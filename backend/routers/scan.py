"""
PhishAware — Scan Router
POST /api/scan — Main endpoint: accepts email data, returns risk score
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException
from datetime import datetime, timezone
import uuid

from models.schemas import EmailScanRequest, ScanResponse
from services.risk_scorer import compute_risk_score

router = APIRouter()


@router.post("/", response_model=ScanResponse)
async def scan_email(request: EmailScanRequest, background_tasks: BackgroundTasks):
    """
    Scans an email and returns a risk score with full feature breakdown.
    
    The scan is synchronous (returns immediately).
    A background task then logs the result to Supabase and triggers the Airflow pipeline.
    """
    try:
        result = compute_risk_score(
            sender_email=request.sender_email,
            subject=request.subject,
            body_text=request.body_text,
            links=request.links,
            headers=request.headers or {}
        )
        
        scan_id = str(uuid.uuid4())
        
        # Trigger background: save to DB + push to Airflow
        background_tasks.add_task(
            save_scan_result,
            scan_id=scan_id,
            result=result,
            request=request
        )
        
        return ScanResponse(
            scan_id=scan_id,
            risk_score=result["risk_score"],
            risk_label=result["risk_label"],
            features=result["features"],
            explanation=result["explanation"],
            scanned_at=datetime.now(timezone.utc),
            pipeline_triggered=True
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def save_scan_result(scan_id: str, result: dict, request: EmailScanRequest):
    """
    Background task: saves scan result to Supabase.
    In production, also enqueues an Airflow DAG run via its REST API.
    """
    # TODO: import supabase client and insert row
    # supabase.table("scan_logs").insert({
    #     "id": scan_id,
    #     "email_hash": result["email_hash"],
    #     "sender_domain": result["sender_domain"],
    #     "risk_score": result["risk_score"],
    #     "risk_label": result["risk_label"],
    #     ...result["features"]
    # }).execute()
    
    # TODO: trigger Airflow DAG via REST API
    # requests.post(f"{AIRFLOW_URL}/api/v1/dags/email_enrichment/dagRuns", ...)
    pass
