import os
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.database import db
from app.config import config

jwt = JWTManager()

def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config.get(config_name, config['default']))

    # Extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config['FRONTEND_URL']}},
         supports_credentials=True)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.projects import projects_bp
    from app.routes.inspections import inspections_bp
    from app.routes.evidence import evidence_bp
    from app.routes.attendance import attendance_bp
    from app.routes.cameras import cameras_bp
    from app.routes.notifications import notifications_bp
    from app.routes.analytics import analytics_bp
    from app.routes.reports import reports_bp
    from app.routes.beneficiaries import beneficiaries_bp
    from app.routes.users import users_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(projects_bp, url_prefix='/api/projects')
    app.register_blueprint(inspections_bp, url_prefix='/api/inspections')
    app.register_blueprint(evidence_bp, url_prefix='/api/evidence')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(cameras_bp, url_prefix='/api/cameras')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(beneficiaries_bp, url_prefix='/api/beneficiaries')
    app.register_blueprint(users_bp, url_prefix='/api/users')

    # Health check
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'service': 'Smart Monitoring System API'}), 200

    # JWT error handlers
    @jwt.unauthorized_loader
    def unauthorized_response(err):
        return jsonify({'error': 'Authorization token is missing or invalid'}), 401

    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_data):
        return jsonify({'error': 'Token has expired. Please login again.'}), 401

    @jwt.invalid_token_loader
    def invalid_token_response(err):
        return jsonify({'error': 'Invalid token'}), 401

    # Generic error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    # Ensure upload directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    return app
