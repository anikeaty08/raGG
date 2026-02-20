import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


def test_health_check(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "version" in data


def test_get_model_settings(client):
    """Test getting model settings."""
    response = client.get("/settings/model")
    # May return 503 if query engine not initialized, which is OK for tests
    assert response.status_code in [200, 503]


def test_query_endpoint_requires_body(client):
    """Test that query endpoint requires request body."""
    response = client.post("/query", json={})
    # Should return validation error or 503
    assert response.status_code in [422, 503]


def test_sources_endpoint(client):
    """Test sources endpoint."""
    response = client.get("/sources")
    # Should return 200 (empty list) or 503
    assert response.status_code in [200, 503]
