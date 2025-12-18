import os
import json
import time
import requests
from typing import List, Dict, Optional, Any
from tenacity import retry, stop_after_attempt, wait_exponential

from scraper.sources.base import BaseScraper
from scraper.utils import rate_limiter
from scraper.utils.cache import get_cached, set_cached
from scraper.utils.scoring import calculate_completeness_score, calculate_confidence_score, should_auto_approve
from scraper.data.nigerian_locations import (
    get_all_search_locations, 
    SEARCH_QUERIES, 
    GOOGLE_CATEGORY_MAPPING,
    API_COST_ESTIMATES,
    estimate_discovery_cost
)

class GooglePlacesScraper(BaseScraper):
    
    @property
    def source_name(self) -> str:
        return "google_places"
    
    @property
    def rate_limit(self) -> int:
        return 5
    
    def __init__(self, job_id: Optional[int] = None, use_cache: bool = True):
        super().__init__(job_id)
        self.api_key = os.getenv("GOOGLE_PLACES_API_KEY")
        self.use_cache = use_cache
        self.api_calls = {
            "nearby_search": 0,
            "place_details": 0,
            "photos": 0,
        }
        if not self.api_key:
            self.log('warn', 'GOOGLE_PLACES_API_KEY not set - API calls will fail')
    
    def get_estimated_cost(self) -> Dict[str, Any]:
        """Calculate estimated API cost based on calls made."""
        cost = (
            self.api_calls["nearby_search"] * API_COST_ESTIMATES["nearby_search"] +
            self.api_calls["place_details"] * (API_COST_ESTIMATES["place_details_basic"] + API_COST_ESTIMATES["place_details_contact"]) +
            self.api_calls["photos"] * API_COST_ESTIMATES["photo"]
        )
        return {
            "api_calls": self.api_calls.copy(),
            "estimated_cost_usd": round(cost, 4),
        }
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def search_nearby(self, lat: float, lng: float, query: str, radius: int = 10000) -> List[Dict]:
        """Search for places near a location."""
        if not self.api_key:
            raise ValueError("Google Places API key not configured")
        
        cache_key = f"nearby_{lat}_{lng}_{query}_{radius}"
        if self.use_cache:
            cached = get_cached(cache_key)
            if cached is not None:
                self.log('debug', f'Cache hit for nearby search', cache_key=cache_key)
                return cached
        
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
            self.api_calls["nearby_search"] += 1
            
            self.log('debug', f'Places API nearby search', url=url, 
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
        
        if self.use_cache and all_results:
            set_cached(cache_key, all_results)
        
        return all_results
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def text_search(self, query: str, location: Optional[Dict] = None) -> List[Dict]:
        """Search for places using text query."""
        if not self.api_key:
            raise ValueError("Google Places API key not configured")
        
        cache_key = f"text_{query}_{location.get('lat') if location else 'none'}"
        if self.use_cache:
            cached = get_cached(cache_key)
            if cached is not None:
                return cached
        
        rate_limiter.wait(self.source_name, self.rate_limit)
        
        url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        params = {
            "query": query,
            "key": self.api_key,
        }
        
        if location:
            params["location"] = f"{location['lat']},{location['lng']}"
            params["radius"] = 15000
        
        all_results = []
        next_page_token = None
        
        while True:
            if next_page_token:
                params["pagetoken"] = next_page_token
                time.sleep(2)
            
            response = requests.get(url, params=params, timeout=30)
            self.api_calls["nearby_search"] += 1
            data = response.json()
            
            if data.get("status") not in ["OK", "ZERO_RESULTS"]:
                break
            
            all_results.extend(data.get("results", []))
            next_page_token = data.get("next_page_token")
            if not next_page_token:
                break
        
        if self.use_cache and all_results:
            set_cached(cache_key, all_results)
        
        return all_results
    
    def get_place_details(self, place_id: str) -> Optional[Dict]:
        """Get detailed information about a place."""
        if not self.api_key:
            return None
        
        cache_key = f"details_{place_id}"
        if self.use_cache:
            cached = get_cached(cache_key)
            if cached is not None:
                return cached
        
        rate_limiter.wait(self.source_name, self.rate_limit)
        
        url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            "place_id": place_id,
            "fields": ",".join([
                "name",
                "formatted_address",
                "formatted_phone_number",
                "international_phone_number",
                "website",
                "opening_hours",
                "types",
                "geometry",
                "address_components",
                "rating",
                "user_ratings_total",
                "photos",
                "reviews",
                "business_status",
                "url",
            ]),
            "key": self.api_key,
        }
        
        start_time = time.time()
        response = requests.get(url, params=params, timeout=30)
        duration = int((time.time() - start_time) * 1000)
        self.api_calls["place_details"] += 1
        
        self.log('debug', f'Place details', response_status=response.status_code, duration=duration)
        
        data = response.json()
        if data.get("status") == "OK":
            result = data.get("result")
            if self.use_cache:
                set_cached(cache_key, result)
            return result
        return None
    
    def get_photo_urls(self, photos: List[Dict], max_photos: int = 5) -> List[str]:
        """Get URLs for place photos."""
        if not self.api_key or not photos:
            return []
        
        photo_urls = []
        for photo in photos[:max_photos]:
            photo_ref = photo.get("photo_reference")
            if photo_ref:
                url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference={photo_ref}&key={self.api_key}"
                photo_urls.append(url)
                self.api_calls["photos"] += 1
        
        return photo_urls
    
    def map_google_category(self, types: List[str]) -> str:
        """Map Google place types to CareNaija categories."""
        for t in types:
            if t in GOOGLE_CATEGORY_MAPPING and GOOGLE_CATEGORY_MAPPING[t]:
                return GOOGLE_CATEGORY_MAPPING[t]
        
        if "hospital" in types:
            return "hospital"
        elif "doctor" in types or "health" in types:
            return "clinic"
        elif "dentist" in types:
            return "dental_clinic"
        elif "pharmacy" in types:
            return "pharmacy"
        
        return "medical_facility"
    
    def parse_place_to_hospital(self, place: Dict, location_info: Dict, include_details: bool = True) -> Dict:
        """Convert Google Places data to hospital format with enhanced fields."""
        place_id = place.get("place_id")
        
        details = None
        if include_details and place_id:
            details = self.get_place_details(place_id)
        
        combined = {**place, **(details or {})}
        
        location = combined.get("geometry", {}).get("location", {})
        types = combined.get("types", [])
        
        address_components = combined.get("address_components", [])
        lga = None
        city = location_info.get("city") or location_info.get("name")
        state = location_info.get("state")
        
        for component in address_components:
            comp_types = component.get("types", [])
            if "administrative_area_level_2" in comp_types:
                lga = component.get("long_name")
            if "administrative_area_level_1" in comp_types and not state:
                state = component.get("long_name")
            if "locality" in comp_types and not city:
                city = component.get("long_name")
        
        photos = combined.get("photos", [])
        photo_urls = self.get_photo_urls(photos) if photos else []
        
        opening_hours = combined.get("opening_hours", {})
        hours_data = {
            "periods": opening_hours.get("periods", []),
            "weekday_text": opening_hours.get("weekday_text", []),
            "open_now": opening_hours.get("open_now"),
        } if opening_hours else None
        
        google_reviews = []
        if combined.get("reviews"):
            for review in combined["reviews"][:5]:
                google_reviews.append({
                    "author": review.get("author_name"),
                    "rating": review.get("rating"),
                    "text": review.get("text"),
                    "time": review.get("time"),
                    "relative_time": review.get("relative_time_description"),
                })
        
        hospital_data = {
            "name": combined.get("name", "").strip(),
            "address": combined.get("formatted_address") or combined.get("vicinity", ""),
            "city": city,
            "lga": lga or city,
            "state": state,
            "phone": combined.get("formatted_phone_number") or combined.get("international_phone_number"),
            "email": None,
            "website": combined.get("website"),
            "type": self.map_google_category(types),
            "ownership": None,
            "latitude": location.get("lat"),
            "longitude": location.get("lng"),
            "source_url": combined.get("url") or f"https://www.google.com/maps/place/?q=place_id:{place_id}",
            "source_id": place_id,
            "google_rating": combined.get("rating"),
            "google_review_count": combined.get("user_ratings_total"),
            "google_photos": photo_urls,
            "google_opening_hours": hours_data,
            "google_categories": types,
            "google_verified": combined.get("business_status") == "OPERATIONAL",
            "google_reviews": google_reviews,
            "raw_data": combined,
            "specialties": [],
            "services": [],
        }
        
        hospital_data["completeness_score"] = calculate_completeness_score(hospital_data)
        hospital_data["confidence_score"] = calculate_confidence_score(hospital_data)
        
        should_approve, reason = should_auto_approve(hospital_data)
        hospital_data["auto_approved"] = should_approve
        hospital_data["approval_reason"] = reason
        
        return hospital_data
    
    def scrape(self, 
               cities: List[str] = None, 
               states: List[str] = None,
               tier: int = None,
               queries: List[str] = None, 
               radius: int = 15000,
               include_details: bool = True,
               auto_approve_enabled: bool = True) -> List[Dict]:
        """
        Scrape hospitals from Google Places API.
        
        Args:
            cities: List of city names to search (optional)
            states: List of state names to filter by (optional)
            tier: Only search locations of this tier (1=major, 2=medium, 3=smaller)
            queries: Search queries to use (default: all medical facility types)
            radius: Search radius in meters (default: 15000)
            include_details: Fetch full place details (costs more API calls)
            auto_approve_enabled: Enable auto-approval for high-quality listings
        """
        if not self.api_key:
            self.log('error', 'Cannot run scrape without GOOGLE_PLACES_API_KEY')
            return []
        
        all_locations = get_all_search_locations()
        
        if cities:
            cities_lower = [c.lower() for c in cities]
            all_locations = [loc for loc in all_locations 
                           if loc["name"].lower() in cities_lower or 
                           any(c in loc["name"].lower() for c in cities_lower)]
        
        if states:
            states_lower = [s.lower() for s in states]
            all_locations = [loc for loc in all_locations 
                           if loc["state"].lower() in states_lower]
        
        if tier:
            all_locations = [loc for loc in all_locations if loc.get("tier") == tier]
        
        search_queries = queries or SEARCH_QUERIES
        
        all_hospitals = []
        seen_place_ids = set()
        
        self.log('info', f'Starting search across {len(all_locations)} locations with {len(search_queries)} queries')
        
        for i, location in enumerate(all_locations):
            self.log('info', f'[{i+1}/{len(all_locations)}] Searching in {location["name"]}, {location["state"]}')
            
            for query in search_queries:
                try:
                    results = self.search_nearby(
                        location["lat"], location["lng"], 
                        query, radius=radius
                    )
                    
                    for place in results:
                        place_id = place.get("place_id")
                        if place_id in seen_place_ids:
                            continue
                        seen_place_ids.add(place_id)
                        
                        hospital_data = self.parse_place_to_hospital(
                            place, location, include_details=include_details
                        )
                        
                        if auto_approve_enabled and hospital_data.get("auto_approved"):
                            hospital_data["status"] = "approved"
                            self.log('info', f'Auto-approved: {hospital_data["name"]} ({hospital_data.get("approval_reason")})')
                        
                        self.process_hospital(hospital_data)
                        all_hospitals.append(hospital_data)
                        
                except Exception as e:
                    self.log('error', f'Error searching {query} in {location["name"]}: {str(e)}')
                    self.stats['errors'] += 1
        
        cost_info = self.get_estimated_cost()
        self.log('info', f'Scraping complete. API cost estimate: ${cost_info["estimated_cost_usd"]:.4f}', 
                metadata=cost_info)
        
        return all_hospitals
    
    def discover_all_nigeria(self, 
                            include_neighborhoods: bool = True,
                            include_details: bool = True) -> Dict[str, Any]:
        """
        Run comprehensive discovery across all of Nigeria.
        Returns statistics and cost information.
        """
        if include_neighborhoods:
            hospitals = self.scrape(include_details=include_details)
        else:
            hospitals = self.scrape(tier=None, include_details=include_details)
        
        auto_approved = sum(1 for h in hospitals if h.get("auto_approved"))
        manual_review = len(hospitals) - auto_approved
        
        avg_completeness = sum(h.get("completeness_score", 0) for h in hospitals) / len(hospitals) if hospitals else 0
        avg_confidence = sum(h.get("confidence_score", 0) for h in hospitals) / len(hospitals) if hospitals else 0
        
        return {
            "total_discovered": len(hospitals),
            "auto_approved": auto_approved,
            "pending_review": manual_review,
            "average_completeness": round(avg_completeness, 1),
            "average_confidence": round(avg_confidence, 1),
            "api_costs": self.get_estimated_cost(),
            "stats": self.stats,
        }


def get_cost_estimate(num_cities: int = 36, include_neighborhoods: bool = True) -> Dict[str, Any]:
    """Get cost estimate for running discovery."""
    return estimate_discovery_cost(
        num_cities=num_cities,
        num_queries=len(SEARCH_QUERIES),
    )


if __name__ == "__main__":
    import sys
    
    scraper = GooglePlacesScraper()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--estimate":
        estimate = get_cost_estimate()
        print("\n=== API Cost Estimate ===")
        print(f"Searches: {estimate['searches']}")
        print(f"Estimated places: {estimate['estimated_places']}")
        print(f"Search cost: ${estimate['search_cost']}")
        print(f"Details cost: ${estimate['details_cost']}")
        print(f"Photo cost: ${estimate['photo_cost']}")
        print(f"Total per run: ${estimate['total_estimated_cost']}")
        print(f"Monthly (daily runs): ${estimate['monthly_cost_daily_runs']}")
    else:
        cities = sys.argv[1:] if len(sys.argv) > 1 else ["Lagos"]
        print(f"Scraping hospitals in: {', '.join(cities)}")
        stats = scraper.run(cities=cities)
        print(f"\nResults: {stats}")
        print(f"API Costs: {scraper.get_estimated_cost()}")
