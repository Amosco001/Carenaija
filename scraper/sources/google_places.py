import os
import json
import time
import requests
from typing import List, Dict, Optional
from tenacity import retry, stop_after_attempt, wait_exponential

from scraper.sources.base import BaseScraper
from scraper.utils import rate_limiter

NIGERIAN_CITIES = [
    {"name": "Lagos", "state": "Lagos", "lat": 6.5244, "lng": 3.3792},
    {"name": "Abuja", "state": "FCT", "lat": 9.0765, "lng": 7.3986},
    {"name": "Port Harcourt", "state": "Rivers", "lat": 4.8156, "lng": 7.0498},
    {"name": "Kano", "state": "Kano", "lat": 12.0022, "lng": 8.5920},
    {"name": "Ibadan", "state": "Oyo", "lat": 7.3775, "lng": 3.9470},
    {"name": "Kaduna", "state": "Kaduna", "lat": 10.5264, "lng": 7.4388},
    {"name": "Enugu", "state": "Enugu", "lat": 6.4584, "lng": 7.5464},
    {"name": "Benin City", "state": "Edo", "lat": 6.3350, "lng": 5.6270},
    {"name": "Ilorin", "state": "Kwara", "lat": 8.4966, "lng": 4.5426},
    {"name": "Jos", "state": "Plateau", "lat": 9.8965, "lng": 8.8583},
    {"name": "Abeokuta", "state": "Ogun", "lat": 7.1557, "lng": 3.3488},
    {"name": "Akure", "state": "Ondo", "lat": 7.2571, "lng": 5.2058},
    {"name": "Calabar", "state": "Cross River", "lat": 4.9517, "lng": 8.3220},
    {"name": "Warri", "state": "Delta", "lat": 5.5167, "lng": 5.7500},
    {"name": "Uyo", "state": "Akwa Ibom", "lat": 5.0377, "lng": 7.9128},
    {"name": "Owerri", "state": "Imo", "lat": 5.4854, "lng": 7.0353},
    {"name": "Asaba", "state": "Delta", "lat": 6.2095, "lng": 6.7250},
    {"name": "Aba", "state": "Abia", "lat": 5.1066, "lng": 7.3667},
    {"name": "Zaria", "state": "Kaduna", "lat": 11.0855, "lng": 7.7199},
    {"name": "Maiduguri", "state": "Borno", "lat": 11.8469, "lng": 13.1600},
]

SEARCH_QUERIES = [
    "hospital",
    "clinic",
    "medical center",
    "diagnostic center",
    "health center",
    "teaching hospital",
]

