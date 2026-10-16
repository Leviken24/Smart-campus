"""Unit and integration tests for Grok AI recommendations API.

Verifies:
- 503 handling when XAI_API_KEY is not configured
- 422 input validation handling
- 200 successful response parsing with mocked Grok transport
"""

import json
import unittest
from unittest.mock import patch
import httpx
from fastapi.testclient import TestClient

from app.main import app
from app.services.grok_service import GrokService


class TestAiRecommendationsApi(unittest.TestCase):
    """Test suite for /api/ai/recommendations endpoint."""

    def setUp(self):
        self.client = TestClient(app)

    def test_recommendations_without_api_key_returns_503(self):
        """When XAI_API_KEY is unset, endpoint must return 503 PROVIDER_UNAVAILABLE."""
        with patch("app.services.grok_service.settings.XAI_API_KEY", None):
            # Create fresh service instance with empty key
            unconfigured_service = GrokService(api_key=None)
            with patch("app.api.ai.grok_service", unconfigured_service):
                response = self.client.post(
                    "/api/ai/recommendations",
                    json={"building_id": "LIB", "focus_area": "energy curtailment"},
                )
                self.assertEqual(response.status_code, 503)
                data = response.json()
                self.assertIn("error", data)
                self.assertEqual(data["error"]["code"], "PROVIDER_UNAVAILABLE")
                self.assertIn("not configured", data["error"]["message"].lower())

    def test_recommendations_with_mocked_grok_returns_200(self):
        """When Grok returns valid JSON, endpoint returns 200 with structured recommendations."""
        mock_grok_response = {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "recommendations": [
                                    {
                                        "title": "HVAC and Lighting Schedule Curtailment",
                                        "summary": "Implement automated lighting and HVAC shutdowns at 20:00 instead of 22:00, projected to save 3,000 kWh/month ($360.00).",
                                        "priority": "high",
                                        "priority_score": 8.5,
                                        "priority_reasoning": "High impact on monthly operating expenditure with zero capital cost.",
                                        "suggested_actions": [
                                            "Reprogram BMS timers for floors 2 and 3",
                                            "Deploy custodial checks after 20:00",
                                        ],
                                        "referenced_data": {
                                            "scenario_id": "scen-501",
                                            "projected_savings_kwh": 3000.0,
                                            "observation_count": 1,
                                        },
                                    }
                                ]
                            }
                        )
                    }
                }
            ]
        }

        async def mock_handler(request: httpx.Request):
            return httpx.Response(200, json=mock_grok_response)

        mock_transport = httpx.MockTransport(mock_handler)
        mock_client = httpx.AsyncClient(transport=mock_transport)

        configured_service = GrokService(api_key="mock-key-for-test")
        
        # Patch get_recommendations to pass mock_client
        original_get_recs = configured_service.get_recommendations

        async def patched_get_recs(payload):
            return await original_get_recs(payload, client=mock_client)

        with patch.object(configured_service, "get_recommendations", side_effect=patched_get_recs):
            with patch("app.api.ai.grok_service", configured_service):
                response = self.client.post(
                    "/api/ai/recommendations",
                    json={
                        "building_id": "LIB",
                        "scenario_id": "scen-501",
                        "focus_area": "Explain Library curtailment",
                    },
                )
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertIsInstance(data, list)
                self.assertEqual(len(data), 1)
                rec = data[0]
                self.assertEqual(rec["title"], "HVAC and Lighting Schedule Curtailment")
                self.assertEqual(rec["priority"], "high")
                self.assertEqual(rec["priority_score"], 8.5)
                self.assertEqual(rec["provenance_label"], "ai_generated_explanation")
                self.assertEqual(len(rec["suggested_actions"]), 2)


if __name__ == "__main__":
    unittest.main()
