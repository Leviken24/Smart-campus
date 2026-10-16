# EcoTwin AI — Technical Evaluation & Judge Q&A Guide

**Project:** EcoTwin AI — AI-Powered Sustainable Campus Intelligence  
**Role:** Technical Lead & Frontend Lead (Combined Person 1 + Person 3 Workstream)  
**Target Audience:** Technical & Non-Technical Hackathon Judges  
**Status:** Verified Against Actual Implementation  
**Last Updated:** Phase 6 Final Verification

---

## System Architecture & Data Flow

```text
+--------------------------------------------------------------------------------------------------+
|                                    ECOTWIN AI SYSTEM ARCHITECTURE                                |
+--------------------------------------------------------------------------------------------------+

  [FIELD / USER INPUTS]                    [FRONTEND CLIENT]                        [FASTAPI BACKEND]
  
  +-------------------+              +---------------------------+            +----------------------------+
  |  Field Photos     |  Upload      |  React 18 + Vite (SPA)    |   HTTP     |  Modular FastAPI Monolith  |
  |  (Waste / Water)  | -----------> |  - Tailwind + shadcn/ui   | ---------> |  - Strict Pydantic Schemas |
  +-------------------+              |  - Recharts Visualizations|            |  - Uvicorn ASGI Server     |
                                     |  - 2.5D Campus Digital Twin|           +--------------+-------------+
  +-------------------+              +---------------------------+                           |
  |  Sensor Telemetry |                                                                      |
  |  (Energy / Water) | -----------------------------------------------------\               |
  +-------------------+                                                       \              |
                                                                               |             |
+------------------------------------------------------------------------------v-------------v-------------+
|                                       BACKEND INTERNAL MODULES & SERVICES                               |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|   1. COMPUTER VISION PIPELINE                                2. DETERMINISTIC SIMULATION ENGINE         |
|   +---------------------------------------+                  +--------------------------------------+   |
|   | app/services/vision_service.py        |                  | app/services/simulation_service.py   |   |
|   | - Binary Magic-Byte Verification      |                  | - Sustainability Time Machine        |   |
|   | - 8MB Upload Limit & UUID Sanitize    |                  | - Pure Python Closed-Form Math       |   |
|   | - Model Inference (Waste/Leakage)     |                  | - Identical Inputs = Identical Out   |   |
|   | - Initial State: 'requires_review'    |                  | - Energy, Water, & Waste Levers      |   |
|   +-------------------+-------------------+                  +-------------------+------------------+   |
|                       |                                                          |                      |
|                       v                                                          v                      |
|   3. HUMAN-IN-THE-LOOP AUDIT REGISTER                        4. CONTEXT-GROUNDED AI ADVISOR             |
|   +---------------------------------------+                  +--------------------------------------+   |
|   | Review Queue: Manager Confirmation    |                  | app/services/grok_service.py         |   |
|   | PATCH /api/vision/observations/{id}   |                  | - xAI Grok API (grok-beta)           |   |
|   | Promoted to 'confirmed' + Twin Marker |                  | - 15s Timeout & 429 Backoff          |   |
|   +-------------------+-------------------+                  | - Never Calculates Numbers           |   |
|                       |                                      | - Strictly Grounded on Sim JSON      |   |
|                       v                                      +-------------------+------------------+   |
|   5. DATA PROVENANCE & REPOSITORY                                                |                      |
|   +------------------------------------------------------------------------------v------------------+   |
|   | SQLite Persistence (`ecotwin.db`) via SQLAlchemy ORM                                             |   |
|   | Tagged Provenance: `real` | `simulated` | `manual` | `calculated` | `ai_generated_explanation`   |   |
|   +-------------------------------------------------------------------------------------------------+   |
|                                                                                                         |
+---------------------------------------------------------------------------------------------------------+
                                                |
                                                v
                                [EXECUTIVE SUSTAINABILITY REPORT]
                                - Deterministic Metric Compilation
                                - Grok Executive Strategic Analysis
                                - Print & PDF Export Ready
```

---

## Implementation Classification Legend

Every technical answer below is explicitly tagged with its actual implementation status in the codebase:
- `[Implemented & Verified]`: Fully implemented, covered by automated tests, and verified in the running application.
- `[Implemented but Staged]`: Backend model or UI component implemented; awaiting upstream teammate integration.
- `[Simulated or Mocked]`: Bounded synthetic data used for repeatable hackathon demonstrations; clearly badged in the UI.
- `[Planned Future Capability]`: Architectural design for post-hackathon production deployment.

