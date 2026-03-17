import requests
from datetime import datetime, timezone
from app.firebase import get_db

SKILLS_LIST = [
    "Python", "JavaScript", "TypeScript", "React", "Node.js",
    "SQL", "PostgreSQL", "MongoDB", "AWS", "Docker",
    "Kubernetes", "Go", "Rust", "Java", "Django",
    "FastAPI", "Vue", "Angular", "Machine Learning", "Redis",
    "Flask", "Ruby", "PHP", "Swift", "Kotlin", "Scala"
]

def extract_skills(text):
    return [s for s in SKILLS_LIST if s.lower() in text.lower()]

def scrape_remoteok():
    db = get_db()
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; JobScraper/1.0)"
    }

    print("Fetching RemoteOK API...")
    try:
        res = requests.get(
            "https://remoteok.com/api",
            headers=headers,
            timeout=15
        )
        res.raise_for_status()
        data = res.json()
    except Exception as e:
        print(f"Request failed: {e}")
        return 0

    jobs = data[1:] if data else []
    print(f"Found {len(jobs)} jobs")

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

            db.collection("jobs").add({
                "title": title,
                "company": company,
                "location": location,
                "salary": salary,
                "description": description,
                "job_url": job_url,
                "source": "RemoteOK",
                "skills": skills,
                "date_posted": datetime.now(timezone.utc).isoformat()
            })
            saved += 1
            print(f"  Saved: {title} @ {company}")

        except Exception as e:
            print(f"  Error: {e}")
            continue

    print(f"Done. Saved {saved} jobs.")
    return saved