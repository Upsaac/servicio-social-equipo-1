from datetime import date, datetime
from flask import Blueprint, request, jsonify, render_template, abort
from flask_login import login_required, current_user
from extensions import db
from models import ReporteBeneficiarios, Proyecto

bp = Blueprint('beneficiarios', __name__)


@bp.route('/reporte-beneficiarios')
@login_required
def reporte_beneficiarios_page():
    if current_user.rol == 'admin':
        proyectos = Proyecto.query.filter(Proyecto.estado.in_(['activo', 'en_revision'])).all()
    else:
        proyectos = Proyecto.query.filter_by(
            lider_id=current_user.id
        ).filter(Proyecto.estado.in_(['activo', 'en_revision'])).all()
    return render_template('reporte-beneficiarios.html', active_page='actividades',
                           proyectos=proyectos)


@bp.route('/api/proyectos/<int:proyecto_id>/beneficiarios')
@login_required
def api_beneficiarios(proyecto_id):
    Proyecto.query.get_or_404(proyecto_id)
    reportes = (ReporteBeneficiarios.query
                .filter_by(proyecto_id=proyecto_id)
                .order_by(ReporteBeneficiarios.periodo_fin.desc())
                .all())
    return jsonify([r.to_dict() for r in reportes])


@bp.route('/api/reportes-beneficiarios', methods=['POST'])
@login_required
def api_crear_reporte():
    data = request.get_json()
    proyecto = Proyecto.query.get_or_404(data['proyecto_id'])

    if current_user.rol != 'admin' and proyecto.lider_id != current_user.id:
        abort(403)

    reporte = ReporteBeneficiarios(
        proyecto_id=proyecto.id,
        periodo_inicio=date.fromisoformat(data['periodo_inicio']),
        periodo_fin=date.fromisoformat(data['periodo_fin']),
        total=int(data['total']),
        hombres=int(data.get('hombres', 0)),
        mujeres=int(data.get('mujeres', 0)),
        edad_6_9=int(data.get('edad_6_9', 0)),
        edad_10_12=int(data.get('edad_10_12', 0)),
        edad_13_15=int(data.get('edad_13_15', 0)),
        edad_16_mas=int(data.get('edad_16_mas', 0)),
    )
    db.session.add(reporte)
    proyecto.ultima_actualizacion = datetime.utcnow()
    db.session.commit()
    return jsonify(reporte.to_dict()), 201
