# EcoTwin AI — Demonstration Runbook, Acceptance Criteria & Reliability Plan

> **Document Status:** Phase 0 Acceptance & Verification Specification  
> **Authority:** Derived directly from [AGENTS.md Section 17, 21, 22](file:///d:/DSU-hackathon/AGENTS.md), [CLAUDE.md](file:///d:/DSU-hackathon/CLAUDE.md), and [docs/architecture.md](file:///d:/DSU-hackathon/docs/architecture.md).  
> **Purpose:** Establishes the authoritative 10-step live demonstration runbook, testable acceptance criteria for all P0 features, demo-data provenance rules, failure recovery procedures, and measurable completion gates.

---

## 1. End-to-End Core Demonstration Runbook

The EcoTwin AI demonstration illustrates a single, continuous user journey: from identifying an operational anomaly through Computer Vision, to state synchronization in the Digital Twin, deterministic what-if modeling via the Sustainability Time Machine, grounded Grok AI reasoning, and verifiable sustainability report generation.

### Demonstration Journey Overview
- **Featured Building:** `LIB` (Library)
- **Secondary Reference Buildings:** `ACADEMIC` (Academic Block), `RESIDENCE` (Student Residence)
- **Primary Intervention:** Energy curtailment via reduced operational hours (off-peak shutdown)
- **Secondary Supported Interventions:** Water pipe leak repair, waste segregation improvement

---

### Detailed Step-by-Step Execution Plan

```
[ Step 1: Campus Overview ] ──> [ Step 2 & 3: Select Library & Inspect Telemetry ]
                                                         │
                                                         v
[ Step 6: Digital Twin State Sync ] <── [ Step 4 & 5: Image Upload & CV Review ]
            │
            v
[ Step 7 & 8: Sustainability Time Machine (Run & Compare Simulation) ]
            │
            v
[ Step 9: Grok AI Grounded Recommendation ] ──> [ Step 10: Audit Report Generation ]
```

#### Step 1: Open Campus Overview Dashboard
- **Presenter Action:** Navigates to `/` (Overview) in the web browser.
- **Audience Sees:** Global campus digital twin header showing total active resource consumption across the last 24 hours (energy in kWh, water in L, waste in kg), aggregate status summary (number of active and review-pending issues), interactive campus map highlighting all 3 buildings (`ACADEMIC`, `LIB`, `RESIDENCE`), and telemetry trend cards.
- **Backend Endpoints / Components:** `GET /api/campus`, `GET /api/buildings`, `frontend/src/pages/Overview.tsx`.
- **Pre-existing Data Required:** Database seeded with initial 3 buildings, current aggregated summary metrics, and active issue counts.
- **Success Criteria:** HTTP 200 returned; dashboard metrics render with explicit units (`kWh`, `L`, `kg`, `%`); data provenance chips display `Simulated` for synthetic baseline metrics; no UI layout breaking.
- **Failure Recovery:** If `/api/campus` returns 500/503, UI renders a descriptive error banner with a "Retry Connection" button without crashing the shell navigation.

#### Step 2: Select Campus Building (`LIB`)
- **Presenter Action:** Clicks on the Library (`LIB`) node on the interactive 2D/2.5D campus map or selects it from the building cards.
- **Audience Sees:** Smooth transition to `/campus-twin?building=LIB` (or building drawer). The building inspector highlights the Library's operational schedule (08:00 - 22:00), baseline resource consumption rates, active sensor list (`ENERGY-LIB-01`, `WATER-LIB-01`), and current status indicator.
- **Backend Endpoints / Components:** `GET /api/buildings/LIB`, `frontend/src/pages/CampusTwin.tsx`.
- **Pre-existing Data Required:** Building record `LIB` seeded with linked sensors in database.
- **Success Criteria:** Library details load cleanly; building status badge displays current health (e.g., "Active Monitoring"); active sensors list displays their operational status and `simulated` source tag.
- **Failure Recovery:** If 404/500 occurs, fallback displays "Building information currently unavailable" with navigation back to Overview.

#### Step 3: Inspect Building Resource Telemetry & Provenance
- **Presenter Action:** Switches to the Telemetry / Resource Monitoring tab or scrolls to the historical chart widget.
- **Audience Sees:** Time-series charts rendered via Recharts showing recent energy usage (hourly kWh readings over the last 24 hours). A visible provenance badge clearly marks all readings with `source: simulated`.
- **Backend Endpoints / Components:** `GET /api/buildings/LIB/readings?metric=energy_consumption`, `frontend/src/pages/ResourceMonitoring.tsx`.
- **Pre-existing Data Required:** Minimum of 12-24 hourly synthetic sensor readings seeded for `ENERGY-LIB-01`.
- **Success Criteria:** Clean line/bar chart rendering without arbitrary jumps; tooltips show timestamp and unit (`kWh`); source label `simulated` is prominently visible.
- **Failure Recovery:** Empty state shows "No telemetry readings available for selected window" with a button to invoke `POST /api/sensors/simulate`.

#### Step 4: Upload Image for Computer Vision Analysis
- **Presenter Action:** Navigates to `/vision-inspector`, drags-and-drops a pre-selected test image depicting visible waste accumulation (e.g. an overflowing paper bin in a library hallway) or selects it via file picker, and clicks "Analyze Image".
- **Audience Sees:** Immediate client-side image preview, file validation feedback (e.g. `waste_bin_overflow.jpg`, 1.4 MB, JPEG), an animated scanning progress state, followed by the structured vision output card displaying detected categories (`cardboard`, `overflowing_bin`) and qualitative certainty (`medium`).
- **Backend Endpoints / Components:** `POST /api/observations/analyze-image` (multipart form-data), `services/vision_service.py`.
- **Pre-existing Data Required:** Curated sample test images in `data/sample_images/` vetted against the vision provider adapter.
- **Success Criteria:** HTTP 201 Created; server stores file under sanitized UUID; returns `observation_id`; initial status is explicitly set to `requires_review`; no hallucinated percentage confidence.
- **Failure Recovery:** If the external vision provider returns 502/timeout, UI displays an honest provider error banner with a retry button. If in demo fallback mode, it indicates `source="demo_fallback"` transparently.

#### Step 5: Review Observation & Confirm Association
- **Presenter Action:** In the Vision Inspector review pane, the presenter verifies the proposed building assignment (`LIB`), adds a short reviewer note ("Confirmed overflowing paper bin outside 2nd floor study hall"), and clicks "Confirm Observation".
- **Audience Sees:** Status badge transitions with animation from amber `requires_review` to green `confirmed`. A confirmation toast appears, and the observation moves to the confirmed issue queue.
- **Backend Endpoints / Components:** `PATCH /api/observations/{id}`, `services/campus_service.py`.
- **Pre-existing Data Required:** Review-pending observation created in Step 4.
- **Success Criteria:** HTTP 200 OK; observation record updated in SQLite with `reviewed_at` timestamp and reviewer note; response payload reflects `status="confirmed"`.
- **Failure Recovery:** If the update fails, UI displays "Failed to update review status; please retry" and retains user input in the form.

#### Step 6: Verify Digital Twin State Synchronization
- **Presenter Action:** Clicks the deep-link in the confirmation toast or navigates back to `/campus-twin`.
- **Audience Sees:** The Library building badge now displays an active issue alert icon. The building details panel lists the newly confirmed observation under "Active Incidents", and the campus overview active incident counter has incremented from 1 to 2.
- **Backend Endpoints / Components:** `GET /api/buildings/LIB`, `GET /api/campus`.
- **Pre-existing Data Required:** Updated observation in database from Step 5.
- **Success Criteria:** Confirmed observation is visible in the Digital Twin interface; issue timestamp, building linkage, and description match Step 5.
- **Failure Recovery:** If the issue counter does not refresh immediately, a manual "Refresh Twin State" button triggers a fresh fetch.

#### Step 7: Configure Sustainability Time Machine Intervention
- **Presenter Action:** Navigates to `/simulations`, selects Resource: `Energy`, Target Building: `Library (LIB)`, and Intervention: `Reduce Equipment Operating Hours`. Presenter enters a proposed reduction from 14.0 hours/day to 10.0 hours/day over a 30-day period (constant baseline load: 25.0 kW; tariff: $0.12/kWh), and clicks "Run Simulation".
- **Audience Sees:** Clean parameter input form with bounded inputs and unit indicators (`hours/day`, `kW`, `$`). Input validation confirms all parameters are positive and non-zero.
- **Backend Endpoints / Components:** `POST /api/simulations/run`, `services/simulation_service.py`, `frontend/src/pages/Simulations.tsx`.
- **Pre-existing Data Required:** Persisted baseline values or valid operational inputs for `LIB`.
- **Success Criteria:** Request payload passes Pydantic schema validation; parameters are strictly verified before execution.
- **Failure Recovery:** If invalid parameters are entered (e.g. negative hours or > 24 hrs), client-side and server-side validation error messages highlight the offending input fields with `422 Unprocessable Entity`.

#### Step 8: Compare Baseline vs Projected Scenario
- **Presenter Action:** Reviews the calculated results displayed in the comparison cards.
- **Audience Sees:** Side-by-side comparison cards:
  - **Baseline:** $10,500.0\text{ kWh}$ ($25.0\text{ kW} \times 14.0\text{ hrs} \times 30\text{ days}$)
  - **Projected Scenario:** $7,500.0\text{ kWh}$ ($25.0\text{ kW} \times 10.0\text{ hrs} \times 30\text{ days}$)
  - **Projected Savings:** $3,000.0\text{ kWh}$ ($28.57\%$ reduction)
  - **Projected Cost Avoided:** $\$360.00$ (at $\$0.12/\text{kWh}$)
  - **Assumptions Card:** Lists all assumptions used in the formula.
  - **Provenance Badge:** Explicitly marked `projected_simulation`.
- **Backend Endpoints / Components:** `POST /api/simulations/run`, `GET /api/simulations/{id}`.
- **Pre-existing Data Required:** Step 7 execution.
- **Success Criteria:** Math is deterministic and mathematically exact ($10500 - 7500 = 3000$); baseline in database remains untouched; calculation method documented.
- **Failure Recovery:** If simulation endpoint fails, UI renders "Simulation calculation failed" with logged error details without altering any existing database records.

#### Step 9: Ask Grok for Grounded Explanations & Recommendations
- **Presenter Action:** Clicks "Explain with Grok AI" on the simulation result card or navigates to `/ai-advisor`.
- **Audience Sees:** Context panel shows exact data being passed to Grok (building ID, projected savings: $3,000\text{ kWh}$, cost: $\$360$, confirmed waste observation). After an animated reasoning state, Grok returns a structured recommendation titled "HVAC & Lighting Schedule Curtailment", justifying the high priority, outlining 2 practical operational steps, and referencing the simulation outputs.
- **Backend Endpoints / Components:** `POST /api/ai/recommendations`, `services/grok_service.py`, `services/recommendation_service.py`.
- **Pre-existing Data Required:** Persisted scenario ID from Step 8, confirmed observation from Step 5.
- **Success Criteria:** HTTP 200 OK; Grok output adheres to Pydantic schema; recommendation text explicitly cites the $\$360$ / $3,000\text{ kWh}$ numbers computed by the backend; provenance label displays `ai_generated_explanation`.
- **Failure Recovery:** If Grok API times out or rate limits (HTTP 429/503), the UI displays a clear notification: "AI Reasoning Service currently unavailable (Rate limit or timeout). Core simulation and telemetry data remain unaffected." Displays a "Retry AI Query" button.

#### Step 10: Generate Authoritative Campus Sustainability Report
- **Presenter Action:** Navigates to `/reports`, selects Scope: `Campus-Wide`, Period: `Last 30 Days`, checks "Include Scenario: scen-501", and clicks "Generate Report".
- **Audience Sees:** A formatted, executive-ready sustainability report containing:
  1. Executive Summary
  2. Campus Resource Consumption Audit (clearly identifying simulated vs measured baseline totals)
  3. Physical Observations Summary (1 under review, 2 confirmed)
  4. Tested Interventions (Library schedule curtailment projection)
  5. Strategic Recommendations & Action Plan
  6. Provenance & Limitations Disclaimer
- **Backend Endpoints / Components:** `POST /api/ai/reports`, `services/report_service.py`.
- **Pre-existing Data Required:** Persisted campus metrics, observations, and scenario history.
- **Success Criteria:** Complete report compiled and validated; distinct visual sections for facts, observations, simulations, and AI text; disclaimer prominently displayed.
- **Failure Recovery:** If report generation fails, cached/pre-compiled report summary is offered with a label "Offline Report Snapshot".

---

## 2. Measurable Acceptance Criteria (P0 Features)

The following table provides objectively verifiable criteria for all mandatory P0 requirements specified in `AGENTS.md`:

| ID | Requirement | Acceptance Criterion | Verification Method | Dependencies | Priority |
|---|---|---|---|---|---|
| **AC-01** | Dashboard & Campus Overview | `GET /api/campus` returns HTTP 200 with aggregate energy (kWh), water (L), waste (kg), issue counts, and provenance tags within 500ms. | Automated API test and visual inspection of `/` rendering metrics and units. | Backend seed data | **P0** |
| **AC-02** | 3 Sample Buildings | Database contains exactly `ACADEMIC`, `LIB`, `RESIDENCE`. `GET /api/buildings` returns all 3 with individual metrics and status. | Pytest DB query test; frontend campus selector displays all 3 buildings. | Database schema & seed | **P0** |
| **AC-03** | Sensor Ingestion Pipeline | `POST /api/sensors/readings` accepts valid JSON, validates bounds, stamps timezone ISO 8601, and rejects NaN, negative values, and unit mismatches with HTTP 422. | Automated unit tests covering valid, out-of-bounds, and malformed payloads. | `SensorService` | **P0** |
| **AC-04** | Synthetic Sensor Stream | `POST /api/sensors/simulate` generates bounded, non-spiking readings; every created reading immutably contains `source="simulated"`. | Database query verifying `source="simulated"` for all generated telemetry. | Sensor simulator module | **P0** |
| **AC-05** | Interactive Campus Representation | Frontend provides interactive 2D/2.5D campus map allowing building selection, showing status badges and active incident counts. | End-to-end browser test: clicking a building opens its detail drawer and updates URL query. | React UI & building endpoints | **P0** |
| **AC-06** | Computer Vision Upload & Inference | `POST /api/observations/analyze-image` accepts JPEG/PNG/WebP under 8MB, rejects non-image files with HTTP 400, saves UUID filename, and returns normalized labels. | API test uploading valid test images and invalid MIME types. | Vision adapter & local upload dir | **P0** |
| **AC-07** | Observation Review Lifecycle | Uploaded observation is created with `status="requires_review"`. `PATCH /api/observations/{id}` updates status to `confirmed` or `dismissed` with reviewer note. | Pytest verifying state machine transitions and audit timestamp. | `Observation` DB model | **P0** |
| **AC-08** | Deterministic Energy Simulation | `POST /api/simulations/run` calculates $\text{kWh} = \text{kW} \times \text{hrs} \times \text{days}$, computes savings and percentage, handles zero baseline gracefully, and returns identical results for identical inputs. | Pytest parameterized math test comparing backend output against expected mathematical truth. | `SimulationService` | **P0** |
| **AC-09** | Additional Simulation (Water/Waste) | Simulation engine supports at least one secondary resource: water leak volume ($\text{L} = \text{flow} \times \text{mins}$) or waste segregation mass ($\text{kg} = \text{total} \times \text{fraction}$). | Unit test executing water leak scenario with bounds checking on duration and flow rate. | `SimulationService` | **P0** |
| **AC-10** | Baseline vs Scenario Separation | Running a simulation creates a separate scenario record; baseline telemetry in `readings` table is 100% unaltered. UI renders both side-by-side. | Database diff check before and after simulation execution. | Database persistence | **P0** |
| **AC-11** | Grounded Grok Recommendations | `POST /api/ai/recommendations` sends assembled context to Grok, receives structured JSON matching Pydantic schema, and references actual scenario savings numbers. | API test verifying response schema and validating that savings figures match simulation output. | `GrokService` & xAI API key | **P0** |
| **AC-12** | Sustainability Report Compilation | `POST /api/ai/reports` aggregates campus metrics, observations, simulation history, and AI insights into an executive report with explicit provenance disclaimer. | Automated API test verifying all required sections exist in returned report JSON. | `ReportService` | **P0** |
| **AC-13** | Provenance Distinction Rule | Every displayed data point across UI and API is classified into `MEASURED`, `SIMULATED`, `OBSERVED`, `CALCULATED`, or `ESTIMATED / AI-GENERATED`. | Visual inspection of UI cards and schema validation of `provenance_label` fields. | Full-stack data contracts | **P0** |
| **AC-14** | External Failure Resilience | If Grok or Vision API is unreachable, backend returns structured HTTP 502/503; frontend displays descriptive banner; core dashboard and simulations continue to work. | Mocked network outage integration tests with disconnected external providers. | Frontend & backend error handlers | **P0** |
| **AC-15** | End-to-End Workflow Integration | The full 10-step demo flow runs sequentially from Step 1 to Step 10 without manual DB tampering or server restart. | Live rehearsal runbook execution adhering to Step 1-10 checklist. | All integrated modules | **P0** |

---

## 3. Demonstration Data Integrity & Provenance

To satisfy the core product principle (*"Never present synthetic data as real sensor measurements, never present a model prediction as a confirmed real-world incident without review, and never present a projected saving as a measured saving"*), the demonstration data architecture is strictly defined:

```
+---------------------------------------------------------------------------------------------------+
|                                  DEMO DATA PROVENANCE TAXONOMY                                    |
|                                                                                                   |
|  [ 1. SIMULATED TELEMETRY ]                                                                       |
|  - Buildings: ACADEMIC, LIB, RESIDENCE                                                            |
|  - Ingestion: Generated via POST /api/sensors/simulate with seed value 42                         |
|  - Label: Immutably marked source="simulated" in SQLite and displayed with "Simulated" badge      |
|                                                                                                   |
|  [ 2. IMAGE OBSERVATIONS (INFERENCES) ]                                                           |
|  - Source: data/sample_images/waste_hallway_bin.jpg (realistic campus bin photo)                  |
|  - Status: Initially created as status="requires_review"                                          |
|  - Label: Explicitly tagged source="image_analysis", certainty="medium"                           |
|                                                                                                   |
|  [ 3. CONFIRMED OPERATIONAL INCIDENTS ]                                                           |
|  - Source: Promoted only after explicit PATCH /api/observations/{id} review action                |
|  - Status: status="confirmed", with reviewer_note and reviewed_at timestamp                       |
|                                                                                                   |
|  [ 4. DETERMINISTIC SCENARIO PROJECTIONS ]                                                        |
|  - Source: Computed by pure Python formulas in services/simulation_service.py                     |
|  - Persistence: Stored in scenarios table; baseline table is NEVER overwritten                    |
|  - Label: Explicitly tagged provenance_label="projected_simulation"                              |
|                                                                                                   |
|  [ 5. AI REASONING & SYNTHESIS ]                                                                  |
|  - Source: Generated by Grok API using strictly supplied campus context JSON                      |
|  - Label: Tagged provenance_label="ai_generated_explanation" with mandatory disclaimer            |
+---------------------------------------------------------------------------------------------------+
```

### Seeded vs Live Operations
1. **Seeded Data (Prepared Before Demo):**
   - 3 canonical building entities (`ACADEMIC`, `LIB`, `RESIDENCE`) with standard operational parameters.
   - Initial 24 hours of baseline simulated telemetry per building.
   - 1 pre-existing resolved observation (to demonstrate historical issue tracking).
   - Standard electricity tariff ($0.12/kWh).
2. **Live Operations (Executed During Presentation):**
   - Uploading `waste_hallway_bin.jpg` live to the Vision Inspector.
   - Reviewing and confirming the resulting observation live.
   - Executing the Library schedule reduction simulation live.
   - Invoking Grok AI live to explain the specific simulation output.
   - Compiling the final report live.
3. **Fallback Integrity Rules:**
   - If live vision analysis fails, presenter toggles to a pre-analyzed fallback observation clearly identified as `source="demo_fallback"`. Presenter explains the network error transparently.
   - Under no circumstances will mock data be represented as live sensor feeds or live vision output.

---

## 4. Failure Recovery Procedures

| Failure Scenario | Immediate Symptoms | Root Cause | Presenter Recovery Procedure | Technical Resilience Mechanism |
|---|---|---|---|---|
| **Backend Startup Failure** | Terminal exits with code 1; frontend shows "Connection Refused". | Port 8000 conflict or missing environment variable in `.env`. | Run `Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess \| Stop-Process -Force`. Re-run `uvicorn app.main:app --port 8000`. | FastAPI startup validation logs exact missing variable before exiting. |
| **Frontend-Backend Connectivity Failure** | Dashboard displays "API Offline" alert badge; network requests show `ECONNREFUSED`. | Backend server stopped or Vite proxy misconfigured. | Verify backend running on `8000`. Test `curl http://localhost:8000/api/health`. If healthy, reload frontend tab. | Vite dev proxy routes `/api` to `localhost:8000`. Global Axios/fetch wrapper returns structured network error. |
| **Database Initialization Problems** | Backend logs SQLite lock error or `TableNotFoundException`. | Missing seed script execution or file permission lock. | Run `python scripts/seed_database.py --reset`. Verify `ecotwin.db` file permissions. | SQLAlchemy startup hook verifies table existence on startup. |
| **Missing Provider Credentials** | Grok or Vision returns "API Key Missing". | Missing `XAI_API_KEY` or `VISION_API_KEY` in `.env`. | Presenter switches application into Demo Mode (`DEMO_MODE=true` in `.env`). | Backend logs warning and exposes explicit status in `GET /api/health` without exposing secrets. |
| **Computer Vision Provider Outage** | Vision analysis spinner hangs or returns HTTP 502/504. | External provider rate limit, network timeout, or endpoint maintenance. | Presenter states: *"The cloud vision service is experiencing latency; we will load our pre-staged sample observation to demonstrate the Digital Twin pipeline."* | Backend times out after 10s, returns `502 Bad Gateway`, and offers sample observation payload marked `source="demo_fallback"`. |
| **Grok API Timeout or Rate Limit** | AI recommendation returns "Service Unavailable" after 15s. | xAI API rate limit (429) or endpoint connectivity drop. | Presenter highlights: *"Notice our deterministic simulation calculations completed instantly. While Grok API is rate-limited, our core engineering calculations remain 100% intact."* | HTTPX client enforces a 12s timeout; UI renders warning banner with a "Retry AI Query" button without breaking the page. |
| **Invalid Image Upload** | Upload rejected with error modal. | File exceeds 8MB or non-image format uploaded. | Presenter selects approved image from `data/sample_images/`. | Client checks file type/size before upload; server checks magic bytes and returns HTTP 400 with clean error message. |
| **Empty Sensor Data** | Charts display blank coordinate grids. | Database flushed without re-seeding telemetry. | Presenter navigates to Telemetry page and clicks "Generate 24h Telemetry" button (`POST /api/sensors/simulate`). | UI detects empty array and displays an empty-state illustration with an explicit "Populate Simulated Telemetry" action button. |
| **Invalid Simulation Parameters** | Simulation button disabled or returns HTTP 422. | Proposed hours > 24, negative power, or non-numeric input. | Presenter corrects input to valid range (e.g. 10.0 hrs/day). | Client-side form constraints prevent negative values; Pydantic schema returns explicit field-level error details. |
| **Unexpected UI / JS Runtime Error** | Component crashes or blank screen. | Unhandled null reference in state. | Presenter refreshes browser page (`Ctrl+F5`). | React Error Boundaries wrap all 7 major view routes, isolating errors to the card and rendering a "Reload Component" button. |

---

## 5. Measurable Completion Gates

Progression through hackathon development is governed by three strict, non-overlapping completion gates:

### Gate A — Core Functionality Gate
> **Definition:** All foundational P0 backend endpoints, deterministic calculation modules, and frontend primitives function in isolation.

**Required Evidence to Pass:**
- [ ] Backend runs on `http://localhost:8000` with `GET /api/health` returning `status="healthy"`.
- [ ] SQLite database initialized with all tables: `buildings`, `sensors`, `readings`, `observations`, `scenarios`.
- [ ] Three sample buildings (`ACADEMIC`, `LIB`, `RESIDENCE`) seeded with consistent initial metrics.
- [ ] Sensor ingestion route validates and stores readings; sensor simulator generates source-labelled data.
- [ ] Pure Python energy simulation unit tests pass with 100% deterministic mathematical accuracy.
- [ ] Pure Python secondary simulation (water or waste) unit tests pass.
- [ ] Dedicated Computer Vision adapter normalizes sample image into `VisionAnalysisResult`.
- [ ] Grok service client successfully connects to xAI API and validates JSON output against Pydantic schema.
- [ ] React frontend starts cleanly with Vite on `http://localhost:5173` without TypeScript or bundle errors.

---

### Gate B — Integration Reliability Gate
> **Definition:** The 7 frontend pages communicate seamlessly with backend endpoints, state transitions propagate across the Digital Twin, and third-party provider failures are handled gracefully without application crashes.

**Required Evidence to Pass:**
- [ ] Frontend successfully retrieves and renders campus metrics from `GET /api/campus`.
- [ ] Selecting a building on the map correctly filters telemetry and active observations.
- [ ] Uploading an image in the Vision Inspector produces a `requires_review` observation in the UI.
- [ ] Confirming an observation updates the Digital Twin status indicators without page reload.
- [ ] Sustainability Time Machine form correctly submits to `/api/simulations/run` and displays baseline vs scenario side-by-side with exact math.
- [ ] Grok AI explains simulation results using the actual backend numbers (no hallucinated figures).
- [ ] Comprehensive sustainability report is generated, displaying distinct sections for facts, simulations, and AI reasoning.
- [ ] Simulating an external provider failure (disconnecting internet or setting dummy API key) does not crash the backend or freeze the frontend UI.
- [ ] Provenance chips (`Simulated`, `Measured`, `Projected`, `AI-Generated`) are visible on all corresponding metrics.

---

### Gate C — Demonstration Readiness Gate
> **Definition:** The team can execute the complete 10-step demo runbook sequentially from memory or runbook without opening code editors, executing ad-hoc database queries, or encountering unhandled errors.

**Required Evidence to Pass:**
- [ ] Full 10-step demo rehearsed end-to-end under timed conditions (target: 6 to 8 minutes).
- [ ] Standard test images verified and staged in `data/sample_images/`.
- [ ] Database seed script verified to reset state to clean demo baseline in $< 5\text{ seconds}$.
- [ ] Team members have assigned speaking roles and smooth handoffs.
- [ ] Offline demo fallback assets verified in case live conference Wi-Fi drops.
- [ ] Architecture slides and live demonstration tell a unified, coherent story of the EcoTwin Impact Engine.

---

## 6. Audit & Pre-Implementation Verification Note

*This document defines the rigorous acceptance and demo specification for Phase 0 planning. In compliance with Phase 0 rules, no application code has been generated, no endpoints have been created, and no acceptance gates have been marked as passed. Verification will occur objectively during Phase 1 through Phase 6.*
