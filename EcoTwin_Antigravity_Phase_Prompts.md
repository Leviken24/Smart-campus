# EcoTwin AI — Antigravity Implementation Prompt Pack
## Four-person team | Strictly aligned with `AGENTS.md` and `CLAUDE.md`

## How to use this pack

1. Put both `AGENTS.md` and `CLAUDE.md` in the root of the shared repository.
2. Give each person the prompt assigned to them for the current phase. Replace `PERSON 1–4` with your real names if useful.
3. Paste prompts into Antigravity **one at a time**. Do not ask it to implement every phase in one giant task.
4. Each person must work in their own branch or clearly separated files where practical. Person 1 integrates.
5. Before coding, Antigravity must read both project files. `AGENTS.md` is the detailed source of truth; `CLAUDE.md` is the beginner-friendly guide.
6. Do not silently change architecture, API routes, shared field names, technology choices, or module boundaries.
7. After each prompt, ask Antigravity to report changed files, commands/tests run, assumptions, blockers, and what remains.
8. Start the next phase only after the current phase's exit criteria are met. Test continuously.

### Fixed project rules

- Product: EcoTwin AI — AI-powered campus sustainability Digital Twin.
- Stack: React + TypeScript + Vite; Tailwind CSS + shadcn/ui; Recharts; Lucide React; React Router; Python + FastAPI; Pydantic; SQLAlchemy; SQLite; HTTPX; Pytest; Uvicorn.
- Architecture: one frontend, one modular-monolith FastAPI backend, one SQLite database. Do not add microservices or multi-agent orchestration.
- AI: a dedicated Computer Vision provider for supported image analysis, plus Grok API for grounded recommendations, simulation explanations, and reports.
- Simulations: deterministic backend calculations; do not rely on Grok to calculate authoritative numbers.
- Sample buildings: `ACADEMIC`, `LIB`, `RESIDENCE`.
- Simulated data must be labelled `simulated`. Image results are observations, not proof, and normally start as `requires_review`.
- API keys remain on the backend, never in frontend `VITE_*` variables or committed files.
- P0 requirements come before P1, and P1 before P2.
- Do not invent a provider, model identifier, API contract, capability, measurement, or result. Verify current provider documentation when needed.

---

# PHASE 0 — Team alignment and safe project setup
**Purpose:** Agree on the shared plan before four people create conflicting code. This is a preparation phase before the 48-hour schedule in `AGENTS.md`.

## Person 1 — Technical lead / shared contracts

**Prompt 0.1**
```text
You are Person 1, Technical Lead / Integration for EcoTwin AI.

Before doing anything, read the complete AGENTS.md and CLAUDE.md in the repository root. AGENTS.md is the source of truth. Do not use a different architecture or silently change any requirement.

This is Phase 0: planning and repository alignment. Do not implement the full application yet.

Tasks:
1. Inspect the current repository and report what already exists.
2. Identify the agreed stack, architecture, four module owners, P0 requirements, six 48-hour phases, and exact API route list from AGENTS.md.
3. Create or update only the planning artifacts needed for the team to coordinate:
   - docs/architecture.md: the modular-monolith architecture and module boundaries.
   - docs/api-contracts.md: the exact initial endpoint list from AGENTS.md, with request/response schemas marked "to be agreed/implemented" where details are not yet specified.
   - docs/phase-0-decisions.md: decisions made, unresolved questions, and owners.
4. Do not invent missing request/response fields. Clearly mark anything not defined by AGENTS.md as a proposal requiring team agreement.
5. Do not create duplicate services, microservices, authentication, multi-agent orchestration, or P2 features.
6. Do not expose or request real API keys. Create no secrets.
7. Tell the team exactly which contracts must be agreed before parallel implementation.

Finish with: files changed, decisions that still need team approval, risks/blockers, and a Phase 0 checklist. Do not start Phase 1 implementation until the team approves the shared contracts.
```

## Person 2 — Digital Twin / sensor / simulation planning

**Prompt 0.2**
```text
You are Person 2, responsible for Digital Twin, sensor data, and simulation in EcoTwin AI.

Read the complete AGENTS.md and CLAUDE.md first. Follow them strictly. This is Phase 0 planning only; do not implement the full backend yet.

Inspect the repository and prepare a concise implementation specification for your module, preferably in docs/digital-twin-simulation-plan.md.

Include only requirements supported by AGENTS.md:
- The three sample buildings: ACADEMIC, LIB, RESIDENCE.
- Sensor and sensor-reading concepts, source labels (simulated/manual/real), timestamps, units, and validation rules.
- Deterministic simulated readings and a validated sensor-ingestion path.
- Energy formula: energy_kwh = power_kw * operating_hours_per_day * operating_days.
- Water formula: leaked_volume_litres = flow_litres_per_minute * duration_minutes.
- Waste formula: segregated_mass_kg = total_waste_kg * segregation_fraction.
- Baseline and scenario must remain separate; projections must be labelled.
- At least energy plus one other resource simulation are P0.
- SQLite/SQLAlchemy/Pydantic/FastAPI are the required initial backend technologies.

Do not invent undocumented API fields, scientific constants, electricity tariffs, emissions factors, or real sensor measurements. Mark unknowns for team agreement. Do not call Grok to perform numerical calculations.

Coordinate your proposed schemas with Person 1; do not create competing contract definitions. Finish with files changed, assumptions, and unresolved questions.
```

