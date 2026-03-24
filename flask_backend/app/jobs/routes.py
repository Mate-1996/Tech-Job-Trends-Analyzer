from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.firebase import get_db
from datetime import datetime, timezone, timedelta

jobs_bp = Blueprint("jobs", __name__)

@jobs_bp.route("/test", methods=["GET"])
def test():
    return {"message": "jobs blueprint is working"}

@jobs_bp.route("/search", methods=["GET"])
def search_jobs():
    title    = request.args.get("title", "").lower().strip()
    location = request.args.get("location", "").lower().strip()
    skill    = request.args.get("skill", "").strip()
    source   = request.args.get("source", "").strip()       
    job_type = request.args.get("job_type", "").lower().strip() 
    date_range = request.args.get("date_range", "").strip()
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))

    db = get_db()
    jobs = [doc.to_dict() | {"id": doc.id} for doc in db.collection("jobs").stream()]

    if title:
        jobs = [j for j in jobs if title in j.get("title", "").lower()]

    if location:
        jobs = [j for j in jobs if location in j.get("location", "").lower()]

    if skill:
        jobs = [j for j in jobs if skill in j.get("skills", [])]

    if source:
        jobs = [j for j in jobs if j.get("source", "").lower() == source.lower()]

    if job_type:
        jobs = [j for j in jobs
                if job_type in j.get("title", "").lower()
                or job_type in j.get("description", "").lower()]

    if date_range:
        now = datetime.now(timezone.utc)
        cutoffs = {"24h": now - timedelta(hours=24),
                   "week": now - timedelta(weeks=1),
                   "month": now - timedelta(days=30)}
        cutoff = cutoffs.get(date_range)
        if cutoff:
            def posted_after(job):
                raw = job.get("date_posted", "")
                if not raw:
                    return False
                try:
                    dt = datetime.fromisoformat(raw)
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    return dt >= cutoff
                except Exception:
                    return False
            jobs = [j for j in jobs if posted_after(j)]

    def sort_key(j):
        raw = j.get("date_posted", "")
        try:
            dt = datetime.fromisoformat(raw)
            return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
        except Exception:
            return datetime.min.replace(tzinfo=timezone.utc)

    jobs.sort(key=sort_key, reverse=True)

    total = len(jobs)
    start = (page - 1) * per_page
    end   = start + per_page
    paginated = jobs[start:end]

    return jsonify({
        "jobs": paginated,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
    })


@jobs_bp.route("/sources", methods=["GET"])
def get_sources():
    """Return all distinct job sources present in the DB."""
    db = get_db()
    jobs = [doc.to_dict() for doc in db.collection("jobs").stream()]
    sources = sorted(set(j.get("source", "") for j in jobs if j.get("source")))
    return jsonify(sources)


@jobs_bp.route("/analytics/skills", methods=["GET"])
def skill_trends():
    db = get_db()
    jobs = [doc.to_dict() for doc in db.collection("jobs").stream()]
    counts = {}
    for job in jobs:
        for skill in job.get("skills", []):
            counts[skill] = counts.get(skill, 0) + 1
    sorted_skills = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    return jsonify([{"skill": s, "count": c} for s, c in sorted_skills[:20]])


@jobs_bp.route("/save/<job_id>", methods=["POST"])
@jwt_required()
def save_job(job_id):
    user_id = get_jwt_identity()
    db = get_db()
    db.collection("saved_jobs").add({"user_id": user_id, "job_id": job_id})
    return jsonify({"message": "Job saved"})


@jobs_bp.route("/saved", methods=["GET"])
@jwt_required()
def get_saved_jobs():
    user_id = get_jwt_identity()
    db = get_db()
    from firebase_admin import firestore
    saved = db.collection("saved_jobs").where(
        filter=firestore.FieldFilter("user_id", "==", user_id)
    ).get()
    job_ids = [s.to_dict()["job_id"] for s in saved]
    jobs = []
    for job_id in job_ids:
        doc = db.collection("jobs").document(job_id).get()
        if doc.exists:
            jobs.append(doc.to_dict() | {"id": doc.id})
    return jsonify(jobs)


@jobs_bp.route("/unsave/<job_id>", methods=["DELETE"])
@jwt_required()
def unsave_job(job_id):
    user_id = get_jwt_identity()
    db = get_db()
    from firebase_admin import firestore
    saved = db.collection("saved_jobs").where(
        filter=firestore.FieldFilter("user_id", "==", user_id)
    ).where(
        filter=firestore.FieldFilter("job_id", "==", job_id)
    ).get()
    for doc in saved:
        doc.reference.delete()
    return jsonify({"message": "Job removed"})