# Restaurant Order App

Sistema de pedidos para restaurante con menu digital por QR.

## Stack

- **Backend:** Python + FastAPI
- **Frontend:** HTML5, CSS3, Vanilla JS, Bootstrap 5 (SPA)
- **Base de Datos:** MySQL (3FN)

## Requisitos

- Python 3.10+
- MySQL 8.0+
- Navegador moderno

## Instalacion

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd restaurant-order-app
```

### 2. Base de Datos

Ejecutar el script SQL incluido:

```bash
mysql -u root -p < database/schema.sql
```

### 3. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

Configurar variables de entorno en `.env`:

```
DATABASE_URL=mysql+pymysql://root:tu_password@localhost:3306/restaurant_pedidos
SECRET_KEY=clave-secreta-segura
```

Ejecutar el servidor:

```bash
uvicorn app.main:app --reload --port 8000
```

Documentacion Swagger: http://localhost:8000/docs

### 4. Frontend

Abrir `frontend/index.html` con Live Server (VS Code) o cualquier servidor estatico en el puerto 5500.

## Credenciales de Prueba

El schema.sql incluye datos semilla. Al registrar un usuario por la API:

```json
POST /api/auth/register
{
    "nombre": "Mozo Demo",
    "email": "mozo@restaurante.com",
    "password": "123456",
    "rol_id": 2
}
```

## Funcionalidades

1. **Ciclo de vida del pedido** - 5 estados con maquina de estados
2. **Menu digital por QR** - cada mesa tiene un QR unico
3. **Disponibilidad en tiempo real** - platos e ingredientes activables/desactivables
4. **Personalizacion de platos** - agregar/quitar ingredientes con precio en tiempo real

## Estructura del Proyecto

```
restaurant-order-app/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── models/
│   │   │   ├── models.py
│   │   │   └── database.py
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── mesas.py
│   │   │   ├── platos.py
│   │   │   ├── ingredientes.py
│   │   │   ├── pedidos.py
│   │   │   ├── menu_publico.py
│   │   │   └── dashboard.py
│   │   ├── schemas/
│   │   │   └── schemas.py
│   │   └── services/
│   │       └── auth.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── app.js
│       ├── router.js
│       ├── components/navbar.js
│       ├── services/api.js
│       └── pages/
│           ├── login.js
│           ├── dashboard.js
│           ├── mesas.js
│           ├── menu-publico.js
│           ├── pedidos.js
│           ├── seguimiento.js
│           ├── platos.js
│           └── ingredientes.js
├── database/
│   └── schema.sql
├── docs/
│   ├── historias_usuario.md
│   └── product_backlog.md
└── README.md
```

## API Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Registro |
| GET | `/api/mesas` | Listar mesas |
| POST | `/api/mesas` | Crear mesa + QR |
| GET | `/api/public/menu/{token}` | Menu publico (QR) |
| POST | `/api/public/pedidos` | Crear pedido (QR) |
| GET | `/api/public/pedidos/{id}` | Seguimiento pedido |
| GET | `/api/pedidos` | Listar pedidos |
| PATCH | `/api/pedidos/{id}/estado` | Cambiar estado |
| PUT | `/api/pedidos/{id}/cancelar` | Cancelar pedido |
| GET/POST/PUT/DELETE | `/api/platos` | CRUD platos |
| GET/POST/PUT | `/api/ingredientes` | CRUD ingredientes |
| GET | `/api/dashboard` | Dashboard resumen |

## Equipo

- Scrum Master + BD + Documentacion
- Backend Developer
- Frontend Developer
