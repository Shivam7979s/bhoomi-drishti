from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("UP", "DEGRADED")
    assert data["service"] == "bhoomi-drishti-ai"
    assert data["embedding_dimension"] == 384


def test_internal_endpoint_forbidden_without_secret():
    response = client.post(
        "/internal/retrieve",
        json={"query": "test query", "top_k": 5},
    )
    assert response.status_code == 403
    assert response.json()["error"] == "FORBIDDEN"


def test_internal_endpoint_forbidden_with_wrong_secret():
    response = client.post(
        "/internal/retrieve",
        json={"query": "test query", "top_k": 5},
        headers={"X-Internal-Secret": "wrong-secret-token"},
    )
    assert response.status_code == 403
