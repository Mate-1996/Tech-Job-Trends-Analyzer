from flask import Flask
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS

bcrypt = Bcrypt()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")

    bcrypt.init_app(app)
    jwt.init_app(app)
    CORS(app)

    from app.auth import auth_bp
    from app.jobs import jobs_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(jobs_bp, url_prefix="/api/jobs")

    from apscheduler.schedulers.background import BackgroundScheduler
    from app.scrapers.remoteok import scrape_remoteok
    scheduler = BackgroundScheduler()
    scheduler.add_job(scrape_remoteok, "interval", hours=12)
    scheduler.start()

    return app