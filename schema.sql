-- Huella Solidaria — Esquema de base de datos
-- SQLite compatible. Generado desde models.py con SQLAlchemy.

CREATE TABLE usuario (
    id            INTEGER  PRIMARY KEY AUTOINCREMENT,
    nombre        TEXT     NOT NULL,
    email         TEXT     UNIQUE NOT NULL,
    password_hash TEXT     NOT NULL,
    rol           TEXT     NOT NULL DEFAULT 'lider'
                           CHECK(rol IN ('admin', 'lider')),
    matricula     TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ods (
    id        INTEGER PRIMARY KEY,   -- coincide con el número oficial ODS 1-17
    numero    INTEGER NOT NULL,
    nombre    TEXT    NOT NULL,
    color_hex TEXT    NOT NULL       -- color oficial de la ONU, ej. '#E5243B'
);

CREATE TABLE proyecto (
    id                   INTEGER  PRIMARY KEY AUTOINCREMENT,
    nombre               TEXT     NOT NULL,
    descripcion          TEXT,
    modalidad            TEXT     NOT NULL DEFAULT 'presencial'
                                  CHECK(modalidad IN ('presencial', 'en_linea', 'mixto')),
    estado               TEXT     NOT NULL DEFAULT 'borrador'
                                  CHECK(estado IN ('borrador', 'en_revision', 'activo', 'pausado', 'cerrado')),
    fecha_inicio         DATE,
    fecha_fin            DATE,
    periodo_tipo         TEXT     CHECK(periodo_tipo IN ('5_semanas', '10_semanas', '15_semanas')),
    ubicacion            TEXT,
    meta_beneficiarios   INTEGER,
    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    lider_id             INTEGER  NOT NULL REFERENCES usuario(id),
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Relación muchos-a-muchos: un proyecto puede impactar varios ODS
CREATE TABLE proyecto_ods (
    proyecto_id INTEGER REFERENCES proyecto(id) ON DELETE CASCADE,
    ods_id      INTEGER REFERENCES ods(id),
    PRIMARY KEY (proyecto_id, ods_id)
);

CREATE TABLE actividad (
    id                          INTEGER  PRIMARY KEY AUTOINCREMENT,
    proyecto_id                 INTEGER  NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    fecha                       DATE     NOT NULL,
    tema                        TEXT     NOT NULL,
    duracion_minutos            INTEGER,
    num_beneficiarios_presentes INTEGER,
    observaciones               TEXT,    -- campo libre: kg residuos, idioma, objetivo SEL, etc.
    created_at                  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reporte_beneficiarios (
    id             INTEGER  PRIMARY KEY AUTOINCREMENT,
    proyecto_id    INTEGER  NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    periodo_inicio DATE     NOT NULL,
    periodo_fin    DATE     NOT NULL,
    total          INTEGER  NOT NULL,
    hombres        INTEGER  DEFAULT 0,
    mujeres        INTEGER  DEFAULT 0,
    edad_6_9       INTEGER  DEFAULT 0,   -- Primaria baja (1°-3°)
    edad_10_12     INTEGER  DEFAULT 0,   -- Primaria alta (4°-6°)
    edad_13_15     INTEGER  DEFAULT 0,   -- Secundaria
    edad_16_mas    INTEGER  DEFAULT 0,   -- Preparatoria y adultos
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Consultas calculadas utilizadas en el dashboard ─────────────────────────

-- Total de beneficiarios de un proyecto (reporte más reciente)
-- SELECT total FROM reporte_beneficiarios
--   WHERE proyecto_id = :id ORDER BY created_at DESC LIMIT 1;

-- % de avance de un proyecto
-- SELECT CAST(r.total AS REAL) / p.meta_beneficiarios * 100
--   FROM proyecto p
--   JOIN reporte_beneficiarios r ON r.proyecto_id = p.id
--   WHERE p.id = :id ORDER BY r.created_at DESC LIMIT 1;

-- KPIs globales del dashboard
-- SELECT COUNT(*) AS proyectos_activos FROM proyecto WHERE estado = 'activo';
-- SELECT COUNT(*) AS total_lideres     FROM usuario   WHERE rol   = 'lider';
-- SELECT COUNT(*) AS total_actividades FROM actividad;

-- ── Tablas añadidas en Ronda 3 ───────────────────────────────────────────────

CREATE TABLE miembro_equipo (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    proyecto_id INTEGER  NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    nombre      TEXT     NOT NULL,
    rol         TEXT     NOT NULL DEFAULT 'Prestador de Servicio Social',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE testimonio (
    id               INTEGER  PRIMARY KEY AUTOINCREMENT,
    proyecto_id      INTEGER  NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    nombre_remitente TEXT     NOT NULL,
    rol_remitente    TEXT     NOT NULL,
    texto            TEXT     NOT NULL,
    estado           TEXT     NOT NULL DEFAULT 'pendiente'
                              CHECK(estado IN ('pendiente', 'aprobado')),
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campo_personalizado (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    proyecto_id INTEGER NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    nombre      TEXT    NOT NULL,
    tipo        TEXT    NOT NULL DEFAULT 'numero' CHECK(tipo IN ('numero', 'texto')),
    unidad      TEXT,
    posicion    INTEGER DEFAULT 0
);

CREATE TABLE valor_metrica (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    actividad_id INTEGER NOT NULL REFERENCES actividad(id) ON DELETE CASCADE,
    campo_id     INTEGER NOT NULL REFERENCES campo_personalizado(id) ON DELETE CASCADE,
    valor_texto  TEXT,
    valor_numero REAL
);

-- ── Columnas añadidas a tablas existentes ────────────────────────────────────
-- ALTER TABLE usuario  ADD COLUMN foto_url TEXT;
-- ALTER TABLE proyecto ADD COLUMN imagen_url TEXT;

CREATE TABLE configuracion (
    id        INTEGER PRIMARY KEY,
    video_url TEXT DEFAULT ''
);
