from flask import Flask
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
import firebase_admin
from firebase_admin import credentials

bcrypt = Bcrypt()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")

    bcrypt.init_app(app)
    jwt.init_app(app)

    cred = credentials.Certificate("firebase-key.json")
    firebase_admin.initialize_app(cred)

    from app.auth import auth_bp
    from app.jobs import jobs_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(jobs_bp, url_prefix="/api/jobs")

    return app