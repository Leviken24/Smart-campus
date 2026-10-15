# CLAUDE.md — EcoTwin AI Build Guide

> **Purpose:** This file is for Claude and the four-person team building EcoTwin AI.
> It explains the project in beginner-friendly language, gives a phased build order,
> and preserves the complete `AGENTS.md` specification below.
>
> **Strict rule:** The original `AGENTS.md` content is included in full below and remains
> the project's source of truth. Do not silently change its stack, architecture, API routes,
> field names, scope, or team responsibilities. If a change is necessary, explain why and
> get agreement from the technical lead before changing the shared specification.

---

# 1. EcoTwin AI explained like you're 10

Imagine your college is a tiny city. It has buildings, lights that use electricity, taps and pipes that use water, and bins that collect waste.

EcoTwin AI makes a **digital copy of that campus** on a computer. This copy is not just a picture: it remembers building information, resource readings, and possible problems.

It has five important jobs:

1. **Watch:** It receives readings about electricity, water, and waste. During this prototype, many readings can be computer-generated. Those readings must clearly say **simulated**.
2. **Look:** A dedicated Computer Vision model/provider examines an uploaded image and suggests what it can see, such as visible waste accumulation. A suggestion is only an **observation**, not proof. A person should review it.
3. **Remember:** The Digital Twin keeps the virtual campus state, readings, observations, and scenario results connected.
4. **Try a what-if:** The Sustainability Time Machine calculates what might happen if someone changes an assumption—for example, reducing equipment operating hours. The backend does the maths using fixed formulas; the AI must not invent the numbers.
5. **Explain:** Grok uses the application's supplied data to explain results, suggest actions, and produce a sustainability report.

### A simple example

Suppose the Library uses 100 kWh of energy during a defined period. The team enters a scenario that reduces equipment operating hours. The simulation calculates a projected new value and the difference from the baseline. The dashboard shows both values and the assumptions. Grok can explain the result, but it cannot pretend the projection is an already-measured saving.

**The big idea:** See a possible problem → review the evidence → test a solution in the computer model → understand the projected result → decide what to do.

## Words you need to know

- **Frontend:** The screens and buttons people use. This project uses React, TypeScript, and Vite.
- **Backend:** The part that receives requests, checks data, runs calculations, and calls external AI providers. This project uses Python and FastAPI.
- **Database:** The application's memory. The prototype uses SQLite.
- **API:** A defined way for one part of the application to ask another part for information or an action.
- **Computer Vision:** AI that analyses images. It is separate from Grok in this project.
- **Sensor reading:** A value associated with a resource, unit, building, and time. It can be real, manual, or simulated.
- **Digital Twin:** The structured virtual version of the campus—not merely its visual map.
- **Simulation:** A repeatable calculation that compares a baseline with a hypothetical scenario.
- **Baseline:** The starting value used for comparison.
- **Scenario/projection:** The calculated result if the chosen assumptions were true. It is not a measured real-world result.
- **Grok:** The language/reasoning provider used for explanations, recommendations, and reports.
- **Provider/API key:** A secret credential used by the backend to access an external provider. It must not be exposed in frontend code or committed to Git.
- **P0/P1/P2:** Priority levels. Finish P0 first; P1 comes after the core works; P2 is optional and must not delay P0.

---

# 2. What the finished prototype must demonstrate

A judge should be able to follow one connected journey:

1. Open the dashboard and see three sample buildings.
2. Select a building and inspect its resource data.
3. Upload a supported image and receive a structured Computer Vision observation.
4. Review that observation and associate it with the correct building.
5. See the observation represented in the Digital Twin.
6. Change a scenario parameter and run a deterministic simulation.
7. Compare the baseline with the projected result, including units and assumptions.
8. Ask Grok to explain the result using the application's actual data.
9. Generate a sustainability report that distinguishes readings, simulated values, calculations, observations, estimates, and AI-generated explanations.

Do not make a collection of disconnected screens. The parts must pass data between each other.

---

# 3. Four-person task split

Use the exact ownership model in `AGENTS.md`. Agree on the shared data contracts before parallel coding.

## Person 1 — Technical Lead / Integration

**Think of this person as the person making sure all four puzzle pieces fit together.**

- Own the shared architecture and API/data contracts.
- Set up repository conventions and coordinate integration.
- Keep the full workflow connected.
- Resolve conflicts about shared interfaces.
- Run integration tests.
- Prepare the architecture explanation and demo runbook.
- Do not become the only person writing every module.

## Person 2 — Digital Twin / Sensor / Simulation

**This person builds the campus model, its readings, and the maths.**

- Create the building model and sample seed data.
- Implement sensor-reading validation and ingestion.
- Generate clearly labelled simulated sensor readings.
- Aggregate resource readings correctly.
- Implement deterministic energy simulation and at least one additional resource simulation (water or waste).
- Save scenarios and assumptions.
- Test formulas, units, bounds, and edge cases.

## Person 3 — Frontend / Visualization

**This person builds the screens people see and use.**

- Create the React/TypeScript UI foundation and design tokens.
- Build navigation and the dashboard.
- Build the selectable campus map and building details.
- Build resource monitoring charts.
- Build the image-upload interface.
- Build the simulation comparison screen.
- Connect screens to the backend API.
- Add loading, empty, success, and error states.

## Person 4 — Computer Vision / Grok / Reports

**This person connects the two AI providers and turns trusted application data into explanations.**

- Test and choose a dedicated Computer Vision provider for the limited supported use cases.
- Build a provider adapter that converts provider output into the application's internal format.
- Connect image results to reviewable observation records with the backend owner.
- Implement the Grok service and validate its output.
- Generate grounded recommendations and sustainability reports.
- Handle provider errors without pretending a call succeeded.

**Collaboration rule:** Ownership does not mean working in isolation. Person 1 must agree the shared request/response shapes with everyone before modules are integrated. Person 2 and Person 4 must coordinate observation, sensor, and simulation data contracts with the backend. Person 3 must use those agreed contracts rather than inventing its own field names.

---

# 4. Build the project in phases

The schedule below follows the 48-hour plan in `AGENTS.md`. Test while building; do not wait until the end.

## Phase 1 — Foundation (Hours 0–4)

### Goal in simple words
Get the empty project running and make sure the frontend can talk to the backend.

### Tasks
- Create the repository and agree the shared contracts.
- Set up React + TypeScript + Vite for the frontend.
- Set up Python + FastAPI for the backend.
- Create environment-variable placeholders.
- Define the shared request/response schemas.
- Seed three sample buildings: `ACADEMIC`, `LIB`, and `RESIDENCE`.
- Implement `GET /api/health`.
- Connect the frontend to the backend.
- Confirm that all four people can run the project locally.

### Who leads?
- Person 1 coordinates repository, contracts, and integration.
- Person 2 prepares building/sample data.
- Person 3 creates the frontend shell and tests the connection.
- Person 4 checks provider configuration requirements, without blocking the foundation.

### Done means
The application runs locally and the frontend can retrieve campus data from the backend.

## Phase 2 — Core modules (Hours 4–14)

### Goal in simple words
Build the main pieces separately, using the same agreed data shapes.

### Tasks
- Person 3: dashboard shell, navigation, campus map, and building panel.
- Person 2: data models, seed data, sensor ingestion, simulated readings, and deterministic simulations.
- Person 4: verify Grok access, select/test the dedicated vision provider, and create provider adapters.
- Person 1: keep interfaces aligned and integrate working pieces as they become available.

