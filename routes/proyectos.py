from datetime import datetime
from flask import Blueprint, request, jsonify, render_template, abort
from flask_login import login_required, current_user
from extensions import db
from models import Proyecto, ODS, Usuario, MiembroEquipo, CampoPersonalizado

bp = Blueprint('proyectos', __name__)


# ── Páginas ──────────────────────────────────────────────────────────────────

@bp.route('/proyectos')
def proyectos_page():
    return render_template('proyectos.html', active_page='proyectos')


@bp.route('/proyectos/<int:proyecto_id>')
def proyecto_detalle_page(proyecto_id):
    proyecto = Proyecto.query.get_or_404(proyecto_id)
    es_lider_dueno = (
        current_user.is_authenticated and current_user.id == proyecto.lider_id
    )
    puede_editar = (
        current_user.is_authenticated and
        (current_user.rol == 'admin' or current_user.id == proyecto.lider_id)
    )
    return render_template('proyecto-detalle.html', active_page='proyectos',
                           proyecto_id=proyecto_id, proyecto_nombre=proyecto.nombre,
                           es_lider_dueno=es_lider_dueno, puede_editar=puede_editar)


@bp.route('/crear-proyecto')
@login_required
def crear_proyecto_page():
    ods_list = ODS.query.order_by(ODS.numero).all()
    lideres = Usuario.query.filter_by(rol='lider').all()
    return render_template('crear-proyecto.html', active_page='proyectos',
                           ods_list=ods_list, lideres=lideres)


@bp.route('/editar-proyecto/<int:proyecto_id>')
@login_required
def editar_proyecto_page(proyecto_id):
    proyecto = Proyecto.query.get_or_404(proyecto_id)
    if current_user.rol != 'admin' and proyecto.lider_id != current_user.id:
        abort(403)
    ods_list = ODS.query.order_by(ODS.numero).all()
    return render_template('editar-proyecto.html', active_page='proyectos',
                           proyecto=proyecto.to_dict(), ods_list=ods_list)


# ── API ───────────────────────────────────────────────────────────────────────

@bp.route('/api/proyectos')
def api_proyectos():
    q = Proyecto.query
    estado = request.args.get('estado')
    ods_num = request.args.get('ods')
    zona = request.args.get('zona')

    # Visitantes no autenticados solo ven proyectos activos
    if not current_user.is_authenticated:
        q = q.filter_by(estado='activo')
    elif estado:
        q = q.filter_by(estado=estado)

    if ods_num:
        q = q.join(Proyecto.ods).filter(ODS.numero == int(ods_num))
    if zona:
        q = q.filter(Proyecto.ubicacion.ilike(f'%{zona}%'))

    proyectos = q.order_by(Proyecto.ultima_actualizacion.desc()).all()
    return jsonify([p.to_dict() for p in proyectos])


@bp.route('/api/proyectos/publicos')
def api_proyectos_publicos():
    proyectos = (Proyecto.query
                 .filter_by(estado='activo')
                 .order_by(Proyecto.ultima_actualizacion.desc())
                 .all())
    return jsonify([p.to_dict() for p in proyectos])


@bp.route('/api/proyectos/<int:proyecto_id>')
def api_proyecto_detalle(proyecto_id):
    p = Proyecto.query.get_or_404(proyecto_id)
    return jsonify(p.to_dict(include_actividades=True))


@bp.route('/api/proyectos', methods=['POST'])
@login_required
def api_crear_proyecto():
    data = request.get_json()

    lider_id = current_user.id
    if current_user.rol == 'admin' and data.get('lider_id'):
        lider_id = int(data['lider_id'])

    proyecto = Proyecto(
        nombre=data['nombre'],
        descripcion=data.get('descripcion'),
        modalidad=data.get('modalidad', 'presencial'),
        periodo_tipo=data.get('periodo_tipo'),
        ubicacion=data.get('ubicacion'),
        meta_beneficiarios=data.get('meta_beneficiarios'),
        imagen_url=data.get('imagen_url'),
        lider_id=lider_id,
        estado='borrador',
    )

    if data.get('fecha_inicio'):
        from datetime import date
        proyecto.fecha_inicio = date.fromisoformat(data['fecha_inicio'])
    if data.get('fecha_fin'):
        from datetime import date
        proyecto.fecha_fin = date.fromisoformat(data['fecha_fin'])

    ods_ids = data.get('ods_ids', [])
    if ods_ids:
        proyecto.ods = ODS.query.filter(ODS.id.in_(ods_ids)).all()

    db.session.add(proyecto)
    db.session.commit()
    return jsonify(proyecto.to_dict()), 201


