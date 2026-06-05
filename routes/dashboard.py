from flask import Blueprint, jsonify, render_template, request, abort
from flask_login import login_required, current_user
from sqlalchemy import func
from extensions import db
from models import Proyecto, Usuario, Actividad, ReporteBeneficiarios, ODS, get_config

bp = Blueprint('dashboard', __name__)


# ── Páginas ──────────────────────────────────────────────────────────────────

@bp.route('/')
def index():
    from flask import redirect, url_for
    return redirect(url_for('dashboard.dashboard_page'))


@bp.route('/dashboard')
def dashboard_page():
    config = get_config()
    return render_template('dashboard.html', active_page='dashboard',
                           video_url=config.video_url)


@bp.route('/configuracion')
@login_required
def configuracion_page():
    if current_user.rol != 'admin':
        abort(403)
    config = get_config()
    return render_template('configuracion.html', active_page='configuracion', config=config)


@bp.route('/api/configuracion', methods=['PUT'])
@login_required
def api_guardar_config():
    if current_user.rol != 'admin':
        abort(403)
    data   = request.get_json()
    config = get_config()
    if 'video_url' in data:
        config.video_url = data['video_url']
    db.session.commit()
    return jsonify({'ok': True})


@bp.route('/lideres')
def lideres_page():
    return render_template('lideres.html', active_page='lideres')


@bp.route('/analisis')
def analisis_page():
    return render_template('analisis.html', active_page='analisis')


@bp.route('/calendario')
def calendario_page():
    proyectos = Proyecto.query.filter(Proyecto.estado.in_(['activo', 'en_revision'])).all()
    return render_template('calendario.html', active_page='calendario',
                           proyectos=[{'id': p.id, 'nombre': p.nombre} for p in proyectos])


# ── API ───────────────────────────────────────────────────────────────────────

@bp.route('/api/dashboard')
def api_dashboard():
    proyectos_activos_q = Proyecto.query.filter_by(estado='activo').all()

    total_beneficiarios = 0
    proyectos_data = []
    for p in proyectos_activos_q:
        ben = p.beneficiarios_totales()
        total_beneficiarios += ben
        proyectos_data.append({
            **p.to_dict(),
            'beneficiarios': ben,
            'avance_pct': p.avance_pct(),
        })

    total_lideres = db.session.query(func.count(Usuario.id)).filter_by(rol='lider').scalar()
    total_actividades = db.session.query(func.count(Actividad.id)).scalar()

    zonas = set()
    for p in proyectos_activos_q:
        if p.ubicacion:
            zonas.add(p.ubicacion.split(',')[0].strip())

    ods_counts = {}
    for p in proyectos_activos_q:
        for o in p.ods:
            ods_counts[o.id] = ods_counts.get(o.id, {'ods_id': o.id, 'numero': o.numero,
                                                       'nombre': o.nombre, 'color': o.color_hex,
                                                       'count': 0})
            ods_counts[o.id]['count'] += 1

    return jsonify({
        'proyectos_activos': len(proyectos_activos_q),
        'total_beneficiarios': total_beneficiarios,
        'total_lideres': total_lideres,
        'total_actividades': total_actividades,
        'zonas_intervencion': len(zonas),
        'proyectos': proyectos_data,
        'ods_impactados': list(ods_counts.values()),
    })