## Person 3 — Frontend / visualization planning

**Prompt 0.3**
```text
You are Person 3, responsible for frontend and visualization in EcoTwin AI.

Read the complete AGENTS.md and CLAUDE.md first. This is Phase 0 planning only; do not build the whole UI yet.

Inspect the repository and prepare docs/frontend-plan.md.

Plan the required frontend using React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, Lucide React, and React Router. Follow the visual direction in AGENTS.md: dark indigo/charcoal, cyan primary accent, violet for AI, restrained glass-like panels, accessible contrast, responsive layout, and clear loading/error/empty states.

List the required navigation/pages:
Overview, Campus Twin, Resource Monitoring, Vision Inspector, Simulations, AI Advisor, Reports.

For each page, list its purpose and the data it needs. Use only endpoint names and data concepts in AGENTS.md; do not invent backend fields. Mark schema-dependent UI as waiting for Person 1's approved contracts.

Do not put API keys in frontend code or VITE_* variables. Do not create decorative charts that pretend to show real data. All simulated data must be visibly labelled.

Do not introduce another frontend framework or unnecessary packages. Coordinate API usage and TypeScript types with Person 1. Finish with files changed, unresolved dependencies, and a UI build order.
```

## Person 4 — Computer Vision / Grok / reports planning

**Prompt 0.4**
```text
You are Person 4, responsible for Computer Vision integration, Grok integration, recommendations, and reports in EcoTwin AI.

Read the complete AGENTS.md and CLAUDE.md first. This is Phase 0 planning only; do not implement the full integrations yet.

Inspect the repository and prepare docs/ai-provider-plan.md.

Keep the two providers separate:
1. A dedicated pretrained Computer Vision provider/model for supported image analysis.
2. Grok API for context-grounded recommendations, simulation explanations, campus questions, and sustainability reports.

AGENTS.md does not specify a particular vision vendor or exact Grok model identifier. Do not guess either. List the criteria to verify against current official provider documentation: image support, endpoint, model ID, request/response schema, rate limits, cost/free tier, latency, and performance on representative images.

Document the expected flow:
image upload -> validation -> vision adapter -> normalized observation -> requires_review -> building association -> Digital Twin/recommendation workflow.
Grok receives only relevant application context. It must not invent readings, determine authoritative simulation values, or overwrite source data.

List backend-only environment names from AGENTS.md: XAI_API_KEY, XAI_MODEL, VISION_PROVIDER, VISION_API_KEY, VISION_MODEL. Do not request or create real keys. Do not place keys in frontend variables or Git.

Coordinate the observation/recommendation/report schemas with Person 1 and Person 2. Mark unknowns instead of inventing them. Finish with files changed, provider decisions still required, and integration dependencies.
```

### Phase 0 exit checklist

- [ ] Everyone has read `AGENTS.md` and `CLAUDE.md`.
- [ ] Existing repository state is understood.
- [ ] Person 1 has recorded the architecture and exact endpoint list.
- [ ] Team has agreed on shared request/response schemas before parallel coding.
- [ ] Provider choices/model IDs are either verified or explicitly marked unresolved.
- [ ] No real keys or secrets have been committed.
- [ ] The team knows each person's ownership and the Phase 1 exit criteria.

---

# PHASE 1 — Foundation (Hours 0–4 in AGENTS.md)
**Goal:** The app runs locally, and the frontend retrieves campus data from the backend.

## Person 1 — Repository, backend skeleton, and integration

**Prompt 1.1**
```text
You are Person 1, Technical Lead / Integration. Read AGENTS.md and CLAUDE.md completely before coding. Implement only Phase 1 Foundation.

Inspect the existing repository first and preserve working code. Follow the agreed modular-monolith architecture: React/TypeScript/Vite frontend, Python/FastAPI backend, SQLite, Pydantic, SQLAlchemy. Do not add microservices or change the stack.

Tasks:
1. Create/complete the root conventions and .gitignore so .env, databases, uploaded images, caches, logs, build output, node_modules, and virtual environments are excluded.
2. Create .env.example using only placeholder values and the variable names in AGENTS.md.
3. Set up the backend package structure from AGENTS.md only as needed.
4. Implement GET /api/health.
5. Coordinate a minimal campus/buildings response with Person 2 and Person 3. Do not invent undocumented fields; agree the schema before wiring it.
6. Configure development CORS for the agreed frontend origin, initially http://localhost:5173.
7. Add basic startup instructions to README.md.
8. Verify backend startup and health endpoint. Do not require external API keys for Phase 1.

Do not implement vision, Grok, reports, deployment, authentication, or P2 features in this phase. Do not overwrite another person's files without coordination.

Return changed files, exact run commands, tests/checks performed, and blockers. Phase 1 passes only when the backend starts and /api/health works.
```

