#!/usr/bin/env python3
import os
import sys
import json
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Optional

from scraper.sources import (
    GooglePlacesScraper,
    NigerianHealthDirectoryScraper,
    HMODirectoryScraper,
    NIGERIAN_CITIES,
)
from scraper.utils import (
    create_scraping_job,
    update_scraping_job,
    log_scraping_activity,
    get_scraping_sources,
    update_source_timestamps,
    get_db_cursor,
)

SCRAPER_CLASSES = {
    "google_places": GooglePlacesScraper,
    "ng_health_directory": NigerianHealthDirectoryScraper,
    "hmo_directory": HMODirectoryScraper,
}

def run_scraper(source: str, job_id: Optional[int] = None, **kwargs) -> Dict:
    scraper_class = SCRAPER_CLASSES.get(source)
    if not scraper_class:
        raise ValueError(f"Unknown scraper source: {source}")
    
    scraper = scraper_class(job_id=job_id)
    stats = scraper.run(**kwargs)
    
    update_source_timestamps(source)
    
    return stats

def create_and_run_job(source: str, job_type: str = "discover", 
                       target_city: str = None, target_state: str = None,
                       **kwargs) -> Dict:
    job_data = {
        "source": source,
        "target_city": target_city,
        "target_state": target_state,
        "job_type": job_type,
        "priority": kwargs.get("priority", 5),
        "scheduled_for": None,
        "metadata": json.dumps(kwargs) if kwargs else None,
    }
    
    job_id = create_scraping_job(job_data)
    print(f"Created job #{job_id} for {source}")
    
    update_scraping_job(job_id, {"status": "running", "started_at": datetime.now()})
    
    try:
        stats = run_scraper(source, job_id=job_id, **kwargs)
        
        update_scraping_job(job_id, {
            "status": "completed",
            "completed_at": datetime.now(),
            "items_processed": stats.get("processed", 0),
            "items_discovered": stats.get("discovered", 0),
            "items_duplicate": stats.get("duplicates", 0),
        })
        
        print(f"Job #{job_id} completed: {stats}")
        return {"job_id": job_id, "stats": stats}
        
    except Exception as e:
        update_scraping_job(job_id, {
            "status": "failed",
            "completed_at": datetime.now(),
            "error_message": str(e),
        })
        print(f"Job #{job_id} failed: {str(e)}")
        raise

def run_daily_discovery():
    print(f"\n{'='*60}")
    print(f"Daily Discovery Run - {datetime.now().isoformat()}")
    print('='*60)
    
    results = []
    
    major_cities = ["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan"]
    
    if os.getenv("GOOGLE_PLACES_API_KEY"):
        print("\n[1/3] Running Google Places scraper...")
        try:
            result = create_and_run_job(
                "google_places",
                job_type="discover",
                cities=major_cities,
                radius=10000
            )
            results.append(result)
        except Exception as e:
            print(f"Google Places scraper failed: {e}")
    else:
        print("\n[1/3] Skipping Google Places (no API key)")
    
    print("\n[2/3] Running health directory scraper...")
    try:
        result = create_and_run_job("ng_health_directory", job_type="discover")
        results.append(result)
    except Exception as e:
        print(f"Health directory scraper failed: {e}")
    
    print("\n[3/3] Running HMO directory scraper...")
    try:
        result = create_and_run_job("hmo_directory", job_type="discover")
        results.append(result)
    except Exception as e:
        print(f"HMO directory scraper failed: {e}")
    
    generate_report(results)
    
    return results

def run_weekly_full_scan():
    print(f"\n{'='*60}")
    print(f"Weekly Full Scan - {datetime.now().isoformat()}")
    print('='*60)
    
    results = []
    
    all_cities = [c["name"] for c in NIGERIAN_CITIES]
    
    if os.getenv("GOOGLE_PLACES_API_KEY"):
        print(f"\nRunning Google Places for {len(all_cities)} cities...")
        try:
            result = create_and_run_job(
                "google_places",
                job_type="full_scan",
                cities=all_cities,
                radius=15000
            )
            results.append(result)
        except Exception as e:
            print(f"Weekly scan failed: {e}")
    
    generate_report(results)
    
    return results

def generate_report(results: List[Dict]):
    print(f"\n{'='*60}")
    print("SCRAPING REPORT")
    print('='*60)
    
    total_processed = sum(r.get("stats", {}).get("processed", 0) for r in results)
    total_discovered = sum(r.get("stats", {}).get("discovered", 0) for r in results)
    total_duplicates = sum(r.get("stats", {}).get("duplicates", 0) for r in results)
    total_errors = sum(r.get("stats", {}).get("errors", 0) for r in results)
    
    print(f"\nSummary:")
    print(f"  Jobs Run: {len(results)}")
    print(f"  Total Processed: {total_processed}")
    print(f"  New Hospitals Found: {total_discovered}")
    print(f"  Duplicates Detected: {total_duplicates}")
    print(f"  Errors: {total_errors}")
    
    if total_discovered > 0:
        print(f"\nPending hospitals awaiting review: {total_discovered}")
        print("Visit /admin to review and approve new hospitals.")
    
    with get_db_cursor(commit=False) as cursor:
        cursor.execute("""
            SELECT state, COUNT(*) as count 
            FROM pending_hospitals 
            WHERE status = 'pending' 
            GROUP BY state 
            ORDER BY count DESC 
            LIMIT 10
        """)
        by_state = cursor.fetchall()
        
        if by_state:
            print(f"\nPending Hospitals by State:")
            for row in by_state:
                print(f"  {row['state'] or 'Unknown'}: {row['count']}")

def main():
    parser = argparse.ArgumentParser(description="CareNaija Hospital Scraper")
    parser.add_argument("command", choices=["daily", "weekly", "run", "report"],
                       help="Command to execute")
    parser.add_argument("--source", choices=list(SCRAPER_CLASSES.keys()),
                       help="Scraper source for 'run' command")
    parser.add_argument("--cities", nargs="+", help="Cities to scrape")
    parser.add_argument("--radius", type=int, default=10000, help="Search radius in meters")
    
    args = parser.parse_args()
    
    if args.command == "daily":
        run_daily_discovery()
    elif args.command == "weekly":
        run_weekly_full_scan()
    elif args.command == "run":
        if not args.source:
            print("Error: --source required for 'run' command")
            sys.exit(1)
        create_and_run_job(args.source, cities=args.cities, radius=args.radius)
    elif args.command == "report":
        generate_report([])

if __name__ == "__main__":
    main()
