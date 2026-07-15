# Product Backlog — Nexora

Full task breakdown per sprint. Each task traces back to a user story in
[user_stories.md](user_stories.md). This file is the source of truth mirrored
on the Trello board (see [scrum.md](scrum.md)).

| Team member | Role | Board initials |
|---|---|---|
| Kerin Barranco | Scrum Master / Backend Developer | KB |
| Yesid Palacio | Frontend Developer | YP |
| Marlon Castillo | Database / Documentation | MC |

**Status legend:** `Done` · `In progress` · `To do`

---

## Prioritization criteria

Tasks are ordered by, in this order:

1. **Blocking dependency** — nothing can be built on top of it until it exists
   (database schema, authentication, ORM models).
2. **MoSCoW priority** of the story it belongs to.
3. **User value per point** — what a diner or waiter notices first.

That is why the whole database and auth layer lands in Sprint 2: without the
schema and the JWT there is no menu, no order and no panel.

---

## Sprint 1 — Planning and design (Week 1)

**Sprint goal:** agree on the problem, the scope and the data model, so that
Sprint 2 can start coding without redesigning anything.

| ID | Task | Story | Owner | Points | Status |
|---|---|---|---|---|---|
| T01 | Define the problem and the project scope | — | KB | 2 | Done |
| T02 | Design the data model and the SQL schema | — | MC | 5 | Done |
| T03 | Write the user stories with acceptance criteria | — | KB | 3 | Done |
| T04 | Build and prioritize the product backlog | — | KB | 2 | Done |
| T05 | Set up the Git repository and the GitFlow branches | — | KB | 2 | Done |
| T06 | Set up the Trello board with the Scrum columns | — | MC | 1 | Done |
| T07 | Design the mockups for the main screens | — | YP | 5 | To do |
| T08 | Justify the technology choices | — | KB | 2 | Done |

**Total: 22 points.**

---

## Sprint 2 — Backend core and authentication (Week 2)

**Sprint goal:** a running API with authentication and the admin CRUDs, so the
frontend has something real to talk to.

| ID | Task | Story | Owner | Points | Status |
|---|---|---|---|---|---|
| T09 | Bootstrap the FastAPI project and its dependencies | — | KB | 2 | Done |
| T10 | Wire up the MySQL connection with SQLAlchemy | — | MC | 3 | Done |
| T11 | Write the SQLAlchemy models for every table | — | MC | 5 | Done |
| T12 | Login endpoint, JWT and the auth dependency | US01 | KB | 5 | Done |
| T13 | Role guard (`require_role`) for admin-only routes | US01 | KB | 3 | Done |
| T14 | Table CRUD and QR token generation | US02 | KB | 5 | Done |
| T15 | Dish CRUD with its ingredient composition | US08 | KB | 5 | Done |
| T16 | Ingredient CRUD | US10 | MC | 3 | Done |
| T17 | Frontend shell: index.html, SPA router and login page | US01 | YP | 5 | Done |

**Total: 36 points.**

---

## Sprint 3 — Business logic and diner experience (Week 3)

**Sprint goal:** a diner can scan, order and customize; the order has a real
lifecycle.

| ID | Task | Story | Owner | Points | Status |
|---|---|---|---|---|---|
| T18 | Public menu endpoint by QR token | US03 | KB | 3 | Done |
| T19 | Create-order endpoint | US05 | KB | 5 | Done |
| T20 | Customization logic and price recalculation | US07 | KB | 5 | Done |
| T21 | Order state machine with validated transitions | US04 | KB | 5 | Done |
| T22 | Cancel-order endpoint | US12 | KB | 2 | Done |
| T23 | Public menu page (diner view) | US03 | YP | 5 | Done |
| T24 | Dish customization modal | US07 | YP | 5 | Done |
| T25 | Cart and checkout | US05 | YP | 5 | Done |

**Total: 35 points.**

---

## Sprint 4 — Panel, inventory and hardening (Week 4)

**Sprint goal:** the restaurant can run the whole service from the panel, and
the API stops trusting its input.

| ID | Task | Story | Owner | Points | Status |
|---|---|---|---|---|---|
| T26 | Order tracking page (diner) | US06 | YP | 3 | Done |
| T27 | Active orders dashboard | US11 | YP | 5 | Done |
| T28 | Table management page | US02 | YP | 3 | Done |
| T29 | Dish management page | US08 | YP | 3 | Done |
| T30 | Dish availability toggle | US09 | YP | 2 | Done |
| T31 | Ingredient management page | US10 | MC | 3 | Done |
| T32 | Call waiter / ask for the bill | US13 | MC | 3 | Done |
| T33 | Responsive redesign for phone, tablet and desktop | US03 | YP | 5 | Done |
| T34 | PWA: manifest, service worker and offline menu | US03 | YP | 5 | Done |
| T35 | Stock deduction and validation on order creation | US10 | KB | 5 | Done |
| T36 | Protect the register endpoint against privilege escalation | US01 | KB | 3 | Done |
| T37 | Harden input validation across the API | US05 | KB | 3 | Done |

**Total: 43 points.**

---

## Sprint 5 — Integration, testing and presentation (Week 5)

**Sprint goal:** everything documented, tested and rehearsed.

| ID | Task | Story | Owner | Points | Status |
|---|---|---|---|---|---|
| T38 | Automated test suite (pytest) | — | KB | 5 | Done |
| T39 | Manual test cases and bug log | — | MC | 3 | Done |
| T40 | Technical document | — | MC | 5 | In progress |
| T41 | README with install instructions | — | KB | 2 | Done |
| T42 | Deploy: GitHub Pages and Railway | — | KB | 3 | Done |
| T43 | Mockups attached to the documentation | — | YP | 3 | To do |
| T44 | Commercial pitch (English, 10 min) | — | Team | 5 | To do |
| T45 | Technical pitch (Spanish, 20 min) | — | Team | 5 | To do |
| T46 | Bug fixing from the test round | — | Team | 3 | In progress |

**Total: 34 points.**

---

## Load per member

| Member | Points | Main focus |
|---|---|---|
| Kerin Barranco (KB) | 69 | Business logic, API, auth, deploy |
| Yesid Palacio (YP) | 62 | SPA, diner experience, responsive, PWA |
| Marlon Castillo (MC) | 31 | Data model, ingredients, documentation |

---

## Definition of Done

A task is done when:

1. The code lives on a branch that follows GitFlow.
2. A pull request was opened and reviewed by at least one teammate.
3. The feature was tested and works.
4. There are no errors in the browser console.
5. The code follows the team conventions (see [git_workflow.md](git_workflow.md)).
6. The Trello board was updated.

## Definition of Ready

A story enters a sprint only when it has: a clear description, acceptance
criteria, an estimate, an owner, and no unresolved blocking dependency.
