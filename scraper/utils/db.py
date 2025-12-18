import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

@contextmanager
def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        conn.close()

@contextmanager
def get_db_cursor(commit=True):
    with get_db_connection() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()

def insert_pending_hospital(data: dict) -> int:
    with get_db_cursor() as cursor:
        cursor.execute("""
            INSERT INTO pending_hospitals 
            (name, address, city, lga, state, phone, email, website, type, ownership, 
             specialties, services, latitude, longitude, source_url, source_name, 
             source_id, raw_data, duplicate_of_id, duplicate_score)
            VALUES (%(name)s, %(address)s, %(city)s, %(lga)s, %(state)s, %(phone)s, 
                    %(email)s, %(website)s, %(type)s, %(ownership)s, %(specialties)s, 
                    %(services)s, %(latitude)s, %(longitude)s, %(source_url)s, 
                    %(source_name)s, %(source_id)s, %(raw_data)s, %(duplicate_of_id)s, 
                    %(duplicate_score)s)
            RETURNING id
        """, data)
        return cursor.fetchone()['id']

def check_source_id_exists(source_name: str, source_id: str) -> bool:
    with get_db_cursor(commit=False) as cursor:
        cursor.execute("""
            SELECT id FROM pending_hospitals 
            WHERE source_name = %s AND source_id = %s
        """, (source_name, source_id))
        return cursor.fetchone() is not None

def get_existing_hospitals():
    with get_db_cursor(commit=False) as cursor:
        cursor.execute("""
            SELECT id, name, address, city, state, phone, latitude, longitude
            FROM hospitals
        """)
        return cursor.fetchall()

def create_scraping_job(data: dict) -> int:
    with get_db_cursor() as cursor:
        cursor.execute("""
            INSERT INTO scraping_jobs 
            (source, target_city, target_state, job_type, priority, scheduled_for, metadata)
            VALUES (%(source)s, %(target_city)s, %(target_state)s, %(job_type)s, 
                    %(priority)s, %(scheduled_for)s, %(metadata)s)
            RETURNING id
        """, data)
        return cursor.fetchone()['id']

def update_scraping_job(job_id: int, data: dict):
    with get_db_cursor() as cursor:
        set_clause = ", ".join([f"{k} = %({k})s" for k in data.keys()])
        data['id'] = job_id
        cursor.execute(f"""
            UPDATE scraping_jobs SET {set_clause} WHERE id = %(id)s
        """, data)

def log_scraping_activity(data: dict):
    with get_db_cursor() as cursor:
        cursor.execute("""
            INSERT INTO scraping_logs 
            (job_id, level, message, source, url, response_status, duration, metadata)
            VALUES (%(job_id)s, %(level)s, %(message)s, %(source)s, %(url)s, 
                    %(response_status)s, %(duration)s, %(metadata)s)
        """, data)

def get_scraping_sources(enabled_only=True):
    with get_db_cursor(commit=False) as cursor:
        query = "SELECT * FROM scraping_sources"
        if enabled_only:
            query += " WHERE enabled = true"
        cursor.execute(query)
        return cursor.fetchall()

def update_source_timestamps(source_name: str):
    with get_db_cursor() as cursor:
        cursor.execute("""
            UPDATE scraping_sources 
            SET last_run_at = NOW(), 
                next_run_at = CASE 
                    WHEN schedule_interval = 'daily' THEN NOW() + INTERVAL '1 day'
                    WHEN schedule_interval = 'weekly' THEN NOW() + INTERVAL '1 week'
                    WHEN schedule_interval = 'monthly' THEN NOW() + INTERVAL '1 month'
                    ELSE NULL
                END
            WHERE name = %s
        """, (source_name,))
