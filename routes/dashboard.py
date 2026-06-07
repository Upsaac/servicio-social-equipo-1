import re
from flask import Blueprint, jsonify, render_template, request, abort
from flask_login import login_required, current_user
from sqlalchemy import func
from extensions import db
from models import Proyecto, Usuario, Actividad, ReporteBeneficiarios, ODS, get_config, MetricaGlobal, ValorMetricaGlobal


def _to_youtube_embed(url: str) -> str:
    """Convert any YouTube URL format to embed format."""
    if not url:
        return url
    if 'youtube.com/embed/' in url:
        return url
    m = re.match(r'https?://youtu\.be/([^?&]+)', url)
    if m:
        return f'https://www.youtube.com/embed/{m.group(1)}'
    m = re.search(r'[?&]v=([^&]+)', url)
    if m:
        return f'https://www.youtube.com/embed/{m.group(1)}'
    return url

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
                           video_url=config.video_url, config=config)


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
    for campo in ('video_url', 'video_titulo', 'video_descripcion'):
        if campo in data:
            valor = data[campo]
            if campo == 'video_url':
                valor = _to_youtube_embed(valor)
            setattr(config, campo, valor)
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

    metricas_globales = []
    for m in MetricaGlobal.query.order_by(MetricaGlobal.nombre).all():
        valores_por_proyecto = []
        for p in m.proyectos:
            v = ValorMetricaGlobal.query.filter_by(metrica_id=m.id, proyecto_id=p.id).first()
            color = p.ods[0].color_hex if p.ods else '#185FA5'
            valores_por_proyecto.append({
                'proyecto_id':     p.id,
                'proyecto_nombre': p.nombre,
                'color':           color,
                'valor': (v.valor_numero if m.tipo == 'numero' else v.valor_texto) if v else None,
            })
        total = sum(
            (e['valor'] or 0) for e in valores_por_proyecto if e['valor'] is not None
        ) if m.tipo == 'numero' else None
        metricas_globales.append({
            'id': m.id, 'nombre': m.nombre, 'tipo': m.tipo,
            'unidad': m.unidad or '', 'total_global': total,
            'valores_por_proyecto': valores_por_proyecto,
        })

    return jsonify({
        'proyectos_activos': len(proyectos_activos_q),
        'total_beneficiarios': total_beneficiarios,
        'total_lideres': total_lideres,
        'total_actividades': total_actividades,
        'zonas_intervencion': len(zonas),
        'proyectos': proyectos_data,
        'ods_impactados': list(ods_counts.values()),
        'metricas_globales': metricas_globales,
    })
