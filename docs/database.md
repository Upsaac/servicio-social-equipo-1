# Base de Datos — Huella Solidaria

Motor: **SQLite** (archivo `instance/database.db`)  
ORM: **SQLAlchemy** (definido en `models.py`)  
Esquema SQL puro: `schema.sql`

---

## Por qué existe cada tabla

| Tabla | Problema que resuelve |
|---|---|
| `usuario` | Identidad y rol de cada persona del sistema (admin / líder) |
| `ods` | Catálogo de los 17 Objetivos de Desarrollo Sostenible de la ONU; pre-cargado en `seed.py` |
| `proyecto` | Unidad central de información: cada iniciativa de servicio social |
| `proyecto_ods` | Permite que un proyecto impacte varios ODS (muchos a muchos) |
| `actividad` | Registro de cada sesión o evento del proyecto (reemplaza el Excel semanal del líder) |
| `reporte_beneficiarios` | Conteo demográfico de beneficiarios por periodo (semanal / quincenal) |

---

## Diagrama ER (texto)

```
USUARIO (1) ──────── (*) PROYECTO
                          │
          proyecto_ods ───┤──── (*) ODS
                          │
                    (*) ACTIVIDAD
                          │
              (*) REPORTE_BENEFICIARIOS
```

---

## Tablas en detalle

### `usuario`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | Autoincremental |
| `nombre` | TEXT | Nombre completo |
| `email` | TEXT UNIQUE | Correo institucional (@tec.mx) |
| `password_hash` | TEXT | Hash werkzeug (never plain text) |
| `rol` | TEXT | `'admin'` (coordinadora) o `'lider'` (alumno) |
| `matricula` | TEXT | Matrícula del alumno (opcional) |
| `created_at` | DATETIME | Timestamp de registro |

**Propiedad calculada (Python):** `initials` = primeras letras del nombre (p.ej. "VO" para "Víctor Ortiz").

---

### `ods`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | Coincide con el número oficial del ODS (1-17) |
| `numero` | INTEGER | Número oficial |
| `nombre` | TEXT | Nombre oficial en español |
| `color_hex` | TEXT | Color oficial de la ONU (ej. `#E5243B`) |

Pre-poblada en `seed.py`. No debe modificarse manualmente.

---

### `proyecto`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | Autoincremental |
| `nombre` | TEXT | Nombre del proyecto |
| `descripcion` | TEXT | Misión / objetivo |
| `modalidad` | TEXT | `presencial`, `en_linea` o `mixto` |
| `estado` | TEXT | `borrador` → `en_revision` → `activo` → `pausado` → `cerrado` |
| `fecha_inicio` | DATE | Inicio del periodo |
| `fecha_fin` | DATE | Fin del periodo |
| `periodo_tipo` | TEXT | `5_semanas`, `10_semanas` o `15_semanas` |
| `ubicacion` | TEXT | Texto libre (colonia, municipio, ciudad) |
| `meta_beneficiarios` | INTEGER | Meta de personas a impactar |
| `ultima_actualizacion` | DATETIME | Se actualiza automáticamente cuando el líder registra actividad o reporte |
| `lider_id` | INTEGER FK | Referencia a `usuario.id` |

**Flujo de estados:** solo la admin puede cambiar el estado. El líder sube el proyecto como `borrador`; la admin lo revisa y lo activa.

**Campos calculados en Python (no almacenados):**
- `beneficiarios_totales()` → `total` del último `reporte_beneficiarios` del proyecto
- `avance_pct()` → `(beneficiarios / meta_beneficiarios) * 100`, limitado a 100%

---

### `proyecto_ods` (tabla asociativa)

| Campo | Tipo | Descripción |
|---|---|---|
| `proyecto_id` | INTEGER FK | Referencia a `proyecto.id` |
| `ods_id` | INTEGER FK | Referencia a `ods.id` |

Clave primaria compuesta. Permite que un proyecto impacte N ODS.

---

### `actividad`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | Autoincremental |
| `proyecto_id` | INTEGER FK | Proyecto al que pertenece |
| `fecha` | DATE | Fecha de la sesión |
| `tema` | TEXT | Nombre / título de la actividad |
| `duracion_minutos` | INTEGER | Duración de la sesión |
| `num_beneficiarios_presentes` | INTEGER | Asistentes en esa sesión |
| `observaciones` | TEXT | Campo libre: kg residuos, idioma, objetivos SEL, etc. |

**Efecto colateral:** al crear una actividad, `proyecto.ultima_actualizacion` se actualiza con `datetime.utcnow()`.

