# Product Backlog - Sistema de Pedidos para Restaurante

## Sprint 1 (Semana 1 - Planeacion y Diseno)

| ID | Tarea | Responsable | Estado |
|----|-------|------------|--------|
| T01 | Definir problema y alcance del proyecto | Scrum Master | Pendiente |
| T02 | Crear mockups en Figma (8 pantallas) | Frontend + Scrum Master | Pendiente |
| T03 | Definir modelo de datos y schema SQL | Scrum Master | Pendiente |
| T04 | Configurar repositorio Git + GitFlow | Scrum Master | Pendiente |
| T05 | Configurar Trello/Notion con columnas Scrum | Scrum Master | Pendiente |
| T06 | Redactar Historias de Usuario | Scrum Master | Pendiente |
| T07 | Crear Product Backlog priorizado | Scrum Master | Pendiente |

---

## Sprint 2 (Semana 2 - Backend Core)

| ID | Tarea | Responsable | HU |
|----|-------|------------|-----|
| T08 | Inicializar proyecto FastAPI + dependencias | Backend | - |
| T09 | Configurar conexion a MySQL (SQLAlchemy) | Backend | - |
| T10 | Crear modelos SQLAlchemy (todas las tablas) | Backend | - |
| T11 | HU01: Endpoint login + JWT + middleware auth | Backend | HU01 |
| T12 | HU02: CRUD de mesas + generacion token QR | Backend | HU02 |
| T13 | HU08: CRUD de platos (endpoints y logica) | Backend | HU08 |
| T14 | HU10: CRUD de ingredientes | Backend | HU10 |
| T15 | Frontend shell: index.html + router SPA + login page | Frontend | HU01 |

---

## Sprint 3 (Semana 3 - Logica de Negocio + Frontend Publico)

| ID | Tarea | Responsable | HU |
|----|-------|------------|-----|
| T16 | HU03: Endpoint menu publico (por token QR) | Backend | HU03 |
| T17 | HU05: Endpoint crear pedido desde QR | Backend | HU05 |
| T18 | HU07: Logica de personalizacion + recalculo precio | Backend | HU07 |
| T19 | HU04: Maquina de estados del pedido | Backend | HU04 |
| T20 | HU12: Endpoint cancelar pedido | Backend | HU12 |
| T21 | HU03: Pagina menu publico (vista cliente QR) | Frontend | HU03 |
| T22 | HU07: Modal personalizar plato (frontend) | Frontend | HU07 |
| T23 | HU05: Carrito + checkout (frontend) | Frontend | HU05 |

---

## Sprint 4 (Semana 4 - Frontend Admin/Mozo)

| ID | Tarea | Responsable | HU |
|----|-------|------------|-----|
| T24 | HU06: Pagina seguimiento de pedido (cliente) | Frontend | HU06 |
| T25 | HU11: Dashboard de pedidos activos (mozo) | Frontend | HU11 |
| T26 | HU02: Pagina gestion de mesas (admin) | Frontend | HU02 |
| T27 | HU08: Pagina gestion de platos (admin) | Frontend | HU08 |
| T28 | HU09: Toggle disponibilidad de platos | Frontend | HU09 |
| T29 | HU10: Pagina gestion de ingredientes (admin) | Frontend | HU10 |

---

## Sprint 5 (Semana 5 - Integracion y Sustentacion)

| ID | Tarea | Responsable | HU |
|----|-------|------------|-----|
| T30 | Pruebas funcionales completas | Todo el equipo | - |
| T31 | Correccion de bugs | Todo el equipo | - |
| T32 | Documento Tecnico (Word/PDF) | Scrum Master | - |
| T33 | README con instrucciones de instalacion | Scrum Master | - |
| T34 | Pitch Comercial (ingles, 10 min) | Todo el equipo | - |
| T35 | Pitch Tecnico (espanol, 20 min) | Todo el equipo | - |
| T36 | Deploy final (GitHub Pages + Backend cloud/local) | Backend + Frontend | - |

---

## Resumen por Responsable

| Responsable | Sprints 1-2 | Sprints 3-4 | Sprint 5 |
|-------------|------------|------------|----------|
| **Scrum Master** | T01-T07, T04-T06 | Apoyo, revisiones | T32-T35 |
| **Backend** | T08-T14 | T16-T20 | T30-T31, T36 |
| **Frontend** | T15 | T21-T23, T24-T29 | T30-T31, T36 |

---

## Definicion de Done (DoD)

Una tarea se considera completada cuando:
1. El codigo esta en la rama correspondiente segun GitFlow
2. Se hizo pull request y fue revisado por al menos un companero
3. La funcionalidad esta probada y funciona
4. No hay errores visibles en consola
5. El codigo sigue las convenciones del equipo
6. Se actualizo el tablero Scrum
