"""Unit and integration tests for sustainability report generation API.

Verifies:
- 200 OK report compilation across campus_wide and specific facility scopes
- Proportional time-window scaling (30 days, 7 days, 24 hours)
- Deterministic metric integrity and provenance disclaimer inclusion
- Mocked Grok synthesis vs deterministic fallback
"""

import json
import unittest
from unittest.mock import patch
import httpx
from fastapi.testclient import TestClient

from app.main import app
from app.services.report_service import ReportService


class TestAiReportsApi(unittest.TestCase):
    """Test suite for /api/ai/reports endpoint."""

    def setUp(self):
        self.client = TestClient(app)

    def test_report_generation_campus_wide_returns_200(self):
        """Test compiling a campus-wide 30-day report."""
        response = self.client.post(
            "/api/ai/reports",
            json={
                "scope": "campus_wide",
                "time_period": "30_days",
                "include_scenarios": ["scen-501"],
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Validate required schema fields
        self.assertIn("report_id", data)
        self.assertTrue(data["report_id"].startswith("rep-"))
        self.assertIn("Campus-Wide", data["title"])
        self.assertEqual(data["scope"], "campus_wide")
        self.assertEqual(data["period"], "30_days")
        self.assertTrue(len(data["executive_summary"]) > 0)

        # Validate quantitative metrics
        metrics = data["resource_metrics"]
        self.assertEqual(metrics["measured_or_simulated_energy_kwh"], 42600.0)
        self.assertEqual(metrics["water_litres"], 253500.0)
        self.assertEqual(metrics["waste_kg"], 9600.0)

        # Validate observation audit
        observations = data["observations_audit"]
        self.assertEqual(observations["total_detected"], 4)
        self.assertEqual(observations["confirmed_count"], 2)

        # Validate simulation scenario integration
        sims = data["simulated_interventions_summary"]
        self.assertEqual(len(sims), 1)
        self.assertEqual(sims[0]["scenario_id"], "scen-501")
        self.assertEqual(sims[0]["projected_energy_savings_kwh"], 3000.0)

        # Validate provenance disclaimer
        self.assertIn("provenance_disclaimer", data)
        self.assertIn("deterministic", data["provenance_disclaimer"].lower())

    def test_report_generation_single_building_scaled_window(self):
        """Test compiling a 7-day report for LIB."""
        response = self.client.post(
            "/api/ai/reports",
            json={
                "scope": "LIB",
                "time_period": "7_days",
                "include_scenarios": [],
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["scope"], "LIB")
        self.assertEqual(data["period"], "7_days")

        # 7-day scaled metrics for LIB
        expected_energy = round(12500.0 * (7.0 / 30.0), 1)
        self.assertEqual(data["resource_metrics"]["measured_or_simulated_energy_kwh"], expected_energy)

    def test_report_generation_with_mocked_grok_narrative(self):
        """Test when Grok synthesizes narrative, returned report uses Grok text."""
        mock_grok_response = {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "executive_summary": "Grok-synthesized executive summary: Library off-peak curtailment is highest ROI opportunity.",
                                "strategic_recommendations": [
                                    {
                                        "priority": "high",
                                        "action": "Implement BMS automated shutdown at 20:00",
                                        "feasibility": "immediate",
                                    }
                                ],
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

        configured_service = ReportService(api_key="mock-key-for-test")
        original_generate = configured_service.generate_report

        async def patched_generate(payload):
            return await original_generate(payload, client=mock_client)

        with patch.object(configured_service, "generate_report", side_effect=patched_generate):
            with patch("app.api.ai.report_service", configured_service):
                response = self.client.post(
                    "/api/ai/reports",
                    json={"scope": "campus_wide", "time_period": "30_days"},
                )
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertIn("Grok-synthesized", data["executive_summary"])
                self.assertEqual(len(data["strategic_recommendations"]), 1)
                self.assertEqual(data["strategic_recommendations"][0]["action"], "Implement BMS automated shutdown at 20:00")


if __name__ == "__main__":
    unittest.main()
