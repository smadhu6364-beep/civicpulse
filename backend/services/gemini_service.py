import google.generativeai as genai
import os
import json
import base64
import asyncio
from datetime import date
from models import IssueAnalysis

CATEGORIES = [
    "pothole", "broken_streetlight", "garbage", "water_leakage",
    "damaged_road", "illegal_dumping", "graffiti", "traffic_signal_issue",
    "sidewalk_damage", "flooding", "other"
]

AUTHORITY_MAP = {
    "pothole": "Roads and Infrastructure Department",
    "broken_streetlight": "Electrical Department",
    "garbage": "Solid Waste Management Department",
    "water_leakage": "Water and Sewerage Department",
    "damaged_road": "Roads and Infrastructure Department",
    "illegal_dumping": "Environmental Services Department",
    "graffiti": "Urban Development Department",
    "traffic_signal_issue": "Traffic Management Department",
    "sidewalk_damage": "Roads and Infrastructure Department",
    "flooding": "Drainage and Stormwater Department",
    "other": "Municipal Corporation",
}

CATEGORY_IMPACTS = {
    "pothole": "poses a serious risk to vehicles and cyclists, potentially causing accidents, tyre damage, and injury to road users",
    "broken_streetlight": "leaves the area unlit after dark, increasing the risk of accidents and criminal activity, and making it unsafe for pedestrians and motorists",
    "garbage": "creates an unsanitary environment, attracts pests and vermin, and poses a direct health hazard to nearby residents, especially children",
    "water_leakage": "wastes a precious public resource, damages road surfaces and surrounding infrastructure, and creates hazardous slippery conditions for commuters",
    "damaged_road": "impedes the safe flow of traffic, risks significant damage to vehicles, and may cause accidents or injury to road users",
    "illegal_dumping": "degrades the local environment, creates a public health hazard, and significantly diminishes the quality of life for neighbourhood residents",
    "graffiti": "defaces public property, reduces the visual appeal of the locality, and erodes community pride",
    "traffic_signal_issue": "creates dangerous confusion at the intersection, risks serious vehicular accidents, and disrupts the orderly flow of traffic",
    "sidewalk_damage": "makes pedestrian movement unsafe and inaccessible, particularly for elderly citizens, children, and persons with disabilities",
    "flooding": "renders roads and pathways impassable, risks significant property damage, and may pose a serious health risk from contaminated stagnant water",
    "other": "adversely affects the quality of life and safety of residents in the surrounding area",
}

SEVERITY_TIMELINES = {
    "high": "within 48 hours, given the immediate safety hazard this situation presents",
    "medium": "within 7 working days",
    "low": "at the earliest convenience, and no later than 30 days from the date of this letter",
}


def _article(noun: str) -> str:
    return "an" if noun[0].lower() in "aeiou" else "a"


def _readable_category(category: str) -> str:
    return "civic issue" if category == "other" else category.replace("_", " ")


def _configure_genai():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    genai.configure(api_key=api_key)


def _analyze_image_sync(image_data: bytes, description: str, location_address: str) -> dict:
    _configure_genai()
    model = genai.GenerativeModel(
        "gemini-1.5-flash",
        generation_config={"response_mime_type": "application/json"},
    )

    image_part = {
        "inline_data": {
            "mime_type": "image/jpeg",
            "data": base64.b64encode(image_data).decode("utf-8"),
        }
    }

    prompt = f"""Analyze this civic issue image and classify it.

User description: {description}
Location: {location_address or "Unknown"}

Return a JSON object with exactly these fields:
{{
  "category": "<one of: {', '.join(CATEGORIES)}>",
  "severity": "<low|medium|high>",
  "summary": "<1-2 sentence factual description of the visible issue>"
}}

Severity guidelines:
- low: minor inconvenience, no immediate safety risk
- medium: moderate disruption or potential safety concern
- high: serious hazard requiring urgent attention"""

    response = model.generate_content([prompt, image_part])
    return json.loads(response.text)


