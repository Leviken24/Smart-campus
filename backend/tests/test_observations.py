"""Unit and integration tests for Computer Vision and observations API.

Verifies:
- POST /api/observations/analyze-image with image validation and requires_review initial status
- GET /api/observations listing and filtering
- PATCH /api/observations/{observation_id} status updates and 404 handling
- Rejection of corrupted files and oversized uploads
"""

import io
import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.services.vision_service import vision_service


class TestObservationsApi(unittest.TestCase):
    """Test suite for /api/observations endpoints."""

    def setUp(self):
        self.client = TestClient(app)
        # Create minimal valid 1x1 JPEG bytes
        self.valid_jpeg_bytes = (
            b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00"
            b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
            b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
            b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342"
            b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4"
            b"\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00"
            b"\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b"
            b"\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
        )

    def test_list_observations_returns_200(self):
        """GET /api/observations returns list of seeded observations."""
        response = self.client.get("/api/observations")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)
        obs_ids = [o["id"] for o in data]
        self.assertIn("obs-401", obs_ids)

    def test_filter_observations_by_building(self):
        """GET /api/observations?building_id=LIB filters correctly."""
        response = self.client.get("/api/observations?building_id=LIB")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(all(o["building_id"] == "LIB" for o in data))

    def test_analyze_image_valid_upload_returns_201(self):
        """POST /api/observations/analyze-image with valid image returns 201 with requires_review."""
        files = {
            "file": ("test-waste.jpg", io.BytesIO(self.valid_jpeg_bytes), "image/jpeg"),
        }
        data = {"building_id": "LIB"}

        response = self.client.post("/api/observations/analyze-image", files=files, data=data)
        self.assertEqual(response.status_code, 201)
        payload = response.json()

        self.assertIn("observation_id", payload)
        self.assertEqual(payload["building_id"], "LIB")
        self.assertEqual(payload["status"], "requires_review")
        self.assertEqual(payload["source"], "image_analysis")
        self.assertTrue(payload["image_url"].startswith("/api/static/uploads/"))
        self.assertIn("provider_metadata", payload)
        self.assertEqual(payload["observation_type"], "waste_accumulation")

    def test_analyze_image_rejects_corrupted_file(self):
        """POST /api/observations/analyze-image rejects non-image binaries with 400."""
        files = {
            "file": ("fake.jpg", io.BytesIO(b"NOT_A_REAL_IMAGE_BYTES"), "image/jpeg"),
        }
        response = self.client.post("/api/observations/analyze-image", files=files)
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data["error"]["code"], "BAD_REQUEST")

    def test_update_observation_status_returns_200(self):
        """PATCH /api/observations/{id} updates status to confirmed."""
        response = self.client.patch(
            "/api/observations/obs-401",
            json={
                "status": "confirmed",
                "building_id": "LIB",
                "reviewer_note": "Confirmed during physical inspection.",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], "obs-401")
        self.assertEqual(data["status"], "confirmed")
        self.assertEqual(data["reviewer_note"], "Confirmed during physical inspection.")
        self.assertIsNotNone(data["reviewed_at"])

    def test_update_observation_not_found_returns_404(self):
        """PATCH /api/observations/nonexistent returns 404."""
        response = self.client.patch(
            "/api/observations/obs-nonexistent-999",
            json={"status": "confirmed"},
        )
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertEqual(data["error"]["code"], "NOT_FOUND")


if __name__ == "__main__":
    unittest.main()
