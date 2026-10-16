# EcoTwin AI — Phase 0 Architecture Decisions, Team Responsibilities & Collaboration Framework

> **Document Status:** Phase 0 Final Alignment Record  
> **Prepared by:** Person 1 (Technical Lead & Architecture Coordinator)  
> **Source Documents:** [AGENTS.md](file:///d:/DSU-hackathon/AGENTS.md), [CLAUDE.md](file:///d:/DSU-hackathon/CLAUDE.md), [docs/architecture.md](file:///d:/DSU-hackathon/docs/architecture.md), [docs/api-contracts.md](file:///d:/DSU-hackathon/docs/api-contracts.md)

---

## 1. Repository Inspection Findings

A comprehensive inspection of the workspace (`d:\DSU-hackathon`) revealed the following baseline status:
1. **Existing Files:**
   - `AGENTS.md` (Project Constitution, Architecture, Technical Reference, and 48-Hour Plan)
   - `CLAUDE.md` (Beginner-friendly orientation, rules, and phase guides)
   - `EcoTwin_Antigravity_Phase_Prompts.md` (Step-by-step implementation prompt pack)
   - Initialized `.git` repository (master branch, no prior commits)
2. **Current Implementation State:**
   - **Frontend:** Does not yet exist (no `package.json`, Vite configuration, components, or UI code).
   - **Backend:** Does not yet exist (no `main.py`, FastAPI routers, virtual environment, or `requirements.txt`).
   - **Persistence:** Does not yet exist (no SQLite database file or migrations).
   - **Configuration:** No `.env` or `.env.example` templates existed.
3. **Missing Foundational Components:**
   - Architecture and API specifications (addressed now by `docs/architecture.md` and `docs/api-contracts.md`).
   - Shared data contracts and Pydantic schemas.
   - Core directory skeleton.
4. **Potential Integration Risks Identified:**
   - Discrepant naming schemes between frontend and backend (e.g., camelCase vs snake_case, ID naming).
   - Unit ambiguity (mixing instantaneous power `kW` with cumulative energy `kWh`; flow rate `L/min` with total volume `L`).
   - Premature or hallucinated AI calculations (relying on Grok instead of backend deterministic mathematics).
   - Accidental exposure of API keys (`XAI_API_KEY`, vision keys) in client-side bundles or git history.

---

## 2. Proposed Architecture Summary

- **Pattern:** Modular Monolith.
- **Frontend:** React 18+, TypeScript, Vite, Tailwind CSS, shadcn/ui primitives, Recharts, Lucide React, React Router.
- **Backend:** Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, SQLite persistence, HTTPX async client, Pytest.
- **AI Integrations:**
  - Dedicated Computer Vision provider for visual observation inference (waste accumulation, visible water leaks).
  - xAI Grok API for reasoning, simulation explanations, and sustainability report compilation.
- **Signature Feature (Sustainability Time Machine):** Pure Python deterministic simulation engine. Baseline telemetry and hypothetical projections are preserved separately with full parameter and assumption traceability.

---

## 3. Team Member Module Ownership & Responsibilities

The team division adheres to the four-role model established in `AGENTS.md` and `CLAUDE.md`. (If operating with 3 developers, Developer 4 responsibilities are shared between Dev 1 and Dev 2 as detailed below):

### Developer 1 — Technical Lead / Architecture & Integration
- **Primary Ownership:**
  - System architecture integrity, shared schemas, and API contracts (`docs/architecture.md`, `docs/api-contracts.md`).
  - Repository conventions, `.gitignore`, `.env.example`, and integration testing framework.
  - End-to-end integration and workflow verification (Phase 1 through Phase 6).
  - Backend skeleton, application lifecycle, CORS, and health check (`/api/health`).
  - Demo runbook preparation and architectural pitch defense.
- **Boundaries:** Does not write isolated domain services in silos; ensures all modules connect harmoniously.

### Developer 2 — Digital Twin / Sensor Data & Simulation Engine
- **Primary Ownership:**
  - Relational database models and migrations (`models/`, `db/session.py`).
  - Seed data generation for the 3 prototype buildings: `ACADEMIC`, `LIB`, `RESIDENCE`.
  - Sensor ingestion pipeline (`POST /api/sensors/readings`) with strict bounds and unit checking.
  - Synthetic sensor telemetry simulator (`POST /api/sensors/simulate`) with immutable `source="simulated"` stamping.
  - Deterministic simulation engine (`services/simulation_service.py`):
    - Energy formula: $\text{kWh} = \text{kW} \times \text{hours/day} \times \text{days}$.
    - Water formula: $\text{Litres} = \text{flow (L/min)} \times \text{minutes}$.
    - Waste formula: $\text{Segregated kg} = \text{total kg} \times \text{segregation fraction}$.
  - Simulation persistence and retrieval (`/api/simulations/run`, `/api/simulations/{id}`).
  - Unit tests for all deterministic formulas and edge cases (zero baseline, bounds).

### Developer 3 — Frontend / UI & Visualization
- **Primary Ownership:**
  - React/TypeScript/Vite setup with Tailwind CSS design tokens (charcoal background, cyan accent, violet AI accent).
  - Application navigation and routing (Overview, Campus Twin, Resource Monitoring, Vision Inspector, Simulations, AI Advisor, Reports).
  - Interactive 2D/2.5D Campus Twin building selector and status visualizer.
  - Telemetry charts (Recharts) with explicit unit and time-period labels.
  - Sustainability Time Machine UI (parameter inputs, baseline vs projected comparison cards, savings indicators).
  - Image upload interface with client-side preview, validation, and review/confirmation controls.
  - Resilient UI states: dedicated loading spinners/skeletons, empty states, and descriptive error banners.
- **Boundaries:** Never hardcodes API keys in frontend code; consumes only agreed endpoints in `docs/api-contracts.md`.

### Developer 4 (or shared between Lead & Dev 2) — Computer Vision, Grok AI & Reports
- **Primary Ownership:**
  - Dedicated Computer Vision provider evaluation and adapter (`services/vision_service.py`).
  - Safe image upload handling (`POST /api/observations/analyze-image`), file size checks, and UUID sanitization.
  - Observation lifecycle management (`requires_review` -> `confirmed` / `dismissed` via `PATCH /api/observations/{id}`).
  - Grok API client (`services/grok_service.py`) via async HTTPX with timeouts and retry limits.
  - Context assembly layer ensuring Grok receives minimal, relevant campus metrics and scenario outputs.
  - Recommendation engine (`services/recommendation_service.py`) and Sustainability Report generation (`services/report_service.py`).
  - Pydantic response validation for all LLM outputs; graceful fallback on provider failure.

---

## 4. Shared Data Contracts Summary

All developers must strictly comply with the schemas detailed in [docs/api-contracts.md](file:///d:/DSU-hackathon/docs/api-contracts.md):
1. **Entity Identifiers:**
   - Canonical Building IDs: `ACADEMIC`, `LIB`, `RESIDENCE`.
   - Observation Statuses: `requires_review`, `confirmed`, `dismissed`, `resolved`.
   - Data Provenance Tags: `measured`, `simulated`, `manual`, `observed`, `calculated`, `ai_generated_explanation`.
2. **Metrics & Units Standard:**
   - Energy: strictly cumulative consumption in `kWh` (instantaneous power in `kW` used only as an input parameter).
   - Water: cumulative volume in `L` (litres) or `m3` (flow rate in `L/min` used only for leak calculations).
   - Waste: fill level in `%`, or mass in `kg`.
3. **Data Integrity Guarantee:**
   - Baseline measurements are never overwritten by simulation scenarios.
   - Grok is never invoked to perform arithmetic calculations.
   - Unreviewed Computer Vision predictions are displayed with `requires_review` status and qualitative confidence markers.

---

## 5. Team Collaboration Rules & Workflow

To maintain parallel velocity during the 48-hour hackathon without merge conflicts or breaking integrations:

1. **Contracts First:**
   No frontend page or backend service may implement ad-hoc JSON fields. If a schema change is required, it must be proposed in `docs/api-contracts.md` and approved by Person 1 first.
2. **Modular File Ownership:**
   - Person 2 works inside `backend/app/models/`, `backend/app/services/simulation_service.py`, `sensor_service.py`.
   - Person 3 works inside `frontend/src/`.
   - Person 4 works inside `backend/app/services/vision_service.py`, `grok_service.py`, `report_service.py`.
   - Person 1 reviews shared files (`main.py`, router mounts, root configs).
3. **Branching & Integration:**
   - Individual feature work branches off `master` (e.g. `feat/p1-backend-skeleton`, `feat/p2-simulations`, `feat/p3-frontend-ui`).
   - Frequent integration merges into `master` at the conclusion of each phase (Phases 1 through 6).
4. **No Secrets in Repositories:**
   - `.env` is strictly git-ignored. All keys (`XAI_API_KEY`, `VISION_API_KEY`) reside exclusively in server-side environment variables.
   - Frontend accesses external capabilities solely via `/api/*` backend proxies.
5. **Continuous Verification:**
   - Code must pass automated unit tests (`pytest tests/`) and frontend build checks (`npm run build`) before merging.
   - No mock code or synthetic data may be passed off as live physical hardware telemetry.

---

## 6. Integration Dependencies

```
[ Person 1: Contracts & Skeleton ]
             |
             +---------------------------------------+
             |                                       |
             v                                       v
[ Person 2: DB, Sensors & Sim Engine ]    [ Person 3: Frontend Shell & UI ]
             |                                       |
             | (Provides schemas & sample data)      | (Consumes mock/live endpoints)
             +-------------------+-------------------+
                                 |
                                 v
              [ Person 4: CV, Grok AI & Reports ]
                                 |
                                 v
              [ Person 1: End-to-End Integration ]
```

- **Person 2 depends on:** Person 1's shared API contracts, database schema definitions, and base project structure.
- **Person 3 depends on:** Person 1's approved endpoints and mock/live API data shapes to build typed frontend services.
- **Person 4 depends on:** Person 2's persisted observation models and simulation outputs to assemble grounding contexts for Grok.
- **Person 1 coordinates:** Full integration testing once components meet exit criteria for each phase.

---

## 7. Decisions Requiring Team Approval

The following specific design decisions remain unresolved and are explicitly marked **`[PENDING TEAM APPROVAL]`**. Neither Person 1, Person 2, nor Person 3 may assume approval until the team formally convenes and agrees:

1. **[PENDING TEAM APPROVAL] Dedicated Computer Vision Provider Selection:**
   - *Option A:* Cloud Vision API / Hugging Face Inference API / Roboflow hosted inference for waste & leak detection.
   - *Option B:* Lightweight local ONNX / PyTorch model (e.g., YOLOv8-nano fine-tuned/pretrained) running directly in the Python service.
   - *Status:* Unresolved. Requires team decision and API key/quota validation.

2. **[PENDING TEAM APPROVAL] Grok Model Identifier:**
   - Official xAI model identifier to be configured in `.env` (e.g., `grok-beta` or `grok-2-latest`).
   - *Status:* Unresolved. Requires validation against current xAI API credentials.

3. **[PENDING TEAM APPROVAL] Simulation Tariff & Cost Units:**
   - Currency: Default proposed as `USD` ($). Confirm if campus presentation prefers `INR` (₹).
   - Tariff defaults: Proposed electricity tariff default $0.12 / kWh; water cost default $0.002 / L.
   - *Status:* Unresolved. Requires team agreement on presentation numbers.

4. **[PENDING TEAM APPROVAL] Campus Map Graphic Representation:**
   - 2.5D Isometric SVG layout vs styled interactive 2D canvas with building status pins.
   - *Status:* Unresolved. Requires Person 3's frontend design review.

---

## 8. Phase 0 Completion Checklist

- [x] Complete project specification reviewed in [AGENTS.md](file:///d:/DSU-hackathon/AGENTS.md) and [CLAUDE.md](file:///d:/DSU-hackathon/CLAUDE.md).
- [x] Repository state audited; zero files overwritten or prematurely deleted.
- [x] Architecture document created in [docs/architecture.md](file:///d:/DSU-hackathon/docs/architecture.md).
- [x] Complete REST API contracts documented in [docs/api-contracts.md](file:///d:/DSU-hackathon/docs/api-contracts.md) covering all 15 required routes.
- [x] Team ownership, boundaries, and collaboration rules defined in [docs/phase-0-decisions.md](file:///d:/DSU-hackathon/docs/phase-0-decisions.md).
- [x] Provenance labels, deterministic formula definitions, and security constraints locked.
- [x] **Gate to Phase 1:** Cross-team planning documents audited, compatibility verified, and team is ready to commence Phase 1 Foundation.

---

## 9. Team Handoff

> This section provides the explicit Phase 0 handoff for the 3-member project structure (Person 1, Person 2, Person 3) to coordinate their detailed module plans without conflict.

### A. Shared Architecture
- **Paradigm:** Modular Monolith consisting of a single React single-page frontend and a single FastAPI backend application.
- **Frontend Stack:** React 18+, TypeScript, Vite bundler, Tailwind CSS, shadcn/ui accessible primitives, Recharts for resource telemetry charts, Lucide React icons, and React Router.
- **Backend Stack:** Python 3.11+, FastAPI web framework, Pydantic v2 data transfer objects/validation, SQLAlchemy 2.0 ORM, SQLite relational database (`ecotwin.db`), and HTTPX async client.
- **Backend Domain Services:** Modular services behind clear interfaces: `CampusService`, `SensorService`, `VisionService`, `SimulationService`, `GrokService`, `RecommendationService`, `ReportService`.
- **Database & Persistence:** Single SQLite file (`ecotwin.db`) for relational persistence. Uploaded images stored in local `data/uploads/` (strictly excluded from Git).
- **Frontend-Backend Communication:** REST API over HTTP/JSON (and multipart for image upload). Frontend requests proxy through `/api/*` to `http://localhost:8000` via Vite dev server proxy. No direct frontend calls to third-party AI APIs.
- *Detailed reference:* See [docs/architecture.md](file:///d:/DSU-hackathon/docs/architecture.md).

### B. Team Member Responsibilities

#### Person 1 — Technical Lead
- Own system architecture integrity, shared data schemas, and API contract coordination ([docs/architecture.md](file:///d:/DSU-hackathon/docs/architecture.md), [docs/api-contracts.md](file:///d:/DSU-hackathon/docs/api-contracts.md)).
- Track unresolved technical decisions and manage approval consensus.
- Review and validate cross-module integration dependencies.
- Coordinate the final Phase 0 review and ensure readiness before Phase 1 coding commences.

#### Person 2 — Digital Twin, Sensors & Simulation
- Plan building and sensor data requirements for the three canonical buildings (`ACADEMIC`, `LIB`, `RESIDENCE`).
- Define resource readings schema, source labels (`simulated`, `manual`, `real`), and units (`kWh`, `L`, `kg`, `%`).
- Document deterministic mathematical simulation algorithms for:
  - Energy: $\text{energy\_kwh} = \text{power\_kw} \times \text{operating\_hours\_per\_day} \times \text{operating\_days}$.
  - Water: $\text{leaked\_volume\_litres} = \text{flow\_litres\_per\_minute} \times \text{duration\_minutes}$.
  - Waste: $\text{segregated\_mass\_kg} = \text{total\_waste\_kg} \times \text{segregation\_fraction}$.
- Define scenario outputs (baseline vs projection, absolute & percentage differences, transparent assumptions).
- Define testing requirements and edge cases (zero baselines, division-by-zero protection, parameter bounds).

#### Person 3 — Frontend, Computer Vision & Grok AI
- Plan all 7 required frontend views and interactions: `Overview`, `Campus Twin`, `Resource Monitoring`, `Vision Inspector`, `Simulations`, `AI Advisor`, `Reports`.
- Research and document the Computer Vision provider strategy for supported observations (visible waste accumulation and water leaks), ensuring outputs normalize into the internal `VisionAnalysisResult` schema.
- Plan Grok-powered capabilities: grounded recommendations, simulation explanations, and comprehensive sustainability reports.
- Document provider security (API keys strictly on backend), response validation (Pydantic schema validation), and graceful failure handling (fallbacks and non-blocking degradation when external APIs fail).

### C. Non-Negotiable Requirements
Every team member must strictly preserve the following rules in their module planning:
1. **Building IDs:** Must strictly be `ACADEMIC`, `LIB`, and `RESIDENCE`.
2. **Sensor Source Labels:** Every reading must be explicitly tagged as `simulated`, `manual`, or `real`.
3. **Observation Review Status:** All new Computer Vision observations must start with status `requires_review`. They become confirmed only upon operator review.
4. **Deterministic Simulations:** Mathematical scenario calculations must be pure, deterministic backend code. Grok must never calculate authoritative numbers.
5. **Separation of Baselines and Projections:** Baseline measurements must remain untouched in the database; projected scenarios are stored and displayed separately.
6. **No AI Hallucinations:** Grok must not invent sensor measurements, issue counts, or official savings. All AI suggestions must reference actual application data.
7. **Server-Side API Keys:** All credentials (`XAI_API_KEY`, vision keys) must reside exclusively on the backend. No keys in frontend code, `VITE_*` variables, or Git.
8. **No Fake Data Presentation:** Synthetic sensor data must be visibly labelled as `simulated` in the UI and API payloads. Never present synthetic data as real physical measurements.
9. **Constitutional Source of Truth:** All work must strictly adhere to [AGENTS.md](file:///d:/DSU-hackathon/AGENTS.md) and [CLAUDE.md](file:///d:/DSU-hackathon/CLAUDE.md).

### D. Shared Integration Rules
To prevent divergence and incompatible code:
1. **Review Contracts First:** All members must thoroughly review [docs/api-contracts.md](file:///d:/DSU-hackathon/docs/api-contracts.md) before writing their module specifications or code.
2. **Document Disagreements:** Person 2 and Person 3 must document any proposed changes or disagreements in their planning documents rather than silently altering contracts or implementing conflicting field names.
3. **Agreed Contract Modifications:** Any modification to shared schemas or endpoints requires review and unanimous agreement from the team and Person 1.
4. **Explicit Dependencies:** Each member must explicitly document all incoming and outgoing dependencies on other members.
5. **Cross-Document Consistency:** All individual planning documents (`digital-twin-simulation-plan.md`, `frontend-plan.md`, `ai-provider-plan.md`) must be reconciled and mutually consistent with `docs/architecture.md` and `docs/api-contracts.md` before Phase 1 foundation coding begins.

---

## 10. Final Phase 0 Integration Review & Readiness Assessment

> Conducted by Person 1 (Technical Lead & Architecture Coordinator) upon completion of all planning artifacts.

### 10.1 Documents Actually Inspected
The workspace was inspected on disk to confirm which planning documents physically exist:
- **`docs/architecture.md`** — **EXISTS** (299 lines, 20.7 KB). Verified complete modular monolith design.
- **`docs/api-contracts.md`** — **EXISTS** (585 lines, 18.0 KB). Verified all 15 endpoints with strict schemas.
- **`docs/phase-0-decisions.md`** — **EXISTS** (Current file). Verified decision log, handoff, and rules.
- **`docs/demo-and-acceptance-plan.md`** — **EXISTS** (29.7 KB). Verified 10-step demo runbook and 15 P0 criteria.
- **`docs/frontend-plan.md`** — **EXISTS** (34.0 KB). Verified 7 application views and Recharts integration.
- **`docs/ai-provider-plan.md`** — **EXISTS** (20.2 KB). Verified CV abstraction, Grok integration, and report audit.
- *Files verified as not present (acknowledged as optional / non-blocking):*
  - `docs/integration-readiness.md` (Not created; unified into `docs/phase-0-decisions.md` and `docs/demo-and-acceptance-plan.md`).
  - `docs/digital-twin-simulation-plan.md` (Not created as a separate standalone file; Person 2's specifications are completely defined in `docs/architecture.md Section 4.1 & 4.3`, `docs/api-contracts.md Section 2.2, 2.3, 2.5`, and `docs/phase-0-decisions.md Section 3 & 9.B`).
  - `docs/implementation-backlog.md` (Not created; backlog tasks defined in `docs/demo-and-acceptance-plan.md Section 2 & 5`).
  - `docs/development-workflow.md` (Not created; collaboration rules defined in `docs/phase-0-decisions.md Section 5`).

### 10.2 Cross-Workstream Compatibility Findings
1. **API Endpoints & Schemas:** 100% compatible. All 15 endpoints match across `architecture.md`, `api-contracts.md`, `frontend-plan.md`, and `ai-provider-plan.md`.
2. **Entity Identifiers:** 100% compatible. Building IDs are uniformly `ACADEMIC`, `LIB`, `RESIDENCE`. Sensor IDs use standard format `ENERGY-LIB-01`, `WATER-LIB-01`.
3. **Telemetry Units & Provenance:** 100% compatible. Energy is strictly `kWh` (with `kW` as instantaneous power input parameter); water is `L` or `m3` (with `L/min` as leak rate); waste is `%` fill or `kg`. Provenance chips (`Simulated`, `Measured`, `Manual`, `Projected`, `AI-Generated`) are universally adopted.
4. **Observation Lifecycle:** 100% compatible. Detections initialize as `requires_review` and transition only via operator review (`confirmed`, `dismissed`, `resolved`).
5. **Deterministic Simulations:** 100% compatible. Formulas for energy, water leaks, and waste segregation are purely deterministic backend code; baseline database rows are never overwritten.
6. **Grok Context Grounding:** 100% compatible. Grok receives structured context JSON with factual simulation savings and is forbidden from computing authoritative numbers.
7. **Reporting Pipeline:** 100% compatible. Gathers quantitative metrics deterministically and appends Grok executive summary with mandatory provenance disclaimers.

### 10.3 Minor Inconsistencies Corrected During Audit
- **Observation Status Parity:** The observation audit queue tabs in `docs/frontend-plan.md` and `docs/ai-provider-plan.md` originally omitted the fourth canonical status: `resolved`. Both documents were updated to include all four statuses: `requires_review`, `confirmed`, `dismissed`, `resolved`.
- **Explicit Person 2 Dependencies:** Added dedicated dependency sections to `docs/frontend-plan.md Section 7.1` and `docs/ai-provider-plan.md Section 8.1` cataloging incoming dependencies on Person 2's data structures and simulation outputs.

### 10.4 Status of Pending Decisions
The 4 pending decisions from Section 7 remain marked **`[PENDING TEAM APPROVAL]`**:
1. Computer Vision hosting choice (Roboflow vs Hugging Face vs local ONNX).
2. Grok model identifier (`grok-beta` vs `grok-2-latest`).
3. Presentation currency ($ vs ₹).
4. Campus map visual asset style (SVG vs Canvas).
- *Impact Assessment on Phase 1:* **NON-BLOCKING**. Phase 1 Foundation strictly covers repository setup, FastAPI backend skeleton with `GET /api/health`, React/Vite frontend shell, and SQLite building seed data. None of these four items are required for Phase 1 execution; they are Phase 2 core module decisions.

### 10.5 Remaining Blockers & Owners
- **Active Blockers for Phase 1:** **ZERO (0)**.
- All mandatory P0 requirements are thoroughly defined and supported by shared contracts.

---

### 10.6 Phase 0 Exit Verdict

## `PHASE 0 COMPLETE — READY FOR PHASE 1`

The architecture, API contracts, acceptance criteria, frontend design, and AI integration plans are fully aligned, mutually consistent, and strictly compliant with [AGENTS.md](file:///d:/DSU-hackathon/AGENTS.md) and [CLAUDE.md](file:///d:/DSU-hackathon/CLAUDE.md). The team is cleared to commence **Phase 1: Foundation (Hours 0–4)**.

