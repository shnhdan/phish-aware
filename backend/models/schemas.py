"""
PhishAware — Pydantic Schemas
Request/response models for all API endpoints
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RiskLabel(str, Enum):
    SAFE = "SAFE"
    SUSPICIOUS = "SUSPICIOUS"
    DANGEROUS = "DANGEROUS"


# ─── Request Models ───────────────────────────────────────────

class EmailScanRequest(BaseModel):
    sender_email: str
    sender_display_name: Optional[str] = None
    subject: str
    body_text: str
    links: List[str] = []
    headers: Optional[dict] = {}

    class Config:
        json_schema_extra = {
            "example": {
                "sender_email": "noreply@amaz0n-secure.xyz",
                "sender_display_name": "Amazon Security",
                "subject": "Your account has been suspended! Verify immediately",
                "body_text": "Dear Customer, click here immediately to verify your account or it will be deleted.",
                "links": ["http://amaz0n-secure.xyz/verify?token=abc123"],
                "headers": {"x-mailer": "unknown"}
            }
        }


class DomainLookupRequest(BaseModel):
    domain: str


# ─── Feature Breakdown ────────────────────────────────────────

class FeatureBreakdown(BaseModel):
    # Domain age
    domain_age_days: Optional[int]
    domain_age_score: int          # 0-25 contribution
    
    # Link analysis
    link_count: int
    malicious_link_count: int
    link_score: int                # 0-35 contribution
    
    # NLP urgent language
    urgent_keyword_count: int
    urgent_keywords: List[str]
    nlp_score: int                 # 0-25 contribution
    
    # Email auth
    spf_pass: Optional[bool]
    dkim_pass: Optional[bool]
    auth_score: int                # 0-15 contribution


# ─── Response Models ──────────────────────────────────────────

class ScanResponse(BaseModel):
    scan_id: str
    risk_score: int                # 0-100
    risk_label: RiskLabel
    features: FeatureBreakdown
    explanation: str               # Human-readable verdict
    scanned_at: datetime
    pipeline_triggered: bool       # Whether Airflow DAG was triggered


class DomainReputationResponse(BaseModel):
    domain: str
    age_days: Optional[int]
    reputation_score: int
    registrar: Optional[str]
    country: Optional[str]
    vt_malicious_count: int
    has_spf: bool
    has_dmarc: bool
    cached: bool
    last_checked: datetime


class ScanHistoryItem(BaseModel):
    id: str
    created_at: datetime
    sender_domain: str
    risk_score: int
    risk_label: RiskLabel
    urgent_keywords: List[str]


class ScanHistoryResponse(BaseModel):
    items: List[ScanHistoryItem]
    total: int
    page: int
    per_page: int


class TrendStats(BaseModel):
    total_scans: int
    dangerous_count: int
    suspicious_count: int
    safe_count: int
    avg_risk_score: float
    top_phishing_domains: List[dict]
    top_keywords: List[dict]
    scans_per_day: List[dict]
