from datetime import date
from werkzeug.security import generate_password_hash
from app import app
from extensions import db
from models import Usuario, ODS, Proyecto

ODS_DATA = [
    (1,  'Fin de la pobreza',                            '#E5243B'),
    (2,  'Hambre cero',                                  '#DDA63A'),
    (3,  'Salud y bienestar',                            '#4C9F38'),
    (4,  'Educación de calidad',                         '#C5192D'),
    (5,  'Igualdad de género',                           '#FF3A21'),
    (6,  'Agua limpia y saneamiento',                    '#26BDE2'),
    (7,  'Energía asequible y no contaminante',          '#FCC30B'),
    (8,  'Trabajo decente y crecimiento económico',      '#A21942'),
    (9,  'Industria, innovación e infraestructura',      '#FD6925'),
    (10, 'Reducción de las desigualdades',               '#DD1367'),
    (11, 'Ciudades y comunidades sostenibles',           '#FD9D24'),
    (12, 'Producción y consumo responsables',            '#BF8B2E'),
    (13, 'Acción por el clima',                          '#3F7E44'),
    (14, 'Vida submarina',                               '#0A97D9'),
    (15, 'Vida de ecosistemas terrestres',               '#56C02B'),
    (16, 'Paz, justicia e instituciones sólidas',        '#00689D'),
    (17, 'Alianzas para lograr los objetivos',           '#19486A'),
]

PROYECTOS_DEMO = [
    ('Selelios',                       'Apoyo educativo a niños en situación vulnerable mediante tutorías y actividades lúdicas.',       'presencial', 'activo', '10_semanas', 'Puebla, Puebla',    200, 4),
    ('Alfabetización Digital Rural',   'Capacitación en uso de computadoras e internet para comunidades rurales.',                       'presencial', 'activo', '15_semanas', 'Puebla, Puebla',    250, 4),
    ('Salud Preventiva Comunitaria',   'Brigadas de salud con pláticas de prevención y orientación médica básica.',                       'presencial', 'activo', '10_semanas', 'Cholula, Puebla',   500, 3),
    ('Huertos Urbanos Comunitarios',   'Instalación y mantenimiento de huertos urbanos para fomentar la seguridad alimentaria.',          'presencial', 'activo', '15_semanas', 'Tehuacan, Puebla',  150, 2),
    ('Brigadas de Salud Infantil',     'Pláticas de higiene y nutrición en escuelas primarias de zonas marginadas.',                      'presencial', 'activo', '5_semanas',  'Puebla, Puebla',    350, 3),
]


def seed():
    with app.app_context():
        if ODS.query.count() == 0:
            for num, nombre, color in ODS_DATA:
                db.session.add(ODS(id=num, numero=num, nombre=nombre, color_hex=color))
            db.session.commit()
            print(f'  ✓ {len(ODS_DATA)} ODS insertados')

        admin = Usuario.query.filter_by(email='admin@tec.mx').first()
        if not admin:
            admin = Usuario(
                nombre='Coordinadora Admin',
                email='admin@tec.mx',
                password_hash=generate_password_hash('admin123'),
                rol='admin',
            )
            db.session.add(admin)
            db.session.commit()
            print('  ✓ Usuario admin creado: admin@tec.mx / admin123')

        lider_names = [
            'Víctor Ortiz', 'Carlos Ramírez', 'Ana Torres', 'Luis Pérez', 'María López',
            'Jorge Herrera', 'Sofía Ruiz', 'Ricardo Vega', 'Elena Soto', 'Pablo Flores',
            'Carmen Díaz', 'Roberto Gil', 'Daniela Mora', 'Adrián Cruz',
        ]
        lideres = []
        for i, nombre in enumerate(lider_names):
            email = f'lider{i+1}@tec.mx'
            u = Usuario.query.filter_by(email=email).first()
            if not u:
                u = Usuario(
                    nombre=nombre,
                    email=email,
                    password_hash=generate_password_hash('lider123'),
                    rol='lider',
                    matricula=f'A0{700000 + i}',
                )
                db.session.add(u)
            lideres.append(u)
        db.session.commit()
        print(f'  ✓ {len(lider_names)} líderes creados (contraseña: lider123)')

        if Proyecto.query.count() == 0:
            for i, (nombre, desc, modalidad, estado, periodo, ubicacion, meta, ods_num) in enumerate(PROYECTOS_DEMO):
                ods_obj = ODS.query.get(ods_num)
                p = Proyecto(
                    nombre=nombre,
                    descripcion=desc,
                    modalidad=modalidad,
                    estado=estado,
                    periodo_tipo=periodo,
                    ubicacion=ubicacion,
                    meta_beneficiarios=meta,
                    fecha_inicio=date(2026, 2, 1),
                    fecha_fin=date(2026, 6, 30),
                    lider_id=lideres[i].id,
                )
                if ods_obj:
                    p.ods.append(ods_obj)
                db.session.add(p)
            db.session.commit()
            print(f'  ✓ {len(PROYECTOS_DEMO)} proyectos demo creados')

        print('\nSeed completado. Arranca con: python app.py')


if __name__ == '__main__':
    seed()
