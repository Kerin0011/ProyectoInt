# Test evidence — Nexora

Manual test cases, automated coverage, and the log of bugs found and fixed
during development.

---

## 1. Automated tests

36 tests with `pytest`, running against in-memory SQLite so they need no MySQL
server and never touch real data.

```bash
cd backend
pip install -r requirements-dev.txt
pytest tests
```

```
tests/test_auth.py .........            8 passed
tests/test_orders.py ................  17 passed
tests/test_order_states.py ...........  11 passed
36 passed
```

| File | Covers | Stories |
|---|---|---|
| `test_auth.py` | Login, JWT, roles, privilege escalation | US01 |
| `test_orders.py` | Input validation, customization rules, price, stock | US05, US07, US10 |
| `test_order_states.py` | State machine, cancellation, table occupancy | US04, US12 |

---

## 2. Manual test cases

Legend: **OK** passes · **KO** fails

### US01 — Authentication

| ID | Case | Steps | Expected | Result |
|---|---|---|---|---|
| TC01 | Valid login | Enter admin@nexora.com / correct password | Redirects to dashboard, token saved | OK |
| TC02 | Wrong password | Enter a wrong password | "Email o contrasena incorrectos", no redirect | OK |
| TC03 | Empty fields | Submit with both fields empty | Browser validation blocks the submit | OK |
| TC04 | Direct access without session | Open `#/mesas` with no token | Redirects to login | OK |
| TC05 | Waiter role | Log in as `mozo` | Admin options are not shown | OK |
| TC06 | Expired token | Wait for the token to expire and act | Redirects to login | OK |

### US02 — Tables and QR

| ID | Case | Steps | Expected | Result |
|---|---|---|---|---|
| TC07 | Create table | Create table "M6" | Appears with a unique QR | OK |
| TC08 | Duplicate number | Create "M6" again | Rejected with a clear message | OK |
| TC09 | Scan the QR | Scan with a phone | Opens that table's menu | OK |
| TC10 | Regenerate QR | Regenerate the token | New QR, old link stops working | OK |
| TC11 | Delete table with orders | Delete a table that has orders | Deletes it and its orders, no FK error | OK |

### US03 / US05 / US07 — Menu, order and customization

| ID | Case | Steps | Expected | Result |
|---|---|---|---|---|
| TC12 | Browse the menu | Open the menu by QR | Dishes grouped by category | OK |
| TC13 | Unavailable dish | Mark a dish sold out, reload the menu | It disappears | OK |
| TC14 | Add extra | Add "Queso extra" (+$2.000) | Price updates live | OK |
| TC15 | Remove ingredient | Remove lettuce from a burger | Price unchanged, note stored | OK |
| TC16 | Note to the kitchen | Write "sin sal" | The note reaches the order card | OK |
| TC17 | Cart total | 2 burgers with cheese | (15.000 + 2.000) x 2 = 34.000 | OK |
| TC18 | Empty cart | Submit with nothing in the cart | Blocked, rejected by the API too | OK |
| TC19 | Responsive | Open on a 375px phone | Nothing overflows horizontally | OK |
| TC20 | Offline | Turn off the network and reload the menu | Renders from cache | OK |

### US04 / US12 — Lifecycle

| ID | Case | Steps | Expected | Result |
|---|---|---|---|---|
| TC21 | Full flow | pending → confirmed → preparing → ready → delivered | Every transition accepted | OK |
| TC22 | Skip a state | Try pending → ready | 400 with an explanatory message | OK |
| TC23 | Go backwards | Try confirmed → pending | 400 | OK |
| TC24 | Cancel pending | Cancel an unconfirmed order | Moves to cancelled | OK |
| TC25 | Cancel confirmed | Try to cancel a confirmed order | The action is not offered | OK |
| TC26 | Tracking | Follow an order from the phone | Timeline advances by itself | OK |

### US10 — Inventory