## Person 2 — Building seed data and backend data foundations

**Prompt 1.2**
```text
You are Person 2, Digital Twin / Sensor / Simulation. Read AGENTS.md and CLAUDE.md completely. Implement only the Phase 1 data foundation.

Inspect the repository and coordinate with Person 1 before defining shared schemas. Do not create a second backend or a separate database layer.

Tasks:
1. Define the initial building data for exactly these sample IDs: ACADEMIC, LIB, RESIDENCE, with display names Academic Block, Library, and Student Residence.
2. Use SQLite and SQLAlchemy as required by AGENTS.md. Add only the minimal building model/seed mechanism needed for Phase 1.
3. Keep sample campus entities clearly identified as sample data, not actual college infrastructure.
4. Provide the agreed building-list/overview data to the API owner, without independently inventing response field names.
5. If the existing project structure is not ready, create the smallest compatible module and document its expected integration point; do not duplicate Person 1's files.

Do not implement sensor ingestion or simulations yet unless the team has finished the Phase 1 foundation early and Person 1 explicitly approves it. Do not use Grok or external providers.

Return changed files, seed/run instructions, tests, and any schema decisions requiring approval.
```

## Person 3 — Frontend skeleton and API connection

**Prompt 1.3**
```text
You are Person 3, Frontend / Visualization. Read AGENTS.md and CLAUDE.md completely. Implement only Phase 1 Foundation.

Inspect the current frontend before editing. Use React + TypeScript + Vite and the required UI stack from AGENTS.md. Do not replace the framework or introduce unnecessary packages.

Tasks:
1. Set up the application shell and basic navigation structure.
2. Create a simple but polished initial Overview page consistent with the specified dark indigo/charcoal, cyan, and violet visual direction.
3. Add a dedicated frontend API client layer; do not scatter raw fetch calls through components.
4. Connect to Person 1's GET /api/health and the agreed campus/buildings endpoint/data contract.
5. Display the three sample buildings when the agreed API is available.
6. Add loading, error, and empty states. Do not silently substitute fake data if the API fails.
7. Configure the frontend backend base URL through a non-secret public configuration value if needed. Never put provider API keys in frontend variables.
8. Ensure the app runs on the expected Vite development port, http://localhost:5173.

Do not build all pages or add mock charts that imply real measurements. Do not build Vision, Grok, or simulations yet.

Return changed files, commands, build results, and any API contract blocker. Phase 1 passes when the frontend can retrieve campus data from the backend.
```

## Person 4 — Provider readiness and safe configuration (no live feature yet)

**Prompt 1.4**
```text
You are Person 4, Computer Vision / Grok / Reports. Read AGENTS.md and CLAUDE.md completely. Work only on Phase 1 provider readiness; do not implement live AI features yet.

Tasks:
1. Inspect the repository's environment configuration.
2. Ensure .env.example contains only placeholders for XAI_API_KEY, XAI_MODEL, VISION_PROVIDER, VISION_API_KEY, VISION_MODEL, plus the other documented app variables as needed.
3. Verify .gitignore excludes .env and other secret-bearing files. Do not print or expose any existing secret; if a real key is found in tracked code, alert Person 1 and do not reproduce it.
4. Research/verify the current official xAI documentation and possible dedicated vision-provider documentation only to establish the current endpoint/model/request requirements. Do not guess exact identifiers and do not commit a real key.
5. Record provider choices and unresolved decisions in docs/ai-provider-plan.md. If credentials are not yet available, clearly mark live integration as blocked rather than faking success.
6. Do not make frontend requests to either provider.

Do not build the vision route, Grok route, recommendation engine, or reports in this phase. Return files changed, documentation verified, configuration status, and blockers.
```

### Phase 1 exit criteria

- [ ] Frontend and backend start locally.
- [ ] `GET /api/health` works.
- [ ] Frontend retrieves the agreed campus/buildings data.
- [ ] Three sample buildings are represented.
- [ ] `.env` and runtime files are ignored by Git.
- [ ] Shared schemas are agreed and documented.

---

# PHASE 2 — Core modules (Hours 4–14)
**Goal:** Dashboard, sensor pipeline, simulations, and verified provider adapters exist independently.

## Person 1 — Contract enforcement and incremental integration

