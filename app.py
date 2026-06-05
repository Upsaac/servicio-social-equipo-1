import os
from flask import Flask
from extensions import db, login_manager


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'hs-dev-secret-2026-change-in-prod'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5 MB
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login_page'

    from models import Usuario

    @login_manager.user_loader
    def load_user(user_id):
        return Usuario.query.get(int(user_id))

    from routes.auth import bp as auth_bp
    from routes.proyectos import bp as proyectos_bp
    from routes.actividades import bp as actividades_bp
    from routes.beneficiarios import bp as beneficiarios_bp
    from routes.dashboard import bp as dashboard_bp
    from routes.testimonios import bp as testimonios_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(proyectos_bp)
    app.register_blueprint(actividades_bp)
    app.register_blueprint(beneficiarios_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(testimonios_bp)

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == '__main__':
    # Al pasar '0.0.0.0', abres el socket a la LAN
    app.run(host='0.0.0.0', port=8022, debug=True)