@bp.route('/api/proyectos/<int:proyecto_id>', methods=['PUT'])
@login_required
def api_editar_proyecto(proyecto_id):
    proyecto = Proyecto.query.get_or_404(proyecto_id)
    if current_user.rol != 'admin' and proyecto.lider_id != current_user.id:
        abort(403)

    data = request.get_json()
    campos = ['nombre', 'descripcion', 'modalidad', 'periodo_tipo', 'ubicacion', 'meta_beneficiarios', 'imagen_url']
    for campo in campos:
        if campo in data:
            setattr(proyecto, campo, data[campo])

    if data.get('fecha_inicio'):
        from datetime import date
        proyecto.fecha_inicio = date.fromisoformat(data['fecha_inicio'])
    if data.get('fecha_fin'):
        from datetime import date
        proyecto.fecha_fin = date.fromisoformat(data['fecha_fin'])

    if 'ods_ids' in data:
        proyecto.ods = ODS.query.filter(ODS.id.in_(data['ods_ids'])).all()

    proyecto.ultima_actualizacion = datetime.utcnow()
    db.session.commit()
    return jsonify(proyecto.to_dict())


@bp.route('/api/proyectos/<int:proyecto_id>/estado', methods=['PUT'])
@login_required
def api_cambiar_estado(proyecto_id):
    if current_user.rol != 'admin':
        abort(403)
    proyecto = Proyecto.query.get_or_404(proyecto_id)
    data = request.get_json()
    estados_validos = ('borrador', 'en_revision', 'activo', 'pausado', 'cerrado')
    nuevo_estado = data.get('estado')
    if nuevo_estado not in estados_validos:
        return jsonify({'error': 'Estado inválido'}), 400
    proyecto.estado = nuevo_estado
    proyecto.ultima_actualizacion = datetime.utcnow()
    db.session.commit()
    return jsonify({'ok': True, 'estado': proyecto.estado})


@bp.route('/api/lideres')
def api_lideres():
    lideres = Usuario.query.filter_by(rol='lider').all()
    result = []
    for u in lideres:
        proyectos_activos = [p for p in u.proyectos if p.estado == 'activo']
        result.append({
            'id': u.id,
            'nombre': u.nombre,
            'email': u.email,
            'initials': u.initials,
            'matricula': u.matricula,
            'foto_url': u.foto_url,
            'proyectos': [{'id': p.id, 'nombre': p.nombre, 'ubicacion': p.ubicacion} for p in proyectos_activos],
            'total_proyectos': len(proyectos_activos),
        })
    return jsonify(result)


# ── Equipo del proyecto ───────────────────────────────────────────────────────

@bp.route('/api/proyectos/<int:proyecto_id>/equipo', methods=['POST'])
@login_required
def api_agregar_miembro(proyecto_id):
    proyecto = Proyecto.query.get_or_404(proyecto_id)
    if current_user.rol != 'admin' and proyecto.lider_id != current_user.id:
        abort(403)
    data = request.get_json()
    m = MiembroEquipo(
        proyecto_id=proyecto.id,
        nombre=data['nombre'],
        rol=data.get('rol', 'Prestador de Servicio Social'),
    )
    db.session.add(m)
    db.session.commit()
    return jsonify({'id': m.id, 'nombre': m.nombre, 'rol': m.rol}), 201


@bp.route('/api/equipo/<int:miembro_id>', methods=['DELETE'])
@login_required
def api_eliminar_miembro(miembro_id):
    m = MiembroEquipo.query.get_or_404(miembro_id)
    proyecto = Proyecto.query.get(m.proyecto_id)
    if current_user.rol != 'admin' and proyecto.lider_id != current_user.id:
        abort(403)
    db.session.delete(m)
    db.session.commit()
    return jsonify({'ok': True})


# ── Campos personalizados ─────────────────────────────────────────────────────

@bp.route('/api/proyectos/<int:proyecto_id>/campos', methods=['POST'])
@login_required
def api_agregar_campo(proyecto_id):
    proyecto = Proyecto.query.get_or_404(proyecto_id)
    if current_user.rol != 'admin' and proyecto.lider_id != current_user.id:
        abort(403)
    data = request.get_json()
    posicion = len(proyecto.campos)
    c = CampoPersonalizado(
        proyecto_id=proyecto.id,
        nombre=data['nombre'],
        tipo=data.get('tipo', 'numero'),
        unidad=data.get('unidad') or None,
        posicion=posicion,
    )
    db.session.add(c)
    db.session.commit()
    return jsonify({'id': c.id, 'nombre': c.nombre, 'tipo': c.tipo, 'unidad': c.unidad}), 201


@bp.route('/api/campos/<int:campo_id>', methods=['DELETE'])
@login_required
def api_eliminar_campo(campo_id):
    c = CampoPersonalizado.query.get_or_404(campo_id)
    proyecto = Proyecto.query.get(c.proyecto_id)
    if current_user.rol != 'admin' and proyecto.lider_id != current_user.id:
        abort(403)
    db.session.delete(c)
    db.session.commit()
    return jsonify({'ok': True})
