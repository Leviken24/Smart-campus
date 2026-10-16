import io
import json
import unittest
from unittest.mock import patch
import httpx
from fastapi.testclient import TestClient
from app.main import app
from app.services.grok_service import GrokService

class TestFailureHandling(unittest.TestCase):
    """
    Automated verification of edge-case and failure handling scenarios:
    - 404 for missing/unimplemented endpoints
    - 400 for corrupt/invalid image files
    - 404 for updating non-existent observation
    - 503 for unconfigured Grok API
    - 503 for upstream Grok API transport failure / timeout
    - 422 for malformed payloads with invalid types
    """

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app, raise_server_exceptions=False)

    def test_missing_endpoint_returns_structured_404(self):
        """Unimplemented or missing endpoints return standardized JSON 404 envelope."""
        res = self.client.get("/api/nonexistent-route-for-testing")
        self.assertEqual(res.status_code, 404)
        data = res.json()
        self.assertIn("error", data)
        self.assertEqual(data["error"]["code"], "NOT_FOUND")

    def test_empty_image_upload_returns_400(self):
        """Empty or 0-byte image file is rejected with 400 Bad Request."""
        res = self.client.post(
            "/api/observations/analyze-image",
            files={"file": ("empty.jpg", io.BytesIO(b""), "image/jpeg")},
        )
        self.assertEqual(res.status_code, 400)
        data = res.json()
        self.assertIn("error", data)

    def test_corrupt_magic_bytes_rejected(self):
        """Text file renamed to .png fails magic byte inspection."""
        fake_png = b"This is plain ASCII text pretending to be a PNG."
        res = self.client.post(
            "/api/observations/analyze-image",
            files={"file": ("spoof.png", io.BytesIO(fake_png), "image/png")},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("magic bytes", res.json()["error"]["message"].lower())

    def test_observation_update_invalid_id_returns_404(self):
        """Updating non-existent observation returns 404 with NOT_FOUND code."""
        res = self.client.patch(
            "/api/observations/obs-missing-99999",
            json={"status": "confirmed", "reviewer_note": "Invalid update"},
        )
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.json()["error"]["code"], "NOT_FOUND")

    def test_recommendations_without_key_returns_503(self):
        """When XAI_API_KEY is not set, recommendations endpoint returns 503."""
        service = GrokService(api_key=None)
        with patch("app.api.ai.grok_service", service):
            res = self.client.post("/api/ai/recommendations", json={"building_id": "LIB"})
            self.assertEqual(res.status_code, 503)
            self.assertEqual(res.json()["error"]["code"], "PROVIDER_UNAVAILABLE")

    def test_recommendations_upstream_timeout_returns_503(self):
        """When Grok API times out or fails with connection error, returns 503 Service Unavailable."""
        service = GrokService(api_key="valid-test-key")

        async def timeout_handler(request: httpx.Request):
            raise httpx.ConnectTimeout("Connection to api.x.ai timed out")

        transport = httpx.MockTransport(timeout_handler)
        mock_client = httpx.AsyncClient(transport=transport)

        original_get_recs = service.get_recommendations
        async def patched_get_recs(payload):
            return await original_get_recs(payload, client=mock_client)

        with patch.object(service, "get_recommendations", side_effect=patched_get_recs):
            with patch("app.api.ai.grok_service", service):
                res = self.client.post("/api/ai/recommendations", json={"building_id": "LIB"})
                self.assertEqual(res.status_code, 503)
                self.assertEqual(res.json()["error"]["code"], "PROVIDER_UNAVAILABLE")

    def test_report_generation_with_malformed_type_returns_422(self):
        """Report endpoint returns 422 when payload fields have invalid types."""
        res = self.client.post("/api/ai/reports", json={"include_scenarios": "invalid-should-be-list"})
        self.assertEqual(res.status_code, 422)

    def test_cors_preflight_origin(self):
        """CORS preflight request responds with permitted origin and headers."""
        res = self.client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("access-control-allow-origin"), "http://localhost:5173")

    def test_unhandled_500_does_not_leak_stack_trace_or_secrets(self):
        """Unhandled exceptions return a sanitized 500 JSON envelope without sensitive details or stack traces."""
        service = GrokService(api_key="valid-key")
        with patch.object(service, "get_recommendations", side_effect=Exception("Sensitive DB trace: pass=secret123 at line 40")):
            with patch("app.api.ai.grok_service", service):
                res = self.client.post("/api/ai/recommendations", json={"building_id": "LIB"})
                self.assertEqual(res.status_code, 500)
                data = res.json()
                self.assertIn("error", data)
                self.assertEqual(data["error"]["code"], "INTERNAL_SERVER_ERROR")
                self.assertNotIn("secret123", json.dumps(data))
                self.assertNotIn("Traceback", json.dumps(data))
                self.assertIsNone(data["error"]["details"])

    def test_settings_cors_and_configuration(self):
        """Settings properly parses comma-separated origins and checks provider configuration flags."""
        from app.core.config import Settings
        s = Settings(
            FRONTEND_ORIGIN="http://localhost:5173,https://ecotwin.campus.edu",
            XAI_API_KEY=None,
            VISION_PROVIDER="mock",
        )
        self.assertEqual(len(s.cors_origins), 2)
        self.assertIn("https://ecotwin.campus.edu", s.cors_origins)
        self.assertFalse(s.is_grok_configured)
        self.assertTrue(s.is_vision_configured)

