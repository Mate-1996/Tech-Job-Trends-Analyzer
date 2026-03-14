from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from app import bcrypt
from flask_jwt_extended import create_access_token

auth_bp = Blueprint("auth", __name__)
db = firestore.client()

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    # Check if email exists
    existing = db.collection("users").where("email", "==", data["email"]).get()
    if existing:
        return jsonify({"error": "Email already in use"}), 409

    hashed = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    user_ref = db.collection("users").add({
        "username": data["username"],
        "email": data["email"],
        "password_hash": hashed,
        "created_at": firestore.SERVER_TIMESTAMP
    })
    return jsonify({"message": "User created"}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    users = db.collection("users").where("email", "==", data["email"]).get()
    if not users:
        return jsonify({"error": "Invalid credentials"}), 401

    user = users[0].to_dict()
    if not bcrypt.check_password_hash(user["password_hash"], data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=users[0].id)
    return jsonify({"token": token})