from datetime import date, datetime
from flask import Blueprint, request, jsonify, render_template, abort
from flask_login import login_required, current_user
from extensions import db
from models import Actividad, Proyecto, ValorMetrica

bp = Blueprint('actividades', __name__)


@bp.route('/registrar-actividad')
@login_required
def registrar_actividad_page():
    if current_user.rol == 'admin':
        proyectos = Proyecto.query.filter(Proyecto.estado.in_(['activo', 'en_revision'])).all()
    else:
        proyectos = Proyecto.query.filter_by(
            lider_id=current_user.id
        ).filter(Proyecto.estado.in_(['activo', 'en_revision'])).all()
    return render_template('registrar-actividad.html', active_page='actividades',
                           proyectos=proyectos)


@bp.route('/api/proyectos/<int:proyecto_id>/actividades')
@login_required
def api_actividades(proyecto_id):
    Proyecto.query.get_or_404(proyecto_id)
    actividades = (Actividad.query
                   .filter_by(proyecto_id=proyecto_id)
                   .order_by(Actividad.fecha.desc())
                   .all())
    return jsonify([a.to_dict() for a in actividades])


@bp.route('/api/actividades', methods=['POST'])
@login_required
def api_crear_actividad():
    data = request.get_json()
    proyecto = Proyecto.query.get_or_404(data['proyecto_id'])

    if current_user.rol != 'admin' and proyecto.lider_id != current_user.id:
        abort(403)

    actividad = Actividad(
        proyecto_id=proyecto.id,
        fecha=date.fromisoformat(data['fecha']),
        tema=data['tema'],
        duracion_minutos=data.get('duracion_minutos'),
        num_beneficiarios_presentes=data.get('num_beneficiarios_presentes'),
        observaciones=data.get('observaciones'),
    )
    db.session.add(actividad)
    db.session.flush()  # get actividad.id before commit

    for item in data.get('metricas', []):
        v = ValorMetrica(
            actividad_id=actividad.id,
            campo_id=item['campo_id'],
            valor_texto=item.get('valor_texto'),
            valor_numero=float(item['valor_numero']) if item.get('valor_numero') is not None else None,
        )
        db.session.add(v)

    proyecto.ultima_actualizacion = datetime.utcnow()
    db.session.commit()
    return jsonify(actividad.to_dict()), 201


@bp.route('/api/actividades/calendario')
def api_calendario():
    mes = request.args.get('mes')  # YYYY-MM
    proyecto_id = request.args.get('proyecto_id')

    q = Actividad.query
    if mes:
        try:
            year, month = int(mes[:4]), int(mes[5:7])
            desde = date(year, month, 1)
            if month == 12:
                hasta = date(year + 1, 1, 1)
            else:
                hasta = date(year, month + 1, 1)
            q = q.filter(Actividad.fecha >= desde, Actividad.fecha < hasta)
        except (ValueError, IndexError):
            pass

    if proyecto_id:
        q = q.filter_by(proyecto_id=int(proyecto_id))

    actividades = q.order_by(Actividad.fecha).all()
    return jsonify([a.to_dict() for a in actividades])