**Prompt 2.1**
```text
You are Person 1, Technical Lead / Integration. Read AGENTS.md and CLAUDE.md. Implement your Phase 2 responsibilities only.

Tasks:
1. Review the agreed contracts and ensure endpoint names and shared field names match AGENTS.md.
2. Maintain a working integration branch and merge/test small completed modules incrementally.
3. Implement or refine only the API route/request-response mapping needed to expose Person 2's building/sensor work; routes must call services rather than contain business logic.
4. Ensure Pydantic validation and consistent error responses are used.
5. Keep CORS restricted to the known development frontend origin for local work.
6. Coordinate schema changes with the team before accepting them.
7. Run integration checks for health, building retrieval, and sensor/simulation endpoints as they become available.

Do not duplicate Person 2's simulation calculations or Person 4's provider adapters. Do not introduce microservices, authentication, or P2 work. Report any contract mismatch and resolve it with the owner before changing shared names.
```

## Person 2 — Sensor pipeline and deterministic simulations

**Prompt 2.2**
```text
You are Person 2, Digital Twin / Sensor / Simulation. Read AGENTS.md and CLAUDE.md. Implement the Phase 2 core data and calculation modules.

Tasks:
1. Complete building, sensor, sensor-reading, and simulation persistence models using SQLAlchemy/SQLite and agreed Pydantic schemas.
2. Implement validated sensor ingestion for POST /api/sensors/readings through the agreed API/service structure.
3. Implement POST /api/sensors/simulate to generate plausible, bounded readings associated with known buildings/sensors. Every generated reading must have source="simulated", timestamps, and documented units/periods. Use deterministic fixtures/fixed seeds in tests.
4. Implement building reading retrieval and aggregation only where periods and units are defined.
5. Implement deterministic energy simulation and at least one additional resource simulation (water or waste), following the exact formulas in AGENTS.md.
6. Return baseline, projected value, unit, absolute difference, percentage difference where defined, assumptions, source references, and calculation version/method as specified.
7. Validate numeric inputs, finite values, allowed units, bounds, fractions in [0,1], and zero-baseline behavior.
8. Add Pytest unit tests for formulas and edge cases.

Do not call Grok for maths. Do not invent an emissions factor, electricity tariff, leak flow rate, or real measurement. Keep baseline readings separate from scenarios. Coordinate API contracts with Person 1. Return changed files, tests run, and any remaining integration work.
```

## Person 3 — Dashboard, campus view, and monitoring UI

**Prompt 2.3**
```text
You are Person 3, Frontend / Visualization. Read AGENTS.md and CLAUDE.md. Implement Phase 2 frontend modules using the agreed API contracts.

Tasks:
1. Complete the application shell and navigation for the required pages, but prioritize the Overview, Campus Twin, and Resource Monitoring views first.
2. Build a selectable 2D/2.5D campus view with exactly the three sample buildings. Do not start a full 3D environment.
3. Selecting a building must update its details panel and resource data.
4. Add resource charts using Recharts only when data comes from the API and units/periods are known.
5. Show source labels such as simulated/manual/real and observation status where available.
6. Use the design direction in AGENTS.md and maintain accessible contrast and responsive behavior.
7. Keep API calls in the dedicated client layer and match Person 1's approved TypeScript types/contracts.
8. Add loading, empty, success, and error states.

Do not invent metrics, fake trend charts, or add unrelated chatbot UI. Do not implement the vision provider call or simulation math in the browser. Return changed files, build/lint results, and remaining contract dependencies.
```

## Person 4 — Verify and implement provider adapters

**Prompt 2.4**
```text
You are Person 4, Computer Vision / Grok / Reports. Read AGENTS.md and CLAUDE.md. Implement Phase 2 provider adapters only after verifying the current official provider documentation and the team-approved provider choices.

Tasks:
1. Confirm the selected dedicated Computer Vision provider supports the intended limited use cases. Test representative images if credentials and access are available. Do not claim reliable water-leak detection unless test cases support it.
2. Implement a vision-service adapter that accepts an image and returns the application's normalized internal result. Keep vendor-specific response handling inside the adapter.
3. Implement the backend Grok service adapter using the verified current endpoint, model configuration, request/response format, timeouts, and bounded error handling.
4. Read keys only from backend environment variables. Never put keys in frontend code or logs.
5. Validate provider outputs before returning them. Do not fabricate labels, boxes, calibrated confidence values, or successful responses.
6. If credentials are unavailable, implement a clear missing-configuration error and mocked tests; do not fake a live provider call.
7. Add tests that mock provider calls so tests do not require live API keys or incur charges.
8. Coordinate normalized schemas and interfaces with Person 1.

Do not yet build the complete recommendations/report flow unless the provider adapters are stable. Do not let Grok calculate authoritative simulation results. Return changed files, verified provider details, tests, and remaining blockers.
```

### Phase 2 exit criteria

- [ ] Dashboard and building selection work.
- [ ] Sensor ingestion and simulated readings work and are source-labelled.
- [ ] Energy and one additional resource simulation are deterministic and tested.
- [ ] Vision provider and Grok access have been technically verified, or missing access is explicitly documented.
- [ ] Provider calls are behind backend adapters.

