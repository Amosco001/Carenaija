import os
import json
import hashlib
import time
from pathlib import Path
from typing import Optional, Dict, Any

CACHE_DIR = Path(__file__).parent.parent / "cache"
CACHE_TTL = 86400 * 7  # 7 days

def get_cache_path(key: str) -> Path:
    """Get cache file path for a given key."""
    cache_hash = hashlib.md5(key.encode()).hexdigest()
    return CACHE_DIR / f"{cache_hash}.json"

def get_cached(key: str, ttl: int = CACHE_TTL) -> Optional[Dict[str, Any]]:
    """Get cached data if exists and not expired."""
    CACHE_DIR.mkdir(exist_ok=True)
    cache_path = get_cache_path(key)
    
    if not cache_path.exists():
        return None
    
    try:
        with open(cache_path, 'r') as f:
            data = json.load(f)
        
        if time.time() - data.get("timestamp", 0) > ttl:
            cache_path.unlink()
            return None
        
        return data.get("value")
    except (json.JSONDecodeError, IOError):
        return None

def set_cached(key: str, value: Any) -> None:
    """Save data to cache."""
    CACHE_DIR.mkdir(exist_ok=True)
    cache_path = get_cache_path(key)
    
    try:
        with open(cache_path, 'w') as f:
            json.dump({
                "key": key,
                "timestamp": time.time(),
                "value": value
            }, f)
    except IOError:
        pass

def clear_cache() -> int:
    """Clear all cached data. Returns number of files deleted."""
    if not CACHE_DIR.exists():
        return 0
    
    count = 0
    for cache_file in CACHE_DIR.glob("*.json"):
        cache_file.unlink()
        count += 1
    return count

def get_cache_stats() -> Dict[str, Any]:
    """Get cache statistics."""
    if not CACHE_DIR.exists():
        return {"files": 0, "size_bytes": 0, "size_mb": 0}
    
    files = list(CACHE_DIR.glob("*.json"))
    total_size = sum(f.stat().st_size for f in files)
    
    return {
        "files": len(files),
        "size_bytes": total_size,
        "size_mb": round(total_size / (1024 * 1024), 2)
    }
