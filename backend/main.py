import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.issues import router as issues_router

app = FastAPI(title="CivicPulse API", version="1.0.0", description="Civic issue reporting platform")

app.add_middleware(
        CORSMiddleware,
        allow_origins=os.environ.get(
                    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
        ).split(","),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
)

app.include_router(issues_router, prefix="/api/issues", tags=["Issues"])


@app.get("/health")
async def health():
        return {"status": "healthy", "version": "1.0.0"}