---

# PHASE 3 — End-to-end integration (Hours 14–24)
**Goal:** The main workflow works locally from data/image to Digital Twin, simulation, AI explanation, and report.

## Person 1 — End-to-end integration owner

**Prompt 3.1**
```text
You are Person 1, Technical Lead / Integration. Read AGENTS.md and CLAUDE.md. Own Phase 3 end-to-end integration.

Tasks:
1. Connect the approved sensor/building APIs, observation flow, simulation APIs, and AI APIs without changing shared contracts silently.
2. Ensure each route delegates to its service and returns the agreed validated schema.
3. Verify that new readings update the correct building summary and that new observations appear in the Digital Twin.
4. Verify that simulation output is calculated by Person 2's deterministic service before being passed to Grok.
5. Verify that the report uses the relevant stored/read application data and clearly distinguishes data sources.
6. Add API integration tests for the complete path, mocking external providers.
7. Run the entire workflow locally and document setup/run steps.
8. Fix contract mismatches by coordinating with module owners, not by creating duplicate fields or routes.

Do not add P2 features. The exit goal is one working local workflow by the end of Day 1. Return exact test results, known limitations, and the remaining integration checklist.
```

## Person 2 — Persistence and Digital Twin state updates

**Prompt 3.2**
```text
You are Person 2, Digital Twin / Sensor / Simulation. Read AGENTS.md and CLAUDE.md. Implement Phase 3 integration for persisted data and Twin state.

Tasks:
1. Ensure validated sensor readings are persisted and associated with the correct sensor/building.
2. Ensure reading history and current summaries use documented units and aggregation periods.
3. Ensure image observations can be stored through the agreed observation schema, including source, building association, status, timestamps, and optional provider metadata.
4. Ensure a new observation can be represented in the Twin without treating an unreviewed observation as confirmed.
5. Ensure each completed simulation is saved with its baseline, parameters, result, assumptions, method/version, and projection label.
6. Keep simulation scenarios separate from baseline measurements. Resetting a scenario must not alter stored readings.
7. Add tests for building associations, observation state handling, scenario persistence, and reproducible calculations.
8. Coordinate observation persistence and API mapping with Person 1 and Person 4.

Do not invent fields independently or use Grok for numerical results. Return changed files, tests, and any unresolved contract issues.
```

## Person 3 — Connect all main screens to real API workflows

**Prompt 3.3**
```text
You are Person 3, Frontend / Visualization. Read AGENTS.md and CLAUDE.md. Implement Phase 3 UI integration only.

Tasks:
1. Connect the dashboard, building details, resource charts, Vision Inspector, and Simulations view to the approved backend API client.
2. Ensure building selection changes the content and readings shown.
3. Implement image selection/preview, upload progress/loading state, normalized observation display, building association, and review controls using the agreed API contracts.
4. Implement the simulation form and baseline-versus-projection comparison using values returned by the backend. Do not calculate authoritative simulation values in React.
5. Show units, assumptions, source labels, and the simulated/projected status.
6. Add clear empty/error/retry states for failed API calls.
7. Do not fabricate a successful upload, observation, or simulation when the backend call fails.
8. Test the complete screen flow against the local backend.

Do not create unrelated pages or alter the API contract. Return changed files, build/lint results, and a manual test sequence.
```

## Person 4 — Observation workflow, recommendations, and reports

**Prompt 3.4**
```text
You are Person 4, Computer Vision / Grok / Reports. Read AGENTS.md and CLAUDE.md. Implement Phase 3 AI workflow integration.

Tasks:
1. Connect image analysis to the agreed observation schema and save image-derived observations with status="requires_review" unless a human confirmation is explicitly part of creation.
2. Normalize vision output and make it available to the Digital Twin after successful persistence.
3. Implement POST /api/ai/recommendations using relevant building metrics, readings with provenance, observation statuses, scenario results, assumptions, and documented priority scores as context.
4. Implement POST /api/ai/reports to generate the report structure required by AGENTS.md: executive summary, scope/time period, metrics, observations/statuses, findings, actions/priorities, scenario results/assumptions, provenance, limitations, and next steps.
5. Validate structured AI output with Pydantic where possible. Handle invalid responses and provider errors without fabricating success.
6. Ensure Grok explains supplied calculation results; it must not replace or alter those values.
7. Add tests using mocked provider responses, including malformed output, missing credentials, and provider failures.
8. Coordinate route/service integration with Person 1 and the frontend contract with Person 3.

Do not send the whole database or unnecessary sensitive data to Grok. Return changed files, tests, and remaining issues.
```

### Phase 3 exit criteria

- [ ] Readings update building metrics.
- [ ] Image analysis creates a reviewable observation.
- [ ] Digital Twin reflects readings and observations.
- [ ] UI runs a backend simulation and displays returned results.
- [ ] Grok explains actual scenario/application data.
- [ ] A structured sustainability report is generated.
- [ ] Main workflow works locally.

