# User Stories — Nexora

Estimation uses the Fibonacci scale (1, 2, 3, 5, 8) in story points. Priority
follows MoSCoW. The **MVP** column marks the stories that must be working for
the final presentation.

| Team member | Role |
|---|---|
| Kerin Barranco | Scrum Master / Backend Developer |
| Yesid Palacio | Frontend Developer |
| Marlon Castillo | Database / Documentation |

---

## US01 — Authentication and login

**As** a waiter or restaurant administrator
**I want** to sign in with my email and password
**So that** I can access the features that match my role

| Field | Value |
|---|---|
| Priority | Must have |
| Points | 5 |
| Sprint | 2 |
| Owner | Kerin Barranco |
| MVP | Yes |

**Acceptance criteria**
- [x] Login requires a valid email and password.
- [x] Correct credentials return a signed JWT.
- [x] Wrong credentials return an error message, never a hint about which field failed.
- [x] The token is stored in localStorage and sent on every request.
- [x] An `admin` user sees the administration options.
- [x] A `mozo` user only sees the order dashboard.
- [x] An inactive user cannot log in even with the right password.

---

## US02 — Table and QR management

**As** an administrator
**I want** to create, update and delete tables, each with a unique QR code
**So that** diners can scan it and reach the menu

| Field | Value |
|---|---|
| Priority | Must have |
| Points | 5 |
| Sprint | 2 |
| Owner | Kerin Barranco |
| MVP | Yes |

**Acceptance criteria**
- [x] Every table has a unique number and an automatically generated QR token.
- [x] The table state can be switched between free and occupied.
- [x] The QR of each table can be downloaded or printed.
- [x] The QR encodes the public menu URL including the table token.
- [x] A duplicated token can be regenerated without recreating the table.
- [x] Deleting a table also removes its orders and requests.

---

## US03 — Public menu via QR

**As** a diner
**I want** to scan the QR on my table and browse the menu
**So that** I can choose dishes without waiting for a waiter

| Field | Value |
|---|---|
| Priority | Must have |
| Points | 5 |
| Sprint | 3 |
| Owner | Yesid Palacio |
| MVP | Yes |

**Acceptance criteria**
- [x] Scanning the QR opens the restaurant menu.
- [x] Dishes are grouped by category.
- [x] Each dish shows name, description, price and photo when available.
- [x] Only dishes marked as available are listed.
- [x] The page is responsive on phone and tablet.
- [x] The menu is cached so it still renders with a weak connection.

---

## US04 — Order lifecycle

**As** a waiter
**I want** to move an order through pending → confirmed → in preparation → ready → delivered
**So that** the kitchen and the dining room stay in sync

| Field | Value |
|---|---|
| Priority | Must have |
| Points | 8 |
| Sprint | 3 |
| Owner | Kerin Barranco |
| MVP | Yes |

**Acceptance criteria**
- [x] The order is created in `pendiente`.
- [x] Transitions follow the defined order; states cannot be skipped.
- [x] States cannot go backwards.
- [x] `entregado` and `cancelado` are final states.
- [x] An invalid transition returns a clear error, not a generic 500.
- [x] Every state change is timestamped.

---

## US05 — Place an order from the QR

**As** a diner
**I want** to pick dishes, customize them and send the order
**So that** the kitchen receives it directly

| Field | Value |
|---|---|
| Priority | Must have |
| Points | 8 |
| Sprint | 3 |
| Owner | Yesid Palacio |
| MVP | Yes |

**Acceptance criteria**
- [x] Several dishes can be added to the cart.
- [x] The cart shows the line items and the running total.
- [x] Quantities can be changed from the cart.
- [x] The order is attached to the table encoded in the QR.
- [x] The order is created as `pendiente`.
- [x] The diner gets a visual confirmation.
- [x] An empty cart cannot be submitted.

---

## US06 — Order tracking

**As** a diner
**I want** to see the state of my order in real time
**So that** I know when my food is coming without asking

| Field | Value |
|---|---|
| Priority | Should have |
| Points | 3 |
| Sprint | 4 |
| Owner | Yesid Palacio |
| MVP | Yes |

**Acceptance criteria**
- [x] A timeline shows the five states.
- [x] The current state is visually highlighted.
- [x] The page refreshes on its own (polling every 10 seconds).
- [x] A message is shown once the order is `entregado`.
- [x] Polling stops when the diner navigates away.

---

## US07 — Customize dishes

**As** a diner
**I want** to add or remove ingredients and see the price update
**So that** the dish matches my taste and I know what it costs

| Field | Value |
|---|---|
| Priority | Must have |
| Points | 8 |
| Sprint | 3 |
| Owner | Kerin Barranco |
| MVP | Yes |

**Acceptance criteria**
- [x] Selecting a dish opens a modal listing its ingredients.
- [x] Default ingredients are pre-selected and can be removed when removable.
- [x] Extras show their additional price.
- [x] The price recalculates live as ingredients are toggled.
- [x] The customization is stored with the order line.
- [x] Only ingredients flagged as extra can be added, and only removable ones removed.
- [x] A free-text note per dish reaches the kitchen.

---

