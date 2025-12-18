from typing import Dict, Any, Optional

def calculate_completeness_score(hospital_data: Dict[str, Any]) -> float:
    """
    Calculate completeness score (0-100) based on available data fields.
    Higher score = more complete data.
    """
    scores = {
        "name": 10,
        "address": 10,
        "city": 5,
        "state": 5,
        "phone": 10,
        "website": 5,
        "latitude": 5,
        "longitude": 5,
        "google_rating": 10,
        "google_review_count": 10,
        "google_opening_hours": 10,
        "google_photos": 10,
        "type": 5,
    }
    
    total = 0
    max_score = sum(scores.values())
    
    for field, weight in scores.items():
        value = hospital_data.get(field)
        if value is not None and value != "" and value != [] and value != {}:
            if field == "google_photos" and isinstance(value, list) and len(value) > 0:
                total += weight
            elif field == "google_opening_hours" and isinstance(value, dict) and value:
                total += weight
            elif field not in ["google_photos", "google_opening_hours"]:
                total += weight
    
    return round((total / max_score) * 100, 1)


def calculate_confidence_score(hospital_data: Dict[str, Any]) -> float:
    """
    Calculate confidence score (0-100) based on data quality signals.
    Higher score = more trustworthy data.
    """
    score = 50  # Base score
    
    # Google verification bonus
    if hospital_data.get("google_verified"):
        score += 15
    
    # Review count bonus (more reviews = more confidence)
    review_count = hospital_data.get("google_review_count", 0) or 0
    if review_count >= 50:
        score += 15
    elif review_count >= 20:
        score += 10
    elif review_count >= 10:
        score += 5
    elif review_count >= 5:
        score += 2
    
    # Rating bonus (higher rating = more confidence)
    rating = hospital_data.get("google_rating", 0) or 0
    if rating >= 4.5:
        score += 10
    elif rating >= 4.0:
        score += 5
    elif rating >= 3.0:
        score += 2
    
    # Photos bonus
    photos = hospital_data.get("google_photos", []) or []
    if len(photos) >= 10:
        score += 10
    elif len(photos) >= 5:
        score += 5
    elif len(photos) >= 1:
        score += 2
    
    # Website bonus
    if hospital_data.get("website"):
        score += 5
    
    # Phone bonus
    if hospital_data.get("phone"):
        score += 5
    
    # Opening hours bonus
    if hospital_data.get("google_opening_hours"):
        score += 5
    
    return min(100, round(score, 1))


def should_auto_approve(hospital_data: Dict[str, Any], 
                        completeness_threshold: float = 60,
                        min_reviews: int = 10) -> tuple[bool, str]:
    """
    Determine if a hospital should be auto-approved.
    Returns (should_approve, reason).
    
    Auto-approval requires ALL of:
    - Google verified listing
    - 10+ user reviews  
    - Completeness score >= 60%
    - No duplicate match detected
    """
    completeness = hospital_data.get("completeness_score", 0)
    review_count = hospital_data.get("google_review_count", 0) or 0
    google_verified = hospital_data.get("google_verified", False)
    duplicate_score = hospital_data.get("duplicate_score", 0) or 0
    
    # Never auto-approve potential duplicates
    if duplicate_score > 0.5:
        return False, f"Potential duplicate (score: {duplicate_score:.0%})"
    
    # Never auto-approve without Google verification
    if not google_verified:
        return False, "Not Google verified"
    
    # Never auto-approve without minimum reviews
    if review_count < min_reviews:
        return False, f"Insufficient reviews ({review_count} < {min_reviews})"
    
    # Never auto-approve without minimum completeness
    if completeness < completeness_threshold:
        return False, f"Incomplete data ({completeness:.0f}% < {completeness_threshold:.0f}%)"
    
    # All criteria met - auto-approve
    return True, f"Verified listing with {review_count} reviews and {completeness:.0f}% complete"


def get_approval_status(hospital_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get full approval status with reasoning.
    """
    completeness = calculate_completeness_score(hospital_data)
    confidence = calculate_confidence_score(hospital_data)
    
    hospital_data["completeness_score"] = completeness
    hospital_data["confidence_score"] = confidence
    
    should_approve, reason = should_auto_approve(hospital_data)
    
    return {
        "completeness_score": completeness,
        "confidence_score": confidence,
        "auto_approved": should_approve,
        "approval_reason": reason,
        "review_count": hospital_data.get("google_review_count", 0),
        "google_verified": hospital_data.get("google_verified", False),
    }
