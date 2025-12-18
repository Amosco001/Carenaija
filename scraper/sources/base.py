import time
import json
import requests
from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Any
from datetime import datetime
from fake_useragent import UserAgent
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from scraper.utils import (
    insert_pending_hospital,
    check_source_id_exists,
    get_existing_hospitals,
    log_scraping_activity,
    is_likely_duplicate,
    rate_limiter,
)

class BaseScraper(ABC):
    def __init__(self, job_id: Optional[int] = None):
        self.job_id = job_id
        self.user_agent = UserAgent()
        self.session = requests.Session()
        self.existing_hospitals = []
        self.stats = {
            'processed': 0,
            'discovered': 0,
            'duplicates': 0,
            'errors': 0,
        }
    
    @property
    @abstractmethod
    def source_name(self) -> str:
        pass
    
    @property
    def rate_limit(self) -> int:
        return 10
    
    def get_headers(self) -> Dict[str, str]:
        return {
            'User-Agent': self.user_agent.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
    
    def log(self, level: str, message: str, url: str = None, 
            response_status: int = None, duration: int = None, metadata: Dict = None):
        log_data = {
            'job_id': self.job_id,
            'level': level,
            'message': message,
            'source': self.source_name,
            'url': url,
            'response_status': response_status,
            'duration': duration,
            'metadata': json.dumps(metadata) if metadata else None,
        }
        try:
            log_scraping_activity(log_data)
        except Exception as e:
            print(f"[{level.upper()}] {self.source_name}: {message}")
    
    def load_existing_hospitals(self):
        self.existing_hospitals = get_existing_hospitals()
        self.log('info', f'Loaded {len(self.existing_hospitals)} existing hospitals for deduplication')
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((requests.RequestException, requests.Timeout))
    )
    def fetch_url(self, url: str, **kwargs) -> requests.Response:
        rate_limiter.wait(self.source_name, self.rate_limit)
        start_time = time.time()
        
        headers = {**self.get_headers(), **kwargs.pop('headers', {})}
        response = self.session.get(url, headers=headers, timeout=30, **kwargs)
        
        duration = int((time.time() - start_time) * 1000)
        self.log('debug', f'Fetched URL', url=url, response_status=response.status_code, duration=duration)
        
        response.raise_for_status()
        return response
    
    def process_hospital(self, hospital_data: Dict) -> Optional[int]:
        self.stats['processed'] += 1
        
        source_id = hospital_data.get('source_id')
        if source_id and check_source_id_exists(self.source_name, source_id):
            self.log('debug', f"Skipping already processed: {hospital_data.get('name')}")
            return None
        
        duplicate = is_likely_duplicate(hospital_data, self.existing_hospitals)
        if duplicate:
            hospital_data['duplicate_of_id'] = duplicate[0]
            hospital_data['duplicate_score'] = duplicate[1]
            hospital_data['status'] = 'duplicate'
            self.stats['duplicates'] += 1
            self.log('info', f"Duplicate found: {hospital_data.get('name')} (score: {duplicate[1]:.2f})")
        else:
            hospital_data['duplicate_of_id'] = None
            hospital_data['duplicate_score'] = None
            self.stats['discovered'] += 1
        
        hospital_data['source_name'] = self.source_name
        hospital_data.setdefault('specialties', [])
        hospital_data.setdefault('services', [])
        
        if hospital_data.get('raw_data') and isinstance(hospital_data['raw_data'], dict):
            hospital_data['raw_data'] = json.dumps(hospital_data['raw_data'])
        
        try:
            pending_id = insert_pending_hospital(hospital_data)
            self.log('info', f"Added pending hospital: {hospital_data.get('name')} (ID: {pending_id})")
            return pending_id
        except Exception as e:
            self.stats['errors'] += 1
            self.log('error', f"Failed to insert hospital: {str(e)}", metadata={'data': hospital_data})
            return None
    
    @abstractmethod
    def scrape(self, **kwargs) -> List[Dict]:
        pass
    
    def run(self, **kwargs) -> Dict[str, int]:
        self.log('info', f'Starting scrape job')
        self.load_existing_hospitals()
        
        try:
            results = self.scrape(**kwargs)
            self.log('info', f'Scrape completed', metadata=self.stats)
        except Exception as e:
            self.log('error', f'Scrape failed: {str(e)}')
            raise
        
        return self.stats
