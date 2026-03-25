# TechJobTrends

A full-stack web application that scrapes remote tech job listings from multiple sources, stores them in a cloud database, and lets users search, filter, and analyze job market trends, including the most in-demand programming languages and skills.

---

## What It Does

- Scrapes job listings from RemoteOK, We Work Remotely, and LinkedIn using a combination of public APIs, RSS feeds, and a headless browser (Playwright)
- Deduplicates listings automatically by job URL, running scrapers multiple times never creates duplicate entries
- Stores structured job data in Firebase Firestore
- Provides a REST API for searching and filtering jobs by title, location, skill, source, job type, and date posted, with pagination
- Tracks skill demand across all listings for market trend analytics
- Supports user authentication (register, login, JWT-protected routes)
- Allows logged-in users to save and manage their favourite job listings
- Automatically re-scrapes data on a schedule via a background scheduler (RemoteOK every 6h, WWR every 12h, LinkedIn every 24h)

---

## Tech Stack

**Backend**
- Python 3.11 + Flask
- Firebase Admin SDK (Firestore)
- Flask-JWT-Extended (authentication)
- Flask-Bcrypt (password hashing)
- Flask-CORS
- BeautifulSoup4 + lxml (HTML and RSS/XML parsing)
- Requests (HTTP client)
- Playwright (headless Chromium browser for JavaScript-rendered pages)
- APScheduler (automated background scraping)

**Frontend**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

**Database**
- Firebase Firestore (NoSQL cloud database)

---

## How the Scrapers Work

**RemoteOK** calls `https://remoteok.com/api` directly and parses the JSON response, no scraping involved.

**We Work Remotely** fetches one RSS feed per job category (programming, devops, data science ...) and parses the XML with BeautifulSoup. If an RSS feed is blocked or unavailable, Playwright loads the equivalent HTML page as a fallback.

**LinkedIn** hits their undocumented guest jobs search endpoint across 7 keyword searches (software engineer, backend, frontend, fullstack, data engineer, devops, ML engineer). Plain `requests` is tried first but LinkedIn almost always rate-limits it, so Playwright takes over, launching a headless Chromium browser, removing the `navigator.webdriver` flag to avoid bot detection, and extracting the rendered HTML.

All three scrapers share a common base that handles rotating user agents, random request delays, skill extraction, and URL-based deduplication.

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- A Firebase project with Firestore enabled
- A `firebase-key.json` service account file

### Backend

```bash
cd flask_backend
python3.11 -m venv venv
source venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
python run.py
```

Create a `.env` file inside `flask_backend/`:
```
FLASK_SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
```

Place your `firebase-key.json` service account file inside `flask_backend/`.

### Frontend

```bash
cd td-frontend
npm install
npm run dev
```

Create a `.env.local` file inside `td-frontend/`:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/jobs/search` | No | Search and filter jobs (see params below) |
| GET | `/api/jobs/sources` | No | List all distinct job sources in the DB |
| GET | `/api/jobs/analytics/skills` | No | Top 20 skills by job count |
| POST | `/api/jobs/save/:id` | Yes | Save a job to your list |
| GET | `/api/jobs/saved` | Yes | Get your saved jobs |
| DELETE | `/api/jobs/unsave/:id` | Yes | Remove a saved job |
