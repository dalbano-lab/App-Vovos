"""Backend API tests for DoctorVovô app"""
import os
import io
import base64
import pytest
import requests
from PIL import Image, ImageDraw

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://vovo-conecta.preview.emergentagent.com').rstrip('/')


def _real_jpeg_b64() -> str:
    """Create a small JPEG with real visual content (shapes/text)."""
    img = Image.new('RGB', (400, 300), (240, 230, 210))
    d = ImageDraw.Draw(img)
    # blister pack-like shapes
    for i in range(4):
        for j in range(2):
            x = 40 + i * 80
            y = 40 + j * 100
            d.ellipse([x, y, x + 50, y + 70], fill=(220, 220, 230), outline=(80, 80, 80), width=3)
    d.rectangle([20, 20, 380, 280], outline=(50, 50, 50), width=4)
    d.text((60, 250), "PARACETAMOL 500mg", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    return base64.b64encode(buf.getvalue()).decode()


# ============ Health ============
class TestHealth:
    def test_root_ok(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/", timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert body.get("status") == "ok"
        assert "DoctorVov" in body.get("message", "")


# ============ Profile ============
class TestProfile:
    def setup_method(self):
        requests.delete(f"{BASE_URL}/api/profile", timeout=30)

    def teardown_method(self):
        requests.delete(f"{BASE_URL}/api/profile", timeout=30)

    def test_get_profile_none(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/profile", timeout=20)
        assert r.status_code == 200
        # nothing exists -> null
        assert r.json() is None

    def test_put_creates_then_get_returns(self, api_client):
        payload = {"full_name": "TEST_Joao Silva", "called_as": "Vovô João", "emergency_phone": "11999999999", "emergency_name": "Maria"}
        r = api_client.put(f"{BASE_URL}/api/profile", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["full_name"] == payload["full_name"]
        assert body["called_as"] == payload["called_as"]
        assert "id" in body
        assert "_id" not in body
        pid = body["id"]

        # GET returns same profile
        g = api_client.get(f"{BASE_URL}/api/profile", timeout=20)
        assert g.status_code == 200
        gb = g.json()
        assert gb is not None
        assert gb["id"] == pid
        assert gb["called_as"] == "Vovô João"
        assert "_id" not in gb

    def test_put_updates_without_duplicate(self, api_client):
        api_client.put(f"{BASE_URL}/api/profile", json={"full_name": "TEST_A", "called_as": "A"}, timeout=30)
        first = api_client.get(f"{BASE_URL}/api/profile", timeout=20).json()
        first_id = first["id"]

        r = api_client.put(f"{BASE_URL}/api/profile", json={"full_name": "TEST_B", "called_as": "B"}, timeout=30)
        assert r.status_code == 200
        updated = r.json()
        # same id (no duplicate)
        assert updated["id"] == first_id
        assert updated["called_as"] == "B"
        assert updated["full_name"] == "TEST_B"

    def test_delete_wipes_all(self, api_client):
        # set profile
        api_client.put(f"{BASE_URL}/api/profile", json={"full_name": "TEST_x", "called_as": "x"}, timeout=30)
        # add med, appt, msg
        api_client.post(f"{BASE_URL}/api/medications", json={"name": "TEST_Med", "times": ["08:00"]}, timeout=30)
        api_client.post(f"{BASE_URL}/api/appointments", json={"title": "TEST_Apt", "date": "2026-02-01", "time": "10:00"}, timeout=30)
        api_client.post(f"{BASE_URL}/api/family-messages", json={"sender_name": "TEST_Filho", "text": "Oi"}, timeout=30)

        r = api_client.delete(f"{BASE_URL}/api/profile", timeout=30)
        assert r.status_code == 200
        assert r.json().get("ok") is True

        assert api_client.get(f"{BASE_URL}/api/profile", timeout=20).json() is None
        assert api_client.get(f"{BASE_URL}/api/medications", timeout=20).json() == []
        assert api_client.get(f"{BASE_URL}/api/appointments", timeout=20).json() == []
        assert api_client.get(f"{BASE_URL}/api/family-messages", timeout=20).json() == []


# ============ Medications CRUD ============
class TestMedications:
    created_ids = []

    def teardown_method(self):
        for mid in self.created_ids:
            requests.delete(f"{BASE_URL}/api/medications/{mid}", timeout=20)
        self.created_ids.clear()

    def test_create_list_delete(self, api_client):
        payload = {"name": "TEST_Losartana", "dosage": "50mg", "instructions": "1x ao dia", "times": ["08:00"]}
        r = api_client.post(f"{BASE_URL}/api/medications", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["name"] == "TEST_Losartana"
        assert body["dosage"] == "50mg"
        assert body["times"] == ["08:00"]
        assert "id" in body and "_id" not in body
        mid = body["id"]
        self.created_ids.append(mid)

        # list
        lst = api_client.get(f"{BASE_URL}/api/medications", timeout=20).json()
        assert any(m["id"] == mid for m in lst)
        assert all("_id" not in m for m in lst)

        # delete
        d = api_client.delete(f"{BASE_URL}/api/medications/{mid}", timeout=20)
        assert d.status_code == 200
        self.created_ids.remove(mid)
        lst2 = api_client.get(f"{BASE_URL}/api/medications", timeout=20).json()
        assert not any(m["id"] == mid for m in lst2)


# ============ Medications Identify (AI) ============
class TestIdentify:
    def test_identify_returns_required_fields(self, api_client):
        b64 = _real_jpeg_b64()
        r = api_client.post(f"{BASE_URL}/api/medications/identify", json={"image_base64": b64}, timeout=120)
        assert r.status_code == 200, r.text
        body = r.json()
        for key in ("name", "dosage", "instructions", "suggested_times", "confidence"):
            assert key in body, f"Missing key {key} in {body}"
        assert isinstance(body["suggested_times"], list)
        assert body["confidence"] in ("baixa", "media", "alta", "média")


# ============ Appointments ============
class TestAppointments:
    ids = []

    def teardown_method(self):
        for i in self.ids:
            requests.delete(f"{BASE_URL}/api/appointments/{i}", timeout=20)
        self.ids.clear()

    def test_crud_and_complete(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/appointments", json={"title": "TEST_Cardio", "date": "2026-02-10", "time": "09:00", "location": "Hosp"}, timeout=30)
        assert r.status_code == 200
        body = r.json()
        assert body["title"] == "TEST_Cardio"
        assert body["completed"] is False
        assert "_id" not in body
        aid = body["id"]
        self.ids.append(aid)

        lst = api_client.get(f"{BASE_URL}/api/appointments", timeout=20).json()
        assert any(a["id"] == aid for a in lst)

        c = api_client.put(f"{BASE_URL}/api/appointments/{aid}/complete", timeout=20)
        assert c.status_code == 200
        lst2 = api_client.get(f"{BASE_URL}/api/appointments", timeout=20).json()
        found = next(a for a in lst2 if a["id"] == aid)
        assert found["completed"] is True

        d = api_client.delete(f"{BASE_URL}/api/appointments/{aid}", timeout=20)
        assert d.status_code == 200
        self.ids.remove(aid)


# ============ Family Messages ============
class TestFamilyMessages:
    ids = []

    def teardown_method(self):
        for i in self.ids:
            requests.delete(f"{BASE_URL}/api/family-messages/{i}", timeout=20)
        self.ids.clear()

    def test_crud_newest_first(self, api_client):
        r1 = api_client.post(f"{BASE_URL}/api/family-messages", json={"sender_name": "TEST_Ana", "text": "Primeira"}, timeout=30).json()
        self.ids.append(r1["id"])
        import time
        time.sleep(1.1)
        r2 = api_client.post(f"{BASE_URL}/api/family-messages", json={"sender_name": "TEST_Beto", "text": "Segunda"}, timeout=30).json()
        self.ids.append(r2["id"])

        lst = api_client.get(f"{BASE_URL}/api/family-messages", timeout=20).json()
        assert all("_id" not in m for m in lst)
        # find indexes
        idx_first = next(i for i, m in enumerate(lst) if m["id"] == r1["id"])
        idx_second = next(i for i, m in enumerate(lst) if m["id"] == r2["id"])
        assert idx_second < idx_first, "Newest should be first"

        d = api_client.delete(f"{BASE_URL}/api/family-messages/{r1['id']}", timeout=20)
        assert d.status_code == 200
        self.ids.remove(r1["id"])
