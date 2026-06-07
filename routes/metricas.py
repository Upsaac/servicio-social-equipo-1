from datetime import datetime
from flask import Blueprint, request, jsonify, abort
from flask_login import login_required, current_user
from extensions import db
from models import (MetricaGlobal, ValorMetricaGlobal, ValorCampoProyecto,
                    CampoPersonalizado, Proyecto)

bp = Blueprint('metricas', __name__)


# ── Métricas globales (CRUD, solo admin) ─────────────────────────────────────

@bp.route('/api/metricas-globales')
def api_listar_metricas():
    metricas = MetricaGlobal.query.order_by(MetricaGlobal.nombre).all()
    return jsonify([m.to_dict() for m in metricas])


@bp.route('/api/metricas-globales', methods=['POST'])
@login_required
def api_crear_metrica():
    if current_user.rol != 'admin':
        abort(403)
    data = request.get_json()
    nombre = (data.get('nombre') or '').strip()
    if not nombre:
        return jsonify({'ok': False, 'error': 'El nombre es requerido.'}), 400
    m = MetricaGlobal(
        nombre=nombre,
        tipo=data.get('tipo', 'numero'),
        unidad=data.get('unidad') or None,
        descripcion=data.get('descripcion') or None,
    )
    if data.get('proyectos_ids'):
        m.proyectos = Proyecto.query.filter(Proyecto.id.in_(data['proyectos_ids'])).all()
    db.session.add(m)
    db.session.commit()
    return jsonify(m.to_dict()), 201


@bp.route('/api/metricas-globales/<int:metrica_id>', methods=['PUT'])
@login_required
def api_editar_metrica(metrica_id):
    if current_user.rol != 'admin':
        abort(403)
    m = MetricaGlobal.query.get_or_404(metrica_id)
    data = request.get_json()
    for campo in ('nombre', 'tipo', 'unidad', 'descripcion'):
        if campo in data:
            setattr(m, campo, data[campo] or None if campo != 'nombre' else data[campo])
    if 'proyectos_ids' in data:
        m.proyectos = Proyecto.query.filter(Proyecto.id.in_(data['proyectos_ids'])).all()
    db.session.commit()
    return jsonify(m.to_dict())


@bp.route('/api/metricas-globales/<int:metrica_id>', methods=['DELETE'])
@login_required
def api_eliminar_metrica(metrica_id):
    if current_user.rol != 'admin':
        abort(403)
    m = MetricaGlobal.query.get_or_404(metrica_id)
    db.session.delete(m)
    db.session.commit()
    return jsonify({'ok': True})


# ── Valor de métrica global por proyecto ─────────────────────────────────────

@bp.route('/api/proyectos/<int:proyecto_id>/metricas-globales/<int:metrica_id>/valor', methods=['PUT'])
@login_required
def api_valor_metrica_global(proyecto_id, metrica_id):
    proyecto = Proyecto.query.get_or_404(proyecto_id)
    if current_user.rol != 'admin' and proyecto.lider_id != current_user.id:
        abort(403)
    metrica = MetricaGlobal.query.get_or_404(metrica_id)
    data = request.get_json()

    v = ValorMetricaGlobal.query.filter_by(metrica_id=metrica_id, proyecto_id=proyecto_id).first()
    if not v:
        v = ValorMetricaGlobal(metrica_id=metrica_id, proyecto_id=proyecto_id)
        db.session.add(v)

    if metrica.tipo == 'numero':
        raw = data.get('valor')
        v.valor_numero = float(raw) if raw is not None and raw != '' else None
    else:
        v.valor_texto = data.get('valor')
    v.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'ok': True, 'valor': v.valor_numero if metrica.tipo == 'numero' else v.valor_texto})


# ── Valor de campo personalizado (nivel proyecto) ────────────────────────────

@bp.route('/api/proyectos/<int:proyecto_id>/campos/<int:campo_id>/valor', methods=['PUT'])
@login_required
def api_valor_campo_proyecto(proyecto_id, campo_id):
    proyecto = Proyecto.query.get_or_404(proyecto_id)
    if current_user.rol != 'admin' and proyecto.lider_id != current_user.id:
        abort(403)
    campo = CampoPersonalizado.query.get_or_404(campo_id)
    if campo.proyecto_id != proyecto_id:
        abort(403)
    data = request.get_json()

    v = ValorCampoProyecto.query.filter_by(campo_id=campo_id).first()
    if not v:
        v = ValorCampoProyecto(campo_id=campo_id)
        db.session.add(v)

    if campo.tipo == 'numero':
        raw = data.get('valor')
        v.valor_numero = float(raw) if raw is not None and raw != '' else None
    else:
        v.valor_texto = data.get('valor')
    v.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'ok': True, 'valor': v.valor_numero if campo.tipo == 'numero' else v.valor_texto})


# ── Métricas globales asignadas a un proyecto (para proyecto-detalle) ─────────

@bp.route('/api/proyectos/<int:proyecto_id>/metricas-globales')
def api_metricas_proyecto(proyecto_id):
    Proyecto.query.get_or_404(proyecto_id)
    metricas = MetricaGlobal.query.filter(
        MetricaGlobal.proyectos.any(id=proyecto_id)
    ).all()
    result = []
    for m in metricas:
        v = ValorMetricaGlobal.query.filter_by(metrica_id=m.id, proyecto_id=proyecto_id).first()
        result.append({
            'id': m.id,
            'nombre': m.nombre,
            'tipo': m.tipo,
            'unidad': m.unidad or '',
            'descripcion': m.descripcion or '',
            'valor': (v.valor_numero if m.tipo == 'numero' else v.valor_texto) if v else None,
        })
    return jsonify(result)
