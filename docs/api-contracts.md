# EcoTwin AI — REST API Contracts & Schema Specification

> **Document Status:** Phase 0 API Contract  
> **Authority:** Derived directly from [AGENTS.md Section 14](file:///d:/DSU-hackathon/AGENTS.md#L826) and [CLAUDE.md](file:///d:/DSU-hackathon/CLAUDE.md).  
> **Contract Rule:** These schemas define the binding contract between the FastAPI backend and the React frontend. Any modification requires technical lead review and agreement from affected module owners before code changes are made.

---

## 1. Global API Conventions

### 1.1 Base URL & Content Negotiation
- Base API URL: `/api`
- Content Type: `application/json` (unless handling multipart/form-data for image uploads)
- Charset: `UTF-8`

### 1.2 Timestamps & Timezones
- All timestamps must be ISO 8601 formatted strings with explicit timezone offsets:
  `YYYY-MM-DDTHH:MM:SSZ` or `YYYY-MM-DDTHH:MM:SS+05:30` (e.g. `2026-10-15T12:00:00+05:30`).

### 1.3 Standard Error Format
All 4xx and 5xx responses must return a consistent JSON payload:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable explanation of error.",
    "details": null
  }
}
```

### 1.4 Standard Building Identifiers
The prototype enforces three canonical building identifiers:
- `ACADEMIC` — Academic Block
- `LIB` — Library
- `RESIDENCE` — Student Residence

---

## 2. Detailed Endpoint Contracts

### 2.1 System Health
#### `GET /api/health`
- **Purpose:** Verification endpoint for backend liveness, database connectivity, and external provider configuration status.
- **Inputs:** None
- **Outputs (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-10-15T12:00:00+05:30",
  "database": "connected",
  "providers": {
    "grok_configured": true,
    "vision_configured": true
  }
}
```
- **Error Responses:**
  - `503 Service Unavailable`: If database connection fails.

---

### 2.2 Campus & Buildings

#### `GET /api/campus`
- **Purpose:** Campus-wide overview aggregating aggregated resource metrics, active incidents, and general twin state.
- **Inputs:** None
- **Outputs (200 OK):**
```json
{
  "campus_name": "EcoTwin Campus Digital Twin",
  "buildings_count": 3,
  "summary_period": "last_24_hours",
  "metrics": {
    "total_energy_kwh": 1420.5,
    "total_water_litres": 8450.0,
    "total_waste_kg": 320.0,
    "waste_segregation_percent": 68.5
  },
  "status_summary": {
    "active_observations_count": 4,
    "requires_review_count": 2,
    "confirmed_issues_count": 2
  },
  "provenance": {
    "energy": "simulated",
    "water": "simulated",
    "waste": "simulated"
  },
  "last_updated": "2026-10-15T12:00:00+05:30"
}
```
- **Error Responses:**
  - `500 Internal Server Error`: Aggregation calculation failure.

---

#### `GET /api/buildings`
- **Purpose:** Retrieve the list of all campus buildings with summary metrics and current statuses.
- **Inputs:** None
- **Outputs (200 OK):**
```json
[
  {
    "id": "LIB",
    "name": "Library",
    "building_type": "academic_facility",
    "metrics": {
      "energy_consumption_kwh": 340.2,
      "water_volume_litres": 1200.0,
      "waste_fill_level_percent": 82.0
    },
    "aggregation_period": "last_24_hours",
    "active_issues_count": 1,
    "requires_review_count": 1,
    "updated_at": "2026-10-15T12:00:00+05:30"
  },
  {
    "id": "ACADEMIC",
    "name": "Academic Block",
    "building_type": "classrooms_and_labs",
    "metrics": {
      "energy_consumption_kwh": 650.0,
      "water_volume_litres": 3100.0,
      "waste_fill_level_percent": 45.0
    },
    "aggregation_period": "last_24_hours",
    "active_issues_count": 1,
    "requires_review_count": 0,
    "updated_at": "2026-10-15T12:00:00+05:30"
  },
  {
    "id": "RESIDENCE",
    "name": "Student Residence",
    "building_type": "residential",
    "metrics": {
      "energy_consumption_kwh": 430.3,
      "water_volume_litres": 4150.0,
      "waste_fill_level_percent": 60.0
    },
    "aggregation_period": "last_24_hours",
    "active_issues_count": 0,
    "requires_review_count": 1,
    "updated_at": "2026-10-15T12:00:00+05:30"
  }
]
```

---

#### `GET /api/buildings/{building_id}`
- **Purpose:** Retrieve comprehensive single-building digital twin representation, including sensors, recent readings summary, and active observations.
- **Inputs:**
  - Path parameter: `building_id` (string, must be one of `ACADEMIC`, `LIB`, `RESIDENCE`)
