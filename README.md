# EcoTwin AI — AI-Powered Sustainable Campus Intelligence

> **Tagline:** *See the problem. Simulate the solution. Make the campus sustainable.*  
> **Hackathon Track:** Sustainable Campus Intelligence / Digital Twin  
> **Architecture:** Modular Monolith (React 18 + TypeScript SPA + FastAPI Backend + SQLite)  
> **AI Architecture:** Dedicated Computer Vision Provider + xAI Grok API for Grounded Reasoning

---

## 1. Project Overview & Core Features

EcoTwin AI is an intelligent campus sustainability platform that transforms fragmented facilities operations into a unified, predictive workflow. By integrating Computer Vision, physical and simulated telemetry, an interactive Digital Twin, deterministic simulation, and grounded Generative AI, EcoTwin AI enables campus administrators to detect sustainability problems, model proposed capital/operational interventions, and obtain evidence-grounded action plans.

```
                           ECOTWIN AI IMPACT ENGINE
                                      |
       +------------------------------+------------------------------+
       |                              |                              |
       v                              v                              v
  VISION-TO-ACTION         SUSTAINABILITY TIME MACHINE       GROUNDED AI ADVISOR
  Field Photo Upload       Deterministic "What-If"           xAI Grok Reasoning
  Magic-byte Verification  Pure Math Closed-Form             Strict JSON Context
  Review Queue Register    Energy, Water, Waste Scenarios    Phased Action Plans
  Spatial Twin Markers     30-Day Cumulative Trajectories    Executive PDF Audit
```

### Key Capabilities
1. **Interactive Campus Digital Twin:** Stateful representation of campus facilities (`ACADEMIC`, `LIB`, `RESIDENCE`) tracking real-time load baselines, sensor states, and spatial incident markers.
2. **Dedicated Computer Vision Inspector:** Field incident reporting for visible waste overflow and water leaks. Features binary magic-byte verification, an 8MB upload limit, UUID isolation, and a mandatory `requires_review` human confirmation queue.
3. **Sustainability Time Machine:** Signature policy sandbox. Facilities managers configure operational interventions (e.g., cutting operating hours by $-2\text{ hrs/day}$, LED retrofits, fixing leaks) and calculate deterministic energy (`kWh`), water (`L`), and utility cost ($\$0.12/\text{kWh}$) projections with 30-day cumulative trajectory charts.
4. **Context-Grounded AI Advisor (xAI Grok):** Large Language Model reasoning strictly grounded on verified building telemetry and simulation results. Grok prioritizes operational actions ($0–10$ score) without ever calculating numbers or hallucinating sensor readings.
5. **Executive Sustainability Reports:** Instant compilation of campus-wide audit reports combining deterministic resource aggregations, confirmed incident logs, and Grok strategic summaries with print/PDF export readiness.
6. **Architectural Data Provenance:** Strict data integrity ensuring no synthetic data is masqueraded as real telemetry. Every metric, chart, and card is permanently badged with its origin: `real`, `simulated`, `manual`, `calculated`, or `ai_generated_explanation`.

---

## 2. Technology Stack & Architecture

### System Architecture
The application is built as a **Modular Monolith** designed for high velocity, stability, and zero unnecessary operational complexity:

```text
  [Field Staff & Admins]
            │
            ▼
  ┌────────────────────────────────────────────────────────┐
  │ React 18 + TypeScript + Vite SPA                       │
  │ • Tailwind CSS + shadcn/ui Design Tokens               │
  │ • Recharts Data Visualizations                         │
  │ • 2.5D Campus Digital Twin & Time Machine Sandbox      │
  └────────────────────────┬───────────────────────────────┘
                           │ HTTP REST / JSON / Multipart
                           ▼
  ┌────────────────────────────────────────────────────────┐
  │ FastAPI Python Backend (Uvicorn ASGI)                  │
  │ • /api/health          - System liveness & provider cfg│
  │ • /api/observations    - CV inference & review queue   │
  │ • /api/simulations     - Deterministic math engine     │
  │ • /api/ai              - Grok recommendations & reports│
  ├────────────────────────────────────────────────────────┤
  │ Domain Services Layer                                  │
  │ • vision_service.py    (Magic bytes, CV normalization) │
  │ • simulation_service.py(Pure Python closed-form math)  │
  │ • grok_service.py      (xAI client, 15s timeout ceiling│
  │ • report_service.py    (Deterministic + AI compiler)   │
  ├────────────────────────────────────────────────────────┤
  │ Persistence Layer                                      │
  │ • SQLAlchemy 2.0 ORM -> SQLite (ecotwin.db) / Postgres │
  └────────────────────────────────────────────────────────┘
```

