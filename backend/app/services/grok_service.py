"""xAI Grok API integration service for EcoTwin AI.

Handles contextual prompt assembly, provider security, rate-limiting resilience,
strict JSON-mode enforcement, and Pydantic validation of AI-generated recommendations.
Never exposes XAI_API_KEY to the frontend.
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings
from app.core.errors import AppException, ProviderUnavailableException
from app.schemas.ai import RecommendationRequest, RecommendationResponse

logger = logging.getLogger("ecotwin.grok_service")

# Official xAI API endpoint
XAI_API_URL = "https://api.x.ai/v1/chat/completions"
REQUEST_TIMEOUT_SECONDS = 15.0

SYSTEM_GUARDRAIL_PROMPT = """You are the EcoTwin AI Campus Sustainability Advisor.
You analyze campus facility context and simulation results to provide prioritized, actionable sustainability recommendations.

CRITICAL GUARDRAIL RULES:
1. Grounding Guarantee: You must ground all claims SOLELY on the provided context (building, scenario, observations, focus area).
2. Numerical Sovereignty: Do NOT invent unmeasured sensor values, hypothetical equipment faults, or unconfirmed incidents. If simulation figures (kWh, litres, cost) are provided, cite them verbatim.
3. Provenance Integrity: Clearly describe all simulation outputs as 'projected' or 'simulated'. Never claim projected savings are already measured or achieved.
4. Schema Enforcement: Output MUST be a valid JSON object matching the requested schema with no surrounding Markdown formatting.

REQUIRED JSON SCHEMA:
{
  "recommendations": [
    {
      "title": "string (concise intervention title)",
      "summary": "string (executive explanation citing specific numbers)",
      "priority": "low" | "medium" | "high",
      "priority_score": float (between 0.0 and 10.0),
      "priority_reasoning": "string (factors driving priority)",
      "suggested_actions": ["string (step 1)", "string (step 2)"],
      "referenced_data": {
        "scenario_id": "string or null",
        "projected_savings_kwh": float or null,
        "observation_count": int or null
      }
    }
  ]
}
"""


class GrokService:
    """Service class encapsulating secure communication with xAI Grok API."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.XAI_API_KEY
        self.model = model or settings.XAI_MODEL

    def _assemble_context(self, request: RecommendationRequest) -> Dict[str, Any]:
        """Assembles factual campus grounding context for the Grok prompt."""
        building_names = {
            "LIB": "Library (Academic & Study Commons)",
            "ACADEMIC": "Academic Block (Classrooms & Research Laboratories)",
            "RESIDENCE": "Student Residence (Housing & Dining Wing)",
        }

        context: Dict[str, Any] = {
            "campus": "EcoTwin Sustainable Campus",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "target_building_id": request.building_id,
            "target_building_name": building_names.get(request.building_id or "", request.building_id or "Campus-Wide"),
            "focus_area_inquiry": request.focus_area or "General sustainability and resource conservation",
        }

        if request.scenario_id:
            context["linked_scenario"] = {
                "scenario_id": request.scenario_id,
                "status": "deterministic_simulation_completed",
            }

        if request.observation_ids:
            context["linked_observations"] = {
                "observation_ids": request.observation_ids,
                "count": len(request.observation_ids),
            }

        return context

    async def get_recommendations(
        self, request: RecommendationRequest, client: Optional[httpx.AsyncClient] = None
    ) -> List[RecommendationResponse]:
        """Queries the Grok API with structured grounding and validates the response."""
        if not self.api_key or not self.api_key.strip():
            logger.warning("Attempted Grok call without configured XAI_API_KEY.")
            raise ProviderUnavailableException(
                message="xAI Grok provider is not configured. Set XAI_API_KEY in the backend server environment.",
                provider="xai_grok",
            )

        context_bundle = self._assemble_context(request)
        user_prompt = f"Campus Grounding Context:\n{json.dumps(context_bundle, indent=2)}\n\nInquiry: {request.focus_area or 'Provide top sustainability recommendations based on this facility state.'}"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_GUARDRAIL_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        should_close_client = False
        if client is None:
            client = httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS)
            should_close_client = True

        try:
            logger.info("Calling xAI Grok API (Model: %s, Building: %s)...", self.model, request.building_id)
            response = await client.post(XAI_API_URL, headers=headers, json=payload)

            if response.status_code == 429:
                logger.warning("xAI Grok rate limit reached (HTTP 429).")
                raise ProviderUnavailableException(
                    message="xAI Grok rate limit reached. Please retry in a few moments.",
                    provider="xai_grok",
                )

            if response.status_code in (401, 403):
                logger.error("xAI Grok authentication failed (HTTP %d).", response.status_code)
                raise ProviderUnavailableException(
                    message="xAI Grok authentication failed. Verify server XAI_API_KEY.",
                    provider="xai_grok",
                )

            if response.status_code >= 500:
                logger.error("xAI Grok remote server error (HTTP %d).", response.status_code)
                raise ProviderUnavailableException(
                    message=f"xAI Grok service temporarily unavailable (HTTP {response.status_code}).",
                    provider="xai_grok",
                )

            response.raise_for_status()
            data = response.json()

            # Extract raw assistant response string
            content = data["choices"][0]["message"]["content"]
            parsed_data = json.loads(content)

            raw_recs = parsed_data.get("recommendations", [])
            if not isinstance(raw_recs, list) or len(raw_recs) == 0:
                # Handle single recommendation object response format
                if "title" in parsed_data:
                    raw_recs = [parsed_data]
                else:
                    raw_recs = []

            results: List[RecommendationResponse] = []
            for item in raw_recs:
                rec_id = f"rec-{uuid.uuid4().hex[:6]}"
                validated = RecommendationResponse(
                    recommendation_id=rec_id,
                    building_id=request.building_id,
                    title=item.get("title", "Sustainability Intervention"),
                    summary=item.get("summary", ""),
                    priority=item.get("priority", "medium") if item.get("priority") in ("low", "medium", "high") else "medium",
                    priority_score=float(min(max(item.get("priority_score", 7.0), 0.0), 10.0)),
                    priority_reasoning=item.get("priority_reasoning", "Ranked based on potential resource impact."),
                    suggested_actions=item.get("suggested_actions", []),
                    referenced_data=item.get("referenced_data", {"scenario_id": request.scenario_id}),
                    provenance_label="ai_generated_explanation",
                    created_at=datetime.now(timezone.utc).isoformat(),
                )
                results.append(validated)

            return results

        except httpx.TimeoutException as exc:
            logger.error("xAI Grok API timed out after %ds: %s", REQUEST_TIMEOUT_SECONDS, exc)
            raise ProviderUnavailableException(
                message=f"xAI Grok API request timed out after {REQUEST_TIMEOUT_SECONDS}s.",
                provider="xai_grok",
            ) from exc
        except (httpx.ConnectError, httpx.NetworkError) as exc:
            logger.error("xAI Grok API connection error: %s", exc)
            raise ProviderUnavailableException(
                message="Unable to connect to xAI Grok API server.",
                provider="xai_grok",
            ) from exc
        except json.JSONDecodeError as exc:
            logger.error("Failed to parse Grok JSON output: %s", exc)
            raise AppException(
                message="Grok output could not be parsed as valid JSON schema.",
                code="AI_SCHEMA_ERROR",
                status_code=502,
            ) from exc
        finally:
            if should_close_client:
                await client.aclose()


# Singleton service instance
grok_service = GrokService()
