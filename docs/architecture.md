# EcoTwin AI — System Architecture & Technical Design

> **Document Status:** Phase 0 Architecture Document  
> **Authority:** Strictly aligned with [AGENTS.md](file:///d:/DSU-hackathon/AGENTS.md) and [CLAUDE.md](file:///d:/DSU-hackathon/CLAUDE.md). This document serves as the architectural foundation for all team members. Any architectural divergence requires Technical Lead review and unanimous consensus.

---

## 1. System Overview & Architectural Paradigm

EcoTwin AI is an intelligent campus sustainability Digital Twin designed to integrate sensor streams, dedicated Computer Vision inference, deterministic mathematical simulations, and Grok-powered contextual intelligence into a unified, actionable platform.

### 1.1 Architectural Style: Modular Monolith
To maximize velocity, reliability, and ease of coordination during the 48-hour hackathon, EcoTwin AI adopts a **Modular Monolith** architecture:
- **Single React/TypeScript Frontend:** A responsive, accessible single-page application built with Vite and Tailwind CSS.
- **Single FastAPI Python Backend:** A unified application structured into discrete, loosely-coupled domain services with distinct responsibilities.
- **Single Relational Persistence Engine:** SQLite via SQLAlchemy ORM for relational persistence, structured query execution, and zero-infrastructure local setup.
- **Two Distinct External AI Providers:**
  1. A dedicated Computer Vision model/provider (for image inference on waste accumulation and visible water leakage).
  2. Grok API (xAI) for context-grounded reasoning, simulation explanations, prioritization explanations, and comprehensive sustainability reporting.

```
                           +------------------------------------------------+
                           |            USER / WEB BROWSER                  |
                           |    React + TypeScript + Vite + Tailwind CSS    |
                           +-----------------------+------------------------+
                                                   |
                                       HTTP REST / JSON (or Multipart)
                                                   |
                                                   v
+---------------------------------------------------------------------------------------------------+
|                               FASTAPI MODULAR MONOLITH BACKEND                                    |
|                                                                                                   |
|  [ API Router Layer ]                                                                             |
|    ├── /api/health                                                                                |
|    ├── /api/campus & /api/buildings (Campus Service)                                              |
|    ├── /api/sensors (Sensor Service & Ingestion Pipeline)                                         |
|    ├── /api/observations (Vision Adapter & Observation Service)                                  |
|    ├── /api/simulations (Deterministic Simulation Engine)                                         |
|    └── /api/ai (Grok Service, Recommendation & Report Services)                                   |
|                                                                                                   |
|  [ Domain Service Boundaries ]                                                                    |
|    +-------------------+  +-------------------+  +--------------------+  +---------------------+  |
|    |  Campus Service   |  |  Sensor Service   |  | Simulation Engine  |  |   Vision Service    |  |
|    |  Building state & |  |  Ingestion, bounds|  | Pure deterministic |  | Dedicated CV Model  |  |
|    |  aggregations     |  |  check, simulator |  | calculations (kWh, |  | Adapter & Review    |  |
|    |                   |  |  & time windows   |  | litres, kg waste)  |  | Normalizer          |  |
|    +---------+---------+  +---------+---------+  +---------+----------+  +----------+----------+  |
|              |                      |                      |                        |             |
|              +----------------------+----------------------+------------------------+             |
|                                     |                                               |             |
|                                     v                                               v             |
|                       [ Pydantic Schemas & DTOs ]                        [ External Provider ]    |
|                                     |                                    Dedicated CV Model API   |
|                                     v                                                             |
|                       [ SQLAlchemy Persistence Layer ]                                            |
|                                     |                                                             |
|                                     v                                                             |
|                            [ SQLite Database ]                                                    |
|                               (ecotwin.db)                                                        |
|                                     |                                                             |
|                                     | (Aggregated state, metrics, observations & scenario outputs)|
|                                     v                                                             |
|                       +-------------------------------+                                           |
|                       | AI Service (Grok Integration) |                                           |
|                       | Context Assembly -> Grok API  | -----------------> [ External Provider ]  |
|                       | Explanations, Recs & Reports  |                      xAI Grok API         |
|                       +-------------------------------+                                           |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Core Technological Components & Boundaries

### 2.1 Frontend Architecture
- **Framework:** React 18+ with TypeScript (strict typing enabled).
- **Bundler & Tooling:** Vite for near-instant HMR and production bundle optimization.
- **Styling & Design Tokens:** Tailwind CSS with a deliberate color system:
  - Deep indigo/charcoal background (`slate-950` / `slate-900`).
  - Cyan primary accent (`cyan-500` / `cyan-400`) for data, telemetry, and action indicators.
  - Violet accent (`violet-500` / `violet-400`) reserved exclusively for AI insights and generative features.
  - Semantic green/amber/red strictly applied for validated status and alerts.
- **Component Primitives:** shadcn/ui (Radix UI primitives) for accessible dialogs, tabs, dropdowns, and cards.
- **Data Visualization:** Recharts for deterministic trend visualization (energy kWh, water litres, waste kg).
- **Icons:** Lucide React for consistent UI iconography.
- **Routing:** React Router v6 managing 7 core views:
  1. `Overview` (Global campus twin summary, high-level KPIs, recent alerts)
  2. `Campus Twin` (2D/2.5D building selector, building state inspector)
  3. `Resource Monitoring` (Telemetry charts, windowed time filters, source labels)
  4. `Vision Inspector` (Image upload, observation inference, review/confirm workflow)
  5. `Simulations` (Sustainability Time Machine: what-if scenarios, baseline vs projection)
  6. `AI Advisor` (Grounded recommendations, contextual Q&A on campus data)
  7. `Reports` (Comprehensive sustainability report generation & provenance audit)
- **State Management & Data Fetching:** Dedicated API client module (`src/services/api/`) using native `fetch` with typed responses and structured error wrappers. No global Redux/Zustand overhead needed unless cross-view caching demands it.

### 2.2 Backend Architecture
- **Framework:** Python 3.11+ with FastAPI.
- **Validation & Typing:** Pydantic v2 schemas for all request payloads, query parameters, and API responses.
- **ORM & Data Layer:** SQLAlchemy 2.0 with declarative mapped columns and SQLite backend.
- **HTTP Client:** HTTPX (async client with timeouts) for outbound external API calls (Vision Provider and Grok API).
- **Test Framework:** Pytest with HTTPX `AsyncClient` test harness. Mocking applied to all third-party provider calls.

---

## 3. Backend Service Boundaries & Directory Structure

To enforce isolation and prevent spaghetti dependencies, backend business logic must reside within dedicated services, keeping API route handlers lean:

```text
backend/
├── app/
│   ├── main.py                  # FastAPI application entrypoint, CORS, lifespan, global error handlers
│   ├── api/                     # Route definitions and HTTP controllers (no business logic)
│   │   ├── health.py            # /api/health
│   │   ├── campus.py            # /api/campus, /api/buildings
│   │   ├── sensors.py           # /api/sensors/readings, /api/sensors/simulate
│   │   ├── observations.py      # /api/observations, /api/observations/analyze-image
│   │   ├── simulations.py       # /api/simulations/run, /api/simulations/{id}
│   │   └── ai.py                # /api/ai/recommendations, /api/ai/reports
│   ├── core/
│   │   ├── config.py            # BaseSettings reading from environment variables
│   │   ├── errors.py            # Custom domain exception hierarchy and handlers
│   │   └── security.py          # Input validation, file mime inspection, filename sanitization
│   ├── schemas/                 # Pydantic v2 DTOs (Request / Response validation)
│   │   ├── campus.py
│   │   ├── sensor.py
│   │   ├── observation.py
│   │   ├── simulation.py
│   │   └── ai.py
│   ├── models/                  # SQLAlchemy 2.0 declarative database models
│   │   ├── building.py
│   │   ├── sensor.py
│   │   ├── reading.py
│   │   ├── observation.py
│   │   ├── scenario.py
│   │   └── recommendation.py
│   ├── services/                # Encapsulated domain logic
│   │   ├── campus_service.py    # Campus aggregation, building status calculation
│   │   ├── sensor_service.py    # Telemetry ingestion, validation bounds, synthetic generation
│   │   ├── vision_service.py    # Dedicated CV integration, image validation, result normalization
│   │   ├── simulation_service.py# Pure deterministic formulas (Energy, Water, Waste, Tariffs)
│   │   ├── grok_service.py      # xAI Grok API client, prompt assembly, JSON output validation
│   │   ├── recommendation_service.py # Priority calculation heuristic & AI recommendation pipeline
│   │   └── report_service.py    # Campus metric assembly, audit trail & report synthesis
│   └── db/
│       ├── session.py           # Database engine, sessionmaker, dependency injection get_db
│       └── base.py              # DeclarativeBase metadata
├── tests/                       # Unit and integration test suite
│   ├── conftest.py
│   ├── test_simulations.py      # Deterministic math tests
│   ├── test_sensors.py          # Ingestion and synthetic simulator tests
│   ├── test_vision.py           # Vision normalization and mock tests
│   └── test_api.py              # End-to-end route tests
└── requirements.txt
```

---

## 4. Key Workflows & Subsystem Architecture

### 4.1 Sensor Ingestion & Storage Workflow
1. **Ingestion Endpoint (`POST /api/sensors/readings`):** Accepts single readings or batched payloads.
2. **Validation Layer:**
   - Validates existence of `building_id` in database (`ACADEMIC`, `LIB`, `RESIDENCE`).
   - Rejects infinite, NaN, or non-numeric values.
   - Enforces bounds checks (e.g., energy consumption $\ge 0$, water flow $\ge 0$, waste fill $0-100\%$).
   - Rejects unit mismatches (e.g. flagging instantaneous power `kW` submitted to an energy `kWh` metric).
3. **Synthetic Sensor Generator (`POST /api/sensors/simulate`):**
   - Implements bounded, seeded pseudo-random generation to simulate continuous campus operations without erratic spikes.
   - Every reading is immutably stamped with `source="simulated"`.
4. **Aggregation:**
   - Pre-calculates building-level totals over specified windows (e.g., daily baseline) for simulation baselines.

### 4.2 Computer Vision Analysis Workflow
1. **Upload Handling:**
   - Receives multipart image upload (`POST /api/observations/analyze-image`).
   - Validates MIME type (`image/jpeg`, `image/png`, `image/webp`) and file magic bytes.
   - Rejects files exceeding `MAX_IMAGE_UPLOAD_MB` (default 8MB).
   - Generates a cryptographically random UUID filename; saves to local `data/uploads/` (excluded from git).
2. **Dedicated Vision Provider Adapter (`services/vision_service.py`):**
   - Transmits image payload to the designated Computer Vision model.
   - **Crucial Rule:** The CV provider is dedicated to visual inference (waste accumulation, visible water leaks) and abstracted behind `VisionService`.
3. **Normalization & Honest Output:**
   - Normalizes raw model output into `VisionAnalysisResult`.
   - Never fabricates confidence scores. If the model does not produce calibrated probabilities, reports qualitative certainty or omits fake percentages.
4. **Review Lifecycle:**
   - Creates an `Observation` in the database with `status="requires_review"`.
   - Admin/user reviews the observation on the frontend (`PATCH /api/observations/{id}`) to confirm, dismiss, or adjust building association.
   - Once confirmed (`status="confirmed"`), the Digital Twin updates its active incident overlay.

### 4.3 Digital Twin & Deterministic Simulation Engine (Sustainability Time Machine)
The signature feature of EcoTwin AI is the **Sustainability Time Machine**, which empowers campus operators to test interventions deterministically.

1. **Separation of Baseline vs Projection:**
   - Baseline is derived from persisted sensor telemetry or established operational parameters.
   - Hypothetical scenarios never overwrite baseline telemetry in the database.
2. **Deterministic Formula Implementations (`services/simulation_service.py`):**
   - **Energy Intervention:**
     $$\text{energy\_kwh} = \text{power\_kw} \times \text{operating\_hours\_per\_day} \times \text{operating\_days}$$
     $$\text{energy\_saved\_kwh} = \text{baseline\_energy\_kwh} - \text{scenario\_energy\_kwh}$$
     $$\text{reduction\_percent} = \left(\frac{\text{energy\_saved\_kwh}}{\text{baseline\_energy\_kwh}}\right) \times 100 \quad (\text{if baseline} > 0)$$
   - **Water Leakage Intervention:**
     $$\text{leaked\_volume\_litres} = \text{flow\_litres\_per\_minute} \times \text{duration\_minutes}$$
     $$\text{water\_saved\_litres} = \text{baseline\_leak\_volume} - \text{repaired\_volume}$$
   - **Waste Segregation Intervention:**
     $$\text{segregated\_mass\_kg} = \text{total\_waste\_kg} \times \text{segregation\_fraction} \quad (\text{fraction} \in [0, 1])$$
   - **Cost & Emissions Estimates (Optional / Documented):**
     $$\text{cost\_saved} = \text{resource\_saved} \times \text{tariff\_rate}$$
     $$\text{co2\_avoided} = \text{energy\_saved\_kwh} \times \text{grid\_emissions\_factor}$$
     *(Only calculated when tariff and emissions factors are explicitly documented and passed).*
3. **Reproducibility:** Identical inputs yield identical outputs. Calculations run strictly in Python, never delegated to an LLM.

### 4.4 Grok AI Service: Context Assembly & Grounding
Grok is strictly utilized as a reasoning and natural-language synthesis layer:
1. **Context Assembly:** Backend gathers validated building telemetry, confirmed observations, deterministic simulation outputs, and assumptions into a compact, structured prompt context.
2. **Prompt Grounding:** Grok is instructed to explain the simulation findings, suggest prioritization based on the provided numbers, and highlight uncertainties.
3. **Prohibition of Hallucinated Authority:** Grok is forbidden from inventing sensor readings, calculating official savings, or executing campus operational commands.
4. **Output Schema Enforcement:** Responses are requested in structured JSON and validated against Pydantic schemas before delivery to the frontend.

---

## 5. End-to-End Data Flow Pipeline

The end-to-end integration ties all pieces into a single unbroken loop:

```
[ Camera / Sensor ]
        |
        v
[ 1. Ingestion / Upload ]
   ├── Image uploaded to /api/observations/analyze-image
   └── Sensor telemetry posted to /api/sensors/readings (or simulated)
        |
        v
[ 2. Backend Normalization & Storage ]
   ├── Vision Provider infers issue -> Observation (requires_review)
   └── Sensor readings stored in DB (source: real | simulated)
        |
        v
[ 3. Human Review & Location Association ]
   └── Operator confirms observation via PATCH /api/observations/{id}
        |
        v
[ 4. Digital Twin State Update ]
   └── Campus overview & building models update active alerts and KPIs
        |
        v
[ 5. Sustainability Time Machine Simulation ]
   └── Operator configures intervention at /api/simulations/run
   └── Deterministic math computes baseline vs projection, savings, assumptions
        |
        v
[ 6. Grok AI Grounded Intelligence ]
   └── Simulation results + campus state fed to Grok via /api/ai/recommendations
   └── Grok returns structured explanation, priority justification, and next steps
        |
        v
[ 7. Comprehensive Sustainability Report ]
   └── Aggregates all data into /api/ai/reports with clear provenance labelling
```

---

## 6. Error Handling, Reliability & Provider Resilience

### 6.1 External Provider Failures
1. **Grok API Outage / Rate Limit:**
   - Backend catches `httpx.HTTPError`, `httpx.TimeoutException`, and HTTP 429/5xx status codes.
   - Returns standard error response (`503 Service Unavailable` with `detail="Grok AI reasoning service temporarily unavailable"`).
   - **Frontend Resilience:** The frontend remains fully functional; dashboard metrics, Digital Twin state, and deterministic simulation calculations continue to work unimpeded. The UI displays an inline warning banner in AI sections with a retry button.
2. **Vision Provider Outage:**
   - Vision service returns a structured failure response without crashing the server.
   - For demo continuity, the backend can return a designated sample review-pending observation *only if explicitly running in mock/demo mode*, clearly labelled as `source="demo_fallback"`. In production mode, an honest error is returned.
3. **No Fabricated Data:**
   - Under no circumstances does the system present synthetic or fallback responses as live verified results without explicit provenance labelling.

### 6.2 Data Provenance & Distinction Rule
Every data point exposed across API schemas and UI views must be unequivocally classified into one of five categories:
1. `MEASURED`: Real physical sensor measurements.
2. `SIMULATED`: Synthetically generated telemetry from the sensor simulator.
3. `OBSERVED`: Computer Vision inferences or manually logged issue reports.
4. `CALCULATED`: Deterministic mathematical outputs computed by the backend simulation engine.
5. `ESTIMATED / AI-GENERATED`: Explanations, qualitative rankings, and textual reports generated by Grok.

---

## 7. Local Development & Deployment Architecture

### 7.1 Local Development
- **Backend:** Python virtual environment (`.venv`), running Uvicorn on `http://localhost:8000`.
- **Frontend:** Node.js with Vite dev server on `http://localhost:5173`.
- **Proxy Configuration:** `vite.config.ts` proxies `/api` requests to `http://localhost:8000`, eliminating CORS friction during local development.

### 7.2 Deployment Strategy
- **Frontend Hosting:** Vercel or equivalent static platform building from `frontend/` via `npm run build`.
- **Backend Hosting:** Containerized or Python-native cloud hosting (e.g., Render, Railway, Fly.io, or cloud VM) executing `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Persistence:** SQLite file stored in a persistent mounted volume or local container storage suitable for hackathon demonstrations.
- **Environment Secrets:** Injected exclusively as server-side environment variables. No secrets in Git or frontend bundles.
