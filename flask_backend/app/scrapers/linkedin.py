import logging
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone
from .base import (
    get_random_headers, extract_skills, random_delay,
    save_job, get_db
)

logger = logging.getLogger(__name__)

# LinkedIn public job search — no login required for basic listings
LINKEDIN_BASE = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"

# Searches to run. Each dict becomes query params.
LINKEDIN_SEARCHES = [
    {"keywords": "software engineer", "location": "Remote", "f_WT": "2"},
    {"keywords": "backend developer", "location": "Remote", "f_WT": "2"},
    {"keywords": "frontend developer", "location": "Remote", "f_WT": "2"},
    {"keywords": "fullstack developer", "location": "Remote", "f_WT": "2"},
    {"keywords": "data engineer", "location": "Remote", "f_WT": "2"},
    {"keywords": "devops engineer", "location": "Remote", "f_WT": "2"},
    {"keywords": "machine learning engineer", "location": "Remote", "f_WT": "2"},
]

# How many result pages to fetch per search (25 results per page)
PAGES_PER_SEARCH = 2


def _build_search_url(params: dict, start: int = 0) -> str:
    from urllib.parse import urlencode
    p = {**params, "start": start}
    return f"{LINKEDIN_BASE}?{urlencode(p)}"


def _parse_jobs_bs4(html: str) -> list[dict]:
    """Parse LinkedIn job cards from the guest API HTML fragment."""
    soup = BeautifulSoup(html, "html.parser")
    jobs = []

    cards = soup.select("li")
    for card in cards:
        try:
            # Title
            title_el = (
                card.select_one(".base-search-card__title") or
                card.select_one("h3.base-search-card__title") or
                card.select_one("h3")
            )
            if not title_el:
                continue
            title = title_el.get_text(strip=True)

            # Company
            company_el = (
                card.select_one(".base-search-card__subtitle") or
                card.select_one("h4.base-search-card__subtitle") or
                card.select_one("h4")
            )
            company = company_el.get_text(strip=True) if company_el else "Unknown"

            # Location
            location_el = (
                card.select_one(".job-search-card__location") or
                card.select_one("span.job-search-card__location")
            )
            location = location_el.get_text(strip=True) if location_el else "Remote"

            # Job URL
            link_el = card.select_one("a.base-card__full-link") or card.find("a", href=True)
            job_url = ""
            if link_el and link_el.get("href"):
                href = link_el["href"]
                # Strip tracking params after the job ID
                job_url = href.split("?")[0] if "?" in href else href

            # Skills via title + company text (no description on list page)
            skills = extract_skills(f"{title} {company}")

            jobs.append({
                "title": title,
                "company": company,
                "location": location,
                "salary": "",
                "description": "",
                "job_url": job_url,
                "source": "LinkedIn",
                "skills": skills,
                "date_posted": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as e:
            logger.warning(f"LinkedIn parse error on card: {e}")
            continue

    return jobs


def _fetch_bs4(url: str) -> str | None:
    """Quick probe with requests — LinkedIn often returns 429 but worth trying."""
    try:
        headers = get_random_headers()
        # LinkedIn guest API needs these extra headers
        headers.update({
            "Referer": "https://www.linkedin.com/jobs/",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
        })
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code == 429:
            logger.warning("LinkedIn rate limited (429), will use Playwright.")
            return None
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        logger.warning(f"LinkedIn BS4 fetch failed: {e}")
        return None


def _fetch_playwright(url: str) -> str | None:
    """Fetch LinkedIn jobs page using Playwright to bypass bot detection."""
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-blink-features=AutomationControlled",
                ],
            )
            context = browser.new_context(
                user_agent=get_random_headers()["User-Agent"],
                viewport={"width": 1366, "height": 768},
                locale="en-US",
                timezone_id="America/New_York",
            )
            # Remove the navigator.webdriver flag
            context.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )
            page = context.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(3000)

            # Scroll to trigger lazy-loaded cards
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(1500)

            html = page.content()
            browser.close()
            return html
    except Exception as e:
        logger.error(f"LinkedIn Playwright fetch failed: {e}")
        return None


def _fetch_page(url: str) -> str | None:
    """Try BS4 first, fall back to Playwright."""
    html = _fetch_bs4(url)
    # LinkedIn often returns thin/blocked responses — check for actual job cards
    if html and "<li>" in html and len(html) > 3000:
        return html
    logger.info("BS4 response insufficient for LinkedIn, switching to Playwright...")
    return _fetch_playwright(url)


def scrape_linkedin() -> int:
    """
    Scrape LinkedIn remote job listings.
    Returns the number of new jobs saved.
    """
    db = get_db()
    total_saved = 0

    for search_params in LINKEDIN_SEARCHES:
        keyword = search_params.get("keywords", "")
        logger.info(f"LinkedIn search: '{keyword}'")

        for page_num in range(PAGES_PER_SEARCH):
            start = page_num * 25
            url = _build_search_url(search_params, start)
            logger.info(f"  Fetching page {page_num + 1}: {url}")

            html = _fetch_page(url)
            if not html:
                logger.error(f"Could not fetch LinkedIn results for '{keyword}' page {page_num + 1}")
                break

            jobs = _parse_jobs_bs4(html)
            logger.info(f"  Parsed {len(jobs)} job cards")

            if not jobs:
                logger.info("  No jobs found, stopping pagination for this search.")
                break

            for job in jobs:
                if save_job(db, job):
                    total_saved += 1
                random_delay(0.5, 1.2)

            random_delay(3.0, 7.0)  # longer pause between pages to avoid rate limiting

        random_delay(4.0, 9.0)  # pause between different searches

    logger.info(f"LinkedIn scrape complete. Saved {total_saved} new jobs.")
    return total_saved