def _generate_letter_sync(
    category: str,
    severity: str,
    summary: str,
    authority: str,
    location: str,
    description: str,
) -> str:
    _configure_genai()
    model = genai.GenerativeModel("gemini-1.5-flash")

    today = date.today().strftime("%d %B %Y")
    readable = _readable_category(category)
    art = _article(readable)
    impact = CATEGORY_IMPACTS.get(category, CATEGORY_IMPACTS["other"])
    timeline = SEVERITY_TIMELINES.get(severity, SEVERITY_TIMELINES["medium"])
    location_text = location or "the location as reported"

    prompt = f"""Write a formal civic complaint letter using exactly the details provided below.

---
Date: {today}
Recipient authority: {authority}
Issue type: {readable}
Severity: {severity.upper()}
Location: {location_text}
Reporter's description: {description}
AI analysis: {summary}
Public impact of this issue: it {impact}
Required action timeline: {timeline}
---

Format the letter exactly as follows:

{today}

The Officer In Charge
{authority}

Dear Sir/Madam,

[Paragraph 1 — Introduction]
Write as a concerned citizen reporting {art} {readable} issue at {location_text}. State that the issue has been assessed as {severity.upper()} severity and requires urgent attention from the {authority}.

[Paragraph 2 — Issue description and impact]
Describe the issue in specific detail, referencing both the reporter's description and the AI analysis summary above. Include this sentence (adapted naturally into the paragraph): "This {readable} {impact}." Explain the direct effect on residents, commuters, or the public depending on the issue type.

[Paragraph 3 — Formal request and escalation notice]
Formally request that the {authority} depute a team to inspect the site and carry out the necessary rectification works {timeline}. State that if no action is taken within the stipulated period, the matter will be escalated to the relevant Commissioner or higher municipal authority.

Yours sincerely,
A Concerned Citizen

---
Rules:
- Use correct English grammar and articles throughout (e.g. "a pothole", "a broken streetlight", "a civic issue" — never "a other issue")
- Do NOT use any placeholder text such as [Name], [Date], [Location], or [Authority]
- Do NOT include square brackets in the final output — replace the paragraph placeholders above with real prose
- Write in formal British English
- Output only the letter text, nothing else"""

    response = model.generate_content(prompt)
    return response.text


async def analyze_image(
    image_data: bytes, description: str, location_address: str
) -> IssueAnalysis:
    try:
        data = await asyncio.to_thread(
            _analyze_image_sync, image_data, description, location_address
        )
    except Exception as e:
        data = {}

    category = data.get("category", "other")
    if category not in CATEGORIES:
        category = "other"

    severity = data.get("severity", "medium")
    if severity not in ("low", "medium", "high"):
        severity = "medium"

    summary = data.get("summary", description)
    authority = AUTHORITY_MAP.get(category, AUTHORITY_MAP["other"])

    try:
        complaint_letter = await asyncio.to_thread(
            _generate_letter_sync,
            category,
            severity,
            summary,
            authority,
            location_address,
            description,
        )
    except Exception:
        readable = _readable_category(category)
        art = _article(readable)
        impact = CATEGORY_IMPACTS.get(category, CATEGORY_IMPACTS["other"])
        timeline = SEVERITY_TIMELINES.get(severity, SEVERITY_TIMELINES["medium"])
        loc = location_address or "the reported location"
        today = date.today().strftime("%d %B %Y")
        complaint_letter = (
            f"{today}\n\n"
            f"The Officer In Charge\n{authority}\n\n"
            f"Dear Sir/Madam,\n\n"
            f"I am writing to bring to your attention {art} {readable} issue located at {loc}, "
            f"which has been assessed as {severity.upper()} severity and requires prompt intervention "
            f"from the {authority}.\n\n"
            f"{description} This {readable} {impact}, and the situation is causing considerable "
            f"inconvenience to residents and commuters in the area.\n\n"
            f"I respectfully request that your department depute a team to inspect and rectify this "
            f"issue {timeline}. Should no corrective action be taken within the stipulated period, "
            f"this matter will be escalated to the appropriate higher authority.\n\n"
            f"Yours sincerely,\nA Concerned Citizen"
        )

    return IssueAnalysis(
        category=category,
        severity=severity,
        authority=authority,
        summary=summary,
        complaint_letter=complaint_letter,
    )
