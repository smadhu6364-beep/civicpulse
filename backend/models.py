from pydantic import BaseModel
from typing import Optional


class Location(BaseModel):
    lat: float
    lng: float
    address: Optional[str] = None


class IssueAnalysis(BaseModel):
    category: str
    severity: str
    authority: str
    summary: str
    complaint_letter: str


class IssueResponse(BaseModel):
    id: str
    description: str
    location: dict
    image_url: Optional[str] = None
    category: str
    severity: str
    authority: str
    summary: str
    complaint_letter: str
    upvotes: int = 0
    status: str = "open"
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None
    created_at: str
    updated_at: str