### Done means
The dashboard is functional, simulation calculations pass tests, and both external-provider integrations have been technically verified.

## Phase 3 — End-to-end integration (Hours 14–24)

### Goal in simple words
Make the pieces work together instead of acting like separate mini-projects.

### Tasks
- Connect readings to building metrics.
- Connect vision results to observation records.
- Make new readings and observations update the Digital Twin.
- Connect simulation requests and responses to the UI.
- Give Grok the relevant simulation context and application data.
- Generate a structured sustainability report.
- Test the complete workflow locally.

### Done means
The main workflow works locally by the end of Day 1.

## Phase 4 — Innovation and polish (Hours 24–32)

### Goal in simple words
Make the Sustainability Time Machine clear and impressive without hiding the maths.

### Tasks
- Finish the baseline-versus-scenario comparison.
- Show assumptions, units, absolute differences, and percentage changes where defined.
- Add useful visual state changes.
- Add prioritized recommendations.
- Refine the interface and responsive layout.

### Done means
A judge can change an intervention and immediately understand the projected impact and its assumptions.

## Phase 5 — Reliability and deployment (Hours 32–40)

### Goal in simple words
Make the prototype handle mistakes and work outside the developers' computers.

### Tasks
- Run unit and API tests.
- Test what happens when either external provider fails.
- Test invalid image uploads.
- Test invalid simulation parameters and zero baselines.
- Verify environment configuration.
- Deploy the frontend and backend.
- Test deployed API connectivity and persistence.
- Confirm that secrets are not exposed.

### Done means
The deployed prototype passes the core demo test.

## Phase 6 — Final verification and pitch (Hours 40–48)

### Goal in simple words
Stop adding risky features and make the demo repeatable.

### Tasks
- Fix only high-impact bugs.
- Rerun the full workflow.
- Prepare reproducible sample data and test images.
- Finalize the architecture explanation and pitch.
- Rehearse what to do if a provider fails.
- Check deployment, API quota, and keys.

### Done means
The demo is repeatable, the team can explain the architecture, and the core features work without editing code live.

---

# 5. API keys and external services: what is actually required

The specification calls for **two separate provider integrations**:

1. **Grok API** — language/reasoning for recommendations, explanations, and reports.
2. **A dedicated Computer Vision provider** — image analysis. It must not be assumed that Grok replaces this provider.

## Required configuration names

The initial `.env.example` template uses:

```dotenv
APP_ENV=development
DATABASE_URL=sqlite:///./ecotwin.db
FRONTEND_ORIGIN=http://localhost:5173

XAI_API_KEY=
XAI_MODEL=

VISION_PROVIDER=
VISION_API_KEY=
VISION_MODEL=

MAX_IMAGE_UPLOAD_MB=8
```

These are placeholders, not credentials. The exact vision-provider settings depend on the provider selected and its verified API contract.

## Rules for keys

- `XAI_API_KEY` and any vision-provider key stay on the **backend**.
- Never put provider keys in frontend `VITE_*` variables.
- Never commit `.env` to GitHub.
- `.env.example` contains variable names/placeholders only—not real keys.
- If a key is exposed, rotate it.
- The backend must handle missing keys gracefully.
- Provider requests need timeouts and error/rate-limit handling.
- Do not repeatedly retry without limits.
- Do not pretend a failed live call succeeded.
- Automated tests must mock provider calls so they do not require live keys or spend API credits.

## What must be checked before choosing a provider

The original specification does not name a particular vision vendor or exact Grok model identifier. Do not guess these. Verify the current provider documentation for:

- Image-input support and supported image types.
- Current endpoint, model identifier, request schema, and response schema.
- Rate limits, latency, and free-tier/cost limits.
- Whether the response supplies useful labels, scores, boxes, or explanations.
- Reliability on a small, representative set of campus/waste/leak images.

Keep the model identifier in configuration, not hardcoded throughout the code. Put provider-specific response handling behind an adapter.

## What does not require a paid/live provider for every test?

- The deterministic simulation engine must work without Grok.
- The dashboard must remain usable if an optional AI call fails.
- Automated tests should mock external calls.
- A clearly labelled sample-data fallback may be used for a demo if a provider fails; never claim that the fallback was a successful live inference.

The source specification does not guarantee that either provider offers a free tier or that a particular deployment host will be free. Check current provider and hosting terms before relying on them.

---

# 6. Fixed technology choices — do not casually replace them

| Area | Required initial choice | Simple explanation |
|---|---|---|
| Frontend | React + TypeScript + Vite | Screens and browser app |
| Styling | Tailwind CSS + shadcn/ui | Visual styling and reusable UI pieces |
| Charts/icons/navigation | Recharts, Lucide React, React Router | Charts, icons, and page navigation |
| Backend | Python + FastAPI | API and application logic |
| Validation | Pydantic | Checks whether incoming/outgoing data has the right shape |
| Database access | SQLAlchemy | Code that talks to the database |
| Prototype database | SQLite | Local application memory |
| HTTP provider calls | HTTPX | Backend calls to external providers |
| Tests | Pytest | Automated backend checks |
| Backend server | Uvicorn | Runs the API |
| Vision | Dedicated pretrained model/provider | Analyses supported images |
| Generative AI | Grok API | Explains data and produces recommendations/reports |
| Version control | Git + GitHub | Tracks code changes |
| Frontend hosting | Vercel or equivalent | Serves the frontend |
| Backend hosting | Python-compatible host | Runs the FastAPI backend |

Use a **modular monolith**: one frontend, one FastAPI backend, one SQLite database, and separate internal modules. Do not add microservices or multi-agent orchestration during the core prototype.

---

# 7. API routes the team must keep consistent

Do not rename routes or fields independently. The backend contract in the source specification is:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend health |
| GET | `/api/campus` | Campus overview |
| GET | `/api/buildings` | List buildings |
| GET | `/api/buildings/{building_id}` | Building details |
| GET | `/api/buildings/{building_id}/readings` | Recent readings |
| POST | `/api/sensors/readings` | Accept a validated reading |
| POST | `/api/sensors/simulate` | Generate simulated readings |
| POST | `/api/observations/analyze-image` | Upload and analyse an image |
| GET | `/api/observations` | List observations |
| PATCH | `/api/observations/{observation_id}` | Review/update observation status |
| POST | `/api/simulations/run` | Run a simulation |
| GET | `/api/simulations/{scenario_id}` | Retrieve a saved scenario |
| GET | `/api/simulations` | List scenarios, if history is implemented |
| POST | `/api/ai/recommendations` | Generate grounded recommendations |
| POST | `/api/ai/reports` | Generate a report |

All routes must validate input, return understandable errors, and keep business logic inside service modules rather than large blocks inside route handlers.

---

# 8. Important rules that must never be broken

1. **Do not invent a second architecture.** The shared specification and agreed schemas govern the project.
2. **Do not fake functionality.** A button must work or be clearly disabled.
3. **Do not fake measurements.** Label simulated readings.
4. **Do not call an image prediction proof.** New image observations start as `requires_review` unless a human confirms them at creation.
5. **Do not let Grok own the maths.** The backend calculates simulation values deterministically.
6. **Do not mix units.** For example, kW is power and kWh is energy; litres and litres/minute are different.
7. **Do not overwrite the baseline with a scenario result.** Keep the baseline and projection separate.
8. **Do not let AI text overwrite source readings or simulation results.**
9. **Do not expose secrets.** Keys stay on the backend; `.env` stays out of Git.
10. **Do not assume exact detection capability.** Test the vision provider on representative images and limit claims to supported use cases.
11. **Do not begin optional P2 features while P0 features are broken.**
12. **Do not make the main demo depend on a live API for every step.** Keep labelled, reproducible sample data available.
13. **Explain every number.** Display units, periods, assumptions, data sources, and whether a value is measured, simulated, calculated, estimated, or AI-generated.
14. **Document agreed architectural changes.** The technical lead must approve changes to shared contracts.

