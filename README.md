# CivicPulse

AI-powered civic issue reporting platform. Upload a photo of a local problem — Gemini Vision auto-categorises it, estimates severity, identifies the responsible municipal authority, and drafts a formal complaint letter. Issues are plotted on a live map and community members can verify/upvote them.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Leaflet.js |
| Backend | Python FastAPI |
| AI | Google Gemini 1.5 Flash (multimodal) |
| Database | Firebase Firestore |
| Deployment | Google Cloud Run (+ Docker) |

## Features

- **Issue Reporting** — Photo upload + description + map pin location
- **Gemini Vision Analysis** — Auto-categorisation, severity (low/medium/high), responsible authority
- **Interactive Map** — Leaflet.js map with colour-coded severity pins
- **Complaint Letter Generator** — AI drafts a formal letter to the relevant authority
- **Community Upvote** — Residents can verify and upvote issues
- **Dashboard** — Total issues, resolution rate, category breakdown, severity chart

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)
- A Firebase project with Firestore enabled

### 1 — Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → New project
2. Enable **Firestore Database** (start in test mode for development)
3. Go to Project Settings → Service Accounts → Generate new private key
4. Save the downloaded JSON as `backend/serviceAccount.json`

### 2 — Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your keys

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### 3 — Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL defaults to /api (proxied by Vite to localhost:8000)

npm install
npm run dev
```

Open `http://localhost:5173`.

### 4 — Docker Compose (full stack)

```bash
cp .env.example .env
# Edit .env with GEMINI_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET
# Place backend/serviceAccount.json

docker compose up --build
```

Frontend: `http://localhost` · Backend: `http://localhost:8000`

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to service account JSON (default: `./serviceAccount.json`) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account as JSON string (for Cloud Run) |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket (optional, for image persistence) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (default: `/api` — proxied in dev) |

## Deploying to Google Cloud Run

### Backend

```bash
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT/civicpulse-backend
gcloud run deploy civicpulse-backend \
  --image gcr.io/YOUR_PROJECT/civicpulse-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=...,FIREBASE_PROJECT_ID=...,FIREBASE_SERVICE_ACCOUNT_JSON='...'
```

Use `FIREBASE_SERVICE_ACCOUNT_JSON` (the full JSON as a string) instead of a file path on Cloud Run. Store it in Secret Manager for production.

### Frontend

```bash
cd frontend
# Set VITE_API_URL to your Cloud Run backend URL at build time
VITE_API_URL=https://civicpulse-backend-xxx-uc.a.run.app/api npm run build

gcloud builds submit --tag gcr.io/YOUR_PROJECT/civicpulse-frontend \
  --build-arg VITE_API_URL=https://civicpulse-backend-xxx-uc.a.run.app/api
gcloud run deploy civicpulse-frontend \
  --image gcr.io/YOUR_PROJECT/civicpulse-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/issues/` | Report a new issue (multipart form) |
| `GET` | `/api/issues/` | List all issues |
| `GET` | `/api/issues/{id}` | Get a single issue |
| `POST` | `/api/issues/{id}/upvote` | Upvote / verify an issue |
| `GET` | `/api/issues/dashboard` | Dashboard statistics |
| `GET` | `/health` | Health check |

### Report Issue — Form Fields

| Field | Type | Required |
|---|---|---|
| `image` | file | Yes |
| `description` | string | Yes |
| `lat` | float | Yes |
| `lng` | float | Yes |
| `address` | string | No |
| `reporter_name` | string | No |
| `reporter_email` | string | No |

## Project Structure

```
civicpulse/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── models.py                  # Pydantic models
│   ├── routers/
│   │   └── issues.py              # Issue endpoints
│   ├── services/
│   │   ├── gemini_service.py      # Gemini Vision + letter generation
│   │   └── firestore_service.py   # Firestore CRUD
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Router
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── MapView.jsx        # Leaflet map with severity pins
│   │   │   ├── IssueForm.jsx      # Report form with map picker
│   │   │   ├── Dashboard.jsx      # Stats + recent issues table
│   │   │   └── IssueModal.jsx     # Issue detail + complaint letter
│   │   └── services/
│   │       └── api.js             # Axios API client
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.example
├── docker-compose.yml
└── README.md
```
