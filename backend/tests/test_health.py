"""Automated tests for backend health check and configuration."""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings


class TestHealthAndFoundation(unittest.TestCase):
    """Test suite verifying backend startup and foundational endpoints."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        from app.db.session import engine
        engine.dispose()

    def setUp(self):
        self.client = TestClient(app)

    def test_root_endpoint(self):
        """Root endpoint returns project metadata."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["project"], "EcoTwin AI")
        self.assertEqual(data["status"], "online")

    def test_health_endpoint_success(self):
        """GET /api/health returns HTTP 200 and valid schema."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify schema keys
        self.assertIn("status", data)
        self.assertIn("version", data)
        self.assertIn("timestamp", data)
        self.assertIn("database", data)
        self.assertIn("providers", data)
        
        # Verify provider keys
        self.assertIn("grok_configured", data["providers"])
        self.assertIn("vision_configured", data["providers"])
        
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["database"], "connected")

    def test_cors_configuration(self):
        """OPTIONS request from frontend origin receives CORS headers."""
        response = self.client.options(
            "/api/health",
            headers={
                "Origin": settings.FRONTEND_ORIGIN,
                "Access-Control-Request-Method": "GET",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), settings.FRONTEND_ORIGIN)

    def test_error_envelope_format(self):
        """404 error conforms to the standard error envelope in docs/api-contracts.md."""
        response = self.client.get("/api/nonexistent-endpoint-404")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        
        self.assertIn("error", data)
        self.assertIn("code", data["error"])
        self.assertIn("message", data["error"])
        self.assertEqual(data["error"]["code"], "NOT_FOUND")


if __name__ == "__main__":
    unittest.main()
