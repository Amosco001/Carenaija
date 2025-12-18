import re
import json
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

from scraper.sources.base import BaseScraper

class NigerianHealthDirectoryScraper(BaseScraper):
    
    @property
    def source_name(self) -> str:
        return "ng_health_directory"
    
    @property
    def rate_limit(self) -> int:
        return 3
    
    def parse_nigerian_phone(self, text: str) -> Optional[str]:
        if not text:
            return None
        patterns = [
            r'(\+234[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{4})',
            r'(0[789][01]\d{8})',
            r'(0[789][01][\s\-]?\d{3}[\s\-]?\d{4})',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return re.sub(r'[\s\-]', '', match.group(1))
        return None
    
    def parse_email(self, text: str) -> Optional[str]:
        if not text:
            return None
        match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        return match.group(0) if match else None
    
    def extract_state_from_address(self, address: str) -> Optional[str]:
        nigerian_states = [
            "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
            "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
            "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna",
            "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
            "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
            "Sokoto", "Taraba", "Yobe", "Zamfara"
        ]
        if address:
            for state in nigerian_states:
                if state.lower() in address.lower():
                    return state
        return None
    
    def scrape_generic_directory(self, url: str, config: Dict) -> List[Dict]:
        hospitals = []
        try:
            response = self.fetch_url(url)
            soup = BeautifulSoup(response.content, 'lxml')
            
            item_selector = config.get('item_selector', '.hospital-item')
            items = soup.select(item_selector)
            
            for item in items:
                try:
                    name_el = item.select_one(config.get('name_selector', '.name'))
                    address_el = item.select_one(config.get('address_selector', '.address'))
                    phone_el = item.select_one(config.get('phone_selector', '.phone'))
                    
                    if not name_el:
                        continue
                    
                    name = name_el.get_text(strip=True)
                    address = address_el.get_text(strip=True) if address_el else None
                    phone_text = phone_el.get_text(strip=True) if phone_el else None
                    
                    hospital_data = {
                        "name": name,
                        "address": address,
                        "city": None,
                        "lga": None,
                        "state": self.extract_state_from_address(address or ""),
                        "phone": self.parse_nigerian_phone(phone_text) if phone_text else None,
                        "email": None,
                        "website": None,
                        "type": "hospital",
                        "ownership": None,
                        "latitude": None,
                        "longitude": None,
                        "source_url": url,
                        "source_id": f"{self.source_name}_{hash(name + (address or ''))}",
                        "raw_data": {"html": str(item)[:500]},
                        "specialties": [],
                        "services": [],
                    }
                    
                    self.process_hospital(hospital_data)
                    hospitals.append(hospital_data)
                    
                except Exception as e:
                    self.log('error', f'Error parsing item: {str(e)}')
                    self.stats['errors'] += 1
                    
        except Exception as e:
            self.log('error', f'Error fetching {url}: {str(e)}')
            self.stats['errors'] += 1
        
        return hospitals
    
    def scrape(self, urls: List[Dict] = None) -> List[Dict]:
        default_sources = [
            {
                "url": "https://hospitals.ng/hospitals",
                "config": {
                    "item_selector": ".hospital-card, .listing-item",
                    "name_selector": "h3, .title, .name",
                    "address_selector": ".address, .location",
                    "phone_selector": ".phone, .contact",
                }
            },
        ]
        
        sources = urls or default_sources
        all_hospitals = []
        
        for source in sources:
            self.log('info', f'Scraping: {source.get("url")}')
            hospitals = self.scrape_generic_directory(
                source["url"],
                source.get("config", {})
            )
            all_hospitals.extend(hospitals)
        
        return all_hospitals


class HMODirectoryScraper(BaseScraper):
    
    @property
    def source_name(self) -> str:
        return "hmo_directory"
    
    @property
    def rate_limit(self) -> int:
        return 2
    
    HMO_SOURCES = {
        "hygeia": {
            "name": "Hygeia HMO",
            "base_url": "https://www.hygeiagroup.com",
            "provider_list_path": "/provider-network",
        },
        "reliance": {
            "name": "Reliance HMO",
            "base_url": "https://www.reliancehmo.com",
            "provider_list_path": "/hospitals",
        },
        "leadway": {
            "name": "Leadway Health",
            "base_url": "https://www.leadway-health.com",
            "provider_list_path": "/providers",
        }
    }
    
    def scrape_hmo_providers(self, hmo_key: str) -> List[Dict]:
        hospitals = []
        hmo_config = self.HMO_SOURCES.get(hmo_key)
        
        if not hmo_config:
            self.log('warn', f'Unknown HMO: {hmo_key}')
            return hospitals
        
        url = urljoin(hmo_config["base_url"], hmo_config["provider_list_path"])
        
        try:
            response = self.fetch_url(url)
            soup = BeautifulSoup(response.content, 'lxml')
            
            provider_items = soup.select('.provider, .hospital, .facility, [class*="provider"], [class*="hospital"]')
            
            for item in provider_items[:50]:
                try:
                    name_el = item.select_one('h2, h3, h4, .name, .title, strong')
                    if not name_el:
                        continue
                    
                    name = name_el.get_text(strip=True)
                    
                    address_el = item.select_one('.address, .location, p')
                    address = address_el.get_text(strip=True) if address_el else None
                    
                    phone_el = item.select_one('.phone, .tel, [href^="tel:"]')
                    phone = None
                    if phone_el:
                        phone_text = phone_el.get('href', '') or phone_el.get_text(strip=True)
                        phone = re.sub(r'tel:', '', phone_text).strip()
                    
                    hospital_data = {
                        "name": name,
                        "address": address,
                        "city": None,
                        "lga": None,
                        "state": None,
                        "phone": phone,
                        "email": None,
                        "website": hmo_config["base_url"],
                        "type": "hospital",
                        "ownership": None,
                        "latitude": None,
                        "longitude": None,
                        "source_url": url,
                        "source_id": f"hmo_{hmo_key}_{hash(name)}",
                        "raw_data": {"hmo": hmo_config["name"], "html": str(item)[:500]},
                        "specialties": [],
                        "services": [],
                    }
                    
                    self.process_hospital(hospital_data)
                    hospitals.append(hospital_data)
                    
                except Exception as e:
                    self.log('error', f'Error parsing HMO provider: {str(e)}')
                    self.stats['errors'] += 1
                    
        except Exception as e:
            self.log('error', f'Error scraping {hmo_key}: {str(e)}')
            self.stats['errors'] += 1
        
        return hospitals
    
    def scrape(self, hmo_keys: List[str] = None) -> List[Dict]:
        target_hmos = hmo_keys or list(self.HMO_SOURCES.keys())
        all_hospitals = []
        
        for hmo_key in target_hmos:
            self.log('info', f'Scraping HMO: {hmo_key}')
            hospitals = self.scrape_hmo_providers(hmo_key)
            all_hospitals.extend(hospitals)
        
        return all_hospitals


if __name__ == "__main__":
    scraper = NigerianHealthDirectoryScraper()
    stats = scraper.run()
    print(f"\nDirectory Results: {stats}")
