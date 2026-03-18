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
    from app.scrapers.weworkremotely import scrape_weworkremotely
    from app.scrapers.linkedin import scrape_linkedin

    scheduler = BackgroundScheduler()

    # RemoteOK, light API call, run every 6 hours
    scheduler.add_job(scrape_remoteok, "interval", hours=6, id="remoteok")

    # We Work Remotely, every 12 hours
    scheduler.add_job(scrape_weworkremotely, "interval", hours=12, id="weworkremotely")

    # LinkedIn, every 24 hours (more aggressive anti-bot)
    scheduler.add_job(scrape_linkedin, "interval", hours=24, id="linkedin")

    scheduler.start()

    return app