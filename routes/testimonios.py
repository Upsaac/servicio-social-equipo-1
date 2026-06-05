from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from extensions import db
from models import Testimonio, Proyecto

bp = Blueprint('testimonios', __name__)


@bp.route('/api/proyectos/<int:proyecto_id>/testimonios')
def api_testimonios(proyecto_id):
    Proyecto.query.get_or_404(proyecto_id)
    proyecto = Proyecto.query.get(proyecto_id)
    puede_moderar = (
        current_user.is_authenticated and
        (current_user.rol == 'admin' or proyecto.lider_id == current_user.id)
    )
    todos = Testimonio.query.filter_by(proyecto_id=proyecto_id).order_by(Testimonio.created_at.desc()).all()
    if puede_moderar:
        return jsonify([t.to_dict() for t in todos])
    return jsonify([t.to_dict() for t in todos if t.estado == 'aprobado'])


@bp.route('/api/proyectos/<int:proyecto_id>/testimonios', methods=['POST'])
@login_required
def api_crear_testimonio(proyecto_id):
    Proyecto.query.get_or_404(proyecto_id)
    data = request.get_json()
    t = Testimonio(
        proyecto_id=proyecto_id,
        nombre_remitente=data.get('nombre_remitente') or current_user.nombre,
        rol_remitente=data['rol_remitente'],
        texto=data['texto'],
        estado='pendiente',
    )
    db.session.add(t)
    db.session.commit()
    return jsonify(t.to_dict()), 201


@bp.route('/api/testimonios/<int:testimonio_id>/estado', methods=['PUT'])
@login_required
def api_moderar_testimonio(testimonio_id):
    t = Testimonio.query.get_or_404(testimonio_id)
    proyecto = Proyecto.query.get(t.proyecto_id)
    if current_user.rol != 'admin' and proyecto.lider_id != current_user.id:
        from flask import abort
        abort(403)
    data = request.get_json()
    nuevo = data.get('estado')
    if nuevo not in ('aprobado', 'pendiente', 'rechazado'):
        return jsonify({'error': 'Estado inválido'}), 400
    if nuevo == 'rechazado':
        db.session.delete(t)
    else:
        t.estado = nuevo
    db.session.commit()
    return jsonify({'ok': True})
