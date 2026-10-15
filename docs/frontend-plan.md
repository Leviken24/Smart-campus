# EcoTwin AI — Frontend Architecture, Component Specifications & UI Implementation Plan

> **Document Status:** Phase 0 Frontend Specification  
> **Role:** Frontend & Visualization Lead (Person 3)  
> **Authority:** Derived directly from [AGENTS.md Section 5.1 & 15](file:///d:/DSU-hackathon/AGENTS.md), [CLAUDE.md](file:///d:/DSU-hackathon/CLAUDE.md), [docs/architecture.md](file:///d:/DSU-hackathon/docs/architecture.md), and [docs/api-contracts.md](file:///d:/DSU-hackathon/docs/api-contracts.md).  
> **Scope:** Defines the complete React/TypeScript interface structure, visual tokens, data provenance rendering, seven core pages, API client layer, error handling, and testable acceptance criteria. No code is implemented in this phase.

---

## 1. Frontend Architecture & Technology Stack

The EcoTwin AI frontend is designed as a high-performance, accessible single-page application (SPA) focused on clean information hierarchy, transparent mathematical modeling, and responsive telemetry visualization.

### Technology Choices & Responsibilities

| Library / Tool | Version Target | Architectural Responsibility |
|---|---|---|
| **React** | `^18.3.1` | Component-based declarative UI and rendering lifecycle. |
| **TypeScript** | `^5.5.0` | Strict static typing; mirrors backend Pydantic DTOs into typed client models. |
| **Vite** | `^5.4.0` | Fast local HMR, asset pipeline, and `/api` dev-proxy routing. |
| **Tailwind CSS** | `^3.4.0` | Utility-first styling, responsive grids, and design token enforcement. |
| **shadcn/ui (Radix UI)** | Latest primitives | Accessible primitives: Dialog, Tabs, Card, Badge, Alert, Button, Select, Toast, Tooltip. |
| **Recharts** | `^2.12.0` | SVG-based responsive resource telemetry and simulation comparison charts. |
| **Lucide React** | `^0.400.0` | Lightweight, consistent iconography across all seven views. |
| **React Router** | `^6.24.0` | Client-side routing across seven primary navigation destinations. |
| **Typed API Client** | Custom fetch wrapper | Native `fetch` with structured JSON parsing, type guards, and unified error wrappers. |

*Design Rule:* No external global state libraries (Redux, Zustand) will be introduced unless complex cross-page caching proves strictly necessary. Component state (`useState`, `useReducer`), URL query parameters (`useSearchParams`), and light React Context wrappers provide predictable data flow.

---

## 2. Visual Design System & Design Tokens

EcoTwin AI employs an intentional, dark-mode-first aesthetic inspired by aerospace and environmental monitoring consoles. The interface avoids flashy or purely decorative distractions, emphasizing high data density, clear contrast, and instant readability.

### 2.1 Color Palette & Design Tokens

```
+---------------------------------------------------------------------------------------------------+
|                                      DESIGN TOKEN PALETTE                                         |
|                                                                                                   |
|  [ BASE FOUNDATION ]                                                                              |
|  - App Background:       slate-950 (#020617) - Deep dark charcoal / midnight base                |
|  - Surface / Panels:     slate-900 (#0f172a) at 70% opacity with backdrop-blur-md                |
|  - Borders:              slate-800 (#1e293b) - Subtle borders distinguishing glass panels         |
|  - Text Primary:         slate-50 (#f8fafc)  - Maximum contrast for metrics and titles            |
|  - Text Secondary:       slate-400 (#94a3b8) - Labels, timestamps, and metadata                  |
|                                                                                                   |
|  [ PRIMARY ACTION & TELEMETRY ]                                                                   |
|  - Cyan Primary:         cyan-500 (#06b6d4) / cyan-400 (#22d3ee)                                  |
|                          Used for active navigation tabs, telemetry trends, and primary CTAs      |
|                                                                                                   |
|  [ AI & REASONING ACCENT ]                                                                        |
|  - Violet Accent:        violet-500 (#8b5cf6) / violet-400 (#a78bfa)                              |
|                          Reserved strictly for Grok insights, reasoning badges, and reports       |
|                                                                                                   |
|  [ SEMANTIC STATUS & ALERT TOKENS ]                                                               |
|  - Review Pending:       amber-500 (#f59e0b) - Requires human review or calibration               |
|  - Confirmed / Healthy:  emerald-500 (#10b981) - Confirmed observation or healthy metric          |
|  - Critical Alert:       rose-500 (#f43f5e) - High severity issue or hardware malfunction         |
+---------------------------------------------------------------------------------------------------+
```

### 2.2 Glassmorphism & Panel Styling
- Containers utilize restrained glass styling: `bg-slate-900/70 backdrop-blur-sm border border-slate-800/80 rounded-xl shadow-lg`.
- Excessive blurs, saturated gradients, or distracting glowing animations are strictly prohibited to ensure high contrast and rapid screen rendering.

### 2.3 Responsive Breakpoints
- **Mobile (`< 768px`):** Single-column stacked layout; collapsible bottom-sheet navigation; simplified cards.
- **Tablet (`768px - 1023px`):** Two-column grid; compact sidebar navigation; responsive chart heights.
- **Desktop (`1024px - 1439px`):** Full multi-panel dashboard; persistent left navigation rail; side-by-side simulation comparisons.
- **Presentation Target (`1440px+`):** Optimized for 1080p and 1440p conference projectors with high-contrast text and crisp SVG rendering.

---

## 3. Data Integrity & Provenance Visualization System

To strictly adhere to the core product principle (*"The system must distinguish facts, observations, simulations, estimates, and AI-generated explanations"*), the frontend implements a mandatory provenance badge component: `<ProvenanceBadge type={...} />`.

Every numeric metric, chart series, and observation card must display one of the following badge variants:

| Provenance Type | Badge Text | Style Tokens | Applied To |
|---|---|---|---|
| **MEASURED** | `Real Sensor` | `bg-emerald-950/80 text-emerald-300 border-emerald-700/50` | Physical IoT hardware sensor readings (if connected). |
| **SIMULATED** | `Simulated` | `bg-sky-950/80 text-sky-300 border-sky-700/50` | Synthetically generated sensor telemetry streams. |
| **MANUAL** | `Manual Log` | `bg-blue-950/80 text-blue-300 border-blue-700/50` | Operator-entered baseline values or manual readings. |
| **OBSERVED** | `Vision Inference` | `bg-amber-950/80 text-amber-300 border-amber-700/50` | Computer Vision image analysis outputs. |
| **REVIEW_PENDING** | `Requires Review` | `bg-amber-900/90 text-amber-200 border-amber-500 animate-pulse` | Unconfirmed visual observations awaiting human confirmation. |
| **CONFIRMED** | `Confirmed Issue` | `bg-emerald-950/80 text-emerald-300 border-emerald-600` | Human-verified incidents linked to a building. |
| **CALCULATED** | `Deterministic Math` | `bg-cyan-950/80 text-cyan-300 border-cyan-700/50` | Pure backend math results (baseline kWh, leak volume). |
| **PROJECTED** | `Simulation Projection` | `bg-indigo-950/80 text-indigo-300 border-indigo-700/50` | Sustainability Time Machine what-if scenario outputs. |
| **AI_GENERATED** | `Grok AI Explanation` | `bg-violet-950/80 text-violet-300 border-violet-700/50` | Explanations, recommendations, and report text synthesized by Grok. |

*Crucial Guardrail:* The UI will never render a simulated reading with a generic "Live" green pulse dot, nor will it display projected savings as "Realized Savings".

---

## 4. Detailed Specifications for the Seven Application Pages

```
                       +---------------------------------------+
                       |           APPLICATION SHELL           |
                       | [Header: Status, Clock, API Indicator]|
                       +-------------------+-------------------+
                                           |
    +-----------+-----------+--------------+--------------+-----------+-----------+
    |           |           |              |              |           |           |
    v           v           v              v              v           v           v
1. Overview  2. Campus  3. Resource    4. Vision      5. Time      6. AI       7. Reports
               Twin     Monitoring     Inspector      Machine     Advisor
```

---

### Page 1: Overview (`/`)

#### 1. Purpose
The primary landing dashboard providing an executive bird's-eye view of campus sustainability health, aggregated 24-hour resource consumption, active issues breakdown, and immediate calls-to-action.

#### 2. Main Interface Components
- **Campus KPI Header Strip:** 4 summary metric cards:
  - Total Energy Consumption ($1,420.5\text{ kWh}$, with `Simulated` badge).
  - Total Water Usage ($8,450.0\text{ L}$, with `Simulated` badge).
  - Total Waste Generated ($320.0\text{ kg}$, with `Simulated` badge).
  - Waste Segregation Rate ($68.5\%$, with `Deterministic Math` badge).
- **Interactive Campus Overview Map (2.5D SVG):** Compact isometric campus layout showing `ACADEMIC`, `LIB`, and `RESIDENCE` with real-time status glow pins (green = nominal, amber = pending review, red = confirmed alert).
- **Recent Alerts & Observations Feed:** Card list displaying latest visual observations and sensor alerts with click-to-review shortcuts.
- **24-Hour Resource Trend Mini-Charts:** Small Recharts Sparklines showing cumulative energy load profile over time.
- **Recommended Interventions Teaser:** Quick banner showing top Grok AI recommendation with a direct link to the Sustainability Time Machine.

#### 3. Backend Endpoints & Data Contracts
- `GET /api/campus` (aggregated consumption, issue counts, provenance).
- `GET /api/buildings` (individual building summaries and statuses).
- `GET /api/observations?status=requires_review` (pending alerts).

#### 4. User Interactions
- Clicking any building node on the map navigates directly to `/campus-twin?building={id}`.
- Clicking an unreviewed alert opens the Vision Inspector review drawer.
- Clicking a mini-chart switches to the Resource Monitoring page with the relevant filter pre-selected.

#### 5. States & Edge Cases
- **Loading:** Skeleton placeholder cards for KPIs and animated shimmer map container.
- **Empty:** "No campus telemetry available. Generate simulated sensor readings" with an inline action button calling `POST /api/sensors/simulate`.
- **Error:** High-visibility alert banner: "Failed to connect to backend campus service (`GET /api/campus`). Retry connection" with countdown timer.
- **Success:** Metrics populated with timestamps and explicit units.

---

### Page 2: Campus Twin (`/campus-twin`)

#### 2.1 Purpose
The interactive Digital Twin interface where users explore spatial relationships, inspect individual building states, review active hardware sensors, and track active building-specific observations.

#### 2.2 Main Interface Components
- **Interactive 2D/2.5D Campus Map Canvas:**
  - Scalable vector representation of campus grounds.
  - Three interactive building polygons labeled `ACADEMIC`, `LIB`, and `RESIDENCE`.
  - Visual status overlays: Amber pulse for unreviewed visual observations; red badge for confirmed leaks or bin overflows; green check for nominal operations.
- **Building Detail Inspector Panel (Side Drawer or Split View):**
  - Building Title & Type (e.g. `Library`, `Academic Facility`).
  - Operational Schedule Indicator (e.g. `08:00 - 22:00 (14 hrs/day)`).
  - Baseline Resource Metrics Card (daily kWh, water volume L, waste kg).
  - Registered Sensors Table: Sensor ID, Metric, Unit, Source (`simulated`), and Status (`online`).
  - Active Incidents List: Linked observations with status chips (`Requires Review` or `Confirmed`).
  - "Launch What-If Simulation" CTA: Pre-fills building ID and deep-links to the Sustainability Time Machine.

#### 2.3 Backend Endpoints & Data Contracts
- `GET /api/buildings`
- `GET /api/buildings/{building_id}`
- `GET /api/observations?building_id={building_id}`

#### 2.4 User Interactions
- Clicking a building polygon triggers smooth focus animation and loads building telemetry into the inspector panel.
- Query param synchronization: URL updates to `/campus-twin?building=LIB` for shareable links.
- Clicking an observation in the building panel expands its photo evidence thumbnail and reviewer notes.

#### 2.5 States & Edge Cases
- **Loading:** Map renders base vector paths; inspector panel shows pulse skeleton.
- **Empty:** If building has no active incidents, panel renders: "No active anomalies detected for this facility. Nominal baseline operating."
- **Error:** If building ID is invalid, falls back to `LIB` default and shows warning toast: "Requested building not found; defaulting to Library."

---

### Page 3: Resource Monitoring (`/monitoring`)

#### 3.1 Purpose
Dedicated telemetry analytics view providing granular historical trends, multi-resource charting (energy, water, waste), aggregation window selectors, and transparent data provenance inspection.

#### 3.2 Main Interface Components
- **Filter Toolbar:**
  - Building Selector (`All Campus`, `Academic Block`, `Library`, `Student Residence`).
  - Resource Tabs (`Energy (kWh)`, `Water (Litres)`, `Waste (kg / %)`).
  - Time Window Selector (`Last 24 Hours`, `Last 7 Days`, `Last 30 Days`).
- **Primary Telemetry Chart (Recharts):**
  - Dynamic line/bar chart displaying readings over time.
  - Distinct styled series with tooltips showing exact timestamp, reading value, unit, and source badge.
  - Reference lines for baseline averages.
- **Readings Data Table (Collapsible):** Tabular view of raw readings with columns: Timestamp, Sensor ID, Building, Metric, Value, Unit, Source.
- **"Generate Synthetic Telemetry" Action Bar:** Allows developer/presenter to trigger `POST /api/sensors/simulate` directly from the UI during live demonstrations.

#### 3.3 Backend Endpoints & Data Contracts
- `GET /api/buildings/{building_id}/readings?metric={metric}&limit=100`
- `POST /api/sensors/simulate`

#### 3.4 User Interactions
- Changing resource tabs switches chart axes and unit formatting dynamically (`kWh` vs `L` vs `kg`).
- Hovering over chart data points renders custom tooltips showing reading provenance.
- Clicking "Generate 24h Data" triggers a loading spinner and refreshes the chart data automatically.

#### 3.5 States & Edge Cases
- **Loading:** Chart container displays an animated grid skeleton.
- **Empty:** Clean empty-state graphic: "No telemetry records found for selected metric/window. Click 'Simulate Stream' to generate bounded demo readings."
- **Error:** Displays network error card with retry button.

---

### Page 4: Vision Inspector (`/vision-inspector`)

#### 4.1 Purpose
The Vision-to-Action interface where users upload campus imagery, trigger dedicated Computer Vision inference, review detected anomalies, and link verified issues to the Digital Twin.

#### 4.2 Main Interface Components
- **Drag-and-Drop Image Upload Zone:**
  - Accepts JPEG, PNG, WebP files up to 8MB.
  - Client-side validation for file size and MIME type.
  - Image preview canvas with clear/replace controls.
  - Candidate Building Selector dropdown (`Auto-detect`, `Library`, `Academic Block`, `Student Residence`).
  - Prominent "Analyze Image with Computer Vision" action button.
- **Inference Analysis Card (Result Container):**
  - Uploaded Image Thumbnail with visual bounding indicators (if supported by provider).
  - Detected Observations Summary (e.g. `Waste Accumulation / Overflowing Bin`).
  - Model Information Badge (Provider name, model identifier, and qualitative certainty: `High` / `Medium` / `Low`).
  - Observation Status Tag: Default `Requires Review` (amber).
- **Human Review & Association Action Bar:**
  - Building Association Selector (allows correcting or confirming building).
  - Reviewer Note Textarea (e.g. "Confirmed by facilities inspection").
  - Two Action Buttons: "Confirm & Publish to Twin" (green) and "Dismiss Observation" (slate).
- **Recent Observations Audit Queue:** Table/cards listing historical observations with filter tabs: `Pending Review`, `Confirmed`, `Dismissed`, `Resolved`.

#### 4.3 Backend Endpoints & Data Contracts
- `POST /api/observations/analyze-image` (multipart/form-data)
- `GET /api/observations`
- `PATCH /api/observations/{observation_id}`

#### 4.4 User Interactions
- User drops an image -> UI renders instantaneous thumbnail preview.
- Clicking "Analyze Image" -> Disables button, triggers scanning radar animation.
- Upon 201 Created -> Renders inference result card with status `requires_review`.
- Clicking "Confirm" -> Triggers `PATCH`, displays success toast, updates status badge to `confirmed`, and deep-links to `/campus-twin` to view the update.

#### 4.5 States & Edge Cases
- **Loading:** Pulsing radar scanner animation over image thumbnail; upload progress bar.
- **File Validation Error:** Pre-upload modal rejects file > 8MB or non-image format with explicit guidance.
- **Provider Failure (502/504):** UI displays provider outage banner: "Computer Vision API is currently unreachable. [Toggle Sample Fallback Observation]" allowing the demo to proceed honestly without pretending live inference succeeded.
- **Empty:** If audit queue has no entries, displays: "No active image observations logged."

---

### Page 5: Simulations (`/simulations`) — Sustainability Time Machine

#### 5.1 Purpose
The signature feature of EcoTwin AI. A deterministic modeling workspace where operators configure what-if scenarios (reducing operating hours, repairing leaks, improving waste segregation) and inspect projected resource and financial impacts side-by-side against baseline truth.

#### 5.2 Main Interface Components
- **Scenario Configuration Form (Left Panel):**
  - Resource Selector: `Energy`, `Water`, `Waste`.
  - Target Building: `Library (LIB)`, `Academic Block (ACADEMIC)`, `Student Residence (RESIDENCE)`.
  - Intervention Selector:
    - *Energy:* `Reduce Equipment Operating Hours`, `Lighting Efficiency Retrofit`.
    - *Water:* `Repair Pipe Leakage`, `Low-flow Fixture Replacement`.
    - *Waste:* `Improve Waste Segregation Fraction`, `Bin Placement Optimization`.
  - Dynamic Parameter Inputs with bounds and unit markers:
    - *Energy:* Operating hours reduction (e.g. $14.0 \rightarrow 10.0\text{ hrs/day}$), Constant power load ($\text{kW}$), Days ($30$).
    - *Water:* Leak flow rate ($\text{L/min}$), Leak duration ($\text{mins}$).
    - *Waste:* Total mass ($\text{kg}$), Segregation fraction ($0.0 - 1.0$).
    - *Financial / Tariff:* Electricity tariff ($\$/\text{kWh}$).
  - "Run Deterministic Simulation" Button & "Reset to Baseline" Button.
- **Comparison Workspace (Right Panel):**
  - **Baseline Card:** Baseline consumption value, period, power load, and provenance chip (`Manual / Measured Baseline`).
  - **Scenario Projection Card:** Projected consumption value, new operating parameters, and provenance chip (`Projected Simulation`).
  - **Impact Delta Summary Cards:**
    - Absolute Savings (e.g. $3,000.0\text{ kWh saved}$).
    - Percentage Reduction (e.g. $28.57\%$ reduction).
    - Cost Avoided (e.g. $\$360.00\text{ saved at }\$0.12/\text{kWh}$).
  - **Assumptions Card:** Bulleted list of all parameters, constants, and calculation methods used in the calculation.
  - **Comparative Bar Chart (Recharts):** Grouped bar chart comparing Baseline vs Scenario across energy, cost, and hours.
  - **"Explain with Grok AI" CTA Button:** Sends simulation results to Grok and deep-links to AI Advisor.

#### 5.3 Backend Endpoints & Data Contracts
- `POST /api/simulations/run`
- `GET /api/simulations/{scenario_id}`
- `GET /api/simulations`

#### 5.4 User Interactions
- Sliders and numeric input fields enforce real-time bounds checking (hours cannot exceed 24; segregation fraction cannot exceed 1.0).
- Clicking "Run Simulation" sends request, animates calculation spinner for 300ms, and updates comparison cards.
- Clicking "Reset" clears scenario state and restores clean baseline view.
- Clicking "Explain with Grok AI" transitions to AI Advisor with scenario context pre-loaded.

#### 5.5 States & Edge Cases
- **Loading:** Subtle calculation pulse on comparison cards (< 500ms).
- **Validation Error (422):** Form displays inline red error text under violating inputs (e.g. "Proposed hours must be strictly less than baseline hours").
- **Zero Baseline Protection:** If baseline is 0, percentage reduction displays "N/A" instead of `NaN%` or dividing by zero.
- **Unsaved Changes Warning:** Prompts user if navigating away from an unpersisted scenario.

---

### Page 6: AI Advisor (`/ai-advisor`)

#### 6.1 Purpose
Context-grounded intelligence interface where operators ask questions, review Grok-generated recommendations, understand simulation outcomes, and inspect the exact factual context passed to the language model.

#### 6.2 Main Interface Components
- **Context Grounding Inspector (Collapsible Top Drawer):**
  - Shows the exact campus data sent to Grok (selected building, active observations, simulation savings: $3,000\text{ kWh}$, $\$360.00$).
  - Explains to user: *"Grok reasoning is strictly grounded in the verified data above."*
- **Recommendation Feed / Cards:**
  - Structured recommendation card:
    - Title & Priority Badge (`High`, `Medium`, `Low` with documented priority score).
    - Executive Summary of recommendation.
    - Feasibility & Timeframe (`Immediate`, `1-3 months`).
    - Grounded Impact Citation (referencing exact simulation figures).
    - Suggested Operational Steps (bulleted actionable list).
- **Contextual Campus Query Bar:**
  - Query input: "Ask Grok about campus sustainability..."
  - Pre-set prompt chips: *"Explain Library energy savings"*, *"Prioritize current waste observations"*, *"Recommend weekend setback schedules"*.
- **AI Disclaimer Footer:** Prominently states: *"AI-generated recommendations provide decision support based on supplied campus data. Authoritative engineering calculations are computed deterministically by the simulation engine."*

#### 6.3 Backend Endpoints & Data Contracts
- `POST /api/ai/recommendations`
- `GET /api/observations`
- `GET /api/simulations`

#### 6.4 User Interactions
- Clicking a prompt chip populates query bar and triggers recommendation generation.
- User can toggle between different building scopes (`Campus Wide` vs `Library Only`).
- Clicking "View Linked Scenario" in an AI card navigates directly to the corresponding Sustainability Time Machine scenario.

#### 6.5 States & Edge Cases
- **Loading:** Shimmering violet skeleton cards with animated text: "Grok is analyzing campus context and simulation outputs..."
- **Rate Limit / Timeout (429/503):** Friendly alert card: "Grok AI reasoning service is temporarily rate-limited or unavailable. Deterministic simulation outputs remain available in the Simulations tab. [Retry Query]"
- **Empty:** "No recommendations generated yet. Select a building or simulation scenario to request grounded insights."

---

### Page 7: Reports (`/reports`)

#### 7.1 Purpose
Comprehensive audit and reporting interface that compiles campus telemetry, verified visual observations, executed simulation scenarios, and AI strategic recommendations into an executive-ready sustainability report with full data provenance.

#### 7.2 Main Interface Components
- **Report Configuration Controls:**
  - Scope Selector: `Campus Wide`, `Library`, `Academic Block`, `Student Residence`.
  - Period Selector: `Last 24 Hours`, `Last 7 Days`, `Last 30 Days`.
  - Included Scenarios Checklist: Multi-select checklist of persisted simulations to include in the report.
  - "Generate Sustainability Report" Action Button.
- **Executive Report Document View (Formatted Print-Ready Layout):**
  - Report Header: Document Title, Scope, Generation Timestamp, Author (`EcoTwin Impact Engine`).
  - Section 1: Executive Summary (Grok-synthesized summary of campus state).
  - Section 2: Resource Consumption Audit Table (categorized by Measured vs Simulated totals).
  - Section 3: Physical Observations & Anomaly Register (confirmed vs review-pending issues).
  - Section 4: Simulated Interventions & What-If Outcomes (table of tested scenarios with baseline, savings, and tariffs).
  - Section 5: Strategic Action Plan & Recommendations.
  - Section 6: Provenance, Limitations & Data Governance Statement.
- **Export Action Toolbar:**
  - "Print / Save as PDF" button (using CSS `@media print` print-optimized stylesheet).
  - "Export JSON" button (downloads structured report payload).

#### 7.3 Backend Endpoints & Data Contracts
- `POST /api/ai/reports`
- `GET /api/simulations`
- `GET /api/campus`

#### 7.4 User Interactions
- User selects scope and checks scenario -> clicks "Generate Report".
- Report compiles and displays in clean, formatted typography.
- Clicking "Print / Save as PDF" triggers the browser's native print dialog with headers, clean page breaks, and transparent backgrounds.

#### 7.5 States & Edge Cases
- **Loading:** Document loading skeleton with progress indicator.
- **Empty:** "Configure report parameters above and click 'Generate Report' to synthesize campus data."
- **Error:** If report synthesis fails, UI offers "Load Cached Offline Report Snapshot" to ensure demo continuity.

---

## 5. API Client Architecture & Integration Layer

All network communication is strictly encapsulated inside `frontend/src/services/api/` to avoid scattering raw `fetch` calls across UI components.

```
frontend/src/services/api/
├── client.ts              # Base HTTP fetch wrapper, error normalizer, timeout handling
├── campusApi.ts           # GET /api/campus, GET /api/buildings, GET /api/buildings/{id}
├── sensorApi.ts           # GET .../readings, POST /api/sensors/readings, POST /api/sensors/simulate
├── observationApi.ts      # POST /api/observations/analyze-image, GET /api/observations, PATCH ...
├── simulationApi.ts       # POST /api/simulations/run, GET /api/simulations/{id}, GET /api/simulations
└── aiApi.ts               # POST /api/ai/recommendations, POST /api/ai/reports
```

### 5.1 Base Client Contract (`client.ts`)
- **Base URL:** `/api` (automatically proxied in development via `vite.config.ts` to `http://localhost:8000`).
- **Headers:** Automatically sets `Accept: application/json` and `Content-Type: application/json` (except for `FormData` uploads where the browser sets boundaries).
- **Timeout:** Enforces a 15-second client-side timeout using `AbortController`.
- **Normalized Error Type:**
```typescript
export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, unknown> | null;
}
```

### 5.2 External Provider Failure Strategy
1. **Grok AI Rate Limit / Outage:** The API client catches 429/502/503 responses and returns an `ApiError` with `code: "AI_PROVIDER_UNAVAILABLE"`. The UI suppresses full-page error crashes and displays an inline retry banner in AI Advisor and Report sections while keeping the rest of the application completely functional.
2. **Vision API Failure:** The client returns `code: "VISION_PROVIDER_UNAVAILABLE"`. The Vision Inspector displays a clear error state and presents the user with an option to load a pre-staged fallback observation marked `source="demo_fallback"`.

---

## 6. Frontend Acceptance Criteria

The following objectively verifiable criteria determine whether the frontend implementation satisfies all requirements from `AGENTS.md` and `docs/api-contracts.md`:

| ID | Page / Area | Acceptance Criterion | Verification Method |
|---|---|---|---|
| **FAC-01** | Global Navigation | Persistent navigation bar renders all 7 required views (`Overview`, `Campus Twin`, `Resource Monitoring`, `Vision Inspector`, `Simulations`, `AI Advisor`, `Reports`) and switches routes without full page reload. | Manual click-through and React Router route assertion. |
| **FAC-02** | Design Tokens | Interface strictly adheres to dark charcoal foundation (`slate-950`), cyan primary telemetry (`cyan-500`), and violet AI accent (`violet-500`). Accessible contrast ratio $\ge 4.5:1$ on text. | CSS audit and browser accessibility inspection. |
| **FAC-03** | Overview Dashboard | Overview page loads `/api/campus` and `/api/buildings`, rendering total energy, water, waste, and building cards with explicit units within 1 second. | Visual load test and network payload verification. |
| **FAC-04** | Interactive Campus Map | 2D/2.5D SVG map renders `ACADEMIC`, `LIB`, and `RESIDENCE` with interactive hover states and click events updating building drawer. | Browser interaction test clicking building polygons. |
| **FAC-05** | Provenance Badges | All displayed telemetry and simulation outputs show explicit provenance chips (`Simulated`, `Measured`, `Projected`, `Vision Inference`, `Deterministic Math`). | Visual check across all 7 views verifying badge presence. |
| **FAC-06** | Telemetry Charts | Recharts graphs render hourly time-series data for energy, water, and waste with interactive tooltips displaying timestamps and units. | Hovering over chart data points to verify tooltip formatting. |
| **FAC-07** | Vision Upload & Review | Upload zone accepts image files under 8MB, posts multipart data, displays inference result with initial `requires_review` status, and enables one-click `confirmed` update. | Uploading test image, verifying preview, and executing PATCH status update. |
| **FAC-08** | Time Machine Simulations | Parameter inputs validate bounds; running simulation renders baseline vs projected cards with exact mathematical difference, savings percentage, and assumptions. | Submitting energy simulation ($14\text{h} \rightarrow 10\text{h}$); verifying $3,000\text{ kWh}$ savings display. |
| **FAC-09** | Grok AI Integration | AI Advisor displays grounded recommendations referencing exact simulation outputs ($3,000\text{ kWh}$); context inspector shows data passed to Grok. | Submitting AI query and verifying returned text citations against simulation numbers. |
| **FAC-10** | Report Generation | Reports page compiles executive summary, resource audit table, observation register, and simulation outcomes with clear provenance disclaimer. | Generating report and verifying all 6 standard sections render in print view. |
| **FAC-11** | Failure Resilience | If backend or external AI provider is offline, frontend renders descriptive inline alert cards with retry controls without throwing unhandled React runtime errors. | Simulating network disconnect; verifying error boundary isolation. |
| **FAC-12** | Responsive Layout | All pages render cleanly without horizontal scrollbars across Mobile (375px), Tablet (768px), and Presentation Desktop (1440px). | Chrome DevTools device mode viewport testing. |

---

## 7. Outstanding Decisions & Dependencies

### 7.1 Cross-Module Dependencies on Person 2's Digital Twin, Sensor & Simulation Plan
While frontend UI shells can be prepared using the contracts in `docs/api-contracts.md`, complete UI integration strictly depends on Person 2's module specifications:
1. **Building & Sensor Data Structures:** The frontend Campus Twin and Resource Monitoring pages depend on Person 2 defining the exact list of linked sensors per building (e.g. `ENERGY-LIB-01`, `WATER-LIB-01`), sensor status enums, and operational hour strings in `models/building.py`.
2. **Reading Units & Source Labels:** The Telemetry charts depend on Person 2 enforcing consistent unit strings (`kWh`, `L`, `kg`, `%`) and source tags (`simulated`, `manual`, `real`) so that `<ProvenanceBadge />` components map directly without client-side guessing.
3. **Simulation Request & Response Structures:** The Sustainability Time Machine UI form dynamically renders input sliders and parameter fields based on Person 2's simulation schema for each resource (energy, water, waste). The frontend expects the backend to calculate and return `baseline_value`, `projected_value`, `absolute_savings`, and `percentage_reduction`.
4. **Baseline & Projection Fields:** The comparative bar charts and delta badges rely on Person 2 maintaining separate baseline and scenario projection fields in the simulation response, ensuring baseline database rows are never overwritten.
5. **Observation-to-Building Relationships:** When an operator reviews an observation on the Vision Inspector and selects a building ID, the frontend relies on Person 2's observation model having a foreign key linkage to the building entity so the incident appears immediately in the building's active incident queue.

### 7.2 Decisions Requiring Team Approval
The following frontend decisions remain marked **`[PENDING TEAM APPROVAL]`**:
1. **[PENDING TEAM APPROVAL] Campus Map Graphic Asset:** Confirmation of the final 2D/2.5D SVG vector asset design for the campus grounds. (Recommended: Custom clean isometric SVG with responsive viewBox).
2. **[PENDING TEAM APPROVAL] Provider Demo Mode Toggle:** Confirmation of whether a global `Demo Mode` switch should be visible in the header for hackathon demonstrations when external API quotas are exhausted.
3. **[PENDING TEAM APPROVAL] Currency Display:** Default set to USD ($). Awaiting team confirmation if INR (₹) is preferred for local judging context.

---

## 8. Pre-Implementation Audit Statement

*This document represents the complete Phase 0 frontend architecture and UI specification. In accordance with Phase 0 rules, no React components, CSS files, or dependencies have been generated or modified in the workspace. Implementation will proceed into Phase 1 once team consensus is established.*
