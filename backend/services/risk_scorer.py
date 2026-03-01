"""
PhishAware — Risk Scorer
Core scoring engine: combines domain age, link analysis, NLP, and auth checks
into a single 0-100 risk score with feature breakdown.
"""

import re
import hashlib
from typing import List, Optional, Tuple
from urllib.parse import urlparse

from services.whois_service import get_domain_age
from services.virustotal_service import check_links
from services.nlp_service import extract_urgent_keywords


# Weights for each feature category (must sum to 100)
WEIGHTS = {
    "domain_age": 25,     # How old is the sender's domain?
    "link_analysis": 35,  # Are links malicious / suspicious?
    "nlp_urgency": 25,    # Does the email use urgent/threatening language?
    "email_auth": 15,     # Does the email pass SPF/DKIM?
}

# Urgency keywords by category
URGENCY_KEYWORDS = {
    "urgency": [
        "verify immediately", "act now", "click here immediately",
        "within 24 hours", "urgent action required", "account will be closed",
        "respond immediately", "time sensitive"
    ],
    "threat": [
        "account suspended", "account disabled", "unusual activity",
        "unauthorized access", "security alert", "your account has been",
        "suspicious login", "unusual sign-in"
    ],
    "reward": [
        "you have won", "congratulations", "selected winner",
        "claim your prize", "free gift", "limited time offer"
    ],
    "impersonation": [
        "dear customer", "dear user", "dear account holder",
        "dear valued member", "hello dear"
    ]
}


def compute_risk_score(
    sender_email: str,
    subject: str,
    body_text: str,
    links: List[str],
    headers: dict = {}
) -> dict:
    """
    Main scoring function. Returns full feature breakdown + final score.
    """
    sender_domain = extract_domain(sender_email)
    full_text = f"{subject} {body_text}".lower()

    # ── Feature 1: Domain Age (0-25 pts risk) ──────────────────
    domain_age_days = get_domain_age(sender_domain)
    domain_age_score = _score_domain_age(domain_age_days)

    # ── Feature 2: Link Analysis (0-35 pts risk) ───────────────
    malicious_links = check_links(links) if links else []
    link_score = _score_links(links, malicious_links)

    # ── Feature 3: NLP Urgency (0-25 pts risk) ─────────────────
    urgent_keywords = extract_urgent_keywords(full_text, URGENCY_KEYWORDS)
    nlp_score = _score_nlp(urgent_keywords, full_text)

    # ── Feature 4: Email Auth (0-15 pts risk) ──────────────────
    spf_pass = headers.get("spf") == "pass" if headers else None
    dkim_pass = headers.get("dkim") == "pass" if headers else None
    auth_score = _score_auth(spf_pass, dkim_pass)

    # ── Final Score ────────────────────────────────────────────
    total = domain_age_score + link_score + nlp_score + auth_score
    risk_score = min(total, 100)
    risk_label = _label(risk_score)

    return {
        "email_hash": hashlib.sha256(body_text.encode()).hexdigest(),
        "sender_domain": sender_domain,
        "risk_score": risk_score,
        "risk_label": risk_label,
        "explanation": _explain(risk_score, urgent_keywords, malicious_links, domain_age_days),
        "features": {
            "domain_age_days": domain_age_days,
            "domain_age_score": domain_age_score,
            "link_count": len(links),
            "malicious_link_count": len(malicious_links),
            "link_score": link_score,
            "urgent_keyword_count": len(urgent_keywords),
            "urgent_keywords": urgent_keywords[:10],
            "nlp_score": nlp_score,
            "spf_pass": spf_pass,
            "dkim_pass": dkim_pass,
            "auth_score": auth_score,
        }
    }


def _score_domain_age(age_days: Optional[int]) -> int:
    """Newer domain = higher risk."""
    if age_days is None:
        return 20  # Unknown domain = high risk
    if age_days < 30:
        return 25
    if age_days < 90:
        return 18
    if age_days < 365:
        return 10
    if age_days < 1825:
        return 5
    return 0


def _score_links(links: List[str], malicious: List[str]) -> int:
    """Malicious links = max risk. Suspicious patterns = partial."""
    if not links:
        return 5  # No links is slightly unusual too
    
    if malicious:
        return min(35, 20 + len(malicious) * 5)
    
    score = 0
    for link in links:
        parsed = urlparse(link)
        # IP address instead of domain name
        if re.match(r'\d+\.\d+\.\d+\.\d+', parsed.netloc or ""):
            score += 15
        # URL shorteners
        if any(s in (parsed.netloc or "") for s in ["bit.ly", "tinyurl", "t.co", "goo.gl"]):
            score += 10
        # Suspicious TLDs
        if any((parsed.netloc or "").endswith(tld) for tld in [".xyz", ".tk", ".ml", ".ga", ".cf"]):
            score += 8
        # Excessive subdomains (paypal.verify.secure.evil.com)
        if (parsed.netloc or "").count(".") > 3:
            score += 12

    return min(35, score)


def _score_nlp(keywords: List[str], text: str) -> int:
    """More urgent/threatening language = higher risk."""
    base = min(len(keywords) * 4, 20)
    
    # Bonus for ALL CAPS words
    caps_words = len(re.findall(r'\b[A-Z]{4,}\b', text))
    caps_bonus = min(caps_words * 2, 5)
    
    return min(25, base + caps_bonus)


def _score_auth(spf_pass: Optional[bool], dkim_pass: Optional[bool]) -> int:
    """Failed auth checks = higher risk."""
    if spf_pass is None and dkim_pass is None:
        return 8  # Unknown = moderate risk
    score = 0
    if spf_pass is False:
        score += 8
    if dkim_pass is False:
        score += 7
    return score


def _label(score: int) -> str:
    if score >= 65:
        return "DANGEROUS"
    if score >= 35:
        return "SUSPICIOUS"
    return "SAFE"


def _explain(score: int, keywords: List[str], malicious_links: List[str], age: Optional[int]) -> str:
    parts = []
    if malicious_links:
        parts.append(f"{len(malicious_links)} malicious link(s) detected")
    if age and age < 90:
        parts.append(f"sender domain is only {age} days old")
    if keywords:
        parts.append(f"contains urgent language: {', '.join(keywords[:3])}")
    
    if not parts:
        return "No significant threats detected."
    
    label = _label(score)
    return f"{label}: " + "; ".join(parts) + "."


def extract_domain(email: str) -> str:
    """Extract domain from email address."""
    if "@" in email:
        return email.split("@")[1].lower().strip()
    return email.lower().strip()
