# Tech Job Trends Analyzer

A full-stack web application that scrapes remote tech job listings, stores them in a cloud database, and lets users search, filter, and analyze job market trends — including the most in-demand programming languages and skills.

>  Currently in active development

---

## What It Does

- Scrapes job listings from **RemoteOK** (and soon WeWorkRemotely) using their public API
- Stores structured job data in **Firebase Firestore**
- Provides a **REST API** for searching and filtering jobs by title, location, and skill
- Tracks skill demand across all listings for market trend analytics
- Supports **user authentication** (register, login, JWT-protected routes)
- Allows logged-in users to save and manage their favorite job listings
- Automatically re-scrapes data every 12 hours via a background scheduler

---

## Tech Stack

**Backend**
- Python 3.11 + Flask
- Firebase Admin SDK (Firestore)
- Flask-JWT-Extended (authentication)
- Flask-Bcrypt (password hashing)
- Flask-CORS
- BeautifulSoup4 + Requests (web scraping)
- APScheduler (automated scraping)

**Frontend**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS

**Database**
- Firebase Firestore (NoSQL cloud database)


---

## Getting Started

**Backend**
```bash
cd flask_backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

**Frontend**
```bash
cd td-frontend
npm install
npm run dev
```

Add a `firebase-key.json` service account file inside `flask_backend/` and a `.env` file with your Flask and JWT secret keys.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/jobs/search` | Search jobs (title, location, skill) |
| GET | `/api/jobs/analytics/skills` | Top skills by job count |
| POST | `/api/jobs/save/:id` | Save a job (auth required) |
| GET | `/api/jobs/saved` | Get saved jobs (auth required) |
| DELETE | `/api/jobs/unsave/:id` | Remove saved job (auth required) |

---