| ID | Case | Steps | Expected | Result |
|---|---|---|---|---|
| TC27 | Deduct stock | Order 2 burgers | Beef drops by 2 | OK |
| TC28 | Removed ingredient | Order a burger with no lettuce | Lettuce stock unchanged | OK |
| TC29 | Insufficient stock | Order 5 burgers with 3 beef left | 409, "No hay stock suficiente" | OK |
| TC30 | Stock after a rejection | Check the stock after TC29 | Unchanged | OK |
| TC31 | Sold-out ingredient | Consume the last unit | Marked unavailable automatically | OK |
| TC32 | Two lines, same dish | 2 + 2 burgers with 3 beef left | 409, they add up | OK |

### Security

| ID | Case | Steps | Expected | Result |
|---|---|---|---|---|
| TC33 | Anonymous registration | POST /register with no token | 401 | OK |
| TC34 | Privilege escalation | A `mozo` tries to create an admin | 403 | OK |
| TC35 | Unknown role | Register with `rol_id: 99` | 400, not a 500 | OK |
| TC36 | Injected ingredient | Add an ingredient that is not an extra | 400 | OK |

---

## 3. Bug log

Bugs found during development and how they were fixed. Every entry maps to a
real commit.

| # | Bug | Impact | Cause | Fix | Commit |
|---|---|---|---|---|---|
| B01 | Python 3.14 broke the API on boot | Blocking | Dependencies incompatible with the runtime | Pinned versions and fixed the JWT handling | `fix: Python 3.14 compatibility, JWT token, router, and frontend bugs` |
| B02 | Two tables shared the same QR token | High: one table's diners ordered onto another | Token generated without a uniqueness check | Regenerate-QR endpoint plus a button in the panel | `fix: add regenerate QR endpoint and button for duplicate mesa tokens` |
| B03 | Deleting a table failed with an FK error | Medium | The table's orders and requests still referenced it | Delete the children first, cascade in the model | `fix: delete associated pedidos and solicitudes before deleting mesa` |
| B04 | The panel kept showing the old UI after a deploy | Medium: the fixes looked like they had not shipped | The service worker was serving a stale cache | Bumped the cache name to invalidate it | `fix: bust service worker cache to show updated mesas delete button` |
| B05 | Layout broke on phones | High: the menu is used from a phone | Fixed widths, no breakpoints | Full responsive redesign | `fix: full responsive redesign for mobile, tablet, and desktop` |
| B06 | Anyone could register themselves as admin | **Critical** | `/register` was public and accepted `rol_id` | Requires an admin token except for the first user | `feat: stock control, protected registration and order validation` |
| B07 | Orders accepted negative quantities | High: the total came out negative | `cantidad` had no lower bound | `Field(gt=0)` and a minimum of one line | idem |
| B08 | Stock was never deducted | High: inventory was decorative | The order never touched the ingredients | Validation and deduction on order creation | idem |
| B09 | Any ingredient could be added to any dish | Medium: free extras | The dish composition was not checked | Only extras can be added, only removables removed | idem |
| B10 | Two lines of the same dish bypassed the stock check | Medium | Validation happened line by line | Consumption is accumulated and checked once | idem |
| B11 | Validation errors showed "[object Object]" | Low | FastAPI returns a list on 422, not a string | `mensajeDeError` normalizes both shapes | idem |

---

## 4. Known limitations

Honesty here is worth more than pretending they do not exist — and it is the
kind of thing the panel asks about.

- **No concurrency control on stock.** Two orders placed at exactly the same
  instant could both pass the check. It needs a `SELECT ... FOR UPDATE`. It has
  not been a problem at the scale of the demo.
- **The tracking polls every 10 seconds** instead of using WebSockets. Simpler,
  and enough for the use case.
- **No stock replenishment flow.** Stock only goes down, or gets edited by hand
  from the panel.
- **Cancelling an order does not return its stock.**