## US08 — Dish management (CRUD)

**As** an administrator
**I want** to create, edit, delete and list menu dishes
**So that** the menu stays current

| Field | Value |
|---|---|
| Priority | Must have |
| Points | 5 |
| Sprint | 2 |
| Owner | Kerin Barranco |
| MVP | Yes |

**Acceptance criteria**
- [x] A table lists every dish.
- [x] A dish can be created with name, description, price, category and image.
- [x] Ingredients can be attached as default, extra or removable.
- [x] Any field can be edited.
- [x] A dish can be deleted without breaking orders that already reference it.
- [x] Changes are reflected immediately on the public menu.
- [x] A dish can be flagged as recommended.

---

## US09 — Dish availability

**As** an administrator
**I want** to mark a dish as available or sold out
**So that** diners cannot order what we do not have

| Field | Value |
|---|---|
| Priority | Should have |
| Points | 2 |
| Sprint | 4 |
| Owner | Yesid Palacio |
| MVP | Yes |

**Acceptance criteria**
- [x] A toggle in the dish table switches availability.
- [x] A disabled dish disappears from the public menu.
- [x] A disabled dish is greyed out in the admin panel.
- [x] Disabling a dish does not affect orders already placed.

---

## US10 — Ingredient and inventory management

**As** an administrator
**I want** to manage the ingredient catalogue with its stock and availability
**So that** the menu reflects what the kitchen can actually cook

| Field | Value |
|---|---|
| Priority | Must have |
| Points | 8 |
| Sprint | 4 |
| Owner | Marlon Castillo |
| MVP | Yes |

**Acceptance criteria**
- [x] Every ingredient is listed with its stock.
- [x] An ingredient can be created with name, stock, extra price and availability.
- [x] Any field can be edited.
- [x] An ingredient can be marked as sold out by hand.
- [x] Placing an order deducts the stock of its base ingredients and extras.
- [x] An ingredient removed by the diner does not consume stock.
- [x] An order that exceeds available stock is rejected and changes nothing.
- [x] An ingredient that reaches zero is marked unavailable automatically.

---

## US11 — Active orders dashboard

**As** a waiter
**I want** to see every active order grouped by state
**So that** I can work the floor efficiently

| Field | Value |
|---|---|
| Priority | Should have |
| Points | 5 |
| Sprint | 4 |
| Owner | Yesid Palacio |
| MVP | Yes |

**Acceptance criteria**
- [x] The dashboard shows one column per state.
- [x] Each order is a card with table, time, dishes and total.
- [x] The state can be changed from the card.
- [x] The dashboard reflects state changes.
- [x] Orders can be filtered by table.

---

## US12 — Cancel an order

**As** a waiter or diner
**I want** to cancel an order that has not been confirmed yet
**So that** the kitchen does not cook food nobody needs

| Field | Value |
|---|---|
| Priority | Should have |
| Points | 3 |
| Sprint | 3 |
| Owner | Kerin Barranco |
| MVP | Yes |

**Acceptance criteria**
- [x] Only a `pendiente` order can be cancelled.
- [x] Once confirmed, the cancel action is not offered.
- [x] Cancelling moves the order to `cancelado`.
- [x] The diner sees that the order was cancelled.
- [x] Cancelled orders are greyed out on the dashboard.

---

## US13 — Call the waiter / ask for the bill

**As** a diner
**I want** to call a waiter or ask for the bill from my phone
**So that** I do not have to wave across the room

| Field | Value |
|---|---|
| Priority | Could have |
| Points | 3 |
| Sprint | 4 |
| Owner | Marlon Castillo |
| MVP | No |

**Acceptance criteria**
- [x] The menu offers "call waiter" and "ask for the bill".
- [x] The request reaches the panel with its table number.
- [x] A waiter can mark the request as attended.
- [x] Only those two request types are accepted.

---

## Backlog summary

| ID | Story | Priority | Points | Sprint | Owner | MVP |
|---|---|---|---|---|---|---|
| US01 | Authentication and login | Must | 5 | 2 | Kerin | Yes |
| US02 | Table and QR management | Must | 5 | 2 | Kerin | Yes |
| US03 | Public menu via QR | Must | 5 | 3 | Yesid | Yes |
| US04 | Order lifecycle | Must | 8 | 3 | Kerin | Yes |
| US05 | Place an order from the QR | Must | 8 | 3 | Yesid | Yes |
| US06 | Order tracking | Should | 3 | 4 | Yesid | Yes |
| US07 | Customize dishes | Must | 8 | 3 | Kerin | Yes |
| US08 | Dish management (CRUD) | Must | 5 | 2 | Kerin | Yes |
| US09 | Dish availability | Should | 2 | 4 | Yesid | Yes |
| US10 | Ingredient and inventory management | Must | 8 | 4 | Marlon | Yes |
| US11 | Active orders dashboard | Should | 5 | 4 | Yesid | Yes |
| US12 | Cancel an order | Should | 3 | 3 | Kerin | Yes |
| US13 | Call the waiter / ask for the bill | Could | 3 | 4 | Marlon | No |

**Total: 68 points across 13 stories.** 12 of the 13 are part of the MVP.