### Technology Breakdown
- **Frontend:** React 18.3, TypeScript 5.5, Vite 5.3, Tailwind CSS 3.4, shadcn/ui primitives, Recharts 2.12, Lucide React.
- **Backend:** Python 3.10–3.14, FastAPI 0.115, Pydantic v2, SQLAlchemy 2.0, Uvicorn, HTTPX.
- **Persistence:** SQLite (`ecotwin.db`) for lightweight, zero-dependency local execution; production-ready for PostgreSQL via `DATABASE_URL`.
- **AI Providers:** Dedicated Pretrained CV Model adapter + xAI Grok API (`grok-beta` / `grok-2-vision-latest`).

---

## 3. Local Setup & Startup Commands

### Prerequisites
- Python 3.10 to 3.14
- Node.js 18.x or 20.x with `npm`
- Git

### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/your-org/ecotwin-ai.git
cd ecotwin-ai

# Create local environment file from template
cp .env.example .env
```

### 2. Backend Startup (Terminal 1)
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Start Uvicorn ASGI development server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **Backend API Root:** `http://localhost:8000`
- **Swagger Interactive Docs:** `http://localhost:8000/docs`
- **Health Verification:** `http://localhost:8000/api/health`

### 3. Frontend Startup (Terminal 2)
```bash
# Navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
- **Application UI:** `http://localhost:5173`

---

## 4. Environment Variables

