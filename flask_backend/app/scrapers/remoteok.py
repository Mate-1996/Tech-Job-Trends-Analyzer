import requests
from datetime import datetime, timezone
from .base import extract_skills, save_job, get_db
import logging

logger = logging.getLogger(__name__)


def scrape_remoteok() -> int:
    db = get_db()
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; JobScraper/1.0)"
    }

    logger.info("Fetching RemoteOK API...")
    try:
        res = requests.get(
            "https://remoteok.com/api",
            headers=headers,
            timeout=15
        )
        res.raise_for_status()
        data = res.json()
    except Exception as e:
        logger.error(f"RemoteOK request failed: {e}")
        return 0

    jobs = data[1:] if data else []
    logger.info(f"RemoteOK: found {len(jobs)} listings")

    saved = 0
    for job in jobs:
        try:
            if not job.get("position"):
                continue

            title = job.get("position", "")
            company = job.get("company", "Unknown")
            location = job.get("location", "Remote") or "Remote"
            salary = job.get("salary", "")
            description = job.get("description", "")[:800]
            job_url = job.get("url", "")
            tags = job.get("tags", [])

            combined = " ".join(tags) + " " + description
            skills = list(set(extract_skills(combined) + [
                t for t in tags if isinstance(t, str) and len(t) < 25
            ]))

            new_job = {
                "title": title,
                "company": company,
                "location": location,
                "salary": salary,
                "description": description,
                "job_url": job_url,
                "source": "RemoteOK",
                "skills": skills,
                "date_posted": datetime.now(timezone.utc).isoformat(),
            }

            if save_job(db, new_job):
                saved += 1

        except Exception as e:
            logger.warning(f"RemoteOK job error: {e}")
            continue

    logger.info(f"RemoteOK done. Saved {saved} new jobs.")
    return saved