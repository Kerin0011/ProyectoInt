# Tablero Trello — Nexora (listo para copiar)

Guía para montar el tablero en 15 minutos. Las tarjetas ya están en el estado
real del proyecto; solo hay que crearlas y arrastrarlas a su columna.

> Alternativa igual de válida: GitHub Projects, que ya está dentro del repo.
> El enunciado acepta Trello, Jira, Notion, Azure DevOps o GitHub Projects.

---

## 1. Crea el tablero

- Nombre: **Nexora — Proyecto Integrador**
- Invita a Yesid y Marlon.
- Hazlo público: *Share → Change visibility → Public*, y pega el enlace en el
  documento técnico (sección 9).

## 2. Crea 5 columnas (listas)

```
Product Backlog   |   Sprint Backlog   |   In Progress   |   In Review   |   Done
```

## 3. Crea las etiquetas (labels)

| Color | Etiqueta |
|---|---|
| Azul | backend |
| Verde | frontend |
| Amarillo | docs |
| Morado | base-datos |
| Rojo | bug |
| Gris | Sprint 1 … Sprint 5 |

## 4. Miembros (iniciales para asignar)

- **KB** = Kerin Barranco · **YP** = Yesid Palacio · **MC** = Marlon Castillo

---

## 5. Tarjetas — columna DONE

Copia cada línea como una tarjeta. Formato: `ID — título · [etiquetas] · miembro`

```
T01 — Definir el problema y el alcance · [docs, Sprint 1] · KB
T02 — Diseñar el modelo de datos y el schema SQL · [base-datos, Sprint 1] · MC
T03 — Escribir las historias de usuario · [docs, Sprint 1] · KB
T04 — Armar y priorizar el product backlog · [docs, Sprint 1] · KB
T05 — Configurar el repositorio Git y las ramas GitFlow · [docs, Sprint 1] · KB
T06 — Configurar el tablero con columnas Scrum · [docs, Sprint 1] · MC
T08 — Justificar las decisiones tecnológicas · [docs, Sprint 1] · KB
T09 — Inicializar el proyecto FastAPI y dependencias · [backend, Sprint 2] · KB
T10 — Conexión a MySQL con SQLAlchemy · [base-datos, Sprint 2] · MC
T11 — Modelos SQLAlchemy de todas las tablas · [base-datos, Sprint 2] · MC
T12 — Login, JWT y dependencia de autenticación · [backend, Sprint 2] · KB
T13 — Guard de roles (require_role) para rutas de admin · [backend, Sprint 2] · KB
T14 — CRUD de mesas y generación de token QR · [backend, Sprint 2] · KB
T15 — CRUD de platos con su composición de ingredientes · [backend, Sprint 2] · KB
T16 — CRUD de ingredientes · [base-datos, Sprint 2] · MC
T17 — Shell del frontend: index, router SPA y login · [frontend, Sprint 2] · YP
T18 — Endpoint de menú público por token QR · [backend, Sprint 3] · KB
T19 — Endpoint de creación de pedido · [backend, Sprint 3] · KB
T20 — Lógica de personalización y recálculo de precio · [backend, Sprint 3] · KB
T21 — Máquina de estados del pedido · [backend, Sprint 3] · KB
T22 — Endpoint de cancelar pedido · [backend, Sprint 3] · KB
T23 — Página de menú público (vista comensal) · [frontend, Sprint 3] · YP
T24 — Modal de personalización de plato · [frontend, Sprint 3] · YP
T25 — Carrito y checkout · [frontend, Sprint 3] · YP
T26 — Página de seguimiento del pedido · [frontend, Sprint 4] · YP
T27 — Dashboard de pedidos activos · [frontend, Sprint 4] · YP
T28 — Página de gestión de mesas · [frontend, Sprint 4] · YP
T29 — Página de gestión de platos · [frontend, Sprint 4] · YP
T30 — Toggle de disponibilidad de platos · [frontend, Sprint 4] · YP
T31 — Página de gestión de ingredientes · [base-datos, Sprint 4] · MC
T32 — Llamar mesero / pedir la cuenta · [backend, Sprint 4] · MC
T33 — Rediseño responsive (móvil, tablet, escritorio) · [frontend, Sprint 4] · YP
T34 — PWA: manifest, service worker y menú offline · [frontend, Sprint 4] · YP
T35 — Descuento y validación de stock al crear pedido · [backend, Sprint 4] · KB
T36 — Proteger el endpoint de registro (escalada de privilegios) · [backend, bug, Sprint 4] · KB
T37 — Endurecer la validación de entrada de la API · [backend, Sprint 4] · KB
T38 — Suite de pruebas automatizadas (pytest) · [backend, Sprint 5] · KB
T41 — README con instrucciones de instalación · [docs, Sprint 5] · KB
T42 — Deploy: GitHub Pages y Railway · [backend, Sprint 5] · KB
```

## 6. Tarjetas — columna IN PROGRESS

```
T39 — Casos de prueba manuales y registro de errores · [docs, Sprint 5] · MC
T40 — Documento técnico · [docs, Sprint 5] · MC
T46 — Corrección de bugs de la ronda de pruebas · [bug, Sprint 5] · Equipo
```

## 7. Tarjetas — columna SPRINT BACKLOG (por hacer, comprometidas)

```
T07 — Mockups de las pantallas · [frontend, Sprint 1] · YP
T43 — Mockups adjuntos a la documentación · [docs, Sprint 5] · YP
T44 — Pitch comercial (inglés, 10 min) · [docs, Sprint 5] · Equipo
T45 — Pitch técnico (español, 20 min) · [docs, Sprint 5] · Equipo
```

## 8. Tarjetas — columna PRODUCT BACKLOG (futuro, fuera del MVP)

```
Notificaciones push cuando el pedido está listo · [backend]
Reportes de ventas e ítems más vendidos · [backend]
Pagos en línea · [backend]
Multi-restaurante / multi-sucursal · [backend]
Devolver stock al cancelar un pedido · [backend]
Modo oscuro en el panel · [frontend]
```

---

## 9. Detalle recomendado por tarjeta

Para las tarjetas que vayas a mostrar en la sustentación, agrega dentro:
- **Descripción:** la historia de usuario que resuelve (US01…US13).
- **Checklist:** los criterios de aceptación de esa historia (de `user_stories.md`).
- **Fecha:** el sprint en que se hizo.

No hace falta en todas — con 5 o 6 bien detalladas basta para evidenciar el uso
real del tablero.
