# EcoTwin AI — Final Hackathon Demonstration Runbook

**Project:** EcoTwin AI — AI-Powered Sustainable Campus Intelligence  
**Role:** Technical Lead & Frontend Lead (Combined Person 1 + Person 3 Workstream)  
**Version:** 1.0.0 (Production / Demo Candidate)  
**Status:** Verified & Protected

---

## 1. Prerequisites & Environment Setup

Before launching the demonstration, ensure the following tools are available on the presentation machine:

- **Python:** 3.10 to 3.14 with `pip`
- **Node.js:** 18.x or 20.x with `npm`
- **Web Browser:** Google Chrome, Microsoft Edge, or Mozilla Firefox (minimum viewport $1280 \times 800$ recommended)
- **Local Network Ports:**
  - `8000`: FastAPI Backend
  - `5173`: React / Vite Frontend Dev Server

---

## 2. Environment Variables Configuration

The backend reads configuration from `.env` in the repository root or `backend/.env`.

```env
# Application Environment
APP_ENV=development

# Database Persistence (Local SQLite)
DATABASE_URL=sqlite:///./ecotwin.db

# Frontend Origin for CORS
FRONTEND_ORIGIN=http://localhost:5173

# xAI Grok API Configuration (Backend-only)
# Optional: If unconfigured, backend automatically compiles deterministic audit reports
XAI_API_KEY=
XAI_MODEL=grok-beta

# Dedicated Computer Vision Provider
VISION_PROVIDER=mock
VISION_API_KEY=
VISION_MODEL=waste-detection-v1

# Upload Constraints
MAX_IMAGE_UPLOAD_MB=8
```

> [!NOTE]
> **No Exposed Secrets:** External provider API keys (`XAI_API_KEY`) are accessed strictly server-side by the FastAPI backend and are never sent or bundled into the frontend.

---

## 3. Exact Startup Commands

Open two separate terminal windows or tabs:

