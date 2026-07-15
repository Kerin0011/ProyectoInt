# Nexora

Digital menu and QR ordering for restaurants.

Each table has its own QR code. A diner scans it, browses the menu,
customizes their dishes and orders from their phone. The order reaches the
staff panel immediately, and the diner follows its progress without asking
anyone.

Nexora is the product. The restaurant using it keeps its own name everywhere a
customer or the staff can see it — see [Per-client setup](#per-client-setup).

---

## Contents

- [How it works](#how-it-works)
- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Order lifecycle](#order-lifecycle)
- [Data model](#data-model)
- [Install](#install)
- [Per-client setup](#per-client-setup)
- [Environment variables](#environment-variables)
- [Tests](#tests)
- [API](#api)
- [Deployment](#deployment)
- [Project layout](#project-layout)
- [Roadmap](#roadmap)
- [Documentation](#documentation)
- [Team](#team)

---

## How it works

1. An admin creates the tables. Each one gets a unique, unguessable QR token.
2. The diner scans it and the menu for that table opens in their browser. No
   app to install, no sign-up.
3. They build the order — extras, removals, a note for the kitchen — and
   confirm it.
4. The order lands in the panel as `pendiente`. The kitchen moves it forward.
5. The diner watches it advance until `entregado`.

Placing an order also deducts the ingredients it consumes from the inventory,
so the menu stops offering what the kitchen has run out of.

## What it does

**For the diner** — no install, reached by QR:

- A menu per table, grouped by category, with the restaurant's recommended
  dishes in their own section.
- Dish customization: add extras with the price updating live, remove
  ingredients, and leave a note for the kitchen per dish.
- A cart with a fixed bar showing the total, and a quantity stepper per dish.
- Call the waiter or ask for the bill with one tap.
- Live order tracking.
- Works as an installable PWA, and the menu still renders on a bad connection.

**For the restaurant** — behind a login:

- A dashboard with active orders, table states and open requests.
- Orders as a state machine with validated transitions.
- Tables: create, occupy, free, regenerate the QR, delete.
- Dishes: full CRUD with categories, image, availability and a recommended flag.
- Ingredients: stock, extra price and availability.
- Inventory that deducts itself: every order consumes the stock of its base
  ingredients and its extras, and an ingredient that hits zero is marked sold
  out and disappears from the menu.
- Two roles: `admin` for everything, `mozo` for running orders.

## Architecture

```mermaid
flowchart LR
    subgraph Client
      A["SPA Vanilla JS<br/>Bootstrap 5 + PWA"]
    end
    subgraph Server
      B["FastAPI<br/>REST + JWT"]
      C["SQLAlchemy ORM"]
    end
    D[("MySQL<br/>3NF")]

    A -- "HTTPS / JSON" --> B
    B --> C --> D

    A -. "GitHub Pages" .-> A
    B -. "Railway" .-> B
```

| Layer | Stack |
|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript SPA, Bootstrap 5, SweetAlert2, service worker + web manifest |
| Backend | Python 3.10+, FastAPI, Uvicorn, SQLAlchemy 2, Pydantic v2 |
| Auth | JWT (`python-jose`), password hashing with `passlib` + `bcrypt` |
| Database | MySQL 8 (PyMySQL), normalized to 3NF |
| Deployment | GitHub Actions to GitHub Pages, Railway for the API |

The SPA is hand-written — a hash router, one module per page, no framework —
and served as static files. The API is stateless and lives on its own, so a
frontend change never puts the backend at risk.

Two decisions worth knowing before reading the code:

**The rules live in the backend.** Valid state transitions, the order total and
the customization rules are enforced server-side. The frontend recalculates the
price live for the diner's benefit, but the total that gets stored is computed
from the database — otherwise anyone could order a burger for $1.

**Data migrations run on boot, exactly once.** The database is on Railway, with
no console for hand-editing. `run_migrations()` adds missing columns
idempotently, and records one-shot data migrations in `migraciones_aplicadas`
so they never run twice. Re-running them on every restart would refill stock
that had already been consumed.

## Order lifecycle

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

States cannot be skipped or walked back, and only a `pendiente` order can be
cancelled. The backend rejects anything else.

## Data model

Eleven tables in Third Normal Form.

```
roles ─< usuarios                categorias ─< platos ─< plato_ingredientes >─ ingredientes
mesas ─< pedidos ─< detalle_pedidos ─< personalizaciones
mesas ─< solicitudes
```

`plato_ingredientes` is the heart of it: an N:M relationship carrying the
attributes that make customization work. `es_default` means the ingredient
comes with the dish and consumes stock, `es_extra` means it can be added for a
price, `es_removible` means the diner can take it out. They are not exclusive —
lettuce in a burger is both default and removable — and the flags belong to the
dish-ingredient pair, not to either side alone.

Order prices are stored on `detalle_pedidos` and `personalizaciones` rather than
read through the relationship. That duplication is deliberate: an order is a
historical record, and yesterday's order must keep yesterday's price when the
menu changes tomorrow.

`database/schema.sql` creates the full schema with seed data. The reasoning
behind the model is in the [technical document](docs/technical_document.md#8-data-model).

## Install

Requires Python 3.10+, MySQL 8.0+ and a modern browser.

**1. Database**

```bash
mysql -u root -p < database/schema.sql
```

Creates the `nexora` database, every table, and seed data: categories,
ingredients, tables and sample dishes.

**2. Backend**

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env    # then edit it, see Environment variables
uvicorn app.main:app --reload --port 8000
```

The API answers at <http://localhost:8000>, with interactive Swagger docs at
<http://localhost:8000/docs>.

**3. Frontend**

Open `frontend/index.html` with Live Server or any static server on port 5500.

To point it at a different backend, use the `?api=` parameter or the browser
console:

```
https://<user>.github.io/<repo>/?api=https://my-backend.com
```

```js
setApiUrl("https://my-backend.com");   // saved in localStorage
```

**4. First user**

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Admin","email":"admin@nexora.com","password":"123456","rol_id":1}'
```

`rol_id` is 1 for admin, 2 for mozo.

Only the first user registers without a token. Once one exists,
`/api/auth/register` requires an admin's token — otherwise anyone could create
themselves an administrator account.

## Per-client setup

Nexora is the product name and only appears on the way in. Once someone is
inside, the panel belongs to the restaurant that bought it. That name is the
one value that changes per client, in `frontend/js/config.js`:

```js
const RESTAURANT_NAME = "Mi Restaurante";
```

| Where | Shows |
|---|---|
| Login screen | Nexora |
| Browser tab, installable app | Nexora |
| Panel navbar | `RESTAURANT_NAME` |
| Public menu, diner's browser tab | `RESTAURANT_NAME` |

## Environment variables

In `backend/.env` — see `backend/.env.example`.

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string. `mysql://` and `mysql+mysqlconnector://` are normalized to `pymysql`. Example: `mysql+pymysql://root:pass@localhost:3306/nexora` |
| `SECRET_KEY` | Signs the JWTs. **Required in production.** Without it the API boots with a throwaway key that changes on every restart, dropping every session. Generate one with `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `CORS_ORIGINS` | Allowed origins, comma-separated. Example: `https://user.github.io,http://localhost:5500` |

## Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest tests
```

47 tests covering authentication and roles, the order state machine, table
management, and the stock validation and deduction. They run against in-memory
SQLite, so they need no MySQL server and never touch real data.

Manual test cases and the bug log are in [docs/test_cases.md](docs/test_cases.md).

## API

Local base: `http://localhost:8000`. Full reference at `/docs`.

**Public — the diner, no token**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/public/menu/{token}` | A table's menu, by QR token |
| `POST` | `/api/public/pedidos` | Place an order |
| `GET` | `/api/public/pedidos/{id}` | Track an order |
| `POST` | `/api/public/solicitar/{token}` | Call the waiter, ask for the bill |

**Auth**

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Log in, returns a JWT |
| `POST` | `/api/auth/register` | Create a user. Admin only, except the first |
| `GET` | `/api/auth/me` | The authenticated user |

**Panel — requires `Authorization: Bearer <token>`**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Operational summary |
| `GET` `POST` | `/api/mesas` | List, create tables |
| `PATCH` | `/api/mesas/{id}/estado` · `/regenerar-qr` | Change state, regenerate the QR |
| `DELETE` | `/api/mesas/{id}` | Delete a table |
| `GET` `POST` `PUT` `DELETE` | `/api/platos` | Dish CRUD |
| `PATCH` | `/api/platos/{id}/disponibilidad` | Toggle a dish |
| `GET` `POST` `PUT` | `/api/ingredientes` | Ingredient management |
| `PATCH` | `/api/ingredientes/{id}/disponibilidad` | Toggle an ingredient |
| `GET` | `/api/pedidos` | List orders, filter with `?estado=` |
| `PATCH` | `/api/pedidos/{id}/estado` | Advance the state |
| `PUT` | `/api/pedidos/{id}/cancelar` | Cancel an order |
| `GET` | `/api/solicitudes` · `PATCH /{id}/atender` | Table requests |

## Deployment

| Component | Platform | How |
|---|---|---|
| Frontend | GitHub Pages | Automatic through GitHub Actions (`.github/workflows/deploy.yml`) on every push to `master` touching `frontend/**`. Enable it under Settings → Pages → Source: GitHub Actions. |
| Backend | Railway | Uses `railway.json`. Set `DATABASE_URL`, `SECRET_KEY` and `CORS_ORIGINS` as service variables. |

## Project layout

```
backend/
├── app/
│   ├── main.py              FastAPI app, migrations on startup
│   ├── config.py            Environment variables
│   ├── models/              SQLAlchemy models, connection, migrations
│   ├── schemas/             Pydantic schemas
│   ├── routes/              Endpoints
│   └── services/            Auth (JWT, roles, hashing), serializers
└── tests/                   pytest suite
frontend/
├── index.html
├── manifest.json, sw.js     PWA
├── css/styles.css
└── js/
    ├── config.js            API URL and RESTAURANT_NAME
    ├── router.js, app.js
    ├── services/            api.js, icons.js
    ├── components/          navbar.js
    └── pages/               login, dashboard, mesas, platos, ingredientes,
                             pedidos, menu-publico, seguimiento
database/schema.sql          MySQL schema and seed data
docs/                        Technical document, user stories, Scrum, tests
railway.json                 Backend deployment
.github/workflows/deploy.yml Frontend deployment
```

## Roadmap

- Push notifications when the order is ready
- Sales reporting and best-selling items
- Online payments
- Multi-restaurant / multi-branch
- Returning stock when an order is cancelled
- Dark mode in the panel

## Documentation

| Document | Contents |
|---|---|
| [Technical document](docs/technical_document.md) | Problem, scope, architecture, data model, technology justification, MVP |
| [User stories](docs/user_stories.md) | The 13 stories with acceptance criteria |
| [Product backlog](docs/product_backlog.md) | Task breakdown per sprint |
| [Scrum](docs/scrum.md) | Ways of working, board, ceremonies, meeting log |
| [Git workflow](docs/git_workflow.md) | GitFlow, commit convention, PR process |
| [Test cases](docs/test_cases.md) | Test cases, coverage, bug log |

## Team

| Member | Role |
|---|---|
| Kerin Barranco | Scrum Master, Backend Developer |
| Yesid Palacio | Frontend Developer |
| Marlon Castillo | Database, Documentation |

Built for the Proyecto Integrador — CodeUp Riwi: Beyond Limits.
