import os
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://vovo-conecta.preview.emergentagent.com').rstrip('/')


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(autouse=False)
def clean_state(api_client):
    # only used by tests that want a clean slate
    api_client.delete(f"{BASE_URL}/api/profile", timeout=30)
    yield
    api_client.delete(f"{BASE_URL}/api/profile", timeout=30)
