"""API tests with Gemini and Firestore stubbed out, so no keys or network are needed."""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient

import main
from routers import issues
from services import gemini_service


@pytest.fixture
def client(monkeypatch):
    store = {}

    async def fake_analyze(image_data, description, location):
        return gemini_service.IssueAnalysis(
            category="pothole",
            severity="high",
            authority=gemini_service.AUTHORITY_MAP["pothole"],
            summary="A deep pothole.",
            complaint_letter="Dear Sir/Madam, ...",
        )

    async def fake_upload(data, content_type="image/jpeg"):
        return "https://example.com/img.jpg"

    async def fake_create(data):
        store["abc"] = {**data, "id": "abc", "upvotes": 0}
        return "abc"

    async def fake_get(issue_id):
        return store.get(issue_id)

    async def fake_upvote(issue_id):
        store[issue_id]["upvotes"] += 1
        return store[issue_id]["upvotes"]

    async def fake_all(limit=200):
        return list(store.values())

    for name, fn in {
        "analyze_image": fake_analyze,
        "upload_image": fake_upload,
        "create_issue": fake_create,
        "get_issue": fake_get,
        "upvote_issue": fake_upvote,
        "get_all_issues": fake_all,
    }.items():
        monkeypatch.setattr(issues, name, fn)
    return TestClient(main.app)


def test_health(client):
    assert client.get("/health").json()["status"] == "healthy"


def test_report_list_and_upvote(client):
    r = client.post(
        "/api/issues/",
        data={"description": "Big hole", "lat": "53.38", "lng": "-6.26"},
        files={"image": ("p.jpg", b"\xff\xd8\xff", "image/jpeg")},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["category"] == "pothole" and body["id"] == "abc"
    assert client.get("/api/issues/").json()["total"] == 1
    assert client.post("/api/issues/abc/upvote").json() == {"upvotes": 1}
    assert client.get("/api/issues/missing").status_code == 404


def test_analyze_falls_back_without_api_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    result = asyncio.run(gemini_service.analyze_image(b"x", "Rubbish on the street", "Main St"))
    assert result.category == "other"
    assert result.severity == "medium"
    assert "Main St" in result.complaint_letter
