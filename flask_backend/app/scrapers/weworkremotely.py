import logging
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone
from .base import (
    get_random_headers, extract_skills, random_delay,
    save_job, get_db
)

logger = logging.getLogger(__name__)

WWR_BASE = "https://weworkremotely.com"


RSS_FEEDS = [
    "https://weworkremotely.com/categories/remote-programming-jobs.rss",
    "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss",
    "https://weworkremotely.com/categories/remote-data-science-jobs.rss",
    "https://weworkremotely.com/categories/remote-management-product-jobs.rss",
    "https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss",
]


# ---------------------------------------------------------------------------
# RSS parsing (primary method)
# ---------------------------------------------------------------------------

def _parse_rss(xml: str) -> list[dict]:
    """Parse a WWR RSS feed into job dicts."""
    soup = BeautifulSoup(xml, "xml")
    jobs = []

    for item in soup.find_all("item"):
        try:
            title_raw = item.find("title")
            if not title_raw:
                continue

            # WWR RSS title format: "Company: Job Title"
            title_text = title_raw.get_text(strip=True)
            if ": " in title_text:
                company, title = title_text.split(": ", 1)
            else:
                title = title_text
                company = "Unknown"

            # Strip region prefix like "[USA Only] Senior Engineer"
            if title.startswith("[") and "]" in title:
                title = title.split("]", 1)[1].strip()

            # Job URL from <link> or <guid>
            job_url = ""
            link_el = item.find("link")
            if link_el:
                job_url = (link_el.get_text(strip=True) or
                           str(link_el.next_sibling or "").strip())
            if not job_url:
                guid = item.find("guid")
                job_url = guid.get_text(strip=True) if guid else ""

            # Region / location
            region_el = item.find("region")
            location = region_el.get_text(strip=True) if region_el else "Remote"
            if not location:
                location = "Remote"

            # Description for skill extraction
            desc_el = item.find("description")
            description = ""
            if desc_el:
                description = BeautifulSoup(
                    desc_el.get_text(strip=True), "html.parser"
                ).get_text(strip=True)[:800]

            skills = extract_skills(f"{title} {company} {description}")

            jobs.append({
                "title": title,
                "company": company,
                "location": location,
                "salary": "",
                "description": description,
                "job_url": job_url,
                "source": "We Work Remotely",
                "skills": skills,
                "date_posted": datetime.now(timezone.utc).isoformat(),
            })

        except Exception as e:
            logger.warning(f"WWR RSS parse error: {e}")
            continue

    return jobs


def _fetch_rss(url: str) -> str | None:
    """Fetch an RSS feed with requests."""
    try:
        headers = get_random_headers()
        headers["Accept"] = "application/rss+xml, application/xml, text/xml, */*"
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        logger.warning(f"WWR RSS fetch failed for {url}: {e}")
        return None


# ---------------------------------------------------------------------------
# HTML fallback (Playwright)
# ---------------------------------------------------------------------------

def _parse_html(html: str) -> list[dict]:
    """
    Parse WWR category page HTML.
    Jobs live in <section class='jobs'> > <ul> > <li> elements.
    """
    soup = BeautifulSoup(html, "html.parser")
    jobs = []

    sections = soup.select("section.jobs") or [soup]

    for section in sections:
        for li in section.select("ul li"):
            if "view-all" in li.get("class", []):
                continue
            try:
                company_el = li.select_one(".company")
                company = company_el.get_text(strip=True) if company_el else "Unknown"

                title_el = li.select_one(".title")
                if not title_el:
                    continue
                title = title_el.get_text(strip=True)
                if not title:
                    continue

                region_el = li.select_one(".region") or li.select_one(".location")
                location = region_el.get_text(strip=True) if region_el else "Remote"
                if not location:
                    location = "Remote"

                link_el = li.select_one("a[href*='/remote-jobs/']") or li.find("a", href=True)
                job_url = ""
                if link_el:
                    href = link_el.get("href", "")
                    job_url = href if href.startswith("http") else f"{WWR_BASE}{href}"

                skills = extract_skills(f"{title} {company}")

                jobs.append({
                    "title": title,
                    "company": company,
                    "location": location,
                    "salary": "",
                    "description": "",
                    "job_url": job_url,
                    "source": "We Work Remotely",
                    "skills": skills,
                    "date_posted": datetime.now(timezone.utc).isoformat(),
                })
            except Exception as e:
                logger.warning(f"WWR HTML parse error: {e}")
                continue

    return jobs


def _fetch_playwright(url: str) -> str | None:
    """Playwright fallback for when RSS fails."""
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
            )
            context = browser.new_context(
                user_agent=get_random_headers()["User-Agent"],
                viewport={"width": 1280, "height": 800},
                locale="en-US",
            )
            context.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )
            page = context.new_page()
            page.goto(url, wait_until="networkidle", timeout=45000)
            page.wait_for_timeout(2000)
            html = page.content()
            browser.close()
            return html
    except Exception as e:
        logger.error(f"WWR Playwright fetch failed for {url}: {e}")
        return None


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def scrape_weworkremotely() -> int:
    """
    Scrape We Work Remotely via RSS (primary) with Playwright HTML fallback.
    Returns the number of new jobs saved.
    """
    db = get_db()
    total_saved = 0
    rss_failed_urls = []

    # --- Primary: RSS ---
    for feed_url in RSS_FEEDS:
        logger.info(f"Fetching WWR RSS: {feed_url}")
        xml = _fetch_rss(feed_url)

        if not xml or len(xml) < 200:
            logger.warning(f"RSS unavailable, will try HTML fallback for: {feed_url}")
            rss_failed_urls.append(feed_url.replace(".rss", ""))
            continue

        jobs = _parse_rss(xml)
        logger.info(f"  Parsed {len(jobs)} jobs from RSS")

        for job in jobs:
            if save_job(db, job):
                total_saved += 1
            random_delay(0.2, 0.6)

        random_delay(1.5, 3.5)

    # --- Fallback: Playwright HTML ---
    for html_url in rss_failed_urls:
        logger.info(f"Trying Playwright HTML fallback: {html_url}")
        html = _fetch_playwright(html_url)

        if not html:
            logger.error(f"Playwright also failed for {html_url}, skipping.")
            continue

        jobs = _parse_html(html)
        logger.info(f"  Parsed {len(jobs)} jobs from HTML")

        for job in jobs:
            if save_job(db, job):
                total_saved += 1
            random_delay(0.3, 0.8)

        random_delay(3.0, 6.0)

    logger.info(f"WWR scrape complete. Saved {total_saved} new jobs.")
    return total_saved