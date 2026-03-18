import random
import time
import logging
from datetime import datetime, timezone
from typing import Optional
from app.firebase import get_db

logger = logging.getLogger(__name__)

SKILLS_LIST = [
    "Python", "JavaScript", "TypeScript", "React", "Node.js",
    "SQL", "PostgreSQL", "MongoDB", "AWS", "Docker",
    "Kubernetes", "Go", "Rust", "Java", "Django",
    "FastAPI", "Vue", "Angular", "Machine Learning", "Redis",
    "Flask", "Ruby", "PHP", "Swift", "Kotlin", "Scala",
    "GraphQL", "REST", "Git", "CI/CD", "Linux", "Azure",
    "GCP", "Terraform", "Spark", "Kafka", "Elasticsearch",
    "TensorFlow", "PyTorch", "Pandas", "NumPy", "C++", "C#",
    "Spring", "Next.js", "Tailwind", "Figma", "Solidity",
]

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintox; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15",
]


def get_random_headers() -> dict:
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }


def extract_skills(text: str) -> list[str]:
    return [s for s in SKILLS_LIST if s.lower() in text.lower()]


def random_delay(min_s: float = 1.5, max_s: float = 4.0):
    """Sleep for a random duration to avoid rate limiting."""
    time.sleep(random.uniform(min_s, max_s))


def job_url_exists(db, url: str) -> bool:
    """Return True if a job with this URL already exists in Firestore."""
    if not url:
        return False
    results = db.collection("jobs").where("job_url", "==", url).limit(1).get()
    return len(results) > 0


def save_job(db, job: dict) -> bool:
    """
    Save a job to Firestore. Returns True if saved, False if skipped (duplicate).
    """
    url = job.get("job_url", "")
    if job_url_exists(db, url):
        logger.debug(f"Skipping duplicate: {url}")
        return False

    job.setdefault("date_posted", datetime.now(timezone.utc).isoformat())
    job.setdefault("source", "Unknown")
    job.setdefault("skills", [])
    job.setdefault("location", "Remote")
    job.setdefault("salary", "")
    job.setdefault("description", "")

    db.collection("jobs").add(job)
    logger.info(f"Saved: {job.get('title')} @ {job.get('company')}")
    return True