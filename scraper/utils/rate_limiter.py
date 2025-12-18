import time
import asyncio
from typing import Dict
from collections import defaultdict
from threading import Lock

class RateLimiter:
    def __init__(self, requests_per_minute: int = 10):
        self.requests_per_minute = requests_per_minute
        self.interval = 60.0 / requests_per_minute
        self.last_request_time: Dict[str, float] = defaultdict(float)
        self.lock = Lock()
    
    def wait(self, key: str = "default"):
        with self.lock:
            now = time.time()
            elapsed = now - self.last_request_time[key]
            if elapsed < self.interval:
                sleep_time = self.interval - elapsed
                time.sleep(sleep_time)
            self.last_request_time[key] = time.time()
    
    async def async_wait(self, key: str = "default"):
        now = time.time()
        elapsed = now - self.last_request_time[key]
        if elapsed < self.interval:
            sleep_time = self.interval - elapsed
            await asyncio.sleep(sleep_time)
        self.last_request_time[key] = time.time()

class MultiSourceRateLimiter:
    def __init__(self):
        self.limiters: Dict[str, RateLimiter] = {}
    
    def get_limiter(self, source: str, requests_per_minute: int = 10) -> RateLimiter:
        if source not in self.limiters:
            self.limiters[source] = RateLimiter(requests_per_minute)
        return self.limiters[source]
    
    def wait(self, source: str, requests_per_minute: int = 10):
        limiter = self.get_limiter(source, requests_per_minute)
        limiter.wait(source)
    
    async def async_wait(self, source: str, requests_per_minute: int = 10):
        limiter = self.get_limiter(source, requests_per_minute)
        await limiter.async_wait(source)

rate_limiter = MultiSourceRateLimiter()
