import os
import re
import json
import time
import feedparser
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from bs4 import BeautifulSoup
from newspaper import Article

from scraper.sources.base import BaseScraper
from scraper.utils import rate_limiter
from scraper.utils.cache import get_cached, set_cached

NIGERIAN_NEWS_SOURCES = [
    {
        "name": "punch_ng",
        "display_name": "Punch Nigeria",
        "rss_url": "https://punchng.com/topics/health/feed/",
        "type": "rss",
        "category": "health",
    },
    {
        "name": "vanguard_ng",
        "display_name": "Vanguard Nigeria",
        "rss_url": "https://www.vanguardngr.com/category/health/feed/",
        "type": "rss",
        "category": "health",
    },
    {
        "name": "guardian_ng",
        "display_name": "Guardian Nigeria",
        "rss_url": "https://guardian.ng/category/features/health/feed/",
        "type": "rss",
        "category": "health",
    },
    {
        "name": "premium_times",
        "display_name": "Premium Times",
        "rss_url": "https://www.premiumtimesng.com/category/health/feed",
        "type": "rss",
        "category": "health",
    },
    {
        "name": "this_day",
        "display_name": "This Day Live",
        "rss_url": "https://www.thisdaylive.com/index.php/category/news/feed/",
        "type": "rss",
        "category": "news",
    },
]

HOSPITAL_KEYWORDS = [
    "hospital opening", "hospital opens", "new hospital", "new clinic",
    "hospital launch", "health facility", "medical center opens",
    "healthcare facility", "hospital commissioning", "hospital inaugurated",
    "primary health center", "teaching hospital", "specialist hospital",
    "diagnostic center", "medical centre", "health centre",
    "hospital expansion", "hospital upgrade", "new ward", "new wing",
    "hospital renovation", "hospital remodeling",
]

NIGERIAN_STATES = [
    "Lagos", "Kano", "Kaduna", "Oyo", "Rivers", "Ogun", "Anambra", 
    "Borno", "Abia", "Delta", "Imo", "Plateau", "Edo", "Enugu", 
    "Kwara", "Cross River", "Katsina", "Niger", "Akwa Ibom", "Osun",
    "Benue", "Sokoto", "Bauchi", "Taraba", "Kebbi", "Jigawa", 
    "Ondo", "Ekiti", "Kogi", "Adamawa", "Zamfara", "Ebonyi", 
    "Gombe", "Yobe", "Nasarawa", "Bayelsa", "FCT", "Abuja"
]

NIGERIAN_CITIES = [
    "Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan", "Kaduna",
    "Benin City", "Enugu", "Ilorin", "Jos", "Calabar", "Warri",
    "Uyo", "Owerri", "Abeokuta", "Akure", "Asaba", "Aba", "Zaria",
    "Maiduguri", "Onitsha", "Awka", "Osogbo", "Yola", "Makurdi"
]

HOSPITAL_PATTERNS = [
    r"(?P<name>[A-Z][a-zA-Z\s]+(?:Hospital|Clinic|Medical|Health|Diagnostic)(?:\s+(?:Center|Centre|Complex|Specialist))?)",
    r"(?P<name>(?:University|Teaching|Federal|State|General|Specialist|Private)\s+(?:Hospital|Medical\s+Center))",
    r"(?P<name>[A-Z][a-zA-Z\s]+(?:PHC|Primary\s+Health\s+(?:Center|Centre)))",
]


