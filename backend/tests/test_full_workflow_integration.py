import io
import json
import unittest
from unittest.mock import patch
import httpx
from fastapi.testclient import TestClient
from app.main import app
from app.services.grok_service import GrokService

class TestFullWorkflowIntegration(unittest.TestCase):
    """
    End-to-end integration tests for the 7 canonical workflow steps:
    Step 1 - Overview Dashboard (GET /api/campus, GET /api/buildings)
    Step 2 - Campus Twin (GET /api/buildings/{id})
    Step 3 - Resource Monitoring (GET /api/buildings/{id}/readings)
    Step 4 - Vision Inspector (POST /api/observations/analyze-image, GET /api/observations, PATCH /api/observations/{id})
    Step 5 - Simulations (POST /api/simulations/run)
    Step 6 - AI Advisor (POST /api/ai/recommendations)
    Step 7 - Reports (POST /api/ai/reports)
    """

    @classmethod
    def setUpClass(cls):
        from app.database import Base, engine, SessionLocal
        from app.seed import seed_database
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        from app.database import engine
        engine.dispose()

    def test_step_1_overview_dashboard_dependencies(self):
        """Step 1: Test GET /api/campus and GET /api/buildings status."""
        campus_res = self.client.get("/api/campus")
        buildings_res = self.client.get("/api/buildings")
        # Person 2 router registration pending (returns 404 cleanly, frontend renders <DependencyNotice>)
        self.assertIn(campus_res.status_code, [200, 404])
        self.assertIn(buildings_res.status_code, [200, 404])

    def test_step_2_campus_twin_dependencies(self):
        """Step 2: Test GET /api/buildings/{id} for LIB, ACADEMIC, RESIDENCE."""
        for b_id in ["LIB", "ACADEMIC", "RESIDENCE"]:
            res = self.client.get(f"/api/buildings/{b_id}")
            self.assertIn(res.status_code, [200, 404])

    def test_step_3_resource_monitoring_dependencies(self):
        """Step 3: Test GET /api/buildings/LIB/readings and POST /api/sensors/simulate."""
        res_readings = self.client.get("/api/buildings/LIB/readings")
        self.assertIn(res_readings.status_code, [200, 404])

        res_sim = self.client.post("/api/sensors/simulate", json={"building_ids": ["LIB"]})
        self.assertIn(res_sim.status_code, [200, 404])

    def test_step_4_vision_inspector_workflow(self):
        """Step 4: Image Upload -> Inference -> Review Status Update."""
        # 1. Upload valid image
        fake_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 100 + b"\xff\xd9"
        upload_res = self.client.post(
            "/api/observations/analyze-image",
            files={"file": ("recycle-check.jpg", io.BytesIO(fake_jpeg), "image/jpeg")},
            data={"building_id": "LIB"},
        )
        self.assertEqual(upload_res.status_code, 201)
        upload_data = upload_res.json()
        self.assertIn("observation_id", upload_data)
        self.assertEqual(upload_data["status"], "requires_review")
        obs_id = upload_data["observation_id"]

        # 2. Retrieve observations
        list_res = self.client.get("/api/observations?building_id=LIB")
        self.assertEqual(list_res.status_code, 200)
        items = list_res.json()
        obs_ids = [item["id"] for item in items]
        self.assertIn(obs_id, obs_ids)

        # 3. Update observation status (human review)
        patch_res = self.client.patch(
            f"/api/observations/{obs_id}",
            json={
                "status": "confirmed",
                "building_id": "LIB",
                "reviewer_note": "Verified during facilities walk-through.",
            },
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.json()["status"], "confirmed")

    def test_step_5_simulations_dependencies(self):
        """Step 5: Test POST /api/simulations/run."""
        payload = {
            "building_id": "LIB",
            "resource_stream": "ENERGY",
            "energy_baseline": {
                "power_kw": 25.0,
                "operating_hours_per_day": 14.0,
                "operating_days": 30.0,
            },
            "energy_intervention": {
                "target_power_kw": 25.0,
                "target_operating_hours_per_day": 10.0,
                "operating_days": 30.0,
            },
        }
        res = self.client.post("/api/simulations/run", json=payload)
        self.assertIn(res.status_code, [200, 201])

    def test_step_6_ai_advisor_workflow(self):
        """Step 6: Test POST /api/ai/recommendations with grounded context."""
        payload = {
            "building_id": "LIB",
            "scenario_id": "scen-501",
            "focus_area": "Explain Library off-peak energy curtailment",
        }

        mock_grok_response = {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "recommendations": [
                                    {
                                        "title": "HVAC and Lighting Schedule Curtailment",
                                        "summary": "Implement automated lighting and HVAC shutdowns at 20:00 instead of 22:00, projected to save 3,000 kWh/month ($360.00).",
                                        "priority": "high",
                                        "priority_score": 8.5,
                                        "priority_reasoning": "High impact on monthly operating expenditure with zero capital cost.",
                                        "suggested_actions": [
                                            "Reprogram BMS timers for floors 2 and 3",
                                            "Deploy custodial checks after 20:00",
                                        ],
                                        "referenced_data": {
                                            "scenario_id": "scen-501",
                                            "projected_savings_kwh": 3000.0,
                                        },
                                    }
                                ]
                            }
                        )
                    }
                }
            ]
        }

        async def mock_handler(request: httpx.Request):
            return httpx.Response(200, json=mock_grok_response)

        mock_transport = httpx.MockTransport(mock_handler)
        mock_client = httpx.AsyncClient(transport=mock_transport)

        configured_service = GrokService(api_key="mock-key-for-test")
        original_get_recs = configured_service.get_recommendations

        async def patched_get_recs(p):
            return await original_get_recs(p, client=mock_client)

        with patch.object(configured_service, "get_recommendations", side_effect=patched_get_recs):
            with patch("app.api.ai.grok_service", configured_service):
                res = self.client.post("/api/ai/recommendations", json=payload)
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertIsInstance(data, list)
                self.assertEqual(len(data), 1)
                self.assertEqual(data[0]["title"], "HVAC and Lighting Schedule Curtailment")
                self.assertEqual(data[0]["provenance_label"], "ai_generated_explanation")
                self.assertEqual(data[0]["priority"], "high")

    def test_step_7_reports_workflow(self):
        """Step 7: Test POST /api/ai/reports."""
        payload = {
            "scope": "campus_wide",
            "time_period": "30_days",
            "include_scenarios": ["scen-501"],
            "target_audience": "Campus Sustainability Committee",
        }
        res = self.client.post("/api/ai/reports", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("report_id", data)
        self.assertIn("executive_summary", data)
        self.assertIn("resource_metrics", data)
        self.assertIn("observations_audit", data)
        self.assertIn("simulated_interventions_summary", data)
        self.assertIn("strategic_recommendations", data)
        self.assertIn("provenance_disclaimer", data)