---

### `reporte_beneficiarios`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | Autoincremental |
| `proyecto_id` | INTEGER FK | Proyecto al que pertenece |
| `periodo_inicio` | DATE | Inicio del periodo reportado |
| `periodo_fin` | DATE | Fin del periodo reportado |
| `total` | INTEGER | Total de beneficiarios en el periodo |
| `hombres` | INTEGER | Desglose por género |
| `mujeres` | INTEGER | Desglose por género |
| `edad_6_9` | INTEGER | Primaria baja (1°-3°) |
| `edad_10_12` | INTEGER | Primaria alta (4°-6°) |
| `edad_13_15` | INTEGER | Secundaria |
| `edad_16_mas` | INTEGER | Preparatoria y adultos |

**Nota:** los proyectos pueden tener un grupo fijo (p.ej. Eco-Calli siempre trabaja con los mismos 100 niños) o variable (p.ej. ValThera varía por sesión). No se guardan identidades individuales, solo conteos.

**Efecto colateral:** al crear un reporte, `proyecto.ultima_actualizacion` se actualiza.

---

## KPIs del dashboard y las queries que los generan

| KPI | Cómo se calcula |
|---|---|
| Proyectos activos | `COUNT(*) FROM proyecto WHERE estado = 'activo'` |
| Total beneficiarios | Suma del `total` del reporte más reciente de cada proyecto activo |
| Líderes activos | `COUNT(*) FROM usuario WHERE rol = 'lider'` |
| Total actividades | `COUNT(*) FROM actividad` |
| Zonas de intervención | Set de `ubicacion.split(',')[0]` de proyectos activos |
| Avance % por proyecto | `beneficiarios_totales / meta_beneficiarios * 100` |

Todos estos valores se calculan en tiempo real en `routes/dashboard.py`. Ninguno se almacena.

---

## Tablas añadidas en Ronda 3

### `miembro_equipo`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | Autoincremental |
| `proyecto_id` | INTEGER FK | Referencia a `proyecto.id` |
| `nombre` | TEXT | Nombre completo del miembro |
| `rol` | TEXT | Ej: "Prestador de Servicio Social", "Colaborador" |

Permite que el líder documente quién más participa en su proyecto. El líder principal sigue siendo el único usuario con cuenta en el sistema; los miembros del equipo son solo datos de texto.

---

### `testimonio`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | Autoincremental |
| `proyecto_id` | INTEGER FK | Referencia a `proyecto.id` |
| `nombre_remitente` | TEXT | Nombre de quien envía el testimonio |
| `rol_remitente` | TEXT | Ej: "Madre de familia", "Beneficiario" |
| `texto` | TEXT | Contenido del testimonio |
| `estado` | TEXT | `pendiente` \| `aprobado` |

**Control de acceso:** el líder dueño del proyecto Y el admin pueden aprobar/rechazar. Cualquier usuario logueado puede enviar.

---

### `campo_personalizado`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | Autoincremental |
| `proyecto_id` | INTEGER FK | Referencia a `proyecto.id` |
| `nombre` | TEXT | Ej: "Kg de residuos", "Idioma de clase" |
| `tipo` | TEXT | `numero` \| `texto` |
| `unidad` | TEXT | Ej: "kg", "%", "" (opcional) |
| `posicion` | INTEGER | Orden de visualización |

Cada proyecto define sus métricas únicas desde `/editar-proyecto`. Inspirado en las entrevistas:
- Eco-Calli: "Kg de residuos", "% incremento conocimiento ambiental"
- TALK!: "Idioma" (texto), "Nivel del grupo" (texto)
- ValThera: "Objetivo socioemocional" (texto)

---

### `valor_metrica`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | Autoincremental |
| `actividad_id` | INTEGER FK | Referencia a `actividad.id` |
| `campo_id` | INTEGER FK | Referencia a `campo_personalizado.id` |
| `valor_texto` | TEXT | Valor cuando `tipo = 'texto'` |
| `valor_numero` | REAL | Valor cuando `tipo = 'numero'` |

Se crea automáticamente al registrar una actividad si el proyecto tiene campos personalizados definidos.

---

### Columnas añadidas a tablas existentes

| Tabla | Columna | Tipo | Descripción |
|---|---|---|---|
| `usuario` | `foto_url` | TEXT | URL de la foto de perfil |
| `proyecto` | `imagen_url` | TEXT | URL de la imagen del proyecto |
| `configuracion` | tabla nueva | — | Configuración global (video_url) |
