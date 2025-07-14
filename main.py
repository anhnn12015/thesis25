import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from config import app_config
from crt_db import database
from flask_jwt_extended import JWTManager
from flask_caching import Cache
from routes import ai, pdf, user
from dotenv import load_dotenv
# from services.logging_service import setup_logging
from services.mail_service import init_mail,mail
jwt = JWTManager()
migrate = Migrate()

cache = Cache(config={
    "CACHE_TYPE": "SimpleCache",  # Loại cache đơn giản
    "CACHE_DEFAULT_TIMEOUT": 300  # Thời gian timeout mặc định là 300 giây (5 phút)
})
def create_app(config_name):
    app = Flask(__name__)
    load_dotenv()
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")
    CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

    # CORS(app, supports_credentials=True)
    app.config.from_object(app_config[config_name])

    database.init_app(app)
    migrate.init_app(app, database)

    jwt.init_app(app)
    cache.init_app(app)
    # setup_logging(app)
    init_mail(app)
    app.register_blueprint(ai.bp, url_prefix='/ai')
    app.register_blueprint(pdf.bp)
    app.register_blueprint(user.bp)

    with app.app_context():
        database.create_all()

    return app


if __name__ == "__main__":
    app = create_app("development")
    app.run(host="0.0.0.0", port=8080, debug=True)
