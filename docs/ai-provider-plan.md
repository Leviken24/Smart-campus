# EcoTwin AI — Computer Vision, Grok AI, Recommendations & Reporting Strategy

> **Document Status:** Phase 0 AI Architecture & Provider Integration Plan  
> **Role:** AI & Computer Vision Lead (Person 4 / Developer 4)  
> **Authority:** Strictly aligned with [AGENTS.md Section 5.3, 5.4, 10, 13](file:///d:/DSU-hackathon/AGENTS.md), [CLAUDE.md](file:///d:/DSU-hackathon/CLAUDE.md), [docs/architecture.md](file:///d:/DSU-hackathon/docs/architecture.md), and [docs/api-contracts.md](file:///d:/DSU-hackathon/docs/api-contracts.md).  
> **Scope:** Defines the dedicated Computer Vision provider strategy, internal adapter abstraction, xAI Grok API integration, grounded recommendation heuristics, comprehensive reporting pipeline, and security/reliability test harnesses. No code is implemented in this phase.

---

## 1. Executive Summary & Architectural Isolation

EcoTwin AI enforces a strict architectural boundary between sensory perception, mathematical simulation, and natural language reasoning:

```
[ Uploaded Image ] ──> [ Dedicated Pretrained CV Model ] ──> [ Normalized Observation ]
                                                                       │
                                                       (Requires Human Review: requires_review)
                                                                       │
                                                                       v
[ Sensor Telemetry ] ──> [ Deterministic Python Engine ] ──> [ Digital Twin & Persistence ]
                                 (kWh, Litres, kg)                     │
                                                                       v
                                                           [ Assembled Context JSON ]
                                                                       │
                                                                       v
                                                           [ xAI Grok API Reasoning ]
                                                                       │
                                                                       v
                                                           [ Recommendations & Reports ]
```

### Mandatory Architectural Rules
1. **Separation of Perception and Reasoning:** Grok API is **never** used as a Computer Vision classifier. Visual inference is performed strictly by a dedicated pretrained Computer Vision model/service.
2. **Deterministic Mathematical Sovereignty:** Authoritative simulation figures (energy savings in kWh, water leak volumes in L, waste segregation in kg, and dollar cost savings) are calculated solely by pure Python backend algorithms. Grok is forbidden from calculating or inventing numbers.
3. **Observation Review Mandate:** All Computer Vision detections initialize in `status="requires_review"`. They never auto-promote to `confirmed` without human review.
4. **Data Grounding Guarantee:** Grok receives only factual, structured application context. It must explicitly cite simulation outputs and persisted observations.

---

## 2. Computer Vision Provider Research & Evaluation

In accordance with `AGENTS.md Section 5.3` (Option B: Dedicated Pretrained Computer Vision Model separate from Grok), we have evaluated four viable candidates against the hackathon's specific target use case: **detecting visible campus waste accumulation (overflowing bins, discarded packaging) and visible water leaks**.

### 2.1 Candidate Evaluation Matrix

| Criterion | Candidate 1: Roboflow Hosted Inference API | Candidate 2: Hugging Face Serverless Inference API | Candidate 3: Google Cloud Vision API | Candidate 4: Local Lightweight ONNX Model |
|---|---|---|---|---|
| **Primary Use-Case Fit** | **High:** Pre-trained public models on waste & garbage detection (e.g. `garbage-classification`, `trash-detection-yolov8`). | **Medium-High:** Zero-shot object detection (OWLv2) or fine-tuned garbage detection models. | **Medium:** General label detection (`Waste container`, `Plastic`, `Water`). Lacks specific "overflowing" context. | **High:** YOLOv8n fine-tuned on TACO/COCO waste running purely on CPU. |
| **Request Protocol & Formats** | HTTPS POST multipart or base64 JSON (`image/jpeg`, `image/png`, `image/webp`). | HTTPS POST binary image bytes or base64 JSON (`image/jpeg`, `image/png`). | HTTPS POST JSON with base64 payload. | In-process Python function accepting raw bytes/numpy array. |
| **Response Structure** | Clean JSON: array of predictions with `class`, `confidence`, `x`, `y`, `width`, `height`. | Clean JSON: array of objects with `label`, `score`, `box: {xmin, ymin, xmax, ymax}`. | Verbose JSON: `labelAnnotations` and `localizedObjectAnnotations`. | Bounding boxes array with class IDs and float confidence scores. |
| **Authentication** | Simple API query parameter or header (`api_key`). | Simple Bearer Token (`Authorization: Bearer $HF_TOKEN`). | Google Cloud Service Account JSON file (complex setup). | Zero authentication (runs locally). |
| **Latency & Cold Starts** | ~180ms – 350ms (consistently fast). | ~200ms warm; **cold starts of 20–30s** on free tier if model is idle. | ~300ms – 600ms. | **~40ms – 80ms** on standard CPU. |
| **Free Tier / Cost** | 1,000 free API calls/month on Starter plan. | Free serverless rate limit (~30 requests/min). | Free tier of 1,000 units/month; requires billing account. | 100% free; unlimited calls. |
| **Hackathon Risk** | Dependent on external cloud connectivity. | Cold starts during live judge demonstration pose latency risk. | Credentials JSON leak risk; general labels require extensive filtering. | Requires committing ~12MB ONNX weight file to repository. |

### 2.2 Recommended Architecture & Selected Approach
- **Primary Recommendation:** **Roboflow Hosted Inference API (or Hugging Face Serverless API)** wrapped behind a strict internal adapter interface.
- **Resilience Fallback:** An internal **Mock/Demo Fallback Adapter** built directly into the vision service. If the external cloud endpoint times out (>10s) or encounters network failure during the live hackathon pitch, the service transparently serves a pre-validated inspection result marked `source="demo_fallback"` without claiming live inference occurred.
- **Provider Environment Variables:**
  - `VISION_PROVIDER="roboflow"` (or `"huggingface"` / `"mock"`)
  - `VISION_API_KEY=""`
  - `VISION_MODEL="waste-detection-v1"`
  - `MAX_IMAGE_UPLOAD_MB=8`

---

## 3. Dedicated Computer Vision Provider Abstraction

To ensure the backend application never couples directly to third-party vendor schemas, all image analysis passes through `services/vision_service.py` and normalizes into a strict Pydantic model.

### 3.1 Normalized Internal Schema (`VisionAnalysisResult`)

```python
class DetectedLabel(BaseModel):
    category: str  # e.g., "overflowing_bin", "cardboard_waste", "water_leak"
    raw_confidence: float  # Uncalibrated model output (0.0 - 1.0)
    bounding_box: Optional[Dict[str, float]] = None  # {x, y, width, height} or {xmin, ymin, xmax, ymax}

class VisionAnalysisResult(BaseModel):
    provider_name: str  # e.g., "roboflow", "huggingface", "mock"
    model_identifier: str
    detected_labels: List[DetectedLabel]
    primary_observation_type: str  # "waste_accumulation" | "water_leakage" | "other"
    summary_description: str
    certainty_level: Literal["low", "medium", "high"]  # Qualitative honest label
    is_anomaly_detected: bool
    processing_time_ms: int
```

### 3.2 Image Validation & Upload Pipeline
Before any external provider is called, `VisionService` executes the following validation checks:
1. **Size Enforcement:** Validates `Content-Length` does not exceed `MAX_IMAGE_UPLOAD_MB` (default 8MB). Rejects oversized files with HTTP 413 Payload Too Large.
2. **MIME & Magic Bytes Inspection:** Inspects both HTTP `Content-Type` header and the file's first 16 magic bytes:
   - JPEG: `\xFF\xD8\xFF`
   - PNG: `\x89\x50\x4E\x47\x0D\x0A\x1A\x0A`
   - WebP: `RIFF....WEBP`
   Rejects non-image binaries, executable scripts, and corrupted bytes with HTTP 400 Bad Request.
3. **Sanitized Storage:** Generates a cryptographically random UUID filename (`uuid4().hex + ".jpg"`). Saves the raw file to `data/uploads/` (strictly excluded from Git).

### 3.3 Observation Lifecycle & State Machine
Every image-derived issue follows an explicit, irreversible state transition:

```
[ Image Uploaded ] ──> [ Status: requires_review ]
                               │
            +------------------+------------------+
            |                                     |
            v                                     v
  [ Status: confirmed ]                 [ Status: dismissed ]
            |
            v
  [ Status: resolved ] (After physical maintenance)
```

- **`requires_review`:** Default initial state. Observation is stored in the database, displayed in the review queue, but does NOT increment the building's active confirmed incident counter.
- **`confirmed`:** Operator verifies the image evidence and confirms the building location (`PATCH /api/observations/{id}`). Now visible on the Digital Twin active incident map.
- **`dismissed`:** Operator marks the image as a false positive or duplicate. Retained in the audit log for model monitoring.
- **`resolved`:** Facilities team confirms the bin was emptied or the pipe was repaired.

---

## 4. xAI Grok API Integration Design

Grok is utilized strictly for contextual reasoning, explaining simulation results, synthesizing sustainability reports, and answering campus questions based on verified data.

### 4.1 Official xAI API Specifications
Based on current official xAI documentation (`https://docs.x.ai`):
- **Base URL:** `https://api.x.ai/v1`
- **Primary Endpoint:** `/chat/completions` (Fully OpenAI-compatible REST interface)
- **Authentication:** HTTP Bearer token via `Authorization: Bearer $XAI_API_KEY`
- **Supported Text Models:** `grok-beta`, `grok-2-1212`, `grok-2-latest`
- **Structured JSON Mode:** Enforced via `response_format: {"type": "json_object"}` in the request payload.

### 4.2 Configuration Parameters
- `XAI_API_KEY`: Server-side secret key (never passed to frontend).
- `XAI_MODEL`: Model identifier (defaults to `grok-beta` or `grok-2-latest`).
- `XAI_TIMEOUT_SECONDS`: Strict 15-second timeout via async HTTPX client.
- `XAI_MAX_RETRIES`: Maximum 2 retries with exponential backoff on HTTP 429/503.

### 4.3 Context Assembly Pipeline (`services/grok_service.py`)
To prevent hallucinations and reduce token usage, the backend compiles a compact, factual JSON context bundle:

```json
{
  "campus_name": "EcoTwin Campus Digital Twin",
  "building": {
    "id": "LIB",
    "name": "Library",
    "operational_hours": "08:00 - 22:00 (14 hrs/day)",
    "baseline_daily_kwh": 340.2
  },
  "active_confirmed_observations": [
    {
      "id": "obs-401",
      "type": "waste_accumulation",
      "description": "Visible paper waste overflow outside 2nd floor entrance"
    }
  ],
  "simulation_scenario_results": {
    "scenario_id": "scen-501",
    "intervention": "reduce_operating_hours",
    "baseline_energy_kwh": 10500.0,
    "projected_energy_kwh": 7500.0,
    "absolute_savings_kwh": 3000.0,
    "percentage_reduction": 28.57,
    "projected_cost_savings_usd": 360.0,
    "assumptions": [
      "Load: 25.0 kW",
      "Hours: 14h -> 10h/day for 30 days",
      "Tariff: $0.12/kWh"
    ]
  }
}
```

### 4.4 System Prompt & Grounding Guardrails
The system prompt passed to Grok enforces strict factual fidelity:

> **System Prompt Guardrail:**
> *"You are the EcoTwin AI Campus Sustainability Advisor. You provide actionable recommendations and explanations based SOLELY on the supplied campus context JSON.  
> 1. You MUST reference the exact mathematical savings ($3,000 kWh, $360.00) calculated by the backend.  
> 2. You must NEVER invent unmeasured sensor readings, hypothetical equipment faults, or unconfirmed real-world incidents.  
> 3. You must output your response strictly conforming to the requested JSON schema.  
> 4. All projected savings must be explicitly described as 'projected' or 'simulated'."*

### 4.5 Pydantic Output Validation
The raw JSON returned by Grok is strictly parsed and validated against `GrokRecommendationResponse`:

```python
class GrokRecommendationResponse(BaseModel):
    title: str
    executive_summary: str
    priority: Literal["low", "medium", "high"]
    priority_score: float = Field(ge=0.0, le=10.0)
    priority_reasoning: str
    suggested_actions: List[str]
    referenced_simulation_id: Optional[str] = None
    referenced_savings_kwh: Optional[float] = None
    provenance_disclaimer: str
```
If Grok returns unparsable JSON or violates bounds, the service logs a validation error and returns an HTTP 502 with a structured fallback message.

---

## 5. Comprehensive Sustainability Reporting Workflow

The reporting workflow (`POST /api/ai/reports`) aggregates multi-source campus telemetry, active observations, executed simulations, and Grok synthesis into an authoritative report.

### 5.1 Report Data Assembly (`services/report_service.py`)
The report generator gathers 5 distinct tiers of factual evidence before calling Grok:
1. **Resource Ingestion Audit:** Sum of all readings in the database over the requested window, split by `source="simulated"` and `source="measured"`.
2. **Observations Anomaly Register:** Count of issues grouped by status (`requires_review`, `confirmed`, `resolved`, `dismissed`).
3. **Deterministic Simulation Ledger:** Historical scenario projections executed by operators, complete with documented assumptions and formulas.
4. **Tariff & Cost Accounting:** Total projected dollar savings computed from backend tariffs.
5. **Grok Executive Synthesis:** Grok generates the Executive Summary and Strategic Recommendations based on the factual ledger.

### 5.2 Mandatory Report Sections & Schema

```json
{
  "report_id": "rep-701",
  "title": "Campus Sustainability Intelligence & Intervention Audit",
  "scope": "campus_wide",
  "period": "30_days",
  "executive_summary": "Grok AI generated summary grounded in metrics...",
  "resource_metrics": {
    "total_energy_kwh": 42600.0,
    "total_water_litres": 253500.0,
    "total_waste_kg": 9600.0,
    "provenance": "simulated"
  },
  "observations_audit": {
    "total_detected": 4,
    "confirmed_count": 2,
    "under_review_count": 1,
    "resolved_count": 1
  },
  "simulated_interventions_summary": [
    {
      "scenario_id": "scen-501",
      "building_id": "LIB",
      "projected_energy_savings_kwh": 3000.0,
      "projected_cost_savings_usd": 360.0
    }
  ],
  "strategic_recommendations": [
    {
      "priority": "high",
      "action": "Adjust Library operational schedule to shave 3,000 kWh monthly",
      "feasibility": "immediate"
    }
  ],
  "provenance_disclaimer": "Metrics represent a combination of simulated sensor streams and deterministic simulations. AI reasoning provided by Grok API based strictly on provided data.",
  "generated_at": "2026-10-15T13:30:00+05:30"
}
```

### 5.3 Offline & Failure Behavior
If the Grok API is unreachable during report generation:
- The backend continues to assemble the Resource Metrics, Observations Audit, and Simulation Ledger deterministically.
- It inserts a standardized fallback executive summary: *"Grok AI reasoning service was offline at the time of report compilation. Quantitative resource metrics and deterministic simulation ledgers are presented without automated natural-language narrative."*
- Generates the complete report without failing the entire request.

---

## 6. Security, Credentials & Testing Strategy

### 6.1 Server-Side Secret Isolation
- `XAI_API_KEY` and `VISION_API_KEY` are read exclusively from environment variables in `backend/app/core/config.py`.
- No credentials are ever passed to the frontend or exposed in API response payloads.
- `.env` is explicitly included in root `.gitignore`.
- `.env.example` documents placeholders only:
```dotenv
XAI_API_KEY=your_xai_api_key_here
XAI_MODEL=grok-beta
VISION_PROVIDER=roboflow
VISION_API_KEY=your_vision_api_key_here
VISION_MODEL=waste-detection-v1
MAX_IMAGE_UPLOAD_MB=8
```

### 6.2 Automated Mocked Unit Testing (`tests/test_ai_services.py`)
To satisfy the rule that automated tests must never require a live API key or consume API credits:
- **Pytest + HTTPX `MockTransport`:** All external calls to `https://api.x.ai/v1/chat/completions` and the Computer Vision API are intercepted and mocked using synthetic JSON fixtures.
- **Test Scenarios:**
  1. Successful vision analysis and label normalization.
  2. Oversized image rejection (>8MB) returning HTTP 413.
  3. Corrupted non-image file rejection returning HTTP 400.
  4. Vision API timeout (10s) triggering demo fallback without crashing.
  5. Grok API 200 OK returning valid structured recommendation JSON.
  6. Grok API 429 Rate Limit handled gracefully returning HTTP 503.
  7. Grok API returning malformed JSON caught by Pydantic validation.

---

## 7. API Contract Alignment & Verification

The AI provider design strictly aligns with all contracts in [`docs/api-contracts.md`](file:///d:/DSU-hackathon/docs/api-contracts.md):

| Endpoint | Contract Role | Alignment Verification |
|---|---|---|
| `POST /api/observations/analyze-image` | Upload image, run CV adapter, return `requires_review` observation. | **Aligned:** Returns `observation_id`, detected labels, qualitative certainty, and sanitized image URL. |
| `GET /api/observations` | Filter observations by status and building. | **Aligned:** Supports filtering by `requires_review`, `confirmed`, `dismissed`, `resolved`. |
| `PATCH /api/observations/{id}` | Human review of observation. | **Aligned:** Transitions observation to `confirmed` with reviewer notes and timestamp. |
| `POST /api/ai/recommendations` | Grounded recommendations from simulation and campus context. | **Aligned:** Context assembly passes scenario results; response mirrors contract schema. |
| `POST /api/ai/reports` | Compile complete sustainability report. | **Aligned:** Aggregates telemetry, observations, simulations, and Grok narrative with disclaimer. |

---

## 8. Outstanding Decisions & Dependencies

### 8.1 Cross-Module Dependencies on Person 2's Digital Twin, Sensor & Simulation Plan
The Grok AI, recommendation, and reporting workflows strictly consume data models and mathematical outputs owned by Person 2:
1. **Context Assembly Dependency:** `POST /api/ai/recommendations` depends on Person 2's simulation output schema (specifically `baseline_value`, `projected_value`, `absolute_savings`, `percentage_reduction`, and `assumptions`). Grok uses these exact fields as grounding facts.
2. **Observation Persistence:** The Vision Service creates `Observation` records that must conform to Person 2's SQLAlchemy `Observation` model (`models/observation.py`) and building foreign key relationships.
3. **Report Generation Audit:** `POST /api/ai/reports` queries Person 2's database tables (`readings`, `observations`, `scenarios`) to calculate campus resource consumption totals and issue counts before invoking Grok to generate the executive summary.

### 8.2 Decisions Requiring Team Approval
The following AI and vision decisions remain marked **`[PENDING TEAM APPROVAL]`**:
1. **[PENDING TEAM APPROVAL] Computer Vision Hosting Choice:** Confirm whether to use Roboflow hosted inference API (1,000 free monthly calls) or Hugging Face serverless API for the primary cloud adapter. (Recommendation: Roboflow for lower latency and dedicated garbage-detection weights).
2. **[PENDING TEAM APPROVAL] Grok Model Identifier:** Confirm `grok-beta` vs `grok-2-latest` in `.env` based on active xAI account tier.
3. **[PENDING TEAM APPROVAL] Demo Mode Fallback Flag:** Confirm inclusion of `DEMO_MODE=true` environment flag to allow running the demo smoothly if offline during presentations.

---

## 9. Pre-Implementation Audit Statement

*This document defines the complete Phase 0 AI architecture, Computer Vision adapter specifications, and Grok integration design. In strict compliance with Phase 0 rules, no external API calls were executed, no credentials were created or tested, and no application code was authored.*
