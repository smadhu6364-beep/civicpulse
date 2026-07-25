import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def _init_firebase():
    if firebase_admin._apps:
        return

    sa_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")
    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    project_id = os.environ.get("FIREBASE_PROJECT_ID")

    if sa_path and os.path.exists(sa_path):
        cred = credentials.Certificate(sa_path)
    elif sa_json:
        cred = credentials.Certificate(json.loads(sa_json))
    else:
        cred = credentials.ApplicationDefault()

    firebase_admin.initialize_app(cred, {"projectId": project_id})


_init_firebase()
_db = firestore.client()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _doc_to_dict(doc) -> Dict[str, Any]:
    data = doc.to_dict()
    data["id"] = doc.id
    for field in ("created_at", "updated_at"):
        val = data.get(field)
        if val and hasattr(val, "isoformat"):
            data[field] = val.isoformat()
    return data


# --- sync helpers (called via asyncio.to_thread) ---

def _create_issue_sync(issue_data: Dict[str, Any]) -> str:
    ref = _db.collection("issues").document()
    now = datetime.now(timezone.utc)
    ref.set({**issue_data, "created_at": now, "updated_at": now, "upvotes": 0, "status": "open"})
    return ref.id


def _get_issue_sync(issue_id: str) -> Optional[Dict[str, Any]]:
    doc = _db.collection("issues").document(issue_id).get()
    return _doc_to_dict(doc) if doc.exists else None


def _get_all_issues_sync(limit: int = 200) -> List[Dict[str, Any]]:
    docs = (
        _db.collection("issues")
        .order_by("created_at", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    return [_doc_to_dict(d) for d in docs]


def _upvote_sync(issue_id: str) -> int:
    ref = _db.collection("issues").document(issue_id)
    ref.update({"upvotes": firestore.Increment(1), "updated_at": datetime.now(timezone.utc)})
    return ref.get().to_dict().get("upvotes", 0)


def _dashboard_sync() -> Dict[str, Any]:
    issues = _get_all_issues_sync(limit=1000)
    total = len(issues)
    resolved = sum(1 for i in issues if i.get("status") == "resolved")
    in_progress = sum(1 for i in issues if i.get("status") == "in_progress")

    categories: Dict[str, int] = {}
    severities = {"low": 0, "medium": 0, "high": 0}

    for issue in issues:
        cat = issue.get("category", "other")
        categories[cat] = categories.get(cat, 0) + 1
        sev = issue.get("severity", "medium")
        if sev in severities:
            severities[sev] += 1

    top = sorted(categories.items(), key=lambda x: x[1], reverse=True)[:6]

    return {
        "total_issues": total,
        "resolved_issues": resolved,
        "in_progress_issues": in_progress,
        "open_issues": total - resolved - in_progress,
        "resolution_rate": round(resolved / total * 100, 1) if total else 0.0,
        "top_categories": [{"category": k, "count": v} for k, v in top],
        "severity_breakdown": severities,
    }


# --- async public API ---

async def create_issue(data: Dict[str, Any]) -> str:
    return await asyncio.to_thread(_create_issue_sync, data)


async def get_issue(issue_id: str) -> Optional[Dict[str, Any]]:
    return await asyncio.to_thread(_get_issue_sync, issue_id)


async def get_all_issues(limit: int = 200) -> List[Dict[str, Any]]:
    return await asyncio.to_thread(_get_all_issues_sync, limit)


async def upvote_issue(issue_id: str) -> int:
    return await asyncio.to_thread(_upvote_sync, issue_id)


async def get_dashboard_stats() -> Dict[str, Any]:
    return await asyncio.to_thread(_dashboard_sync)