---

# PHASE 4 — Innovation and polish (Hours 24–32)
**Goal:** Finish the Sustainability Time Machine and make the projected impact understandable.

## Person 1 — Integration and acceptance review

**Prompt 4.1**
```text
You are Person 1, Technical Lead / Integration. Read AGENTS.md and CLAUDE.md. Implement Phase 4 integration/acceptance work only.

Tasks:
1. Verify the Sustainability Time Machine follows the exact flow: select building -> select resource -> configure intervention -> deterministic simulation -> compare baseline/scenario -> ask Grok to explain.
2. Check that every intervention maps to validated backend parameters and a documented calculation method.
3. Verify assumptions, units, absolute differences, percentage changes, and projection labels are consistently returned and displayed.
4. Confirm issue-priority scores are calculated by backend logic, not invented by Grok. If the priority formula is implemented, document normalized inputs and weights as a product heuristic.
5. Coordinate fixes with module owners. Do not rewrite modules that already work.
6. Run the demo workflow and targeted tests after each fix.
7. Do not begin P2 features while any P0 requirement is broken.

Return acceptance findings, changed files, tests, and a prioritized remaining bug list.
```

## Person 2 — Simulation correctness and scenario reproducibility

**Prompt 4.2**
```text
You are Person 2, Digital Twin / Sensor / Simulation. Read AGENTS.md and CLAUDE.md. Refine the Sustainability Time Machine's calculation layer for Phase 4.

Tasks:
1. Ensure validated scenario parameters cover the supported interventions already defined in AGENTS.md: equipment operating hours, specified lighting-efficiency assumptions, assumed leak flow/repair, waste segregation rate, or collection-schedule/waste-bin assumptions where implemented.
2. Do not implement an intervention unless its inputs, units, and calculation method are explicit and defensible.
3. Ensure identical inputs and calculation rules return identical numerical results.
4. Return baseline, projected result, unit, absolute difference, percentage change where defined, assumptions, data sources, and calculation version/method.
5. Handle zero baseline and missing data without inventing values.
6. Add tests for invalid bounds, units, edge cases, and repeatability.
7. Preserve baseline readings; never overwrite them with scenario values.
8. Coordinate response shapes with Person 1 and Person 3.

Do not add unsupported emissions factors or tariffs. Only calculate optional cost/emissions impacts when the relevant configured factor and units are documented.
```

## Person 3 — Sustainability Time Machine UX and visual polish

**Prompt 4.3**
```text
You are Person 3, Frontend / Visualization. Read AGENTS.md and CLAUDE.md. Implement Phase 4 UI polish focused on the Sustainability Time Machine.

Tasks:
1. Make the user flow clear: select building -> resource -> intervention -> enter bounded parameters -> run -> compare baseline and projected scenario -> view AI explanation.
2. Display baseline and scenario side by side, with units, absolute change, percentage change where defined, and explicit "projected/simulated" labels.
3. Display the assumptions and data sources returned by the backend.
4. Add reset/rerun controls that do not pretend to change persisted baseline data.
5. Add helpful validation messages and loading/error states.
6. Add visual transitions only when they clarify a real state change; avoid decorative charts.
7. Keep accessible contrast, responsive behavior, and the visual direction in AGENTS.md.
8. Use backend-returned values only; do not recalculate authoritative values in the frontend.

Do not add full 3D rendering or unrelated features. Return changed files and build/lint/manual test results.
```

## Person 4 — Grounded recommendations and report quality

**Prompt 4.4**
```text
You are Person 4, Computer Vision / Grok / Reports. Read AGENTS.md and CLAUDE.md. Refine recommendations and reports for Phase 4.

Tasks:
1. Ensure recommendations reference actual observations, statuses, building metrics, priority scores, or scenario results supplied by the backend.
2. Make uncertainty and missing information explicit. If impact cannot be estimated from supplied data, say so rather than inventing a number.
3. Ensure Grok explains the backend's calculated scenario output without changing numerical results.
4. Include assumptions, data provenance, and limitations in reports.
5. Keep the report structure from AGENTS.md. PDF export is optional and must not delay core P0 behavior.
6. Validate structured output and handle provider failure/invalid JSON cleanly.
7. Add mocked tests for recommendations and reports, including insufficient data and provider failure.
8. Coordinate UI response needs with Person 3 and route contracts with Person 1.

Do not add an unrelated chatbot, do not send the entire database, and do not present AI suggestions as actions already executed.
```

### Phase 4 exit criteria

- [ ] A judge can change an intervention and understand the projected result.
- [ ] Baseline remains intact.
- [ ] Assumptions and units are visible.
- [ ] Grok explains the calculated output without changing it.
- [ ] Priority/recommendation logic is transparent enough to explain.

---