---

# 9. What to postpone

The following are P2 in the source specification. Do not start them until the required prototype is reliable:

- Full 3D campus rendering.
- Physical IoT hardware.
- Authentication and role management.
- Advanced forecasting that needs substantial historical data.
- Multi-agent orchestration.
- Microservices.
- Complex notifications or background job infrastructure.

P1 items—such as extra water/waste simulations, issue prioritization, trend charts, saved scenario history, PDF export, animation, and richer visualization—come after P0 is stable.

---

# 10. How Claude should work with this repository

When asked to implement a task:

1. Read this `CLAUDE.md` and the complete `AGENTS.md` before changing code.
2. Identify the exact phase, module owner, and source requirements involved.
3. Check existing code and shared schemas before creating new files or interfaces.
4. Make the smallest coherent change; do not rewrite unrelated modules.
5. Keep the established stack, module boundaries, route names, and field names.
6. Add or update tests for the changed behavior.
7. Validate inputs and handle provider failures safely.
8. Never put secrets in source code, frontend variables, logs, or committed files.
9. Report what changed, files changed, commands/tests run, remaining work, and any required environment variables.
10. If a requirement is unclear or conflicts with `AGENTS.md`, explain the conflict and ask the technical lead rather than silently inventing a solution.
11. If an external API contract/model identifier is needed, say that it must be verified from the provider's current documentation; do not fabricate it.
12. Keep simulated data and demo fallbacks explicitly labelled.

---

# 11. Final check before calling the prototype complete

Use the detailed Definition of Done and Demo Runbook in `AGENTS.md`. At minimum, confirm:

- [ ] Frontend and backend start.
- [ ] Three buildings appear with consistent metrics.
- [ ] Sensor readings are accepted and source-labelled.
- [ ] Simulated readings update the right building.
- [ ] The dedicated vision provider analyses a supported image.
- [ ] Vision results become reviewable observations.
- [ ] The Digital Twin reflects readings and observations.
- [ ] Energy and at least one additional resource simulation work and are tested.
- [ ] Baseline and projected scenario remain separate.
- [ ] Grok recommendations use actual application data.
- [ ] The sustainability report is generated from relevant application data.
- [ ] Estimates, simulated values, and AI output are labelled.
- [ ] Unit/API tests pass and the frontend production build succeeds.
- [ ] Missing credentials and provider failures are handled gracefully.
- [ ] `.env`, uploaded private data, and secrets are not committed.
- [ ] The full demo works in the deployed environment.
- [ ] The team can explain every displayed impact figure.

---

# 12. Complete original project specification

The complete original `AGENTS.md` is reproduced below so that this guide does not replace or omit the detailed contracts, data models, formulas, UI requirements, tests, and judging/demo requirements.

---

# AGENTS.md — EcoTwin AI
## Project Constitution, Architecture, Technical Reference, and 48-Hour Build Plan

> **Project:** EcoTwin AI — AI-Powered Sustainable Campus Intelligence  
> **Hackathon duration:** 48 hours  
> **Team:** 4 people  
> **Primary innovation:** EcoTwin Impact Engine  
> **Signature feature:** Sustainability Time Machine  
> **AI architecture:** Dedicated Computer Vision provider + Grok API for reasoning, recommendations, and reports  
> **Document status:** Initial project source of truth. Update this file only when the team agrees on an architectural change.

---

## 1. Purpose of This Document

This file is the shared source of truth for all developers and coding agents working on EcoTwin AI. It defines:

- The problem being solved and the required outcomes.
- Product scope and feature priorities.
- Technology stack and architectural boundaries.
- Module responsibilities and data contracts.
- Sensor, Computer Vision, Digital Twin, simulation, and Generative AI workflows.
- API expectations and data model conventions.
- UI/UX direction.
- Security, reliability, testing, and code-quality rules.
- Team ownership and the 48-hour implementation plan.
- Definition of done and demo requirements.

**Do not invent a second architecture, duplicate an existing service, or silently change shared contracts.** If a change is necessary, explain why, agree on it with the technical lead, and update this document and any affected schemas.

This document specifies the product and implementation constraints. It intentionally does **not** contain individual coding-agent prompts.

---

# 2. Product Overview

## 2.1 Product Name

**EcoTwin AI**

**Tagline:** *See the problem. Simulate the solution. Make the campus sustainable.*

## 2.2 Product Vision

EcoTwin AI is an intelligent campus sustainability platform that combines Computer Vision, sensor data, a Digital Twin, deterministic simulation, and Generative AI. It helps campus administrators identify possible sustainability problems, understand resource use, test proposed interventions, and receive evidence-grounded recommendations and reports.

The product must be a connected system—not a static dashboard with an unrelated chatbot.

## 2.3 Problem Statement Alignment

The selected problem statement requires a Digital Twin of a college campus integrating Computer Vision and sensor data to detect issues such as:

- Waste accumulation.
- Energy wastage.
- Water leakage.
- Inefficient resource usage.

Generative AI must produce actionable recommendations and sustainability reports.

The prototype must visibly demonstrate all of the following:

1. **Computer Vision:** Analyse an uploaded image for supported sustainability observations.
2. **Sensor data:** Ingest readings through a validated pipeline. Simulated readings are acceptable for the prototype but must be labelled as simulated.
3. **Digital Twin:** Maintain a structured virtual representation of campus buildings, resource metrics, sensor readings, and observations.
4. **Simulation:** Calculate the effects of proposed interventions using deterministic, testable code.
5. **Generative AI:** Use Grok to explain findings, prioritize actions, and generate reports based on actual application data.
6. **End-to-end integration:** Connect the components in one user workflow.

## 2.4 Core Product Principle

**The system must distinguish facts, observations, simulations, estimates, and AI-generated explanations.**

Never present synthetic data as real sensor measurements. Never present a model prediction as a confirmed real-world incident without review. Never present a projected saving as a measured saving.

---

# 3. Product Innovation

## 3.1 EcoTwin Impact Engine

The EcoTwin Impact Engine is the connected workflow that transforms observations and resource readings into testable interventions and explainable outcomes.

It consists of three complementary capabilities.

### A. Sustainability Time Machine — Signature Feature

Users compare a baseline campus/building state against a proposed scenario.

Flow:

`Select building → Select resource → Configure intervention → Run deterministic simulation → Compare baseline and scenario → Ask Grok to explain the result`

Examples of interventions:

- Reduce equipment operating hours.
- Replace specified lighting with more efficient alternatives.
- Change an assumed leak flow rate or repair a confirmed leak.
- Increase a waste segregation rate.
- Change a collection schedule or waste-bin intervention assumption.

Requirements:

- Preserve the baseline.
- Accept validated scenario parameters.
- Calculate results on the backend.
- Return the assumptions used.
- Display absolute and percentage changes.
- Label results as projected/simulated.
- Allow the user to reset or rerun the scenario.
- Produce the same numerical result for identical inputs and calculation rules.

### B. Vision-to-Action

Flow:

`Upload image → Dedicated vision provider → Structured prediction → Human review/location association → Observation saved → Digital Twin updated → Grok recommendation`

