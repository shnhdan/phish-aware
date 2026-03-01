"""
PhishAware — NLP Service
Detects urgency, threats, rewards, and impersonation patterns in email text.
Uses rule-based matching + optional spaCy for more advanced NLP.
"""

import re
from typing import List, Dict


def extract_urgent_keywords(text: str, keyword_dict: Dict[str, List[str]]) -> List[str]:
    """
    Scans lowercase text for phishing keyword patterns.
    Returns list of matched keywords/phrases.
    """
    found = []
    text_lower = text.lower()
    
    for category, keywords in keyword_dict.items():
        for keyword in keywords:
            if keyword.lower() in text_lower:
                found.append(keyword)
    
    return list(set(found))


def compute_text_features(text: str) -> dict:
    """
    Extracts numerical text features for the pipeline.
    """
    text_lower = text.lower()
    
    return {
        # Sentence structure anomalies
        "all_caps_word_count": len(re.findall(r'\b[A-Z]{4,}\b', text)),
        "exclamation_count": text.count("!"),
        "question_count": text.count("?"),
        
        # Urgency signals
        "has_deadline": any(p in text_lower for p in [
            "24 hours", "48 hours", "within hours", "today", "immediately",
            "right now", "as soon as possible", "asap"
        ]),
        
        # Impersonation signals
        "impersonates_bank": any(p in text_lower for p in [
            "bank of america", "chase", "wells fargo", "citibank", "hsbc",
            "sbi", "hdfc", "icici", "axis bank", "paypal"
        ]),
        "impersonates_tech": any(p in text_lower for p in [
            "google", "microsoft", "apple", "amazon", "netflix",
            "facebook", "instagram", "whatsapp"
        ]),
        
        # Request for sensitive info
        "requests_credentials": any(p in text_lower for p in [
            "password", "social security", "credit card", "cvv",
            "date of birth", "mother's maiden", "pin number", "otp"
        ]),
        
        # Link-related text patterns
        "has_click_here": "click here" in text_lower,
        "has_verify_link": any(p in text_lower for p in [
            "verify your", "confirm your", "validate your", "update your"
        ]),
        
        # Word count for context
        "word_count": len(text.split()),
        
        # Grammatical red flags (simple heuristic)
        "grammar_errors_approx": _estimate_grammar_errors(text),
    }


def _estimate_grammar_errors(text: str) -> int:
    """
    Very rough heuristic for grammar errors.
    Real implementation would use LanguageTool API (free).
    """
    errors = 0
    # Double spaces
    errors += len(re.findall(r'  +', text))
    # Missing space after period
    errors += len(re.findall(r'\.[A-Z]', text))
    # Repeated punctuation
    errors += len(re.findall(r'[!?]{2,}', text))
    return errors