- **Outputs (200 OK):**
```json
{
  "id": "LIB",
  "name": "Library",
  "building_type": "academic_facility",
  "operational_hours": "08:00 - 22:00",
  "baseline_metrics": {
    "energy_daily_kwh": 340.2,
    "water_daily_litres": 1200.0,
    "waste_daily_kg": 85.0
  },
  "sensors": [
    {
      "id": "ENERGY-LIB-01",
      "metric": "energy_consumption",
      "unit": "kWh",
      "status": "online",
      "source": "simulated"
    },
    {
      "id": "WATER-LIB-01",
      "metric": "water_volume",
      "unit": "L",
      "status": "online",
      "source": "simulated"
    }
  ],
  "active_observations": [
    {
      "id": "obs-101",
      "observation_type": "waste_accumulation",
      "description": "Overflowing paper waste bin near 2nd floor study hall",
      "status": "requires_review",
      "source": "image_analysis",
      "created_at": "2026-10-15T11:30:00+05:30"
    }
  ],
  "updated_at": "2026-10-15T12:00:00+05:30"
}
```
- **Error Responses:**
  - `404 Not Found`: If `building_id` does not match known buildings.

---

#### `GET /api/buildings/{building_id}/readings`
- **Purpose:** Retrieve historical sensor telemetry points for a building for chart rendering.
- **Inputs:**
  - Path parameter: `building_id` (string, required)
  - Query parameters:
    - `metric` (optional string: `energy_consumption`, `water_volume`, `waste_fill_level`, `waste_weight`)
    - `limit` (optional integer, default `50`, max `500`)
- **Outputs (200 OK):**
```json
{
  "building_id": "LIB",
  "metric_filtered": "energy_consumption",
  "readings_count": 2,
  "readings": [
    {
      "id": "read-201",
      "sensor_id": "ENERGY-LIB-01",
      "metric": "energy_consumption",
      "value": 32.5,
      "unit": "kWh",
      "timestamp": "2026-10-15T10:00:00+05:30",
      "source": "simulated"
    },
    {
      "id": "read-202",
      "sensor_id": "ENERGY-LIB-01",
      "metric": "energy_consumption",
      "value": 31.8,
      "unit": "kWh",
      "timestamp": "2026-10-15T11:00:00+05:30",
      "source": "simulated"
    }
  ]
}
```
- **Error Responses:**
  - `400 Bad Request`: Invalid metric or invalid query limit.
  - `404 Not Found`: Unknown `building_id`.

---

### 2.3 Sensor Ingestion & Telemetry Generation

#### `POST /api/sensors/readings`
- **Purpose:** Ingest one or more validated sensor readings. Demonstrates path to physical IoT integration.
- **Inputs (Request Body JSON):**
```json
{
  "sensor_id": "ENERGY-LIB-01",
  "building_id": "LIB",
  "metric": "energy_consumption",
  "value": 34.2,
  "unit": "kWh",
  "timestamp": "2026-10-15T12:00:00+05:30",
  "source": "manual"
}
```
- **Validation Rules:**
  - `building_id`: Must match an active building.
  - `metric`: Permitted enums: `energy_consumption`, `water_volume`, `waste_weight`, `waste_fill_level`.
  - `value`: Finite float, non-negative ($0 \le \text{value} \le 100000$). Reject NaN and infinity.
  - `unit`: Must match metric (`energy_consumption` -> `kWh`, `water_volume` -> `L` or `m3`, `waste_weight` -> `kg`, `waste_fill_level` -> `%`).
  - `source`: Must be `real`, `manual`, or `simulated`.
- **Outputs (201 Created):**
```json
{
  "id": "read-305",
  "sensor_id": "ENERGY-LIB-01",
  "building_id": "LIB",
  "metric": "energy_consumption",
  "value": 34.2,
  "unit": "kWh",
  "timestamp": "2026-10-15T12:00:00+05:30",
  "source": "manual",
  "status": "ingested"
}
```
- **Error Responses:**
  - `422 Unprocessable Entity`: Schema/unit validation failure.
  - `404 Not Found`: Unknown `building_id`.

---

#### `POST /api/sensors/simulate`
- **Purpose:** Generate a batch of deterministic or bounded pseudo-random simulated telemetry for campus sensors.
- **Inputs (Request Body JSON):**
```json
{
  "building_ids": ["ACADEMIC", "LIB", "RESIDENCE"],
  "metrics": ["energy_consumption", "water_volume"],
  "points_per_metric": 6
}
```
*(All fields optional with sensible defaults).*
- **Outputs (200 OK):**
```json
{
  "generated_count": 36,
  "status": "simulated",
  "source": "simulated",
  "message": "Generated 36 simulated sensor readings across 3 buildings."
}
```
- **Error Responses:**
  - `422 Unprocessable Entity`: Invalid building ID or metric parameter.

---

### 2.4 Computer Vision & Observations