---

## 15 Critical Technical Evaluation Questions & Answers

---

### Question 1: What problem does EcoTwin AI solve?
**Status:** `[Implemented & Verified]`

#### 30-Second Spoken Pitch
> "University campuses consume massive volumes of power and water while generating tonnes of waste, but facility management operates in isolated silos. Energy billing spreadsheets, physical leak reports, and custodial bin logs never communicate. This leaves physical blind spots across campus and forces administrators to make retrofit decisions reactively based on guesswork. EcoTwin AI connects visual field reports, resource telemetry, and predictive simulation into a single actionable workflow."

#### Deep Technical Explanation
Campus sustainability operations suffer from three systemic failures:
1. **Data Fragmentation:** Electrical consumption data (utility interval meters), water distribution data, and custodial solid-waste logs reside in disconnected departments.
2. **Physical Blind Spots:** Meter telemetry cannot detect physical surface anomalies—such as an overflowing recycling hopper or a sub-surface pipe rupture pooling on the campus quad—until substantial resource loss has already occurred.
3. **Unvalidated Policy Decisions:** Sustainability committees often allocate capital (e.g., LED retrofits, HVAC schedule curtailment) without quantitative sandbox modeling to verify projected ROI or environmental impact before implementation.

EcoTwin AI addresses this by establishing an integrated intelligence layer: ingesting telemetry, enabling field mobile image analysis, providing a spatial Digital Twin, and running deterministic "what-if" simulations before capital expenditure.

---

### Question 2: What makes EcoTwin AI different from a conventional sustainability dashboard?
**Status:** `[Implemented & Verified]`

#### 30-Second Spoken Pitch
> "Conventional sustainability dashboards are passive historical telemetry charts with an unrelated chatbot bolted onto the side. EcoTwin AI is an active, connected Impact Engine: it connects field photo observations directly into a spatial digital twin, lets administrators test 'what-if' policy changes in our deterministic Sustainability Time Machine, grounds Generative AI strictly on verified engineering numbers, and enforces rigorous data provenance so simulated data is never confused with real measurements."

