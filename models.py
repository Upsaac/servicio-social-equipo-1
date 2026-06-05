from datetime import datetime
from flask_login import UserMixin
from extensions import db

proyecto_ods = db.Table(
    'proyecto_ods',
    db.Column('proyecto_id', db.Integer, db.ForeignKey('proyecto.id'), primary_key=True),
    db.Column('ods_id', db.Integer, db.ForeignKey('ods.id'), primary_key=True),
)


class Usuario(UserMixin, db.Model):
    __tablename__ = 'usuario'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.Text, nullable=False)
    email = db.Column(db.Text, unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    rol = db.Column(db.Text, nullable=False, default='lider')
    matricula = db.Column(db.Text)
    foto_url = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    proyectos = db.relationship('Proyecto', backref='lider', lazy=True)

    @property
    def initials(self):
        parts = self.nombre.strip().split()
        return ''.join(p[0].upper() for p in parts[:2]) if parts else '?'


class ODS(db.Model):
    __tablename__ = 'ods'
    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.Integer, nullable=False)
    nombre = db.Column(db.Text, nullable=False)
    color_hex = db.Column(db.Text, nullable=False)


class Proyecto(db.Model):
    __tablename__ = 'proyecto'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.Text, nullable=False)
    descripcion = db.Column(db.Text)
    modalidad = db.Column(db.Text, nullable=False, default='presencial')
    estado = db.Column(db.Text, nullable=False, default='borrador')
    fecha_inicio = db.Column(db.Date)
    fecha_fin = db.Column(db.Date)
    periodo_tipo = db.Column(db.Text)
    ubicacion = db.Column(db.Text)
    meta_beneficiarios = db.Column(db.Integer)
    imagen_url = db.Column(db.Text)
    ultima_actualizacion = db.Column(db.DateTime, default=datetime.utcnow)
    lider_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ods = db.relationship('ODS', secondary=proyecto_ods, lazy='subquery')
    actividades = db.relationship(
        'Actividad', backref='proyecto', lazy=True, cascade='all, delete-orphan'
    )
    reportes = db.relationship(
        'ReporteBeneficiarios', backref='proyecto', lazy=True, cascade='all, delete-orphan'
    )
    equipo = db.relationship(
        'MiembroEquipo', backref='proyecto', lazy=True, cascade='all, delete-orphan'
    )
    testimonios = db.relationship(
        'Testimonio', backref='proyecto', lazy=True, cascade='all, delete-orphan'
    )
    campos = db.relationship(
        'CampoPersonalizado', backref='proyecto', lazy=True, cascade='all, delete-orphan',
        order_by='CampoPersonalizado.posicion'
    )

    def beneficiarios_totales(self):
        if not self.reportes:
            return 0
        latest = max(self.reportes, key=lambda r: r.created_at)
        return latest.total

    def avance_pct(self):
        if not self.meta_beneficiarios:
            return 0
        total = self.beneficiarios_totales()
        return round(min(total / self.meta_beneficiarios * 100, 100))

    def to_dict(self, include_actividades=False):
        data = {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'modalidad': self.modalidad,
            'estado': self.estado,
            'fecha_inicio': self.fecha_inicio.isoformat() if self.fecha_inicio else None,
            'fecha_fin': self.fecha_fin.isoformat() if self.fecha_fin else None,
            'periodo_tipo': self.periodo_tipo,
            'ubicacion': self.ubicacion,
            'meta_beneficiarios': self.meta_beneficiarios,
            'imagen_url': self.imagen_url,
            'ultima_actualizacion': (
                self.ultima_actualizacion.strftime('%d/%m/%Y %H:%M')
                if self.ultima_actualizacion else None
            ),
            'lider': {
                'id': self.lider.id,
                'nombre': self.lider.nombre,
                'initials': self.lider.initials,
                'email': self.lider.email,
                'foto_url': self.lider.foto_url,
            } if self.lider else None,
            'ods': [
                {'id': o.id, 'numero': o.numero, 'nombre': o.nombre, 'color': o.color_hex}
                for o in self.ods
            ],
            'equipo': [{'id': m.id, 'nombre': m.nombre, 'rol': m.rol} for m in self.equipo],
            'campos': [
                {'id': c.id, 'nombre': c.nombre, 'tipo': c.tipo, 'unidad': c.unidad}
                for c in self.campos
            ],
            'beneficiarios': self.beneficiarios_totales(),
            'avance_pct': self.avance_pct(),
        }
        if include_actividades:
            data['actividades'] = [a.to_dict() for a in sorted(self.actividades, key=lambda x: x.fecha, reverse=True)]
            data['reportes'] = [r.to_dict() for r in self.reportes]
        return data


class MiembroEquipo(db.Model):
    __tablename__ = 'miembro_equipo'
    id          = db.Column(db.Integer, primary_key=True)
    proyecto_id = db.Column(db.Integer, db.ForeignKey('proyecto.id'), nullable=False)
    nombre      = db.Column(db.Text, nullable=False)
    rol         = db.Column(db.Text, nullable=False, default='Prestador de Servicio Social')
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)


