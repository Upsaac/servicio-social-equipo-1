# Sistema de Gestión de Proyectos de Servicio Social

Plataforma web para el registro, seguimiento y análisis de proyectos de servicio social. Permite gestionar líderes, proyectos, actividades, beneficiarios y testimonios desde un panel centralizado.

---

## Tabla de Contenidos

1. [Tecnologías y Arquitectura](#tecnologías-y-arquitectura)
2. [Entregables de Código](#entregables-de-código)
3. [Requisitos de Despliegue](#requisitos-de-despliegue)
4. [Manual de Instalación](#manual-de-instalación)
5. [Estructura del Proyecto](#estructura-del-proyecto)

---

## Tecnologías y Arquitectura

### Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Lenguaje | Python | 3.10+ |
| Framework web | Flask | 3.1.3 |
| ORM / Base de datos | Flask-SQLAlchemy + SQLite | 3.1.1 |
| Autenticación | Flask-Login | 0.6.3 |
| Servidor WSGI (desarrollo) | Werkzeug | 3.1.3 |
| Servidor WSGI (producción) | Gunicorn | 23.0.0 |
| Frontend | HTML5 + CSS3 + JavaScript (vanilla) | — |

### Arquitectura General

```
Cliente (Navegador)
        │  HTTP
        ▼
  Servidor Flask
  ┌─────────────────────────────────┐
  │  app.py  (Application Factory)  │
  │                                 │
  │  routes/                        │
  │  ├── auth.py        /login      │
  │  ├── dashboard.py   /dashboard  │
  │  ├── proyectos.py   /proyectos  │
  │  ├── actividades.py             │
  │  ├── beneficiarios.py           │
  │  └── testimonios.py             │
  │                                 │
  │  models.py  (SQLAlchemy ORM)    │
  └─────────────────────────────────┘
        │
        ▼
  SQLite (instance/database.db)
```

El sistema sigue el patrón **MVC** dentro de Flask:
- **Modelos** → `models.py` (Usuario, Proyecto, Actividad, Testimonio, etc.)
- **Vistas** → `templates/` (plantillas Jinja2)
- **Controladores** → `routes/` (blueprints de Flask)

La comunicación entre el frontend y el servidor mezcla renderizado de páginas completas con llamadas **REST/JSON** a la API interna (`/api/...`).

---

## Entregables de Código

### Qué se entrega

El repositorio incluye el código fuente completo de la aplicación web:

```
servicio-social-equipo-1/
├── app.py                  # Punto de entrada y factory de la app
├── extensions.py           # Inicialización de extensiones (db, login)
├── models.py               # Modelos de datos (ORM)
├── schema.sql              # Esquema SQL de la base de datos
├── seed.py                 # Script para poblar datos iniciales
├── requirements.txt        # Dependencias Python
├── routes/                 # Blueprints con las rutas de la aplicación
│   ├── auth.py
│   ├── dashboard.py
│   ├── proyectos.py
│   ├── actividades.py
│   ├── beneficiarios.py
│   └── testimonios.py
├── templates/              # Plantillas HTML (Jinja2)
└── static/                 # Archivos estáticos (CSS, JS, imágenes subidas)
    ├── css/
    ├── js/
    └── uploads/
```

### Cómo se entrega

- **Canal**: Repositorio Git (control de versiones).
- **Formato**: Clonar el repositorio o descargar el ZIP desde la rama `main`.
- **Base de datos**: No se incluye el archivo `instance/database.db` en el repositorio. Se genera localmente al ejecutar la aplicación por primera vez.
- **Archivos subidos por usuarios** (`static/uploads/`): No forman parte del entregable de código; son generados en tiempo de ejecución.

---

## Requisitos de Despliegue

### Requisitos de Software

| Componente | Versión mínima | Notas |
|-----------|---------------|-------|
| Python | 3.10 | Recomendado 3.11+ |
| pip | 23+ | Incluido con Python |
| Git | 2.x | Para clonar el repositorio |
| Sistema operativo | Linux / macOS / Windows | |

> **Producción**: se recomienda usar un servidor WSGI dedicado como **Gunicorn** (Linux/macOS) o **Waitress** (Windows) en lugar del servidor de desarrollo de Flask.

### Requisitos de Hardware (mínimos)

| Recurso | Mínimo |
|---------|--------|
| RAM | 512 MB |
| Disco | 200 MB (más espacio para uploads) |
| CPU | 1 núcleo |

### Puertos

- La aplicación escucha por defecto en el puerto **8022**.
- Asegúrate de que ese puerto esté abierto en el firewall si se accede desde otra máquina.

### Variables de Entorno

| Variable | Entorno | Descripción |
|----------|---------|-------------|
| `SECRET_KEY` | Producción (obligatoria) | Clave secreta para sesiones Flask. Si no se define, se usa un valor de desarrollo inseguro. |
| `FLASK_DEBUG` | Desarrollo (opcional) | `true` activa el modo debug. Por defecto `true`; en producción debe ser `false` o no definirse. |

---

## Manual de Instalación

### Paso 1 — Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd servicio-social-equipo-1
```

### Paso 2 — Crear y activar el entorno virtual

```bash
# Crear entorno virtual
python3 -m venv .venv

# Activar en macOS / Linux
source .venv/bin/activate

# Activar en Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

### Paso 3 — Instalar dependencias

```bash
pip install -r requirements.txt
```

### Paso 4 — Inicializar la base de datos

Al ejecutar la aplicación por primera vez, Flask-SQLAlchemy crea automáticamente el archivo `instance/database.db` con todas las tablas.

```bash
python app.py
```

La primera vez que el servidor arranca verás en la consola que las tablas son creadas. Una vez iniciado, puedes detenerlo con `Ctrl+C`.

### Paso 5 — (Opcional) Cargar datos de prueba

Si deseas poblar la base de datos con datos de ejemplo:

```bash
python seed.py
```

### Paso 6 — Ejecutar la aplicación

```bash
python app.py
```

La aplicación estará disponible en:

```
http://localhost:8022
```

o en la IP de tu máquina si accedes desde otro dispositivo en la misma red:

```
http://<IP_DE_TU_MÁQUINA>:8022
```

---

### Instalación en Producción (Gunicorn + Linux)

Para un despliegue en servidor Linux, Gunicorn ya está incluido en `requirements.txt`.

**1. Instalar dependencias** (igual que en desarrollo)

```bash
pip install -r requirements.txt
```

**2. Inicializar la base de datos** (solo la primera vez)

```bash
python app.py
```

Detener con `Ctrl+C` una vez que aparezca el mensaje de tablas creadas.

**3. Definir la clave secreta**

```bash
export SECRET_KEY="cambia-esto-por-una-clave-segura-aleatoria"
```

**4. Iniciar con Gunicorn**

```bash
gunicorn --bind 0.0.0.0:8022 --workers 2 wsgi:application
```

> `wsgi.py` es el punto de entrada estándar para Gunicorn. Los `--workers 2` permiten atender múltiples requests en paralelo.

**5. (Opcional) Ejecutar como servicio del sistema**

Crea el archivo `/etc/systemd/system/servicio-social.service`:

```ini
[Unit]
Description=Sistema Servicio Social
After=network.target

[Service]
User=<tu_usuario>
WorkingDirectory=/ruta/al/proyecto
Environment="SECRET_KEY=tu_clave_secreta"
ExecStart=/ruta/al/proyecto/.venv/bin/gunicorn --bind 0.0.0.0:8022 --workers 2 wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

Activarlo:

```bash
sudo systemctl enable servicio-social
sudo systemctl start servicio-social
```

---

## Estructura del Proyecto

```
servicio-social-equipo-1/
├── app.py                     # Application factory (create_app)
├── wsgi.py                    # Punto de entrada para Gunicorn (producción)
├── extensions.py              # db, login_manager
├── models.py                  # Modelos: Usuario, Proyecto, Actividad...
├── schema.sql                 # Definición SQL de las tablas
├── seed.py                    # Datos de prueba
├── requirements.txt           # Dependencias (incluye gunicorn)
│
├── routes/
│   ├── __init__.py
│   ├── auth.py                # /login, /logout, /perfil
│   ├── dashboard.py           # /, /dashboard, /analisis, /calendario
│   ├── proyectos.py           # /proyectos, /crear-proyecto
│   ├── actividades.py         # /registrar-actividad
│   ├── beneficiarios.py       # /reporte-beneficiarios
│   └── testimonios.py         # API de testimonios
│
├── templates/                 # Vistas Jinja2
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   ├── proyectos.html
│   ├── proyecto-detalle.html
│   ├── crear-proyecto.html
│   ├── editar-proyecto.html
│   ├── registrar-actividad.html
│   ├── reporte-beneficiarios.html
│   ├── analisis.html
│   ├── calendario.html
│   ├── lideres.html
│   ├── perfil.html
│   ├── configuracion.html
│   └── sidebar.html
│
├── static/
│   ├── css/                   # Hojas de estilo por vista
│   ├── js/                    # Scripts por vista
│   └── uploads/               # Imágenes subidas por los usuarios
│
├── instance/
│   └── database.db            # Base de datos SQLite (generada en runtime)
│
└── docs/
    └── database.md            # Documentación del esquema de datos
```

---

## Notas de Seguridad para Producción

- Cambiar el valor de `SECRET_KEY` en `app.py` o mejor aún, leerlo desde una variable de entorno.
- Desactivar el modo `debug=True` en `app.py` antes de desplegar.
- Considerar migrar de SQLite a PostgreSQL o MySQL para entornos con múltiples usuarios concurrentes.
- Configurar un límite de tamaño de archivo de subida acorde al uso esperado (actualmente 5 MB).