# PHASE 5 — Reliability and deployment (Hours 32–40)
**Goal:** Test failure cases, deploy frontend/backend, and verify the deployed workflow.

## Person 1 — Release integration and deployment coordination

**Prompt 5.1**
```text
You are Person 1, Technical Lead / Integration. Read AGENTS.md and CLAUDE.md. Own Phase 5 release coordination.

Tasks:
1. Run the agreed backend unit/API test suites and frontend build/lint checks.
2. Test the complete workflow against the deployed frontend and backend.
3. Configure the deployed frontend origin in backend CORS using the actual agreed origin; do not use unrestricted production CORS without reason.
4. Verify environment variables are configured server-side and no secrets are present in the frontend bundle, Git history, or logs.
5. Verify host support, runtime limits, request timeouts, upload limits, and SQLite/local-disk persistence assumptions.
6. Coordinate fixes with the relevant owner; do not silently change contracts.
7. Maintain a release checklist and record blockers.

Do not claim deployment works until it has been tested. Do not add P2 features. Return test evidence, deployment status, environment variables required, and known limitations.
```

## Person 2 — Backend validation, persistence, and failure tests

**Prompt 5.2**
```text
You are Person 2, Digital Twin / Sensor / Simulation. Read AGENTS.md and CLAUDE.md. Perform Phase 5 backend reliability work.

Tasks:
1. Run and improve tests for energy, water, waste, percentage changes, zero baselines, bounds, units, timestamps, sensor/building association, and scenario persistence.
2. Test invalid numeric values, NaN/infinity, invalid units, unknown building/sensor IDs, and invalid scenario parameters.
3. Verify database initialization/seed process is repeatable and the demo can be restored consistently.
4. Ensure failed simulation requests do not alter baseline data or erase observations.
5. Check that errors are understandable and do not expose stack traces or secrets.
6. Verify persistence assumptions for the selected backend host. If SQLite or local disk may be ephemeral, document the limitation and coordinate an approved deployment-safe approach without silently changing the database choice.
7. Mock external provider calls in tests; the backend calculation tests must work without API keys.

Return tests run, failures/fixes, persistence findings, and any deployment blockers.
```

## Person 3 — Frontend quality and deployed connectivity

**Prompt 5.3**
```text
You are Person 3, Frontend / Visualization. Read AGENTS.md and CLAUDE.md. Perform Phase 5 frontend reliability work.

Tasks:
1. Run the frontend lint and production build.
2. Test navigation, building selection, resource charts, image upload states, observation review, simulation comparison, AI errors, and report rendering.
3. Verify frontend API base URL points to the deployed backend in the deployed build.
4. Check that CORS/API/network failures show clear messages and retry options where appropriate.
5. Ensure no provider key or secret is bundled into frontend assets or stored in VITE_* variables.
6. Check responsive layout and keyboard-operable controls at the expected presentation resolution.
7. Confirm charts use API data and display units/periods; remove any decorative or misleading mock data.
8. Do not add new features during release hardening.

Return build/lint results, manual test checklist, deployed API connectivity result, and remaining blockers.
```

## Person 4 — Provider failure handling and configuration audit

**Prompt 5.4**
```text
You are Person 4, Computer Vision / Grok / Reports. Read AGENTS.md and CLAUDE.md. Perform Phase 5 AI/provider reliability work.

Tasks:
1. Test missing API key, invalid key, timeout, rate limit, network failure, malformed provider output, and unsupported image cases using mocks where possible.
2. Ensure provider calls have timeouts and bounded retry behavior.
3. Ensure the UI receives clear errors and the system never fabricates a successful live result.
4. Ensure automated tests do not require live keys or spend credits.
5. Verify XAI_API_KEY, XAI_MODEL, VISION_PROVIDER, VISION_API_KEY, and VISION_MODEL are server-side configuration only.
6. Verify image upload size/type validation and safe server-generated filenames; uploaded images must not be committed to Git.
7. Verify observation outputs are normalized, uncertain predictions remain reviewable, and no unsupported confidence calibration is claimed.
8. If a clearly labelled sample-data fallback is used for the demo, make its simulated/sample status obvious.

Return failure-test results, configuration audit, provider limitations, and remaining blockers.
```

### Phase 5 exit criteria

- [ ] Backend tests pass.
- [ ] Frontend build/lint passes.
- [ ] Invalid input and provider failure paths behave safely.
- [ ] Deployed frontend reaches deployed backend.
- [ ] Persistence and host limitations are understood.
- [ ] Secrets are not exposed.
- [ ] Deployed core demo works.

---

# PHASE 6 — Final verification and pitch (Hours 40–48)
**Goal:** Freeze scope, rehearse, and demonstrate a repeatable working product.

## Person 1 — Demo owner / architecture explanation