An image-derived result is an **observation**, not automatically a confirmed incident. It should normally begin in `requires_review` status until a user confirms it.

Initial Computer Vision scope:

- Visible waste accumulation or overflowing bins.
- Visible water leakage, only if the selected model/provider passes test cases.

Do not claim reliable detection of every leak, equipment fault, or waste category. Validate the selected provider against representative images. If it cannot reliably handle a category, remove or clearly limit that category rather than faking capability.

Energy wastage should primarily be inferred from sensor/resource data and operating assumptions, not from a photograph alone.

### C. Sustainability Prioritization

The application ranks issues using transparent, configurable factors, such as:

- Severity.
- Estimated resource/environmental impact.
- Urgency.
- Evidence quality/confidence.
- Cost or effort, when known.

An illustrative priority formula may be:

`priority_score = w_severity * severity + w_impact * impact + w_urgency * urgency`

All inputs must be normalized to a documented scale, and weights must be documented. The score is a product heuristic, not a universal scientific standard.

Grok may explain the ranking, but the backend owns the score calculation.

---

# 4. Scope and Priorities

## 4.1 P0 — Required for a Complete Prototype

1. Application shell and navigation.
2. Campus overview dashboard.
3. Three selectable buildings.
4. Structured building and resource data model.
5. Simulated sensor readings with source labels.
6. Sensor reading ingestion endpoint.
7. Interactive campus map/2D or 2.5D Digital Twin.
8. Image upload and dedicated Computer Vision inference.
9. Structured observation creation and review status.
10. Deterministic energy simulation.
11. At least one additional resource simulation for water or waste.
12. Baseline-versus-scenario comparison.
13. Grok-powered, context-aware recommendations.
14. Grok-generated sustainability report.
15. Clear distinction between measured, simulated, calculated, and AI-generated information.
16. Input validation and meaningful error states.
17. Core automated tests.
18. Reliable end-to-end demo workflow.

## 4.2 P1 — Important If Core Functionality Is Stable

- Water and waste simulation coverage beyond the minimum.
- Transparent issue prioritization.
- Recent sensor trend charts.
- Saved scenario history.
- Report export to PDF.
- Animated building-state changes.
- Richer campus visualization.
- Scenario comparison across multiple buildings.
- More detailed report filters.

## 4.3 P2 — Only After P0 and P1 Are Reliable

- Full 3D campus rendering.
- Physical IoT hardware.
- Authentication and role management.
- Advanced forecasting requiring substantial historical data.
- Multi-agent orchestration.
- Microservices.
- Complex notifications or background job infrastructure.

Do not begin P2 work while a P0 requirement is broken.

---

# 5. Technology Stack

Use the following stack unless a technical blocker is identified and the technical lead approves a change.

## 5.1 Frontend

| Technology | Responsibility |
|---|---|
| React | Component-based user interface |
| TypeScript | Typed data contracts and safer integration |
| Vite | Development server and production build |
| Tailwind CSS | Styling and design tokens |
| shadcn/ui | Accessible, reusable UI primitives |
| Recharts | Resource analytics and trend charts |
| Lucide React | Consistent icons |
| React Router | Page navigation |
| Fetch or a small typed HTTP client | Backend API communication |

Frontend rules:

- Use TypeScript for application code.
- Avoid `any`; if unavoidable, isolate it and validate the data.
- Keep API calls in a dedicated API/client layer, not scattered across UI components.
- Keep UI components separate from business calculations.
- Do not put secrets or provider API keys in frontend environment variables.
- Use loading, empty, success, and error states.
- Ensure the primary dashboard works at the expected presentation resolution and remains usable on smaller screens.

## 5.2 Backend

| Technology | Responsibility |
|---|---|
| Python | Business logic and simulation |
| FastAPI | REST API |
| Pydantic | Input/output validation |
| SQLAlchemy | Database access |
| SQLite | Prototype persistence |
| HTTPX | HTTP calls to external providers |
| Pytest | Automated tests |
| Uvicorn | Local ASGI server |

Backend rules:

- Use a modular monolith, not separate microservices.
- Keep provider calls behind service interfaces.
- Keep simulation calculations independent from Grok.
- Validate request bodies and uploaded files.
- Use consistent error responses.
- Persist important observations and completed scenarios.
- Avoid blocking operations in asynchronous routes where possible.
- Do not return stack traces, API keys, or provider secrets to clients.

## 5.3 Computer Vision — Option B

Use a **dedicated pretrained Computer Vision model or vision API**, separate from Grok.

Provider selection must be validated early based on:

- Support for image input.
- Ability to handle the selected use cases.
- Latency and rate limits.
- Cost/free-tier limits.
- Ease of integration.
- Whether the provider returns useful labels, scores, boxes, or explanations.
- Reliability on a small, representative test set.

Wrap the selected provider behind an internal interface so the rest of the application does not depend on one vendor's response format.

Suggested internal responsibility:

`vision_service.analyze_image(image, requested_categories) -> validated observation result`

Do not train a new deep-learning model from scratch during the hackathon.

If the chosen provider's output is not a calibrated probability, do not label its self-reported score as a calibrated confidence. Use an honest confidence/uncertainty label or omit the numerical value.

## 5.4 Generative AI

Use the **Grok API** for:

- Context-aware recommendations.
- Explanation of simulation results.
- Issue/action summaries.
- Sustainability reports.
- Campus questions grounded in supplied application data.

The backend must own all Grok requests.

Provider requirements:

- Read the key from a server-side environment variable such as `XAI_API_KEY`.
- Verify the current endpoint, model identifier, request schema, response schema, and rate limits against current xAI documentation before implementation.
- Use timeouts and handle rate limits/provider errors.
- Validate returned structured data.
- Avoid sending unnecessary sensitive data or raw files.
- Pass only relevant building metrics, observations, assumptions, and simulation results.
- Treat model output as untrusted content.
- Never allow model-generated instructions to bypass server-side validation or authorization.
- Do not let Grok invent sensor readings or calculate authoritative savings.

The precise Grok model identifier must be configuration, not duplicated as a hardcoded string throughout the codebase.

## 5.5 Persistence and Deployment

| Component | Initial choice |
|---|---|
| Database | SQLite |
| Local uploaded-image storage | A controlled upload directory, excluded from Git |
| Production image storage | Optional object storage if deployment requires it |
| Frontend hosting | Vercel or an equivalent static/frontend host |
| Backend hosting | A Python-compatible hosting service |
| Version control | Git and GitHub |
| Local secrets | `.env` (never committed) |
| Configuration template | `.env.example` (no real secrets) |

Verify host support, runtime limits, storage persistence, file-upload limits, and API timeouts before deployment. Local disk may be ephemeral on some hosts; do not assume uploaded files persist there.

---

# 6. Architecture

## 6.1 Architecture Style

**Modular monolith.**

One React frontend, one FastAPI backend, one SQLite database, and clearly separated internal modules.

This is the best balance for a 48-hour hackathon: modular responsibilities without the operational overhead of microservices.

## 6.2 Logical Architecture

```text
                           ECO TWIN AI
                               |
                    +----------+----------+
                    |                     |
                    v                     v
              React Frontend         Image Upload
                    |                     |
                    |                     v
                    |              Vision Provider
                    |                     |
                    v                     v
               FastAPI Backend <--- Validated Observation
                    |
      +-------------+------------------------------+
      |             |             |                |
      v             v             v                v
 Campus Service  Sensor Service  Simulation     AI Service
      |             |             Engine           |
      |             |               |              v
      |             |               |           Grok API
      +-------------+---------------+              |
                    |                              v
                    +---------------------- Recommendations
                    |                      and Reports
                    v
                SQLite DB
```

