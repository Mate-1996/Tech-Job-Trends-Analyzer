from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.firebase import get_db

jobs_bp = Blueprint("jobs", __name__)

@jobs_bp.route("/test", methods=["GET"])
def test():
    return {"message": "jobs blueprint is working"}

@jobs_bp.route("/search", methods=["GET"])
def search_jobs():
    title = request.args.get("title", "").lower()
    location = request.args.get("location", "").lower()
    skill = request.args.get("skill", "")

    db = get_db()
    jobs = [doc.to_dict() | {"id": doc.id} for doc in db.collection("jobs").stream()]

    if title:
        jobs = [j for j in jobs if title in j.get("title", "").lower()]
    if location:
        jobs = [j for j in jobs if location in j.get("location", "").lower()]
    if skill:
        jobs = [j for j in jobs if skill in j.get("skills", [])]

    return jsonify(jobs[:50])

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
    db.collection("saved_jobs").add({
        "user_id": user_id,
        "job_id": job_id,
    })
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