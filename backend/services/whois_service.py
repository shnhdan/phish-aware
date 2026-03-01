"""
PhishAware — WHOIS Service
Looks up domain registration date to compute domain age.
Uses python-whois library + caching via Supabase.
"""

import whois
from datetime import datetime, timezone
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def get_domain_age(domain: str) -> Optional[int]:
    """
    Returns the age of a domain in days.
    Returns None if WHOIS lookup fails.
    
    Uses python-whois (free, no API key needed).
    Results should be cached in Supabase domain_reputation table.
    """
    try:
        w = whois.whois(domain)
        creation_date = w.creation_date
        
        # creation_date can be a list or single datetime
        if isinstance(creation_date, list):
            creation_date = creation_date[0]
        
        if creation_date is None:
            return None
        
        # Normalize timezone
        if creation_date.tzinfo is None:
            creation_date = creation_date.replace(tzinfo=timezone.utc)
        
        now = datetime.now(timezone.utc)
        age_days = (now - creation_date).days
        
        logger.info(f"Domain {domain} age: {age_days} days")
        return age_days
    
    except Exception as e:
        logger.warning(f"WHOIS lookup failed for {domain}: {e}")
        return None


def get_domain_info(domain: str) -> dict:
    """
    Returns full WHOIS info for a domain.
    """
    try:
        w = whois.whois(domain)
        creation_date = w.creation_date
        if isinstance(creation_date, list):
            creation_date = creation_date[0]
        
        return {
            "domain": domain,
            "registrar": w.registrar,
            "creation_date": creation_date,
            "country": w.country,
            "age_days": get_domain_age(domain)
        }
    except Exception as e:
        logger.warning(f"WHOIS info failed for {domain}: {e}")
        return {"domain": domain, "error": str(e)}