class GooglePlacesScraper(BaseScraper):
    
    @property
    def source_name(self) -> str:
        return "google_places"
    
    @property
    def rate_limit(self) -> int:
        return 5
    
    def __init__(self, job_id: Optional[int] = None):
        super().__init__(job_id)
        self.api_key = os.getenv("GOOGLE_PLACES_API_KEY")
        if not self.api_key:
            self.log('warn', 'GOOGLE_PLACES_API_KEY not set - API calls will fail')
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def search_nearby(self, lat: float, lng: float, query: str, radius: int = 10000) -> List[Dict]:
        if not self.api_key:
            raise ValueError("Google Places API key not configured")
        
        rate_limiter.wait(self.source_name, self.rate_limit)
        
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            "location": f"{lat},{lng}",
            "radius": radius,
            "type": "hospital",
            "keyword": query,
            "key": self.api_key,
        }
        
        all_results = []
        next_page_token = None
        
        while True:
            if next_page_token:
                params["pagetoken"] = next_page_token
                time.sleep(2)
            
            start_time = time.time()
            response = requests.get(url, params=params, timeout=30)
            duration = int((time.time() - start_time) * 1000)
            
            self.log('debug', f'Places API search', url=url, 
                    response_status=response.status_code, duration=duration)
            
            data = response.json()
            
            if data.get("status") not in ["OK", "ZERO_RESULTS"]:
                self.log('error', f'API error: {data.get("status")}', 
                        metadata={'error_message': data.get('error_message')})
                break
            
            results = data.get("results", [])
            all_results.extend(results)
            
            next_page_token = data.get("next_page_token")
            if not next_page_token:
                break
        
        return all_results
    
    def get_place_details(self, place_id: str) -> Optional[Dict]:
        if not self.api_key:
            return None
        
        rate_limiter.wait(self.source_name, self.rate_limit)
        
        url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            "place_id": place_id,
            "fields": "name,formatted_address,formatted_phone_number,international_phone_number,website,opening_hours,types,geometry,address_components",
            "key": self.api_key,
        }
        
        start_time = time.time()
        response = requests.get(url, params=params, timeout=30)
        duration = int((time.time() - start_time) * 1000)
        
        self.log('debug', f'Place details', response_status=response.status_code, duration=duration)
        
        data = response.json()
        if data.get("status") == "OK":
            return data.get("result")
        return None
    
    def parse_place_to_hospital(self, place: Dict, city_info: Dict) -> Dict:
        location = place.get("geometry", {}).get("location", {})
        
        types = place.get("types", [])
        if "hospital" in types:
            facility_type = "hospital"
        elif "doctor" in types or "health" in types:
            facility_type = "clinic"
        else:
            facility_type = "medical_facility"
        
        address_components = place.get("address_components", [])
        lga = None
        for component in address_components:
            if "administrative_area_level_2" in component.get("types", []):
                lga = component.get("long_name")
                break
        
        return {
            "name": place.get("name", "").strip(),
            "address": place.get("vicinity") or place.get("formatted_address", ""),
            "city": city_info.get("name"),
            "lga": lga or city_info.get("name"),
            "state": city_info.get("state"),
            "phone": place.get("formatted_phone_number") or place.get("international_phone_number"),
            "email": None,
            "website": place.get("website"),
            "type": facility_type,
            "ownership": None,
            "latitude": location.get("lat"),
            "longitude": location.get("lng"),
            "source_url": f"https://www.google.com/maps/place/?q=place_id:{place.get('place_id')}",
            "source_id": place.get("place_id"),
            "raw_data": place,
            "specialties": [],
            "services": [],
        }
    
    def scrape(self, cities: List[str] = None, queries: List[str] = None, 
               radius: int = 15000) -> List[Dict]:
        if not self.api_key:
            self.log('error', 'Cannot run scrape without GOOGLE_PLACES_API_KEY')
            return []
        
        target_cities = NIGERIAN_CITIES
        if cities:
            target_cities = [c for c in NIGERIAN_CITIES if c["name"].lower() in [x.lower() for x in cities]]
        
        search_queries = queries or SEARCH_QUERIES
        
        all_hospitals = []
        seen_place_ids = set()
        
        for city in target_cities:
            self.log('info', f'Searching in {city["name"]}, {city["state"]}')
            
            for query in search_queries:
                try:
                    results = self.search_nearby(
                        city["lat"], city["lng"], 
                        query, radius=radius
                    )
                    
                    for place in results:
                        place_id = place.get("place_id")
                        if place_id in seen_place_ids:
                            continue
                        seen_place_ids.add(place_id)
                        
                        hospital_data = self.parse_place_to_hospital(place, city)
                        self.process_hospital(hospital_data)
                        all_hospitals.append(hospital_data)
                        
                except Exception as e:
                    self.log('error', f'Error searching {query} in {city["name"]}: {str(e)}')
                    self.stats['errors'] += 1
        
        return all_hospitals


if __name__ == "__main__":
    import sys
    
    scraper = GooglePlacesScraper()
    cities = sys.argv[1:] if len(sys.argv) > 1 else ["Lagos"]
    
    print(f"Scraping hospitals in: {', '.join(cities)}")
    stats = scraper.run(cities=cities)
    print(f"\nResults: {stats}")