#### `POST /api/observations/analyze-image`
- **Purpose:** Accept image upload, run dedicated Computer Vision inference, normalize output, and create a review-pending observation.
- **Inputs:**
  - `Content-Type: multipart/form-data`
  - Form Fields:
    - `file`: Binary image file (JPEG, PNG, WebP; max `MAX_IMAGE_UPLOAD_MB`).
    - `building_id` (optional string): Candidate building association (e.g. `LIB`).
- **Validation Rules:**
  - File extension and MIME validation (`image/jpeg`, `image/png`, `image/webp`).
  - Payload size under limit.
- **Outputs (201 Created):**
```json
{
  "observation_id": "obs-401",
  "building_id": "LIB",
  "observation_type": "waste_accumulation",
  "description": "Visible accumulation of cardboard and packaging outside entrance bins.",
  "status": "requires_review",
  "source": "image_analysis",
  "image_url": "/api/static/uploads/obs-401.jpg",
  "provider_metadata": {
    "provider": "dedicated-cv-provider",
    "model": "cv-sustainability-v1",
    "certainty_level": "medium",
    "detected_labels": ["cardboard", "overflowing_bin"]
  },
  "created_at": "2026-10-15T12:05:00+05:30"
}
```
- **Error Responses:**
  - `400 Bad Request`: Invalid image file or corrupted bytes.
  - `413 Payload Too Large`: Exceeds file upload limit.
  - `502 Bad Gateway`: Computer Vision external provider communication failure.

---

#### `GET /api/observations`
- **Purpose:** List observations, with optional status and building filters.
- **Inputs (Query Parameters):**
  - `building_id` (optional string)
  - `status` (optional string: `requires_review`, `confirmed`, `dismissed`, `resolved`)
  - `source` (optional string: `image_analysis`, `sensor_rule`, `manual`)
- **Outputs (200 OK):**
```json
[
  {
    "id": "obs-401",
    "building_id": "LIB",
    "observation_type": "waste_accumulation",
    "description": "Visible accumulation of cardboard and packaging outside entrance bins.",
    "status": "requires_review",
    "source": "image_analysis",
    "image_url": "/api/static/uploads/obs-401.jpg",
    "certainty_level": "medium",
    "created_at": "2026-10-15T12:05:00+05:30",
    "reviewed_at": null
  }
]
```

---

#### `PATCH /api/observations/{observation_id}`
- **Purpose:** Review and update observation status or assign/correct building location.
- **Inputs:**
  - Path parameter: `observation_id` (string, required)
  - Request Body JSON:
```json
{
  "status": "confirmed",
  "building_id": "LIB",
  "reviewer_note": "Confirmed during physical inspection by facilities team."
}
```
- **Validation Rules:**
  - `status`: Allowed values: `requires_review`, `confirmed`, `dismissed`, `resolved`.
- **Outputs (200 OK):**
```json
{
  "id": "obs-401",
  "building_id": "LIB",
  "observation_type": "waste_accumulation",
  "description": "Visible accumulation of cardboard and packaging outside entrance bins.",
  "status": "confirmed",
  "reviewer_note": "Confirmed during physical inspection by facilities team.",
  "reviewed_at": "2026-10-15T12:08:00+05:30"
}
```
- **Error Responses:**
  - `404 Not Found`: If `observation_id` does not exist.
  - `422 Unprocessable Entity`: Invalid status transition.

---

### 2.5 Sustainability Time Machine Simulations

#### `POST /api/simulations/run`
- **Purpose:** Execute a deterministic mathematical simulation comparing a baseline campus/building state against a proposed intervention.
- **Inputs (Request Body JSON):**
```json
{
  "building_id": "LIB",
  "resource_type": "energy",
  "intervention": "reduce_operating_hours",
  "baseline": {
    "power_kw": 25.0,
    "operating_hours_per_day": 14.0,
    "operating_days": 30.0,
    "baseline_energy_kwh": 10500.0
  },
  "parameters": {
    "proposed_hours_per_day": 10.0,
    "electricity_tariff_per_kwh": 0.12
  }
}
```
- **Validation Rules:**
  - `resource_type`: Must be `energy`, `water`, or `waste`.
  - Non-negative parameter values; no division by zero allowed.
  - Segregation fractions must be strictly in $[0, 1]$.
- **Outputs (200 OK):**
```json
{
  "scenario_id": "scen-501",
  "building_id": "LIB",
  "resource_type": "energy",
  "intervention": "reduce_operating_hours",
  "baseline_value": 10500.0,
  "projected_value": 7500.0,
  "unit": "kWh",
  "absolute_savings": 3000.0,
  "percentage_reduction": 28.57,
  "estimated_cost_savings": 360.0,
  "currency": "USD",
  "assumptions": [
    "Constant aggregate power load of 25.0 kW",
    "Operating hours reduced from 14.0 to 10.0 hrs/day over 30 days",
    "Electricity tariff assumed at $0.12 per kWh"
  ],
  "calculation_method": "deterministic_formula_v1",
  "provenance_label": "projected_simulation",
  "created_at": "2026-10-15T12:10:00+05:30"
}
```
- **Error Responses:**
  - `422 Unprocessable Entity`: Parameter bounds or formula constraint violation.
  - `404 Not Found`: Unknown `building_id`.

