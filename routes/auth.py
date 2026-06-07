import os
import uuid
from flask import Blueprint, request, jsonify, render_template, redirect, url_for, current_app, abort
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash, generate_password_hash
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


@bp.route('/api/perfil/password', methods=['PUT'])
@login_required
def cambiar_password():
    data = request.get_json()
    actual = data.get('password_actual', '')
    nueva  = data.get('password_nueva', '')
    if not actual or not nueva:
        return jsonify({'ok': False, 'error': 'Completa ambos campos.'}), 400
    if len(nueva) < 6:
        return jsonify({'ok': False, 'error': 'La nueva contraseña debe tener al menos 6 caracteres.'}), 400
    if not check_password_hash(current_user.password_hash, actual):
        return jsonify({'ok': False, 'error': 'La contraseña actual es incorrecta.'}), 401
    current_user.password_hash = generate_password_hash(nueva)
    db.session.commit()
    return jsonify({'ok': True})


# ── Gestión de usuarios (solo admin) ─────────────────────────────────────────

@bp.route('/api/usuarios')
@login_required
def api_listar_usuarios():
    if current_user.rol != 'admin':
        abort(403)
    usuarios = Usuario.query.order_by(Usuario.nombre).all()
    return jsonify([{
        'id': u.id, 'nombre': u.nombre, 'email': u.email,
        'rol': u.rol, 'matricula': u.matricula or '',
        'foto_url': u.foto_url,
    } for u in usuarios])


@bp.route('/api/usuarios', methods=['POST'])
@login_required
def api_crear_usuario():
    if current_user.rol != 'admin':
        abort(403)
    data = request.get_json()
    nombre   = (data.get('nombre') or '').strip()
    email    = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    rol      = data.get('rol', 'lider')
    if not nombre or not email or not password:
        return jsonify({'ok': False, 'error': 'Nombre, email y contraseña son requeridos.'}), 400
    if len(password) < 6:
        return jsonify({'ok': False, 'error': 'La contraseña debe tener al menos 6 caracteres.'}), 400
    if rol not in ('admin', 'lider'):
        return jsonify({'ok': False, 'error': 'Rol inválido.'}), 400
    if Usuario.query.filter_by(email=email).first():
        return jsonify({'ok': False, 'error': 'Ya existe un usuario con ese correo.'}), 409
    u = Usuario(
        nombre=nombre, email=email,
        password_hash=generate_password_hash(password),
        rol=rol, matricula=data.get('matricula', ''),
    )
    db.session.add(u)
    db.session.commit()
    return jsonify({'ok': True, 'id': u.id, 'nombre': u.nombre, 'email': u.email, 'rol': u.rol}), 201


@bp.route('/api/usuarios/<int:usuario_id>', methods=['DELETE'])
@login_required
def api_eliminar_usuario(usuario_id):
    if current_user.rol != 'admin':
        abort(403)
    if usuario_id == current_user.id:
        return jsonify({'ok': False, 'error': 'No puedes eliminar tu propia cuenta.'}), 400
    u = Usuario.query.get_or_404(usuario_id)
    db.session.delete(u)
    db.session.commit()
    return jsonify({'ok': True})