**Prompt 6.1**
```text
You are Person 1, Technical Lead / Integration. Read AGENTS.md and CLAUDE.md. Prepare the Phase 6 final verification and demo runbook.

Tasks:
1. Follow the exact demo sequence in AGENTS.md:
   overview -> select Library -> upload test image -> review observation -> show Twin update -> run Sustainability Time Machine -> ask Grok to explain -> generate report -> explain real-sensor extension.
2. Verify every step against the deployed system. Record expected results and recovery steps if a provider fails.
3. Prepare a concise architecture explanation using the existing modular-monolith design and the actual implemented modules.
4. Confirm the demo dataset is reproducible and clearly labelled.
5. Freeze feature scope. Fix only high-impact bugs and coordinate the relevant owner.
6. Ensure the team can explain how each impact number is calculated.
7. Do not claim features that are not implemented or tested.

Return the final runbook, readiness checklist, blockers, and a short list of honest limitations.
```

## Person 2 — Numerical correctness and sample data

**Prompt 6.2**
```text
You are Person 2, Digital Twin / Sensor / Simulation. Read AGENTS.md and CLAUDE.md. Prepare the Phase 6 data and calculation verification.

Tasks:
1. Seed a repeatable sample campus dataset for ACADEMIC, LIB, and RESIDENCE.
2. Verify every sensor reading has a source, timestamp, unit, and documented period where applicable.
3. Verify the main energy scenario and at least one water/waste scenario with hand-checkable examples.
4. Confirm that identical inputs produce identical outputs and that zero-baseline/invalid-input cases are handled.
5. Confirm baseline data is not overwritten by scenarios.
6. Prepare a short explanation for the team of each formula, unit, assumption, and limitation used in the demo.
7. Do not invent real campus measurements; label sample/simulated data clearly.

Return verification results, sample-data reset steps, formula examples, and unresolved risks.
```

## Person 3 — UI walkthrough and presentation readiness

**Prompt 6.3**
```text
You are Person 3, Frontend / Visualization. Read AGENTS.md and CLAUDE.md. Prepare the frontend for the final demo.

Tasks:
1. Run the deployed walkthrough at the expected presentation resolution.
2. Confirm all navigation items and core controls work; no critical control is decorative.
3. Verify clear loading, success, empty, and error states.
4. Confirm building selection, resource charts, image review, scenario comparison, AI explanation, and report display work.
5. Ensure all simulated/projected/estimated/AI-generated values are clearly labelled.
6. Remove obvious layout defects without redesigning or adding features.
7. Prepare a concise click-by-click UI demo sequence for the presenter.
8. Do not replace failed API calls with fake success states.

Return final build status, walkthrough checklist, known UI limitations, and recovery steps.
```

## Person 4 — AI output verification and fallback readiness

**Prompt 6.4**
```text
You are Person 4, Computer Vision / Grok / Reports. Read AGENTS.md and CLAUDE.md. Prepare final AI/provider verification.

Tasks:
1. Verify a supported test image produces a normalized observation through the real provider when credentials and provider access are available.
2. Confirm image-derived observations are review-pending until reviewed.
3. Verify Grok explanations use the actual backend simulation result and do not change its numerical values.
4. Generate a report and check it includes scope, metrics, observations/statuses, findings, recommendations, scenario results/assumptions, provenance, limitations, and next steps.
5. Verify missing-key/provider-failure behavior and prepare a clearly labelled sample-data fallback only if needed.
6. Confirm no key is printed, committed, or included in frontend assets.
7. Do not claim live AI succeeded if a sample fallback was used.

Return AI verification results, report checklist, provider status, and the exact demo fallback procedure.
```

### Phase 6 exit criteria

- [ ] Full demo sequence rehearsed.
- [ ] Sample data and test images ready.
- [ ] Provider quota/keys checked without exposing them.
- [ ] Deployed core flow works.
- [ ] Fallback is honest and clearly labelled.
- [ ] Team can explain architecture, calculations, assumptions, and limitations.

---

# Cross-phase rules for every Antigravity prompt

Append this short instruction to any prompt if the coding agent begins drifting:

```text
Before making changes, reread AGENTS.md and CLAUDE.md. Follow their stack, architecture, contracts, scope priorities, and security rules. Inspect existing code first. Make only the changes assigned to this person and phase. Do not invent data, provider capabilities, API fields, model IDs, or successful external calls. Do not expose secrets. Add/update tests for changed behavior. At the end, report files changed, commands/tests run and results, unresolved questions, and the next phase's blockers. If a requirement is unclear or conflicts with AGENTS.md, stop and ask Person 1 rather than silently changing the specification.
```

# Source-of-truth note

This prompt pack is derived from the team roles, architecture, stack, API route plan, testing strategy, 48-hour implementation plan, security rules, and demo checklist in `AGENTS.md` / `CLAUDE.md`. The original files remain authoritative. Phase 0 is an added coordination step before the six phases explicitly listed in `AGENTS.md`; it does not replace or renumber those six phases.