class Testimonio(db.Model):
    __tablename__ = 'testimonio'
    id               = db.Column(db.Integer, primary_key=True)
    proyecto_id      = db.Column(db.Integer, db.ForeignKey('proyecto.id'), nullable=False)
    nombre_remitente = db.Column(db.Text, nullable=False)
    rol_remitente    = db.Column(db.Text, nullable=False)
    texto            = db.Column(db.Text, nullable=False)
    estado           = db.Column(db.Text, nullable=False, default='pendiente')
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'nombre_remitente': self.nombre_remitente,
            'rol_remitente': self.rol_remitente,
            'texto': self.texto,
            'estado': self.estado,
            'fecha': self.created_at.strftime('%d %b %Y') if self.created_at else '',
        }


class CampoPersonalizado(db.Model):
    __tablename__ = 'campo_personalizado'
    id          = db.Column(db.Integer, primary_key=True)
    proyecto_id = db.Column(db.Integer, db.ForeignKey('proyecto.id'), nullable=False)
    nombre      = db.Column(db.Text, nullable=False)
    tipo        = db.Column(db.Text, nullable=False, default='numero')
    unidad      = db.Column(db.Text)
    posicion    = db.Column(db.Integer, default=0)
    valores     = db.relationship(
        'ValorMetrica', backref='campo', lazy=True, cascade='all, delete-orphan'
    )


class ValorMetrica(db.Model):
    __tablename__ = 'valor_metrica'
    id           = db.Column(db.Integer, primary_key=True)
    actividad_id = db.Column(db.Integer, db.ForeignKey('actividad.id'), nullable=False)
    campo_id     = db.Column(db.Integer, db.ForeignKey('campo_personalizado.id'), nullable=False)
    valor_texto  = db.Column(db.Text)
    valor_numero = db.Column(db.Float)

    def to_dict(self):
        return {
            'campo_id': self.campo_id,
            'campo_nombre': self.campo.nombre,
            'campo_unidad': self.campo.unidad or '',
            'campo_tipo': self.campo.tipo,
            'valor': self.valor_numero if self.campo.tipo == 'numero' else self.valor_texto,
        }


class Actividad(db.Model):
    __tablename__ = 'actividad'
    id = db.Column(db.Integer, primary_key=True)
    proyecto_id = db.Column(db.Integer, db.ForeignKey('proyecto.id'), nullable=False)
    fecha = db.Column(db.Date, nullable=False)
    tema = db.Column(db.Text, nullable=False)
    duracion_minutos = db.Column(db.Integer)
    num_beneficiarios_presentes = db.Column(db.Integer)
    observaciones = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    metricas = db.relationship(
        'ValorMetrica', backref='actividad', lazy=True, cascade='all, delete-orphan'
    )

    def to_dict(self):
        return {
            'id': self.id,
            'proyecto_id': self.proyecto_id,
            'proyecto_nombre': self.proyecto.nombre if self.proyecto else None,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'tema': self.tema,
            'duracion_minutos': self.duracion_minutos,
            'num_beneficiarios_presentes': self.num_beneficiarios_presentes,
            'observaciones': self.observaciones,
            'metricas': [v.to_dict() for v in self.metricas],
        }


class Configuracion(db.Model):
    __tablename__ = 'configuracion'
    id        = db.Column(db.Integer, primary_key=True)
    video_url = db.Column(db.Text, default='')


def get_config():
    c = Configuracion.query.get(1)
    if not c:
        c = Configuracion(id=1, video_url='')
        db.session.add(c)
        db.session.commit()
    return c


class ReporteBeneficiarios(db.Model):
    __tablename__ = 'reporte_beneficiarios'
    id = db.Column(db.Integer, primary_key=True)
    proyecto_id = db.Column(db.Integer, db.ForeignKey('proyecto.id'), nullable=False)
    periodo_inicio = db.Column(db.Date, nullable=False)
    periodo_fin = db.Column(db.Date, nullable=False)
    total = db.Column(db.Integer, nullable=False)
    hombres = db.Column(db.Integer, default=0)
    mujeres = db.Column(db.Integer, default=0)
    edad_6_9 = db.Column(db.Integer, default=0)
    edad_10_12 = db.Column(db.Integer, default=0)
    edad_13_15 = db.Column(db.Integer, default=0)
    edad_16_mas = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'proyecto_id': self.proyecto_id,
            'periodo_inicio': self.periodo_inicio.isoformat(),
            'periodo_fin': self.periodo_fin.isoformat(),
            'total': self.total,
            'hombres': self.hombres,
            'mujeres': self.mujeres,
            'edad_6_9': self.edad_6_9,
            'edad_10_12': self.edad_10_12,
            'edad_13_15': self.edad_13_15,
            'edad_16_mas': self.edad_16_mas,
        }