All external provider requests must pass through backend services. The database is the source of truth for persisted application state.

## 6.3 Backend Module Boundaries

Suggested responsibilities:

- `api/`: HTTP routes and request/response mapping only.
- `schemas/`: Pydantic request and response schemas.
- `models/`: SQLAlchemy persistence models.
- `services/campus_service.py`: Campus and building retrieval/update logic.
- `services/sensor_service.py`: Sensor reading validation and aggregation.
- `services/vision_service.py`: Dedicated Computer Vision provider integration.
- `services/simulation_service.py`: Deterministic calculations.
- `services/grok_service.py`: Grok API calls and output validation.
- `services/recommendation_service.py`: Priority calculation and recommendation orchestration.
- `services/report_service.py`: Report data assembly and generation.
- `core/config.py`: Environment configuration.
- `core/errors.py`: Consistent errors.
- `tests/`: Unit and integration tests.

Routes must not contain large blocks of business logic. Routes should validate, call a service, and return a schema-validated response.

---

# 7. Suggested Repository Structure

The final repository may be adjusted during setup, but preserve the boundaries and responsibilities.

```text
ecotwin-ai/
├── AGENTS.md
├── README.md
├── .gitignore
├── .env.example
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── dashboard/
│   │   │   ├── campus/
│   │   │   ├── monitoring/
│   │   │   ├── vision/
│   │   │   ├── simulations/
│   │   │   ├── ai/
│   │   │   └── reports/
│   │   ├── pages/
│   │   ├── services/
│   │   │   └── api/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── lib/
│   │   └── styles/
│   └── public/
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── core/
│   │   ├── schemas/
│   │   ├── models/
│   │   ├── services/
│   │   └── db/
│   └── tests/
├── data/
│   ├── seed/
│   ├── sample_images/
│   └── README.md
├── docs/
│   ├── architecture.md
│   ├── api-contracts.md
│   └── demo-runbook.md
└── scripts/
    ├── seed_database.py
    └── generate_sample_sensor_data.py
```

Do not create every directory empty just to match the tree. Create directories when their module is introduced. Keep generated databases, real uploaded images, `.env`, caches, and secrets out of Git.

---

# 8. Data Model and Shared Contracts

Shared data shapes must be defined before parallel implementation. Prefer Pydantic schemas on the backend and matching TypeScript types on the frontend. Avoid independently invented field names.

## 8.1 Building

Represents one campus building.

Required conceptual fields:

- `id`: stable string ID, e.g. `LIB`.
- `name`: display name.
- `building_type`: documented category.
- `created_at`/`updated_at`, where applicable.
- Resource summaries with units and aggregation periods.
- Data provenance metadata.
- Current issue/status summary, preferably derived from persisted records.

Prototype buildings:

- `ACADEMIC` — Academic Block.
- `LIB` — Library.
- `RESIDENCE` — Student Residence.

These are sample campus entities, not claims about actual college infrastructure.

## 8.2 Sensor

Conceptual fields:

- `id`.
- `building_id`.
- `metric`.
- `unit`.
- `source`: `simulated`, `manual`, or `real`.
- `status`.
- Optional descriptive metadata.

## 8.3 Sensor Reading

Conceptual fields:

- `id`.
- `sensor_id`.
- `building_id`.
- `metric`.
- `value`.
- `unit`.
- `timestamp` with timezone.
- `source`.
- Optional quality/status metadata.

Rules:

- Validate units and allowed metric names.
- Validate finite numeric values; reject NaN and infinity.
- Validate sensible bounds where they are defined.
- Define aggregation windows explicitly.
- Do not mix instantaneous power (kW) with energy (kWh).
- Do not mix flow rate (L/min) with volume (L).
- Do not aggregate readings with incompatible units or time periods.

## 8.4 Observation

Represents a detected or reported sustainability issue.

Conceptual fields:

- `id`.
- `building_id`.
- `observation_type`.
- `description`.
- `source`: `image_analysis`, `sensor_rule`, or `manual`.
- `status`: `requires_review`, `confirmed`, `dismissed`, or `resolved`.
- Optional provider/model label and score.
- Optional image reference.
- `created_at`.
- Optional `reviewed_at` and review metadata.

Image observations begin in `requires_review` unless the workflow explicitly includes human confirmation at creation time.

## 8.5 Simulation Scenario

Conceptual fields:

- `id`.
- `building_id`.
- `resource_type`.
- `intervention`.
- Validated `parameters`.
- Baseline values and period.
- Scenario result values and units.
- Assumptions.
- Calculation/version identifier.
- `created_at`.
- Status.

Persist enough information to reproduce and explain the result.

## 8.6 Recommendation

Conceptual fields:

- `id`.
- Optional `building_id`.
- Related observation/scenario IDs, when relevant.
- `title`.
- `reason`.
- `priority`.
- `suggested_action`.
- Optional impact estimate referencing calculated results.
- `status`.
- `created_at`.
- Data/assumption references.

AI-generated recommendations must not silently overwrite source readings or simulation outputs.

---

# 9. Sensor Data Design

## 9.1 Initial Sensor Types

| Resource | Example metric | Unit | Primary use |
|---|---|---|---|
| Energy | Energy consumption | kWh over a defined period | Energy monitoring and simulation |
| Water | Water volume | L or m³ over a defined period | Water monitoring and leak-related analysis |
| Waste | Waste weight or bin fill | kg or % | Waste monitoring |
| Optional occupancy | Occupancy count/status | people or documented state | Context for resource use |

For the prototype, sensor readings can be generated by a simulator. The backend must also expose a route that accepts a validated reading, demonstrating a path to real sensor integration.

## 9.2 Sample Sensor Payload

```json
{
  "sensor_id": "ENERGY-LIB-01",
  "building_id": "LIB",
  "metric": "energy_consumption",
  "value": 32.5,
  "unit": "kWh",
  "timestamp": "2026-10-15T10:00:00+05:30",
  "source": "simulated"
}
```

This is an example contract only. The time interval represented by a kWh reading must be documented in the actual implementation.

## 9.3 Sensor Simulation

The simulator should:

- Produce plausible, bounded sample values.
- Associate every reading with a known building and sensor.
- Generate timestamps.
- Mark the source as `simulated`.
- Avoid arbitrary jumps that undermine the demo unless the jump is a deliberate scenario.
- Be deterministic when a fixed seed/test fixture is used.
- Allow the dashboard to refresh through polling.

Use polling initially. Do not implement WebSockets unless the core workflow is complete and a real need is demonstrated.

---

# 10. Computer Vision Design

## 10.1 Pipeline

1. Accept image upload through the backend.
2. Validate content type, size, and file signature where feasible.
3. Generate a safe internal filename; do not trust a user-provided path.
4. Call the dedicated vision provider.
5. Normalize provider output into our internal schema.
6. Validate the output and handle uncertainty.
7. Associate the observation with a building/location.
8. Save the observation as review-pending.
9. Return structured data to the frontend.
10. Make the observation available to the Digital Twin and recommendation workflow.

## 10.2 Provider Abstraction

The rest of the application must not depend directly on a vendor-specific response structure. Normalize the result into an internal `VisionAnalysisResult`-style schema.

Provider-specific code belongs in the vision service/adapter.