class NewsMonitorScraper(BaseScraper):
    
    @property
    def source_name(self) -> str:
        return "news_monitor"
    
    @property
    def rate_limit(self) -> int:
        return 2  # Be polite with news sites
    
    def __init__(self, job_id: Optional[int] = None, use_cache: bool = True):
        super().__init__(job_id)
        self.use_cache = use_cache
        self.processed_urls = set()
    
    def fetch_rss_feed(self, source: Dict) -> List[Dict]:
        """Fetch and parse RSS feed."""
        cache_key = f"rss_{source['name']}_{datetime.now().strftime('%Y%m%d')}"
        if self.use_cache:
            cached = get_cached(cache_key, ttl=21600)  # 6 hour cache
            if cached:
                self.log('debug', f"Cache hit for {source['name']}")
                return cached
        
        rate_limiter.wait(self.source_name, self.rate_limit)
        
        try:
            feed = feedparser.parse(source['rss_url'])
            if feed.bozo:
                self.log('warn', f"Feed parsing issue: {source['name']}", 
                        metadata={'error': str(feed.bozo_exception)})
            
            articles = []
            for entry in feed.entries[:20]:  # Limit to recent 20
                article = {
                    'title': entry.get('title', ''),
                    'link': entry.get('link', ''),
                    'summary': entry.get('summary', ''),
                    'published': entry.get('published', ''),
                    'source_name': source['name'],
                    'source_display': source['display_name'],
                }
                articles.append(article)
            
            if self.use_cache and articles:
                set_cached(cache_key, articles)
            
            self.log('info', f"Fetched {len(articles)} articles from {source['name']}")
            return articles
            
        except Exception as e:
            self.log('error', f"Failed to fetch RSS: {source['name']}", 
                    metadata={'error': str(e)})
            return []
    
    def extract_article_content(self, url: str) -> Optional[str]:
        """Extract full article text using newspaper3k."""
        cache_key = f"article_{hash(url)}"
        if self.use_cache:
            cached = get_cached(cache_key, ttl=86400 * 7)  # 7 day cache
            if cached:
                return cached
        
        try:
            rate_limiter.wait(self.source_name, self.rate_limit)
            
            article = Article(url)
            article.download()
            article.parse()
            
            content = article.text
            if self.use_cache and content:
                set_cached(cache_key, content)
            
            return content
            
        except Exception as e:
            self.log('warn', f"Failed to extract article: {url}", 
                    metadata={'error': str(e)})
            return None
    
    def is_healthcare_related(self, text: str) -> bool:
        """Check if article is related to healthcare facilities."""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in HOSPITAL_KEYWORDS)
    
    def extract_hospital_name(self, text: str) -> Optional[str]:
        """Extract hospital/clinic name from text using patterns."""
        for pattern in HOSPITAL_PATTERNS:
            matches = re.findall(pattern, text)
            if matches:
                name = matches[0] if isinstance(matches[0], str) else matches[0][0]
                # Clean up the name
                name = re.sub(r'\s+', ' ', name).strip()
                if len(name) > 5 and len(name) < 100:
                    return name
        return None
    
    def extract_location(self, text: str) -> Dict[str, Optional[str]]:
        """Extract city and state from text."""
        city = None
        state = None
        
        # Check for state mentions
        for s in NIGERIAN_STATES:
            pattern = rf'\b{s}\s*(?:State)?\b'
            if re.search(pattern, text, re.IGNORECASE):
                state = s
                break
        
        # Check for city mentions
        for c in NIGERIAN_CITIES:
            if re.search(rf'\b{c}\b', text, re.IGNORECASE):
                city = c
                break
        
        return {'city': city, 'state': state}
    
    def detect_event_type(self, text: str) -> str:
        """Detect the type of hospital event."""
        text_lower = text.lower()
        
        if any(w in text_lower for w in ['opening', 'opens', 'launch', 'inaugurate', 'commission']):
            return 'opening'
        elif any(w in text_lower for w in ['expansion', 'expand', 'new wing', 'new ward']):
            return 'expansion'
        elif any(w in text_lower for w in ['renovation', 'upgrade', 'remodel', 'refurbish']):
            return 'renovation'
        elif any(w in text_lower for w in ['close', 'closing', 'shut down', 'shutdown']):
            return 'closure'
        
        return 'unknown'
    
    def calculate_credibility(self, source_name: str, article: Dict) -> float:
        """Calculate credibility score based on source and content."""
        score = 50.0
        
        # Source credibility
        trusted_sources = ['punch_ng', 'vanguard_ng', 'guardian_ng', 'premium_times']
        if source_name in trusted_sources:
            score += 20
        
        # Has publish date
        if article.get('published'):
            score += 10
        
        # Has substantial content
        if len(article.get('summary', '')) > 100:
            score += 10
        
        # Has hospital name extracted
        if article.get('hospital_name'):
            score += 10
        
        return min(score, 100)
    
    def process_article(self, article: Dict) -> Optional[Dict]:
        """Process a single article and extract healthcare facility info."""
        url = article.get('link', '')
        if url in self.processed_urls:
            return None
        self.processed_urls.add(url)
        
        # Check if title/summary mentions healthcare
        combined_text = f"{article.get('title', '')} {article.get('summary', '')}"
        if not self.is_healthcare_related(combined_text):
            return None
        
        # Get full article content for better extraction
        full_text = self.extract_article_content(url)
        if full_text:
            combined_text = f"{combined_text} {full_text}"
        
        # Extract entities
        hospital_name = self.extract_hospital_name(combined_text)
        location = self.extract_location(combined_text)
        event_type = self.detect_event_type(combined_text)
        
        # Build submission
        submission = {
            'source_type': 'rss',
            'source_name': article.get('source_name'),
            'source_url': url,
            'headline': article.get('title'),
            'excerpt': article.get('summary', '')[:500],
            'raw_text': combined_text[:5000],
            'published_at': article.get('published'),
            'hospital_name': hospital_name,
            'city': location['city'],
            'state': location['state'],
            'event_type': event_type,
            'geo_confidence': 0.8 if location['city'] and location['state'] else 0.5 if location['state'] else 0.3,
            'credibility_score': self.calculate_credibility(article.get('source_name', ''), {
                **article, 'hospital_name': hospital_name
            }),
        }
        
        return submission
    
    def scrape(self, sources: List[str] = None, days_back: int = 7) -> List[Dict]:
        """
        Scrape news sources for healthcare facility mentions.
        
        Args:
            sources: List of source names to scrape (default: all)
            days_back: How many days back to consider articles
        """
        target_sources = NIGERIAN_NEWS_SOURCES
        if sources:
            sources_lower = [s.lower() for s in sources]
            target_sources = [s for s in NIGERIAN_NEWS_SOURCES 
                           if s['name'].lower() in sources_lower]
        
        all_submissions = []
        
        self.log('info', f'Starting news monitor scan across {len(target_sources)} sources')
        
        for source in target_sources:
            try:
                articles = self.fetch_rss_feed(source)
                
                for article in articles:
                    submission = self.process_article(article)
                    if submission:
                        self.process_submission(submission)
                        all_submissions.append(submission)
                        self.log('info', f"Found: {submission.get('hospital_name', 'Unknown')} - {submission.get('event_type')}")
                        
            except Exception as e:
                self.log('error', f'Error processing source {source["name"]}: {str(e)}')
                self.stats['errors'] += 1
        
        self.log('info', f'News scan complete. Found {len(all_submissions)} healthcare mentions.')
        return all_submissions
    
    def process_submission(self, submission: Dict):
        """Save submission to database."""
        try:
            self.save_to_db(submission)
            self.stats['processed'] += 1
        except Exception as e:
            self.log('error', f'Failed to save submission: {str(e)}')
            self.stats['errors'] += 1
    
    def save_to_db(self, submission: Dict):
        """Save unverified submission to database."""
        import psycopg2
        from psycopg2.extras import Json
        
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            self.log('warn', 'DATABASE_URL not set, skipping save')
            return
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        try:
            # Check for duplicates
            cur.execute(
                "SELECT id FROM unverified_submissions WHERE source_url = %s",
                (submission['source_url'],)
            )
            if cur.fetchone():
                self.log('debug', f"Duplicate submission skipped: {submission['source_url']}")
                return
            
            cur.execute("""
                INSERT INTO unverified_submissions 
                (source_type, source_name, source_url, headline, excerpt, raw_text,
                 hospital_name, city, state, geo_confidence, event_type, credibility_score)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                submission.get('source_type'),
                submission.get('source_name'),
                submission.get('source_url'),
                submission.get('headline'),
                submission.get('excerpt'),
                submission.get('raw_text'),
                submission.get('hospital_name'),
                submission.get('city'),
                submission.get('state'),
                submission.get('geo_confidence'),
                submission.get('event_type'),
                submission.get('credibility_score'),
            ))
            
            conn.commit()
            self.log('debug', f"Saved submission: {submission.get('headline', '')[:50]}")
            
        finally:
            cur.close()
            conn.close()


if __name__ == "__main__":
    import sys
    
    scraper = NewsMonitorScraper()
    
    if len(sys.argv) > 1:
        sources = sys.argv[1:]
        print(f"Scanning specific sources: {', '.join(sources)}")
        results = scraper.scrape(sources=sources)
    else:
        print("Scanning all Nigerian news sources...")
        results = scraper.scrape()
    
    print(f"\nFound {len(results)} healthcare-related articles")
    for r in results[:5]:
        print(f"  - {r.get('hospital_name', 'Unknown')}: {r.get('headline', '')[:60]}...")
