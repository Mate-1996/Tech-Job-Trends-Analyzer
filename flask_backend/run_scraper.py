import sys
import logging
from app import create_app
from app.scrapers.remoteok import scrape_remoteok
from app.scrapers.weworkremotely import scrape_weworkremotely
from app.scrapers.linkedin import scrape_linkedin

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

SCRAPERS = {
    "remoteok": scrape_remoteok,
    "weworkremotely": scrape_weworkremotely,
    "linkedin": scrape_linkedin,
}

app = create_app()

with app.app_context():
    targets = sys.argv[1:] if len(sys.argv) > 1 else list(SCRAPERS.keys())

    for name in targets:
        if name not in SCRAPERS:
            print(f"Unknown scraper '{name}'. Choose from: {', '.join(SCRAPERS)}")
            sys.exit(1)

        print(f"\n{'='*50}")
        print(f"Running scraper: {name}")
        print(f"{'='*50}")
        count = SCRAPERS[name]()
        print(f"Done — {count} new jobs saved from {name}.")