## 10.3 Image Handling

- Set a reasonable maximum upload size in configuration.
- Accept only supported image types.
- Reject unsupported/corrupt files with a clear error.
- Do not execute or interpret uploaded files as code.
- Avoid committing uploaded user images to Git.
- Avoid retaining images longer than needed for the prototype.
- If deployment storage is ephemeral, clearly handle missing image references.

## 10.4 Honest Output

A model prediction is not proof. Keep uncertainty visible and require review for ambiguous detections. Do not fabricate bounding boxes, labels, or confidence scores.

---

# 11. Digital Twin Design

The Digital Twin is a structured, stateful virtual representation of the campus. The visual map is only one view of that representation.

## 11.1 State Sources

The Twin may receive updates from:

- Validated sensor readings.
- Confirmed or review-pending observations.
- User-entered parameters.
- Calculated simulation scenarios.

Each data item must retain its source and timestamp where relevant.

## 11.2 State Update Rules

- New sensor readings update the relevant reading history and current summaries.
- New image observations create an observation record and a visible issue marker.
- An unreviewed observation must be visually distinguishable from a confirmed issue.
- A completed simulation creates a separate scenario state; it must not overwrite the measured/supplied baseline.
- Resetting a scenario restores the baseline view.
- Resolving an issue updates the issue record, not the historical sensor readings.

## 11.3 Initial Visualization

Use an interactive 2D/2.5D campus map with three selectable buildings. A rich 3D environment is optional and must not delay the working data/simulation pipeline.

Required interactions:

- Select a building.
- View its resource metrics.
- View its observations/issues.
- Open the relevant simulation.
- See baseline and scenario values.
- See clear source/status indicators.

---

# 12. Simulation Engine

The simulation engine is a deterministic backend module. It must not require a Grok call to calculate numerical results.

## 12.1 General Rules

- Validate all parameters.
- Use explicit units.
- Return baseline, scenario, absolute difference, percentage difference where defined, and assumptions.
- Avoid dividing by zero.
- Handle missing inputs without inventing values.
- Keep baseline and scenario data separate.
- Label scenario results as projections.
- Record the calculation version or method.
- Write unit tests for formulas and edge cases.

## 12.2 Energy

For equipment with constant power:

`energy_kwh = power_kw * operating_hours_per_day * operating_days`

For a baseline and scenario:

`energy_saved_kwh = baseline_energy_kwh - scenario_energy_kwh`

When the baseline is non-zero:

`reduction_percent = energy_saved_kwh / baseline_energy_kwh * 100`

This formula applies only when the model correctly represents the equipment and period. Do not automatically assume an operating-hour percentage equals the energy-reduction percentage if the equipment mix or load profile changes.

## 12.3 Water

For a leak with an estimated constant flow:

`leaked_volume_litres = flow_litres_per_minute * duration_minutes`

The flow rate must come from a supplied assumption or suitable sensor data. Computer Vision alone should not be presented as measuring an exact leak flow rate.

## 12.4 Waste

For a defined waste mass and segregation fraction:

`segregated_mass_kg = total_waste_kg * segregation_fraction`

Validate the fraction to `[0, 1]`. State what “segregated” means in the application and do not equate segregation automatically with verified recycling.

## 12.5 Cost and Emissions

Energy cost estimate:

`estimated_cost_savings = energy_saved_kwh * electricity_tariff_per_kwh`

Emissions estimate:

`estimated_co2_avoided = energy_saved_kwh * applicable_emissions_factor`

Only compute these values when the tariff/emissions factor is configured and its units and applicability are documented. Mark them as estimates. Do not hardcode an unsupported universal emissions factor.

## 12.6 Scenario Response

A scenario response should include:

- Scenario ID, if persisted.
- Building/resource/intervention.
- Baseline value and unit.
- Projected value and unit.
- Absolute difference/savings.
- Percentage difference where defined.
- Optional cost impact.
- Optional emissions impact.
- Assumptions.
- Data sources.
- Calculation method/version.
- A projection/simulation label.

---

# 13. Grok AI Service Design

## 13.1 Responsibilities

Grok is used for language and reasoning tasks:

- Recommendations based on campus state.
- Explanations of calculated simulation results.
- Prioritized action plans.
- Sustainability reports.
- Questions about the campus, grounded in supplied data.

Grok is **not** the source of truth for sensor data, issue status, calculations, or persisted records.

## 13.2 Context Assembly

Before calling Grok, the backend assembles a minimal context containing only the relevant:

- Building metrics.
- Sensor readings and their provenance.
- Observations and review statuses.
- Scenario results and assumptions.
- Priority scores and their documented meaning.

Do not send the entire database for every request.

## 13.3 Output Validation

Where possible, request structured JSON and validate it against a Pydantic schema. If the output is invalid, handle it as a provider/validation error; do not blindly render arbitrary output as trusted structured data.

AI outputs must identify estimates and uncertainties. Do not allow Grok to override numeric values calculated by the simulation engine.

## 13.4 Recommendations

A recommendation should include, as applicable:

- Title.
- Problem/context.
- Suggested action.
- Reason.
- Priority.
- Expected benefit tied to available calculations.
- Assumptions or missing information.
- Supporting observation/scenario references.

If there is not enough data to estimate impact, the response must say so instead of inventing a number.

## 13.5 Sustainability Reports

The report should contain:

1. Executive summary.
2. Campus/building scope and time period.
3. Resource metrics.
4. Observations and issue statuses.
5. Main findings.
6. Recommended actions and priorities.
7. Scenario results and assumptions.
8. Data-source/provenance notes.
9. Limitations and next steps.

A report must distinguish actual/supplied readings, simulated readings, calculations, model observations, and AI-generated explanations.

---

# 14. REST API Contract

The following is the initial endpoint plan. Request/response schemas must be implemented and agreed on before parallel modules integrate. Do not silently change routes or field names.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Backend health check |
| `GET` | `/api/campus` | Campus overview and summary |
| `GET` | `/api/buildings` | List buildings |
| `GET` | `/api/buildings/{building_id}` | Building detail |
| `GET` | `/api/buildings/{building_id}/readings` | Recent readings for a building |
| `POST` | `/api/sensors/readings` | Ingest a validated reading |
| `POST` | `/api/sensors/simulate` | Generate simulated readings |
| `POST` | `/api/observations/analyze-image` | Upload and analyse an image |
| `GET` | `/api/observations` | List observations, optionally filtered |
| `PATCH` | `/api/observations/{observation_id}` | Review/update observation status |
| `POST` | `/api/simulations/run` | Validate and run a simulation |
| `GET` | `/api/simulations/{scenario_id}` | Retrieve a saved scenario |
| `GET` | `/api/simulations` | List saved scenarios, if history is implemented |
| `POST` | `/api/ai/recommendations` | Generate grounded recommendations |
| `POST` | `/api/ai/reports` | Generate a sustainability report |

API rules:

- Use consistent JSON schemas.
- Return appropriate HTTP status codes.
- Validate IDs and enum values.
- Use timezone-aware ISO 8601 timestamps.
- Return clear error messages without secrets or stack traces.
- Keep business logic in services.
- Document any changes to this contract.
- Add CORS configuration for the deployed frontend origin; do not use unrestricted production CORS without reason.

---

# 15. Frontend Pages and UX

## 15.1 Global Visual Direction

