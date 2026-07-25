from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from typing import Optional

from services.gemini_service import analyze_image
from services.firestore_service import (
    create_issue,
    get_all_issues,
    get_dashboard_stats,
    get_issue,
    upload_image,
    upvote_issue,
)

router = APIRouter()

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB

@router.post("/")
async def report_issue(
        description: str = Form(...),
        lat: float = Form(...),
        lng: float = Form(...),
        address: Optional[str] = Form(None),
        reporter_name: Optional[str] = Form(None),
        reporter_email: Optional[str] = Form(None),
        image: UploadFile = File(...),
):
        image_data = await image.read()
        if len(image_data) > MAX_IMAGE_BYTES:
                    raise HTTPException(status_code=400, detail="Image must be under 10 MB")

        location_label = address or f"{lat:.5f}, {lng:.5f}"
        analysis = await analyze_image(image_data, description, location_label)
        image_url = await upload_image(image_data, image.content_type or "image/jpeg")

    issue_data = {
                "description": description,
                "location": {"lat": lat, "lng": lng, "address": address},
                "category": analysis.category,
                "severity": analysis.severity,
                "authority": analysis.authority,
                "summary": analysis.summary,
                "complaint_letter": analysis.complaint_letter,
                "reporter_name": reporter_name,
                "reporter_email": reporter_email,
                "image_url": image_url,
    }

    issue_id = await create_issue(issue_data)

    return {
                "id": issue_id,
                "message": "Issue reported successfully",
                **issue_data,
                "upvotes": 0,
                "status": "open",
    }


@router.get("/dashboard")
async def dashboard():
        return await get_dashboard_stats()


@router.get("/")
async def list_issues():
        issues = await get_all_issues()
        return {"issues": issues, "total": len(issues)}


@router.get("/{issue_id}")
async def fetch_issue(issue_id: str):
        issue = await get_issue(issue_id)
        if not issue:
                    raise HTTPException(status_code=404, detail="Issue not found")
                return issue


@router.post("/{issue_id}/upvote")
async def vote(issue_id: str):
        issue = await get_issue(issue_id)
    if not issue:
                raise HTTPException(status_code=404, detail="Issue not found")
            new_count = await upvote_issue(issue_id)
    return {"upvotes": new_count}
