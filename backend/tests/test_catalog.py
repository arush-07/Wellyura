from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_catalog_summary() -> None:
    response = client.get("/api/v1/catalog/summary")
    assert response.status_code == 200
    assert response.json() == {
        "institutions": 268,
        "programmes": 4102,
        "countries": 12,
        "subjects": 9,
        "source": "Wellyura v1 legacy seed files",
    }


def test_search_returns_programmes() -> None:
    response = client.get("/api/v1/search", params={"q": "computer", "limit": 3})
    assert response.status_code == 200
    payload = response.json()
    assert payload["query"] == "computer"
    assert len(payload["programmes"]) <= 3


def test_missing_university_returns_problem_shape() -> None:
    response = client.get("/api/v1/universities/not-a-real-university")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
