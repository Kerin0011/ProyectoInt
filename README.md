<div align="center">

# 🍽️ Nexora

### Menú digital y pedidos por QR para restaurantes

Los comensales escanean el QR de su mesa, exploran el menú, personalizan sus platos y ordenan desde el celular. La cocina y los meseros gestionan todo en tiempo real desde un panel.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-offline--ready-5A0FC8?logo=pwa&logoColor=white)

</div>

---

## 📑 Tabla de contenidos

- [Características](#-características)
- [Cómo funciona](#-cómo-funciona)
- [Arquitectura](#-arquitectura)
- [Stack tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Variables de entorno](#-variables-de-entorno)
- [Ciclo de vida del pedido](#-ciclo-de-vida-del-pedido)
- [API](#-api)
- [Modelo de datos](#-modelo-de-datos)
- [Despliegue](#-despliegue)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Roadmap](#-roadmap)
- [Equipo](#-equipo)

---

## ✨ Características

### Para el comensal (sin instalar nada, vía QR)
- 📱 **Menú digital por mesa** — cada mesa tiene su propio código QR único.
- ⭐ **Recomendados** — el restaurante destaca sus platos estrella en una sección propia.
- 🍔 **Personalización de platos** — agregar extras (con precio en vivo) o quitar ingredientes.
- 📝 **Notas para la cocina** — "sin sal", "término medio", etc., por cada plato.
- 🛒 **Carrito con barra fija** — total y cantidad siempre visibles; stepper de cantidad en cada plato.
- 🔔 **Llamar al mesero / pedir la cuenta** con un toque.
- 📡 **Seguimiento en tiempo real** — el cliente ve el estado de su pedido paso a paso.
- 🌙 **PWA offline** — el menú se cachea y los pedidos se encolan si se cae la conexión.

### Para el restaurante (panel autenticado)
- 📊 **Dashboard** — pedidos activos, estado de mesas y solicitudes en curso.
- 🧾 **Gestión de pedidos** — máquina de estados con transiciones validadas.
- 🪑 **Gestión de mesas** — crear, ocupar/liberar, regenerar QR y eliminar.
- 🍽️ **Gestión de platos** — CRUD, categorías, imagen, disponibilidad y "recomendado".
- 🧂 **Gestión de ingredientes** — stock, precio extra y disponibilidad en tiempo real.
- 📉 **Inventario que se descuenta solo** — cada pedido consume el stock de los ingredientes base y de los extras; al llegar a cero el ingrediente se marca agotado y deja de ofrecerse.
- 🔐 **Roles** — `admin` (todo) y `mozo` (operación de pedidos).

---

## 🔄 Cómo funciona

```
  Comensal                     Nexora                       Restaurante
 ┌──────────┐   escanea QR   ┌──────────────┐   pedido    ┌──────────────┐
 │  📱 Móvil │ ─────────────▶ │  Menú público │ ──────────▶ │  Dashboard    │
 │          │ ◀───────────── │  (SPA + PWA)  │ ◀────────── │  + Pedidos    │
 └──────────┘  seguimiento   └──────────────┘   estados   └──────────────┘
```

1. El admin crea las mesas → cada una genera un **QR único**.
2. El comensal escanea → abre el **menú de esa mesa** en su navegador.
3. Arma su pedido (personaliza, agrega notas) y lo **confirma**.
4. El pedido entra al panel como `pendiente`; la cocina/mesero lo hace avanzar.
5. El comensal ve el **progreso en vivo** hasta `entregado`.

---

## 🏗️ Arquitectura

```mermaid
flowchart LR
    subgraph Cliente
      A["📱 SPA Vanilla JS<br/>Bootstrap 5 + PWA"]
    end
    subgraph Servidor
      B["⚡ FastAPI<br/>REST + JWT"]
      C["🗃️ SQLAlchemy ORM"]
    end
    D[("🐬 MySQL<br/>3FN")]

    A -- "HTTPS / JSON" --> B
    B --> C --> D

    A -. "GitHub Pages" .-> A
    B -. "Railway" .-> B
```

- **Frontend** — SPA hecha a mano (router por hash, sin framework), servida como estática en **GitHub Pages**. Funciona como PWA instalable con soporte offline.
- **Backend** — API REST con **FastAPI**, autenticación **JWT**, ORM **SQLAlchemy**, desplegada en **Railway**.
- **Base de datos** — **MySQL** normalizada a 3FN. El esquema incluye una **migración idempotente al arranque** que alinea columnas nuevas sin intervención manual.

---

## 🧰 Stack tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla, SPA), Bootstrap 5, SweetAlert2, Service Worker + Web Manifest (PWA) |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, SQLAlchemy 2, Pydantic v2 |
| **Auth** | JWT (`python-jose`), hashing de contraseñas con `passlib` + `bcrypt` |
| **Base de datos** | MySQL 8 (PyMySQL), diseño en 3ª Forma Normal |
| **DevOps** | GitHub Actions → GitHub Pages (frontend), Railway (backend) |

---

## 🚀 Instalación

### Requisitos
- Python **3.10+**
- MySQL **8.0+**
- Un navegador moderno

### 1. Clonar

```bash
git clone <url-del-repo>
cd nexora
```

### 2. Base de datos

```bash
mysql -u root -p < database/schema.sql
```

Esto crea la base `nexora`, todas las tablas y datos semilla (categorías, ingredientes, mesas y platos de ejemplo).

### 3. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env    # y edita los valores (ver sección siguiente)

uvicorn app.main:app --reload --port 8000
```

- API: <http://localhost:8000>
- **Docs interactivas (Swagger):** <http://localhost:8000/docs>

> Al arrancar, Nexora ejecuta migraciones idempotentes que agregan columnas nuevas si faltan — no necesitas correr SQL a mano tras actualizar.

### 4. Frontend

**Desarrollo local:** abre `frontend/index.html` con Live Server (VS Code) o cualquier servidor estático (puerto 5500).

Para apuntar el frontend a un backend distinto, usa el parámetro `?api=` o la consola del navegador:

```
https://<usuario>.github.io/<repo>/?api=https://mi-backend.com
```
```js
setApiUrl("https://mi-backend.com");   // se guarda en localStorage
```

### 5. Usuario inicial

Registra el administrador vía API (o Swagger):

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Admin","email":"admin@nexora.com","password":"123456","rol_id":1}'
```

> `rol_id`: **1 = admin**, **2 = mozo**.

> **Solo el primer usuario se registra sin token.** Una vez existe al menos un
> usuario, `/api/auth/register` exige el token de un admin. De lo contrario
> cualquiera podría crearse una cuenta de administrador.

### 6. Pruebas

```bash
cd backend
pip install -r requirements-dev.txt
pytest tests
```

Las pruebas corren contra SQLite en memoria, así que no necesitan MySQL levantado
ni tocan datos reales.

---

## 🔧 Variables de entorno

`backend/.env` (ver `backend/.env.example`):

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Cadena de conexión MySQL. Nexora normaliza `mysql://` y `mysql+mysqlconnector://` a `pymysql`. | `mysql+pymysql://root:pass@localhost:3306/nexora` |
| `SECRET_KEY` | Clave para firmar los JWT. **Obligatoria en producción**: si falta, el backend arranca con una clave temporal distinta en cada reinicio y las sesiones se caen. Genérala con `python -c "import secrets; print(secrets.token_urlsafe(48))"`. | `una-clave-larga-y-secreta` |
| `CORS_ORIGINS` | Orígenes permitidos, separados por coma. | `https://usuario.github.io,http://localhost:5500` |

---

## 🧭 Ciclo de vida del pedido

Las transiciones se validan en el backend: no se puede saltar ni retroceder estados.

```mermaid
stateDiagram-v2
    [*] --> pendiente
    pendiente --> confirmado
    pendiente --> cancelado
    confirmado --> en_preparacion
    en_preparacion --> listo
    listo --> entregado
    entregado --> [*]
    cancelado --> [*]
```

Solo los pedidos en `pendiente` pueden cancelarse.

---

## 📡 API

Base local: `http://localhost:8000` · Documentación completa en `/docs`.

### Públicos (comensal, sin token)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/public/menu/{token}` | Menú de una mesa por su token QR |
| `POST` | `/api/public/pedidos` | Crear un pedido |
| `GET` | `/api/public/pedidos/{id}` | Seguimiento de un pedido |
| `POST` | `/api/public/solicitar/{token}` | Llamar mesero / pedir la cuenta |

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Login (devuelve JWT) |
| `POST` | `/api/auth/register` | Registrar usuario (solo admin, salvo el primero) |
| `GET` | `/api/auth/me` | Datos del usuario autenticado |

### Panel (requiere `Authorization: Bearer <token>`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/dashboard` | Resumen operativo |
| `GET/POST` | `/api/mesas` | Listar / crear mesas |
| `PATCH` | `/api/mesas/{id}/estado` · `/regenerar-qr` | Cambiar estado / regenerar QR |
| `DELETE` | `/api/mesas/{id}` | Eliminar mesa |
| `GET/POST/PUT/DELETE` | `/api/platos` | CRUD de platos |
| `PATCH` | `/api/platos/{id}/disponibilidad` | Activar / desactivar plato |
| `GET/POST/PUT` | `/api/ingredientes` | Gestión de ingredientes |
| `PATCH` | `/api/ingredientes/{id}/disponibilidad` | Activar / desactivar ingrediente |
| `GET` | `/api/pedidos` | Listar pedidos (filtro `?estado=`) |
| `PATCH` | `/api/pedidos/{id}/estado` | Avanzar estado |
| `PUT` | `/api/pedidos/{id}/cancelar` | Cancelar pedido |
| `GET` | `/api/solicitudes` · `PATCH /{id}/atender` | Solicitudes de mesa |

---

## 🗄️ Modelo de datos

Diseño en **3ª Forma Normal**. Entidades principales:

```
roles ─< usuarios                    categorias ─< platos ─< plato_ingredientes >─ ingredientes
mesas ─< pedidos ─< detalle_pedidos ─< personalizaciones
mesas ─< solicitudes
```

- **`platos.destacado`** → marca los "Recomendados".
- **`detalle_pedidos.nota`** → nota del comensal para la cocina.
- **`personalizaciones`** → registra cada extra agregado o ingrediente quitado, con su precio.

El script `database/schema.sql` crea el esquema completo con datos semilla.

---

## ☁️ Despliegue

| Componente | Plataforma | Cómo |
|-----------|------------|------|
| **Frontend** | GitHub Pages | Automático vía GitHub Actions (`.github/workflows/deploy.yml`) en cada push a `master`/`main` que toque `frontend/**`. |
| **Backend** | Railway | Usa `railway.json`. Comando: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Configura `DATABASE_URL`, `SECRET_KEY` y `CORS_ORIGINS` como variables del servicio. |

**Habilitar GitHub Pages:** Settings → Pages → *Source: GitHub Actions*.

---

## 📂 Estructura del proyecto

```
nexora/
├── backend/
│   ├── app/
│   │   ├── main.py              # App FastAPI + migraciones al arranque
│   │   ├── config.py            # Variables de entorno
│   │   ├── models/              # Modelos SQLAlchemy + conexión/migraciones
│   │   ├── schemas/             # Esquemas Pydantic
│   │   ├── routes/              # Endpoints (auth, mesas, platos, pedidos, ...)
│   │   └── services/            # Auth (JWT, roles, hashing), serializers
│   └── tests/                   # Pruebas automatizadas (pytest)
├── frontend/
│   ├── index.html
│   ├── manifest.json  ·  sw.js  # PWA
│   ├── css/styles.css
│   └── js/
│       ├── router.js  ·  app.js
│       ├── services/            # api.js, icons.js
│       ├── components/          # navbar.js
│       └── pages/               # login, dashboard, mesas, platos,
│                                # ingredientes, pedidos, menu-publico, seguimiento
├── database/schema.sql          # Esquema MySQL + datos semilla
├── docs/                        # Historias de usuario y product backlog
├── railway.json                 # Deploy backend
└── .github/workflows/deploy.yml # Deploy frontend
```

---

## 🗺️ Roadmap

- [ ] Notificaciones push cuando el pedido está listo
- [ ] Reportes de ventas e ítems más vendidos
- [ ] Pagos en línea
- [ ] Multi-restaurante / multi-sucursal
- [ ] Modo oscuro en el panel

---

## 👥 Equipo

| Integrante | Rol |
|---|---|
| **Kerin Barranco** | Scrum Master · Backend Developer |
| **Yesid Palacio** | Frontend Developer |
| **Marlon Castillo** | Base de datos · Documentación |

## 📚 Documentación

| Documento | Contenido |
|---|---|
| [Technical Document](docs/technical_document.md) | Problema, alcance, arquitectura, modelo de datos, justificación tecnológica y MVP |
| [User Stories](docs/user_stories.md) | Las 13 historias con criterios de aceptación |
| [Product Backlog](docs/product_backlog.md) | Desglose de tareas por sprint |
| [Scrum](docs/scrum.md) | Metodología, tablero, ceremonias y registro de reuniones |
| [Git Workflow](docs/git_workflow.md) | GitFlow, convención de commits y proceso de PR |
| [Test Cases](docs/test_cases.md) | Casos de prueba, cobertura automatizada y registro de errores |

<div align="center">

Hecho con 🧡 para restaurantes que quieren digitalizar su servicio.

</div>
