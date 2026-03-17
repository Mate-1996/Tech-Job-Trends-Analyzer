from app import create_app
from app.scrapers.remoteok import scrape_remoteok

app = create_app()
with app.app_context():
    scrape_remoteok()