All configuration is declared in `.env` (never committed to version control). A verified template is provided in [`.env.example`](file:///d:/DSU-hackathon/.env.example):

| Variable | Type | Default | Description |
|---|---|---|---|
| `APP_ENV` | String | `development` | Runtime environment (`development`, `staging`, `production`). |
| `DATABASE_URL` | String | `sqlite:///./ecotwin.db` | SQLAlchemy connection URI (supports SQLite or PostgreSQL). |
| `FRONTEND_ORIGIN` | String | `http://localhost:5173` | Allowed CORS origin for frontend client requests. |
| `XAI_API_KEY` | String | `""` | xAI API Key for Grok reasoning. *(Optional: backend falls back gracefully to deterministic reports if omitted)*. |
| `XAI_MODEL` | String | `grok-beta` | Model identifier for xAI completions. |
| `VISION_PROVIDER` | String | `mock` | Dedicated CV provider adapter (`mock`, `roboflow`, `huggingface`). |
| `VISION_API_KEY` | String | `""` | API key for external vision provider if not using mock. |
| `VISION_MODEL` | String | `waste-detection-v1`| Vision model category tag. |
| `MAX_IMAGE_UPLOAD_MB` | Integer | `8` | Maximum permissible file upload size in megabytes. |

> [!IMPORTANT]
> **Zero Credential Exposure:** All API keys (`XAI_API_KEY`, `VISION_API_KEY`) are backend-only environment variables. The Vite frontend bundle contains zero secret keys.

---

## 5. API Contracts Summary

All requests and responses strictly adhere to the schemas documented in [`docs/api-contracts.md`](file:///d:/DSU-hackathon/docs/api-contracts.md).

- **System Health:**
  - `GET /api/health` $\rightarrow$ Checks database connectivity, version, and external provider statuses.
- **Computer Vision & Observations:**
  - `POST /api/observations/analyze-image` $\rightarrow$ Uploads field photograph (multipart), validates magic bytes, runs inference, creates `requires_review` observation.
  - `GET /api/observations` $\rightarrow$ Lists campus observations with optional `?building_id=` filter.
  - `PATCH /api/observations/{id}` $\rightarrow$ Human reviewer endpoint to confirm, dismiss, or add notes to an observation.
- **Sustainability Time Machine (Deterministic Simulations):**
  - `POST /api/simulations/run` $\rightarrow$ Accepts building ID, resource dimension, and intervention parameters; returns deterministic reductions and 30-day cumulative curves.
- **Context-Grounded AI Advisor (xAI Grok):**
  - `POST /api/ai/recommendations` $\rightarrow$ Synthesizes prioritized, grounded action items based on supplied telemetry and scenario IDs.
  - `POST /api/ai/reports` $\rightarrow$ Generates an executive sustainability audit report combining deterministic numbers and Grok strategic analysis.

---

## 6. Testing & Quality Verification

### Run Backend Unit & Integration Tests
```bash
cd backend
python -m unittest discover -s tests -v
```
- **Test Suite Results:** **32/32 tests passing** (execution time: ~0.30s).
- **Coverage:** Health check endpoints, CORS headers, error envelopes, magic-byte image validation, observation review state transitions, deterministic simulation calculations, Grok context grounding, and defensive 15s timeout / 429 rate-limit handling.

### Run Frontend Static Typecheck & Build
```bash
cd frontend
npm run build
```
- **Typecheck:** `tsc --noEmit` exits with **0 errors**.
- **Bundle Optimization:** `vite build` succeeds, generating minified production artifacts in `dist/` with gzip size summaries.

---

## 7. Deployment Configuration

EcoTwin AI is production-ready for deployment to modern container and static hosting platforms:

- **Frontend Deployment (Vercel / Netlify):**
  - Deploy `frontend/` as a static SPA.
  - Set build command: `npm run build`, output directory: `dist`.
  - Configured with `dist/_redirects` (`/*  /index.html  200`) to support client-side routing on page refresh.
  - Configure `VITE_API_BASE_URL` to point to the backend domain.
- **Backend Deployment (Render / Railway / Fly.io):**
  - Deploy `backend/` using the included [`Procfile`](file:///d:/DSU-hackathon/Procfile):
    ```text
    web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    ```
  - For SQLite persistence across container restarts, mount a persistent volume at `/data/` and configure `DATABASE_URL=sqlite:////data/ecotwin.db`. Alternatively, supply a hosted PostgreSQL URI in `DATABASE_URL`.
  - Detailed step-by-step instructions: [`docs/deployment-guide.md`](file:///d:/DSU-hackathon/docs/deployment-guide.md).

---

## 8. Known Limitations & Technical Honesty

In accordance with our engineering charter, EcoTwin AI never exaggerates capabilities:
1. **Simulated Telemetry:** Sensor readings use bounded, diurnal simulation models for reproducible evaluation; physical BACnet/Modbus IoT meters are not connected in the prototype.
2. **Computer Vision Domain Scope:** Vision inference is constrained to visible surface anomalies (waste bin overflow, surface water pooling). The system does not claim detection of electrical faults or microscopic contaminants from photographs.
3. **Cloud Persistence:** In serverless or ephemeral container deployments without mounted disks, local SQLite databases reset on instance cycling.
4. **Teammate Workstream Boundaries:** Upstream endpoints owned by Person 2 (`/api/campus`, `/api/buildings/*`) are staged; when Person 2 services are offline, the frontend shields users by rendering non-blocking `<DependencyNotice>` cards.

---

## 9. Demonstration & Presentation Assets

- **Live Demo Runbook:** [`docs/demo-runbook.md`](file:///d:/DSU-hackathon/docs/demo-runbook.md) — 7-minute judge presentation script with fallback paths.
- **Technical Q&A Guide:** [`docs/judge-questions-and-answers.md`](file:///d:/DSU-hackathon/docs/judge-questions-and-answers.md) — Comprehensive 15-question reference with 30-second spoken answers and deep technical breakdowns.
- **Slide Deck (PowerPoint):** [`docs/ecotwin-hackathon-pitch.pptx`](file:///d:/DSU-hackathon/docs/ecotwin-hackathon-pitch.pptx) — Professional 16:9 widescreen presentation deck.
- **Slide Deck Preview (HTML):** [`docs/pitch-deck-preview.html`](file:///d:/DSU-hackathon/docs/pitch-deck-preview.html) — Zero-dependency browser-renderable slide deck.
- **Speaker Notes:** [`docs/presentation-speaker-notes.md`](file:///d:/DSU-hackathon/docs/presentation-speaker-notes.md) — Word-for-word spoken narration for each slide.
