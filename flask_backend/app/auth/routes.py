from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from flask_jwt_extended import create_access_token
from app import bcrypt
from app.firebase import get_db

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password") or not data.get("username"):
        return jsonify({"error": "Missing fields"}), 400

    db = get_db()
    existing = db.collection("users").where(
        filter=firestore.FieldFilter("email", "==", data["email"])
    ).get()
    if existing:
        return jsonify({"error": "Email already in use"}), 409

    hashed = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    _, doc_ref = db.collection("users").add({
        "username": data["username"],
        "email": data["email"],
        "password_hash": hashed,
        "created_at": firestore.SERVER_TIMESTAMP
    })
    return jsonify({"message": "User created", "user_id": doc_ref.id}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Missing fields"}), 400

    db = get_db()
    users = db.collection("users").where(
        filter=firestore.FieldFilter("email", "==", data["email"])
    ).get()
    if not users:
        return jsonify({"error": "Invalid credentials"}), 401

    user_doc = users[0]
    user = user_doc.to_dict()
    if not bcrypt.check_password_hash(user["password_hash"], data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=user_doc.id)
    return jsonify({"token": token, "user_id": user_doc.id})