- Dark indigo/charcoal background.
- Cyan as the primary information/action accent.
- Violet for AI/innovation elements.
- Green/amber/red only where their status meaning is clear.
- Subtle glass-like panels; avoid excessive blur and glow.
- Clear typography, spacing, and information hierarchy.
- Consistent loading, error, empty, and success states.
- Avoid decorative charts that do not represent actual data.
- Use accessible contrast and keyboard-operable controls.

## 15.2 Navigation

1. **Overview**
2. **Campus Twin**
3. **Resource Monitoring**
4. **Vision Inspector**
5. **Simulations**
6. **AI Advisor**
7. **Reports**

## 15.3 Overview

Display:

- Campus resource summary.
- Active/review-pending issues.
- Interactive campus map.
- Resource trends.
- High-priority observations.
- Recent sensor readings.
- Recommended next actions.

Every metric must identify its unit and relevant period.

## 15.4 Campus Twin

- Selectable building visualization.
- Building details panel.
- Resource metrics.
- Observation/issue markers.
- Source and status labels.
- Direct entry into relevant simulations.

## 15.5 Resource Monitoring

- Energy, water, and waste charts.
- Building and time-period filters where supported.
- Clear source labels.
- Consistent units and aggregation windows.

## 15.6 Vision Inspector

- Drag/drop or file-picker upload.
- Preview and validation.
- Analysis/loading state.
- Structured result.
- Uncertainty/confidence where valid.
- Building/location association.
- Confirm/dismiss/review controls.
- Clear failure and retry behavior.

## 15.7 Simulations

- Resource selector.
- Intervention selector.
- Parameter inputs with units and bounds.
- Run/reset controls.
- Baseline vs projected values.
- Savings and percentage changes.
- Assumptions and source labels.
- AI explanation based on returned results.

## 15.8 AI Advisor

- Context-aware questions and recommendations.
- Explicit display of the building/data scope used.
- Loading and provider-error states.
- No fabricated claims that the system executed an action.
- Distinguish AI suggestions from calculated results.

## 15.9 Reports

- Structured sustainability report.
- Scope/time-period summary.
- Observations and resource metrics.
- Recommendations and scenario results.
- Assumptions, provenance, and limitations.
- PDF export is optional after core report generation works.

---

# 16. Security and Reliability Requirements

These requirements are mandatory even for a hackathon prototype.

## Secrets

- Keep `XAI_API_KEY` and any vision-provider key on the backend.
- Never commit `.env`.
- Never place provider keys in frontend `VITE_*` variables.
- Include only placeholder names in `.env.example`.
- If a key is exposed, rotate it.

## Input Handling

- Validate JSON through Pydantic.
- Validate uploaded image types and sizes.
- Generate safe server-side filenames.
- Reject malformed numeric values, NaN, and infinity.
- Apply sensible bounds to scenario parameters.
- Avoid arbitrary file paths supplied by users.

## External Providers

- Set request timeouts.
- Handle rate limits, network errors, and invalid responses.
- Avoid unlimited retries.
- Provide a clear UI error when a provider is unavailable.
- Do not fabricate a successful result when a call fails.
- Use a deterministic demo fixture/fallback only when it is clearly identified as sample data.

## Data Integrity

- Do not overwrite baseline measurements with scenario results.
- Keep source and timestamp metadata.
- Do not treat a vision observation as a confirmed incident without review.
- Validate all AI output before using it in application state.
- Keep calculations independent of model-generated text.

## Reliability

- The dashboard should remain navigable if an optional AI call fails.
- A failed report generation must not erase sensor data or observations.
- Core calculations must work without Grok.
- Use sample seed data so the demo can be restored consistently.
- Avoid a hard dependency on live external APIs for every step of the main demonstration.

---

# 17. Testing Strategy

Testing must begin during implementation, not in the final hours.

## 17.1 Backend Unit Tests

Test:

- Energy calculation.
- Water volume calculation.
- Waste/segregation calculation.
- Percentage change and zero-baseline behavior.
- Parameter validation.
- Unit and aggregation validation.
- Sensor/building association.
- Observation state transitions.
- Priority score normalization.
- Grok response-schema validation.
- Vision response normalization.

## 17.2 API Tests

Test:

- Health endpoint.
- Building retrieval.
- Valid and invalid sensor readings.
- Simulated sensor generation.
- Valid and invalid image uploads.
- Observation listing and review updates.
- Valid and invalid simulation requests.
- AI provider failure handling.
- Missing configuration behavior.

Mock external provider calls in automated tests. The test suite must not depend on a live API key or spend API credits.

## 17.3 Frontend Checks

- Production build succeeds.
- Navigation works.
- Building selection changes content.
- Charts use returned data.
- Loading/error/empty states render correctly.
- Invalid input is handled.
- Simulation results update the comparison view.
- Observation review actions update the UI after a successful API response.

## 17.4 End-to-End Demo Test

Run this exact workflow before presenting:

1. Open the dashboard.
2. Select a building.
3. Review resource data.
4. Upload a test image.
5. Review the Computer Vision observation.
6. Confirm its building/location.
7. Verify that the Digital Twin reflects the observation.
8. Run a scenario.
9. Check the calculated values and assumptions.
10. Ask Grok to explain the result.
11. Generate a sustainability report.
12. Verify that the report distinguishes simulated data and estimates.

---

# 18. Team Responsibilities

Four people should own bounded modules, with the technical lead responsible for integration.

## Developer 1 — Technical Lead / Integration

Responsibilities:

- Own this architecture and shared contracts.
- Set up repository conventions.
- Coordinate integration.
- Review module boundaries.
- Maintain the end-to-end workflow.
- Resolve shared-interface conflicts.
- Run integration tests.
- Prepare the architecture explanation and demo runbook.

The lead should not become the sole implementer of every module. Integration and quality control are the primary responsibilities.

## Developer 2 — Digital Twin / Sensor / Simulation

Responsibilities:

- Building model and seed data.
- Sensor ingestion and simulator.
- Resource aggregation.
- Deterministic simulation engine.
- Calculation tests.
- Scenario persistence.

## Developer 3 — Frontend / Visualization

Responsibilities:

- UI foundation and design tokens.
- Navigation and dashboard.
- Campus map and building detail views.
- Monitoring charts.
- Vision upload interface.
- Simulation comparison UI.
- Loading/error states and API integration.

## Developer 4 — Computer Vision / Grok / Reports

Responsibilities:

- Validate the dedicated vision provider.
- Implement vision adapter and normalized output.
- Implement observation creation/review flow with the backend owner.
- Implement Grok service.
- Generate recommendations and reports.
- Validate AI output and handle provider failures.

Module ownership does not remove the need for collaboration. The team must use shared contracts and integrate incrementally.

---

# 19. Forty-Eight-Hour Implementation Plan

The sequence below is a planning target, not permission to defer testing until a phase ends. Test and integrate continuously.

## Phase 1 — Foundation (Hours 0–4)

Goals:

- Create the repository.
- Initialize React/TypeScript/Vite and FastAPI.
- Define environment variables.
- Define shared schemas and API contracts.
- Seed three sample buildings.
- Implement `/api/health`.
- Connect the frontend to the backend.
- Verify all developers can run the project.

**Exit criteria:** Application runs locally and the frontend retrieves campus data.

## Phase 2 — Core Modules (Hours 4–14)

Parallel work:

- Frontend: dashboard shell, navigation, campus map, building panel.
- Digital Twin: data models, seed data, sensor ingestion, simulator.
- Simulation: deterministic energy and at least one other resource calculation.
- AI/CV: verify Grok access; select and test dedicated vision provider; implement provider adapters.