---

#### `GET /api/simulations/{scenario_id}`
- **Purpose:** Retrieve a previously executed and persisted simulation scenario.
- **Inputs:**
  - Path parameter: `scenario_id` (string, required)
- **Outputs (200 OK):**
  - Returns the exact `SimulationResponse` payload as defined in `POST /api/simulations/run`.
- **Error Responses:**
  - `404 Not Found`: Scenario ID not found.

---

#### `GET /api/simulations`
- **Purpose:** Retrieve list of historical/saved simulation scenarios for comparison.
- **Inputs (Query Parameters):**
  - `building_id` (optional string)
  - `resource_type` (optional string)
- **Outputs (200 OK):** Array of `SimulationResponse` objects.

---

### 2.6 Grok-Powered AI Intelligence

#### `POST /api/ai/recommendations`
- **Purpose:** Ask Grok to generate grounded, context-aware recommendations explaining current observations, simulation results, or campus resource states.
- **Inputs (Request Body JSON):**
```json
{
  "building_id": "LIB",
  "scenario_id": "scen-501",
  "observation_ids": ["obs-401"],
  "focus_area": "energy_and_waste"
}
```
- **Outputs (200 OK):**
```json
{
  "recommendation_id": "rec-601",
  "building_id": "LIB",
  "title": "HVAC and Lighting Schedule Curtailment",
  "summary": "Implement automated lighting and HVAC shutdowns at 20:00 instead of 22:00, projected to save 3,000 kWh/month ($360.00).",
  "priority": "high",
  "priority_score": 8.5,
  "priority_reasoning": "High impact on monthly operating expenditure with zero capital cost; reinforces active library conservation initiative.",
  "suggested_actions": [
    "Reprogram BMS timers for floors 2 and 3",
    "Deploy custodial checks after 20:00 to verify peripheral electronics are shut off"
  ],
  "referenced_data": {
    "scenario_id": "scen-501",
    "projected_savings_kwh": 3000.0,
    "observation_count": 1
  },
  "provenance_label": "ai_generated_explanation",
  "created_at": "2026-10-15T12:12:00+05:30"
}
```
- **Error Responses:**
  - `503 Service Unavailable`: Grok API rate limit, timeout, or invalid key.
  - `422 Unprocessable Entity`: Invalid request parameters or failure to parse Grok JSON schema.

---

#### `POST /api/ai/reports`
- **Purpose:** Generate a complete, authoritative sustainability report grounded in actual campus telemetry, observations, and completed simulations.
- **Inputs (Request Body JSON):**
```json
{
  "scope": "campus_wide",
  "time_period": "30_days",
  "include_scenarios": ["scen-501"],
  "target_audience": "Campus Sustainability Committee"
}
```
- **Outputs (200 OK):**
```json
{
  "report_id": "rep-701",
  "title": "Campus Sustainability Intelligence & Intervention Audit",
  "scope": "campus_wide",
  "period": "30_days",
  "executive_summary": "Overall campus resource usage remains stable, with major efficiency opportunities identified in the Library's off-peak energy curtailment and recycling segregation.",
  "resource_metrics": {
    "measured_or_simulated_energy_kwh": 42600.0,
    "water_litres": 253500.0,
    "waste_kg": 9600.0
  },
  "observations_audit": {
    "total_detected": 4,
    "confirmed_count": 2,
    "resolved_count": 1,
    "under_review_count": 1
  },
  "simulated_interventions_summary": [
    {
      "scenario_id": "scen-501",
      "building_id": "LIB",
      "projected_energy_savings_kwh": 3000.0,
      "projected_cost_savings": 360.0
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
  "generated_at": "2026-10-15T12:15:00+05:30"
}
```
- **Error Responses:**
  - `503 Service Unavailable`: External Grok API connectivity failure.
  - `500 Internal Server Error`: Assembly or validation error during report compilation.

---

## 3. Team Agreement Decisions for Contracts

The following details are formally designated for team consensus:
1. **Currency Representation:** Proposed as USD (`currency="USD"`). Team can adjust to INR if preferred for local context.
2. **Emissions Factor Standard:** Propose omitting automated emissions calculations unless grid emissions factor is explicitly passed in simulation request body to prevent misleading figures.
3. **Observation Image Storage Route:** Propose `/api/static/uploads/{filename}` as the serving endpoint for locally stored prototype images.
