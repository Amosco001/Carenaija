import re
from difflib import SequenceMatcher
from typing import List, Dict, Optional, Tuple
from math import radians, sin, cos, sqrt, atan2

def normalize_name(name: str) -> str:
    if not name:
        return ""
    name = name.lower().strip()
    name = re.sub(r'\s+(hospital|clinic|medical center|health center|diagnostic|centre)s?\s*$', '', name, flags=re.IGNORECASE)
    name = re.sub(r'^(the|st\.?|saint|dr\.?|doctor)\s+', '', name, flags=re.IGNORECASE)
    name = re.sub(r'[^\w\s]', '', name)
    name = re.sub(r'\s+', ' ', name)
    return name.strip()

def normalize_phone(phone: str) -> str:
    if not phone:
        return ""
    digits = re.sub(r'\D', '', phone)
    if digits.startswith('234'):
        digits = '0' + digits[3:]
    elif digits.startswith('+234'):
        digits = '0' + digits[4:]
    return digits

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    if not all([lat1, lon1, lat2, lon2]):
        return float('inf')
    R = 6371
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

def string_similarity(s1: str, s2: str) -> float:
    if not s1 or not s2:
        return 0.0
    return SequenceMatcher(None, s1.lower(), s2.lower()).ratio()

def calculate_duplicate_score(new_hospital: Dict, existing_hospital: Dict) -> Tuple[float, Dict]:
    scores = {}
    name1 = normalize_name(new_hospital.get('name', ''))
    name2 = normalize_name(existing_hospital.get('name', ''))
    name_sim = string_similarity(name1, name2)
    scores['name_similarity'] = name_sim
    
    phone1 = normalize_phone(new_hospital.get('phone', ''))
    phone2 = normalize_phone(existing_hospital.get('phone', ''))
    phone_match = 1.0 if phone1 and phone2 and phone1 == phone2 else 0.0
    scores['phone_match'] = phone_match
    
    distance = haversine_distance(
        new_hospital.get('latitude'), new_hospital.get('longitude'),
        existing_hospital.get('latitude'), existing_hospital.get('longitude')
    )
    if distance < 0.1:
        location_score = 1.0
    elif distance < 0.5:
        location_score = 0.8
    elif distance < 1.0:
        location_score = 0.5
    elif distance < 2.0:
        location_score = 0.3
    else:
        location_score = 0.0
    scores['location_score'] = location_score
    scores['distance_km'] = distance
    
    state1 = (new_hospital.get('state') or '').lower()
    state2 = (existing_hospital.get('state') or '').lower()
    state_match = 1.0 if state1 and state2 and state1 == state2 else 0.0
    scores['state_match'] = state_match
    
    city1 = (new_hospital.get('city') or '').lower()
    city2 = (existing_hospital.get('city') or '').lower()
    city_sim = string_similarity(city1, city2)
    scores['city_similarity'] = city_sim
    
    addr1 = (new_hospital.get('address') or '').lower()
    addr2 = (existing_hospital.get('address') or '').lower()
    addr_sim = string_similarity(addr1, addr2) if addr1 and addr2 else 0.0
    scores['address_similarity'] = addr_sim
    
    weights = {
        'name_similarity': 0.35,
        'phone_match': 0.25,
        'location_score': 0.20,
        'address_similarity': 0.10,
        'city_similarity': 0.05,
        'state_match': 0.05
    }
    
    final_score = sum(scores.get(k, 0) * v for k, v in weights.items())
    
    if phone_match == 1.0 and name_sim > 0.7:
        final_score = max(final_score, 0.95)
    
    if location_score == 1.0 and name_sim > 0.8:
        final_score = max(final_score, 0.90)
    
    return final_score, scores

def find_potential_duplicates(
    new_hospital: Dict, 
    existing_hospitals: List[Dict],
    threshold: float = 0.7
) -> List[Tuple[Dict, float, Dict]]:
    duplicates = []
    
    for existing in existing_hospitals:
        score, details = calculate_duplicate_score(new_hospital, existing)
        if score >= threshold:
            duplicates.append((existing, score, details))
    
    duplicates.sort(key=lambda x: x[1], reverse=True)
    return duplicates

def is_likely_duplicate(new_hospital: Dict, existing_hospitals: List[Dict]) -> Optional[Tuple[int, float]]:
    duplicates = find_potential_duplicates(new_hospital, existing_hospitals, threshold=0.75)
    if duplicates:
        best_match = duplicates[0]
        return (best_match[0]['id'], best_match[1])
    return None
