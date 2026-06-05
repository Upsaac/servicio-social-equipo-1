import os
import uuid
from flask import Blueprint, request, jsonify, render_template, redirect, url_for, current_app
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename
from extensions import db
from models import Usuario

EXTENSIONES_PERMITIDAS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}

bp = Blueprint('auth', __name__)


@bp.route('/login', methods=['GET'])
def login_page():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.dashboard_page'))
    return render_template('login.html')


@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    user = Usuario.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'ok': False, 'error': 'Correo o contraseña incorrectos.'}), 401

    login_user(user)
    return jsonify({'ok': True, 'rol': user.rol})


@bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login_page'))


@bp.route('/api/me')
@login_required
def me():
    return jsonify({
        'id': current_user.id,
        'nombre': current_user.nombre,
        'rol': current_user.rol,
        'initials': current_user.initials,
        'email': current_user.email,
        'foto_url': current_user.foto_url,
    })


@bp.route('/api/upload-foto', methods=['POST'])
@login_required
def upload_foto():
    archivo = request.files.get('foto')
    if not archivo or archivo.filename == '':
        return jsonify({'error': 'No se seleccionó archivo'}), 400
    ext = archivo.filename.rsplit('.', 1)[-1].lower()
    if ext not in EXTENSIONES_PERMITIDAS:
        return jsonify({'error': 'Formato no permitido. Usa: PNG, JPG, JPEG, WEBP o GIF'}), 400
    nombre = f"{uuid.uuid4().hex}.{ext}"
    ruta   = os.path.join(current_app.config['UPLOAD_FOLDER'], nombre)
    archivo.save(ruta)
    return jsonify({'url': f'/static/uploads/{nombre}'})


@bp.route('/perfil')
@login_required
def perfil_page():
    return render_template('perfil.html', active_page='perfil')


@bp.route('/api/perfil', methods=['PUT'])
@login_required
def actualizar_perfil():
    data = request.get_json()
    if 'foto_url' in data:
        current_user.foto_url = data['foto_url']
    if 'matricula' in data:
        current_user.matricula = data['matricula']
    db.session.commit()
    return jsonify({'ok': True})