#### Deep Technical Explanation
| Feature Dimension | Conventional Sustainability Dashboard | EcoTwin AI Impact Engine |
|---|---|---|
| **Primary Function** | Passive historical visualization (yesterday's kWh) | Active predictive modeling & intervention testing |
| **Field Data Capture** | None, or disconnected manual ticket systems | Direct Computer Vision analysis of field photographs |
| **Simulation Capability** | None, or static spreadsheet exports | Interactive, deterministic **Sustainability Time Machine** |
| **Generative AI Role** | Generic chatbot that hallucinates savings numbers | Strictly context-grounded reasoning engine (xAI Grok) |
| **Data Integrity** | Unlabeled data mixtures | Enforced architectural provenance badges (`real`, `simulated`, `calculated`) |
| **Human-in-the-Loop** | Binary automated alerts | Mandatory review queue for AI observations before twin updates |

---

### Question 3: What is the Digital Twin in this project?
**Status:** `[Implemented & Verified]`

#### 30-Second Spoken Pitch
> "In EcoTwin AI, the Digital Twin is not just a 3D picture. It is a stateful, structured virtual representation of campus facilities—Academic Block, Library, and Student Residence. It maintains live operational state: synchronized resource baselines across power, water, and waste, exact spatial coordinates of sensors and detected incidents, and active observation registers that dynamically update when human operators confirm field inspections."

#### Deep Technical Explanation
The Digital Twin is defined as a living software representation of the physical campus environment with synchronized state:
- **Spatial Schema:** Buildings (`ACADEMIC`, `LIB`, `RESIDENCE`) have geographic centroids (`lat`, `lng`), polygon perimeter coordinates, gross square footage, and functional zoning.
- **Resource State Representation:** Each building entity aggregates time-windowed metrics:
  - Energy: Instantaneous load (`kW`), period consumption (`kWh`), and tariff rate ($\$0.12/\text{kWh}$).
  - Water: Flow rate (`L/min`) and cumulative volume (`L`).
  - Waste: Bin fill percentage (`%`) and segregation compliance rate (`%`).
- **Dynamic Observation Markers:** The Twin dynamically overlays active incidents on the 2.5D campus map (`CampusMap.tsx` / `InteractiveTwin.tsx`). Unreviewed observations display amber pulsing indicators; human-confirmed observations render high-visibility operational markers.

---

### Question 4: How does Computer Vision contribute to the platform?
**Status:** `[Implemented & Verified]`

#### 30-Second Spoken Pitch
> "Sensors cannot see an overflowing waste bin behind the cafeteria or an exterior puddle from a cracked irrigation valve. Our dedicated Computer Vision pipeline allows field staff to upload photos from inspections. The backend verifies file signatures via binary magic bytes and size limits, runs dedicated CV inference, and creates an observation in a mandatory 'requires review' state. A facility manager confirms the issue with human notes before it updates the campus twin."

#### Deep Technical Explanation
- **Dedicated Provider Architecture:** Computer Vision is completely separated from Grok, adhering to modular architecture in `app/services/vision_service.py`.
- **Security & Integrity:**
  - Enforces a strict 8MB size ceiling (`MAX_IMAGE_UPLOAD_MB`).
  - Validates binary magic-byte headers (`\xFF\xD8\xFF` for JPEG, `\x89PNG` for PNG, `RIFF...WEBP` for WebP); file extensions alone are never trusted.
  - Generates safe UUID filenames, saving to a local untracked upload repository (`data/uploads/`).
- **Normalized Schema:** Outputs a validated `VisionAnalysisResult` containing detected category (`waste_accumulation`, `water_leakage`), bounding/location hints, confidence score, and initial lifecycle status: `requires_review`.
- **Honest AI Scope:** The system explicitly limits vision scope to visible surface anomalies. We do not claim vision detection of electrical faults or microscopic contaminants from photographs.

---

### Question 5: What is the Sustainability Time Machine?
**Status:** `[Implemented & Verified]`

#### 30-Second Spoken Pitch
> "The Sustainability Time Machine is our signature policy-forecasting sandbox. Facilities directors select a building and resource—like energy or water—and simulate interventions, such as cutting operating hours by 2 hours a day or retrofitting LED lighting. It calculates exact kilowatt-hour, litre, and dollar savings, shows a 30-day cumulative trajectory, and gives complete mathematical transparency behind every projection."

#### Deep Technical Explanation
The Time Machine (`app/services/simulation_service.py` & `TimeMachine.tsx`) allows interactive simulation of real-world operational policies:
- **Supported Interventions:**
  1. *Operating Hours Curtailment:* Setback HVAC and non-essential lighting during unoccupied evening hours ($-1$ to $-6\text{ hrs/day}$).
  2. *LED Lighting Retrofit:* Model conversion of legacy fluorescent ballast fixtures to high-efficiency LED arrays ($10\%$ to $40\%$ load reduction).
  3. *Water Leak Mitigation:* Quantify immediate resource recovery by repairing identified pipe breaches (recovering $15\text{ to }120\text{ L/hr}$).
  4. *Waste Segregation Campaign:* Model diversion rate improvements and reduced municipal landfill tipping fees.
- **Output Contract:** Returns a validated `SimulationResult` containing:
  - `baseline_consumption` vs `projected_consumption` with explicit engineering units (`kWh`, `L`, `kg`).
  - `absolute_reduction` and `percentage_reduction`.
  - `cost_savings_usd` based on documented commercial tariffs.
  - `cumulative_30d_series` for financial ROI charting.
  - `assumptions_used` documenting all mathematical constants.

---

### Question 6: Why are simulation calculations deterministic rather than AI-generated?
**Status:** `[Implemented & Verified]`

#### 30-Second Spoken Pitch
> "Capital allocation and engineering decisions require 100% mathematical reproducibility. Large Language Models hallucinate numbers and give different results for identical prompts. In EcoTwin AI, pure deterministic backend Python functions calculate all energy, water, and dollar projections. Identical inputs yield identical outputs every single time. Grok is then used strictly to explain the engineering results."

#### Deep Technical Explanation
- **The Non-Determinism Hazard:** Generative LLMs are probabilistic token predictors. Prompting an LLM to "calculate 30-day savings for a 2-hour curtailment" produces variable, uncalibrated figures across calls, making auditing impossible.
- **Deterministic Implementation:** All calculations in `simulation_service.py` execute closed-form mathematical equations:
  $$\Delta E = (\text{Baseline Hours} - \text{Scenario Hours}) \times \bar{P}_{\text{load}}$$
  $$\text{Savings}_{\text{USD}} = \Delta E \times \text{Tariff Rate } (\$0.12/\text{kWh})$$
- **Verification:** Covered by automated backend unit tests (`tests/test_simulations.py` and `tests/test_full_workflow_integration.py`), verifying identical outputs across thousands of executions with zero floating-point drift or stochastic variance.

---

### Question 7: What does Grok do, and what does it NOT do?
**Status:** `[Implemented & Verified]`

#### 30-Second Spoken Pitch
> "Grok acts as our senior sustainability consultant. It ingests verified building telemetry, active observations, and deterministic simulation results to generate prioritized, phased action plans and synthesize executive audit reports. Crucially, Grok never calculates savings or invents sensor data—it only interprets verified facts passed to it in structured JSON."

#### Deep Technical Explanation
- **What Grok DOES:**
  - Evaluates multi-dimensional campus context (telemetry + human-confirmed observations + simulation outputs).
  - Generates structured, prioritized recommendations with explicit priority scores ($0–10$), timeline horizons (Immediate, Short-Term, Capital), and operational rationales.
  - Synthesizes comprehensive Executive Summaries for campus provosts and sustainability directors.
  - Verbatim citations of verified building IDs, meter readings, and simulation scenario UUIDs.
- **What Grok DOES NOT Do:**
  - It does **not** calculate energy savings, water volumes, or utility tariffs.
  - It does **not** invent sensor readings, buildings, or campus incidents.
  - It does **not** mutate database records or bypass the human review queue.
  - It does **not** communicate directly with the frontend; all requests are backend-brokered via `app/services/grok_service.py`.

---

### Question 8: How does the application distinguish real measurements from simulated data?
**Status:** `[Implemented & Verified]`

#### 30-Second Spoken Pitch
> "We enforce a strict data provenance standard across the entire stack. Every reading, chart, and metric is stamped with an immutable badge: 'real' for physical meters, 'simulated' for bounded demo telemetry, 'manual' for human logs, 'calculated' for deterministic projections, and 'ai_generated_explanation' for Grok summaries. We never present synthetic numbers as real or simulated savings as measured savings."

#### Deep Technical Explanation
Architectural compliance with Section 2.4 of `AGENTS.md`:
1. **Schema Layer (Pydantic & SQLAlchemy):** Every reading entity enforces a `source` enum:
   ```python
   DataSource = Literal["real", "simulated", "manual", "calculated", "ai_generated_explanation"]
   ```
2. **API Serialization:** All payload endpoints explicitly return `source: "simulated"` and boolean flags like `is_simulated: true`.
3. **Frontend Presentation:** The UI renders dedicated, color-coded shadcn/ui badges next to every metric:
   - Green `[REAL]`: Verified meter telemetry.
   - Purple `[SIMULATED]`: Bounded synthetic sensor data.
   - Blue `[CALCULATED]`: Deterministic Time Machine output.
   - Amber `[AI EXPLANATION]`: Grok-synthesized reasoning.
4. **Honesty Rule:** Projected savings in the Time Machine are labeled as *projected potential*, never as *measured reductions*.

---

### Question 9: How are observations reviewed and confirmed?
**Status:** `[Implemented & Verified]`

#### 30-Second Spoken Pitch
> "Computer Vision output is treated as an unconfirmed observation, never an immediate truth. When a photo is uploaded, it is automatically marked 'requires review'. A facility manager accesses the review queue, inspects the image and detected category, adds contextual notes or reassigns the building, and clicks Confirm or Dismiss. Only confirmed observations trigger campus twin markers and priority recommendations."

#### Deep Technical Explanation
- **Lifecycle State Machine:**
  $$\text{Image Upload} \longrightarrow \texttt{requires\_review} \genfrac{}{}{0pt}{}{\nearrow \texttt{confirmed} \longrightarrow \text{Twin Marker \& AI Plan}}{\searrow \texttt{dismissed} \longrightarrow \text{Archived Audit Log}}$$
- **Review Endpoint:**
  - Handled via `PATCH /api/vision/observations/{id}/status`.
  - Accepts validated schema: `{ "status": "confirmed", "reviewer_notes": "Grounds team dispatched" }`.
  - Records reviewer timestamp (`reviewed_at`) and reviewer ID.
- **Frontend Interaction:** The Vision Review modal (`VisionInspector.tsx`) displays the source photograph, model confidence, assigned building, and allows single-click status transitions with required reviewer notes.

---

### Question 10: What happens when an AI provider fails?
**Status:** `[Implemented & Verified]`

#### 30-Second Spoken Pitch
> "The application is built to be resilient. If the Grok API is unconfigured, times out, or hits a rate limit, the core application continues running normally. The backend automatically produces a fully structured deterministic report, and the frontend displays a transparent service notice. The user can still run simulations, review photos, and inspect telemetry without interruption."

#### Deep Technical Explanation
- **Defensive API Client:** Built with HTTPX in `app/services/grok_service.py` with strict fault handling:
  - *Hard Timeout:* Enforces a 15-second timeout ceiling (`httpx.TimeoutException`).
  - *Rate Limits (429):* Traps 429 errors and maps them to HTTP 503 `PROVIDER_UNAVAILABLE` with client retry headers.
  - *Missing Credentials:* If `XAI_API_KEY` is empty, the service does not crash; it logs a warning and returns a structured fallback response.
- **Deterministic Report Fallback:** When Grok is unavailable, `app/services/report_service.py` falls back to `generate_deterministic_summary()`, generating a complete executive document using algorithmic heuristics.
- **UI Error Shields:** Frontend components (`AiAdvisor.tsx`, `ReportView.tsx`) catch 503/500 responses and display `<ServiceNotice>` callouts informing the user of external provider status without breaking the UI shell.

---

### Question 11: How does the backend persist data?
**Status:** `[Implemented & Verified]`

#### 30-Second Spoken Pitch
> "The backend uses SQLAlchemy ORM with a local SQLite database (`ecotwin.db`) for lightweight, zero-dependency persistence during hackathon evaluation. It stores building metadata, sensor readings, vision observations, simulation scenarios, and generated recommendations with full relational integrity and timestamp tracking."

#### Deep Technical Explanation
- **ORM & Models:** Structured via SQLAlchemy declarative base in `app/models/`:
  - `BuildingModel`: Building identifiers, names, types, square footage, coordinates.
  - `SensorModel`: Sensor metadata, metric type, units, data source.
  - `ReadingModel`: Time-series readings (`timestamp`, `value`, `metric`, `source`).
  - `ObservationModel`: Vision incidents (`image_path`, `category`, `status`, `notes`).
  - `ScenarioModel`: Time Machine runs (`intervention`, `parameters`, `projected_savings`).
- **Database Location:** Local `backend/ecotwin.db` managed via `app/db/session.py`.
- **Cloud Deployment Caveat:** On ephemeral container platforms (Render, Railway), SQLite requires an attached persistent volume (`/data/ecotwin.db`) or can switch to PostgreSQL simply by configuring `DATABASE_URL` in `.env`.

---

### Question 12: How would the system work with real IoT sensors?
**Status:** `[Planned Future Capability]` (Ingestion Endpoint: `[Implemented & Verified]`)

#### 30-Second Spoken Pitch
> "While our prototype uses bounded simulated telemetry for repeatable judging, our ingestion pipeline is production-ready. We already have a validated REST endpoint (`POST /api/sensors/ingest`). In a production deployment, lightweight edge gateways would bridge campus BMS systems—using BACnet, Modbus, or MQTT—to push JSON readings directly into this endpoint with `source: 'real'`."

#### Deep Technical Explanation
- **Ingestion Contract:** `POST /api/sensors/ingest` validates incoming payloads using Pydantic:
  ```json
  {
    "sensor_id": "ENERGY-LIB-01",
    "building_id": "LIB",
    "metric": "energy_consumption",
    "value": 34.2,
    "unit": "kWh",
    "timestamp": "2026-10-16T12:00:00Z",
    "source": "real"
  }
  ```
- **Validation Rules:** Validates allowed metrics (`energy_consumption`, `water_volume`, `waste_fill`), asserts finite positive numbers (rejects `NaN` and `Inf`), and validates unit consistency.
- **Hardware Integration Topology:**
  $$\text{Schneider/Siemens Sub-meters} \xrightarrow{\text{RS-485 / Modbus}} \text{Raspberry Pi Edge Gateway} \xrightarrow[\text{HTTPS POST}]{\text{JSON Telemetry}} \texttt{/api/sensors/ingest}$$

---

### Question 13: What are the known limitations of the prototype?
**Status:** `[Implemented & Verified]` (Documented with complete technical honesty)

#### 30-Second Spoken Pitch
> "We are completely upfront about our boundaries: First, sensor readings are simulated within realistic bounds rather than connected to live campus hardware. Second, our Computer Vision model targets visible surface issues like waste heaps and water puddles; it cannot detect invisible electrical faults. Third, SQLite is used locally, requiring persistent storage volumes in ephemeral cloud containers."

#### Deep Technical Explanation
1. **No Live BACnet Hardware Connection:** Telemetry is generated via mathematical simulation models with diurnal campus curves; no physical IoT sub-meters are currently wired.
2. **Computer Vision Boundary:** Vision analysis is strictly constrained to macro-scale visible issues (overflowing waste receptacles, surface pooling); we make no claim of detecting HVAC mechanical friction or micro-contaminants.
3. **Container Ephemerality:** SQLite database state resets on cloud container restarts unless a persistent disk volume is mounted.
4. **Teammate Boundary Staging:** Backend routes owned by Person 2 (`/api/campus`, `/api/buildings/*`) are staged; when Person 2 services are offline, the frontend gracefully renders non-blocking `<DependencyNotice>` cards without failing.

---

### Question 14: What would you build next with more time?
**Status:** `[Planned Future Capability]`

#### 30-Second Spoken Pitch
> "With another development sprint, we would focus on three high-impact additions: First, automated edge camera processing to run continuous CV inference on perimeter security feeds. Second, automated closed-loop BACnet control to push HVAC schedule setbacks directly to building automation systems. Third, multi-building portfolio benchmarking and automated utility bill PDF reconciliation."

#### Deep Technical Explanation
1. **Edge Video Stream Processing:** Deploy an edge daemon connecting to campus RTSP security camera streams, running lightweight YOLOv8 models to detect waste accumulation automatically without manual photo uploads.
2. **Closed-Loop BMS Actuation:** Enable two-way integration where approved Time Machine scenarios write setback schedules directly to campus Honeywell/Johnson Controls BMS via BACnet/IP.
3. **TimescaleDB Migration:** Migrate the persistence layer from SQLite to PostgreSQL with TimescaleDB hypertables to support sub-second query performance across millions of high-frequency sensor readings.
4. **Utility Bill OCR & Tariff Calibration:** Implement automated parsing of municipal electricity and water PDF bills to dynamically calibrate utility tariffs and peak-demand surcharges.

---

### Question 15: How do you measure or validate sustainability impact?
**Status:** `[Implemented & Verified]` (Methodology and calculation verified; live physical verification is `[Planned Future Capability]`)

#### 30-Second Spoken Pitch
> "We validate impact through an auditable 3-step protocol: First, we establish a verified 30-day pre-intervention baseline. Second, the Time Machine models the intervention using transparent utility tariffs and standard engineering coefficients. Third, in real deployment, post-intervention utility meter data is compared against projections, validating impact if actual reductions fall within a 5% engineering tolerance window."

#### Deep Technical Explanation
Aligned with the **International Performance Measurement and Verification Protocol (IPMVP)**:
- **Phase 1: Baseline Establishment:** Calculate average daily consumption ($E_{\text{baseline}}$) and peak demand across a standardized 30-day operational period, normalized for weather degree-days (CDD/HDD).
- **Phase 2: Predictive Simulation:**
  $$\Delta E_{\text{projected}} = \text{Deterministic Reduction Model}(\text{Intervention Parameters})$$
  $$\text{Financial Savings} = \Delta E_{\text{projected}} \times \text{Tariff Rate}$$
- **Phase 3: Post-Intervention Measurement:** Following intervention deployment (e.g. 20:00 HVAC setbacks), collect 30 days of actual metered data ($E_{\text{post}}$).
- **Validation Criteria:**
  $$\text{Variance} = \left| \frac{(E_{\text{baseline}} - E_{\text{post}}) - \Delta E_{\text{projected}}}{\Delta E_{\text{projected}}} \right|$$
  An intervention is mathematically verified if $\text{Variance} \le 5\%$.
