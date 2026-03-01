"""
PhishAware — FastAPI Backend
Handles email scan requests, risk scoring, and data pipeline triggers
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from routers import scan, history, domain
from database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="PhishAware API",
    description="Privacy-first phishing detection with data engineering pipeline",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://phish-aware.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router, prefix="/api/scan", tags=["Scan"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(domain.router, prefix="/api/domain", tags=["Domain"])


@app.get("/")
async def root():
    return {
        "service": "PhishAware API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