**Exit criteria:** Dashboard is functional, simulation calculations pass tests, and both external-provider integrations have been technically verified.

## Phase 3 — End-to-End Integration (Hours 14–24)

Goals:

- Connect readings to building metrics.
- Connect vision results to observation records.
- Update the Digital Twin from new observations/readings.
- Connect simulation requests and responses to the UI.
- Connect simulation context to Grok.
- Generate a structured sustainability report.
- Test the complete workflow locally.

**Exit criteria:** Main workflow functions locally by the end of Day 1.

## Phase 4 — Innovation and Polish (Hours 24–32)

Goals:

- Finish Sustainability Time Machine.
- Add baseline/scenario comparison.
- Add transparent assumptions and savings.
- Add useful visual state transitions.
- Add prioritized recommendations.
- Refine the interface and responsive layout.

**Exit criteria:** A judge can modify an intervention and understand its projected impact immediately.

## Phase 5 — Reliability and Deployment (Hours 32–40)

Goals:

- Run unit and API tests.
- Test external-provider failures.
- Validate uploaded-image handling.
- Check invalid scenario inputs and zero baselines.
- Verify environment configuration.
- Deploy frontend and backend.
- Test deployed API connectivity and persistence.
- Confirm that secrets are not exposed.

**Exit criteria:** Deployed prototype passes the core demo test.

## Phase 6 — Final Verification and Pitch (Hours 40–48)

Goals:

- Fix only high-impact bugs.
- Re-run the end-to-end workflow.
- Prepare a consistent sample dataset.
- Finalize architecture explanation.
- Prepare a concise pitch and demo sequence.
- Rehearse failure recovery.
- Verify deployment, API quota, and keys.

**Exit criteria:** The demonstration is repeatable, the team can explain the architecture, and core features work without editing code live.

---

# 20. Judging-Criteria Strategy

The rubric weights are:

| Criterion | Weight | Evidence EcoTwin AI should show |
|---|---:|---|
| Technical Implementation | 30% | Working vision pipeline, sensor ingestion, connected Digital Twin, deterministic simulation, Grok integration |
| Innovation & Creativity | 25% | Sustainability Time Machine and Vision-to-Action workflow |
| Practicality & Impact | 20% | Transparent resource-saving calculations, assumptions, prioritized actions, sustainability reports |
| Presentation & Demo | 15% | Polished dashboard and a coherent live workflow |
| Teamwork | 10% | Clearly owned modules, shared contracts, integration, and coordinated presentation |

Do not claim guaranteed scores. Demonstrate working functionality and explain the engineering choices honestly.

---

# 21. Demo Runbook

The intended live demonstration is:

1. **Open Overview:** Show campus resource metrics and current issue statuses.
2. **Select Library:** Inspect building-level data and trends.
3. **Upload an image:** Run Computer Vision and create a review-pending observation.
4. **Review the observation:** Associate it with the building and confirm or dismiss it.
5. **Show the Digital Twin update:** Point out the issue marker and building state.
6. **Open Sustainability Time Machine:** Select an energy or water intervention.
7. **Run the simulation:** Display baseline, projected value, savings, units, and assumptions.
8. **Ask Grok to explain:** Generate a grounded recommendation from the scenario result.
9. **Generate the report:** Show findings, recommendations, estimates, and limitations.
10. **Close with impact:** Explain how the same architecture could connect to real campus sensors.

Use a prepared sample dataset and test images, but ensure the live workflow is real. If a provider fails, use a clearly labelled sample-data fallback rather than pretending a live call succeeded.

---

# 22. Definition of Done

EcoTwin AI is ready for judging only when all applicable P0 items below are satisfied.

## Functional

- [ ] Frontend and backend start successfully.
- [ ] Three buildings appear with consistent metrics.
- [ ] Sensor readings can be ingested and are source-labelled.
- [ ] Simulated readings update the correct building.
- [ ] Dedicated Computer Vision provider analyses a supported image.
- [ ] Vision output is validated and represented as an observation.
- [ ] Observation review status is functional.
- [ ] The Digital Twin reflects new readings and observations.
- [ ] Energy simulation is deterministic and tested.
- [ ] At least one additional resource simulation works.
- [ ] Baseline and projected scenario are shown separately.
- [ ] Grok recommendations use actual application data.
- [ ] Sustainability report is generated from relevant data.
- [ ] Estimates, simulated values, and AI outputs are labelled.

## Quality

- [ ] Core unit tests pass.
- [ ] API validation tests pass.
- [ ] Frontend production build succeeds.
- [ ] Errors are understandable and do not expose secrets.
- [ ] Missing provider credentials are handled gracefully.
- [ ] Main demo works against the deployed environment.
- [ ] `.env` and uploaded private data are not committed.
- [ ] No critical UI control is decorative or nonfunctional.
- [ ] The team can explain how every displayed impact figure is calculated.

## Presentation

- [ ] Demo dataset is seeded and reproducible.
- [ ] Test images are ready.
- [ ] Demo sequence has been rehearsed.
- [ ] Architecture and innovation can be explained concisely.
- [ ] Limitations and assumptions are disclosed honestly.

---

# 23. Environment Configuration

Use `.env.example` to document configuration names, never real credentials.

Illustrative variables:

```dotenv
APP_ENV=development
DATABASE_URL=sqlite:///./ecotwin.db
FRONTEND_ORIGIN=http://localhost:5173

XAI_API_KEY=
XAI_MODEL=

VISION_PROVIDER=
VISION_API_KEY=
VISION_MODEL=

MAX_IMAGE_UPLOAD_MB=8
```

This is an initial template. Exact provider-specific variables depend on the selected vision provider and the verified Grok API contract.

Do not commit `.env`. Ensure `.gitignore` excludes:

- `.env` and other secret-bearing environment files.
- Python virtual environments.
- `node_modules`.
- Build output.
- SQLite database files containing local/runtime data.
- Uploaded images and upload directories.
- Logs, caches, and temporary files.
- API response dumps that may contain sensitive data.

---

# 24. Final Engineering Rules

1. **One source of truth:** This document and the agreed schemas govern architecture.
2. **Contracts before parallel coding:** Agree on shared request/response shapes before integration.
3. **Small, bounded changes:** Do not rewrite unrelated modules.
4. **No fake functionality:** A button must perform its stated action or be clearly disabled.
5. **No fabricated measurements:** Simulated data must be labelled.
6. **Deterministic calculations:** The backend owns numeric simulation results.
7. **Provider abstraction:** Vision and Grok integrations must be replaceable without rewriting core business logic.
8. **Human review:** Image predictions are observations, not automatic proof.
9. **Fail gracefully:** External API failure must not destroy the core application state.
10. **Test continuously:** Do not postpone integration until the final phase.
11. **Keep scope disciplined:** Finish P0 before P2.
12. **Protect secrets:** API keys belong on the backend.
13. **Explain every metric:** Units, periods, assumptions, and data provenance must be clear.
14. **Update this file deliberately:** Architectural changes require team agreement and documentation.
15. **Optimize for the complete product:** A coherent end-to-end workflow is more valuable than a larger number of disconnected features.

---

## Final Product Statement

**EcoTwin AI is a campus sustainability Digital Twin that combines sensor data and Computer Vision observations with deterministic what-if simulations and Grok-powered recommendations. Its Sustainability Time Machine lets administrators explore possible interventions and understand their projected resource impact before acting.**

Build the connected workflow first. Make the calculations defensible. Make the interface clear. Then polish the demonstration.