### Terminal 1: Backend API (FastAPI)
```bash
# Navigate to backend directory
cd d:/DSU-hackathon/backend

# Launch Uvicorn ASGI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Expected Terminal Output:*
```text
INFO: Starting EcoTwin AI backend service (Environment: development)...
INFO: Database connection successfully verified (sqlite:///./ecotwin.db).
INFO: Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Terminal 2: Frontend UI (React + Vite)
```bash
# Navigate to frontend directory
cd d:/DSU-hackathon/frontend

# Launch Vite development server
npm run dev
```
*Expected Terminal Output:*
```text
  VITE v5.4.21  ready in 320 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 4. Pre-Demo Health Check Verification

Before inviting judges or opening the live presentation tab:

1. **Verify Backend Health:**
   Open a browser or terminal and check:
   ```bash
   curl http://localhost:8000/api/health
   ```
   *Expected Response (HTTP 200):*
   ```json
   {
     "status": "healthy",
     "version": "1.0.0",
     "database": "connected",
     "providers": {
       "grok_configured": false,
       "vision_configured": true
     }
   }
   ```
2. **Open Frontend:**
   Navigate to `http://localhost:5173/`.
   Check the navbar indicator in the top right: It should display a green badge reading **"API Online"** (connected to FastAPI v1.0.0).

---

## 5. Step-by-Step Demonstration Sequence (7-Minute Presentation)

### Step 1: Campus Sustainability Overview & Navigation (1 Minute)
- **Action:** Open `http://localhost:5173/` (Overview Dashboard).
- **Showcase:**
  - Executive KPI summary cards: Energy Consumption (kWh), Water Volume (L), Waste Generation (kg), and Campus Sustainability Index.
  - Transparent data provenance badges (`simulated`, `calculated`, `ai_generated`).
  - Active facility summary cards: **Academic Block (`ACADEMIC`)**, **Library (`LIB`)**, and **Student Residence (`RESIDENCE`)**.
- **Talking Point:** *"EcoTwin AI is a connected intelligence system distinguishing verified sensor facts from simulations, observations, and AI explanations."*

---

### Step 2: Interactive Campus Twin (1.5 Minutes)
- **Action:** Click **"Campus Twin"** in the top navigation or click on the **Library** card.
- **Showcase:**
  - **2.5D Isometric SVG Map:** Notice the spatial layout of `ACADEMIC`, `LIB`, and `RESIDENCE`.
  - **Interactive Building Selection:** Click on **Library** to inspect facility details (operating hours, baseline energy $340.2\text{ kWh}$, water $1,200\text{ L}$, waste $85\text{ kg}$).
  - **Layer Filtering:** Toggle between **Energy**, **Water**, and **Waste** layers on the top map control.
  - **Live Observation Markers:** Point out visual incident pins directly anchored onto building coordinates.
- **Talking Point:** *"The Digital Twin provides a unified spatial view combining telemetry with real-time visual observations from the field."*

---

### Step 3: Vision Inspector — Image Analysis to Human Review (1.5 Minutes)
- **Action:** Click **"Vision Inspector"** in the navigation bar.
- **Showcase:**
  - Select **Library (`LIB`)** as candidate facility.
  - Drag and drop or browse for `data/sample_images/waste_accumulation_sample.jpg`.
  - Click **"Analyze Image with Computer Vision"**.
  - **Live Inference Result:** An observation card appears with type `WASTE_ACCUMULATION`, detected labels (`cardboard`, `overflowing_bin`), and critical initial status: **`requires_review`**.
  - **Human-in-the-Loop Review:** Add a reviewer note: *"Custodial team alerted to entrance bins"*, then click **"Confirm & Publish to Digital Twin"**.
  - **Instant Twin Synchronization:** The observation transitions to `CONFIRMED` and immediately registers in the observations register.
  - *(Optional Security Demo):* Attempt to upload `data/sample_images/invalid_file.txt` $\to$ rejected instantly with **400 Bad Request** magic bytes validation error.
- **Talking Point:** *"Our constitutional principle: model predictions are observations, not facts. High-stakes campus interventions require human-in-the-loop validation before updating the digital twin."*

---

### Step 4: Sustainability Time Machine — Signature Feature (1.5 Minutes)
- **Action:** Click **"Simulations"** in the navigation bar.
- **Showcase:**
  - Select **Library (`LIB`)**, Resource **Energy**, and Intervention **Operating Hours Curtailment**.
  - Adjust slider: Reduce daily operating schedule by $-2.0\text{ hours/day}$ (from 14.0 hrs to 12.0 hrs).
  - Click **"Run Simulation"**.
  - **Tab 1 — Comparative Impact:** View side-by-side Recharts comparative bar chart displaying baseline ($340.2\text{ kWh/day}$) vs projected ($291.6\text{ kWh/day}$), showing $-14.3\%$ reduction and $\$175.00/\text{mo}$ projected cost savings.
  - **Tab 2 — 30-Day Trajectory:** Click tab 2 to view the cumulative 30-day savings trajectory AreaChart (projected cumulative savings of $1,458\text{ kWh}$).
  - **Tab 3 — Engineering Assumptions:** Click tab 3 to demonstrate transparency—inspect the exact deterministic formula, baseline operational hours, and commercial electricity tariff ($\$0.12/\text{kWh}$).
- **Talking Point:** *"The Sustainability Time Machine allows facility directors to test hypothetical operational policies deterministically before investing capital."*

---

### Step 5: Grok AI Advisor — Grounded Prioritization (1 Minute)
- **Action:** Click **"AI Advisor"** in the navigation.
- **Showcase:**
  - Select **Library (`LIB`)** and linked scenario citation.
  - In the focus area, enter: *"Provide top prioritized actions to achieve the 14% energy reduction."*
  - Click **"Generate Grounded Recommendations"**.
  - **Priority Scoring:** Grok returns structured, prioritized action cards with priority score ($8.5/10$), grounded rationale, and implementation steps.
  - **Transparent Evidence Grounding:** Citations directly reference verified observations and deterministic simulation outputs.
- **Talking Point:** *"Grok is not used as a generic chatbot—it is strictly grounded on verified building telemetry and deterministic simulation numbers."*

---

### Step 6: Executive Sustainability Report Generation (0.5 Minutes)
- **Action:** Click **"Reports"** in the navigation.
- **Showcase:**
  - Select Scope: **Campus-Wide**, Period: **30 Days**, Audience: **Campus Sustainability Committee**.
  - Click **"Generate Executive Report"**.
  - **Complete Audit Document:** Renders executive summary, resource metrics audit, visual observations audit, deterministic simulation summaries, and strategic recommendations.
  - Click **"Print / Export PDF"** $\to$ triggers clean print preview formatted for campus executives.
- **Talking Point:** *"From a raw photograph to an executive-ready campus sustainability report in a seamless, verifiable pipeline."*

---

## 6. Live Fallbacks for External Provider Outages

| Failure Scenario | Automatic System Behavior | Presenter Talking Point |
|---|---|---|
| **No xAI API Key Configured** | Backend automatically compiles a comprehensive deterministic audit report and fallback recommendations without crashing. | *"Notice our graceful degradation: Even without external Grok connectivity, our deterministic calculation engine compiles the complete audit report."* |
| **xAI Grok API Timeout / Rate Limit** | Backend returns HTTP 503 `PROVIDER_UNAVAILABLE` with a clear user notice in the AI Advisor; no fake text is generated. | *"The platform adheres strictly to data honesty: when third-party APIs experience downtime, we display clear provider notices rather than faking insights."* |
| **Backend Unreachable** | Frontend navbar displays red "API Offline" badge; individual components display structured `<DependencyNotice>` cards with retry buttons. | *"Our frontend architecture uses defensive error boundaries and non-blocking dependency notices."* |

---

## 7. Post-Demo Reset Procedure

To reset the demonstration state cleanly for the next judging panel:

1. In Terminal 1 (Backend), press `Ctrl+C` to stop Uvicorn.
2. Restart Uvicorn:
   ```bash
   python -m uvicorn app.main:app --port 8000 --reload
   ```
   *(Note: The vision service re-seeds the default baseline observation `obs-401` on startup)*.
3. In browser, refresh `http://localhost:5173/` (`Ctrl+F5`).
