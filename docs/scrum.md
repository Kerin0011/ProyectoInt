# Scrum — Ways of working

How the team plans, tracks and reviews the work on Nexora.

---

## 1. Team and roles

| Member | Role | Responsibilities |
|---|---|---|
| Kerin Barranco | Scrum Master / Backend Developer | Facilitates ceremonies, removes blockers, owns the schedule. Business logic, API and deployment. |
| Yesid Palacio | Frontend Developer | SPA, user experience, API integration. |
| Marlon Castillo | Database / Documentation | Data model, migrations, technical documentation. |

Roles are a reference, not a wall: every member must understand the whole
solution and be able to explain any technical decision during the defence.

---

## 2. Tool

**Trello** — free, no setup, and the whole board is visible from a single
public link, which is what the evaluators need.

### Board columns

| Column | Meaning |
|---|---|
| **Product Backlog** | Everything pending, ordered by priority. |
| **Sprint Backlog** | Committed for the current sprint only. |
| **In Progress** | Being worked on right now. One member, one card. |
| **In Review** | Pull request open, waiting for a teammate. |
| **Done** | Merged and meeting the Definition of Done. |

### Card conventions

- **Title:** `T35 — Stock deduction on order creation`
- **Label:** the sprint (`Sprint 4`) and the type (`backend`, `frontend`, `docs`, `bug`)
- **Member:** whoever owns it, always exactly one
- **Description:** the linked user story and its acceptance criteria
- **Checklist:** the acceptance criteria, ticked as they land

### How to set it up

1. Create the board **Nexora — Proyecto Integrador** and invite Yesid and Marlon.
2. Create the five columns above.
3. Create one card per task in [product_backlog.md](product_backlog.md) — the
   IDs (T01…T46) already match.
4. Drop each card in the column matching its real state.
5. Make the board public: *Share → Change visibility → Public*, and paste the
   link into the technical document.

> Keep the board and `product_backlog.md` in sync. A board that contradicts the
> repository is worse than no board: it is the first thing a reviewer notices.

---

## 3. Ceremonies

| Ceremony | When | Duration | Output |
|---|---|---|---|
| **Sprint Planning** | Monday, start of sprint | 45 min | Sprint Backlog with owners and estimates |
| **Daily Standup** | Every day | 10 min | Blockers surfaced |
| **Sprint Review** | Friday | 30 min | Working demo of what got done |
| **Sprint Retrospective** | Friday, after the review | 20 min | One concrete improvement for the next sprint |

**The three standup questions:** what did I finish yesterday, what am I taking
today, what is blocking me.

---

## 4. Estimation

Fibonacci story points (1, 2, 3, 5, 8) by relative complexity, not by hours.
The reference: **US09 (availability toggle) = 2 points**. Everything else is
estimated against it.

Anything above 8 points gets split before it enters a sprint.

---

## 5. Meeting log

The enunciado requires a meeting record. This is the template — **fill it with
what actually happened**, meeting by meeting. Do not backfill invented minutes:
it is the one artifact a reviewer can cross-check against the commit history
and the board, and a log that does not match sinks your credibility on
everything else you hand in.

```markdown
### Sprint N — <Ceremony>
**Date:** YYYY-MM-DD · **Duration:** NN min
**Attendees:** Kerin, Yesid, Marlon

**Discussed**
- ...

**Decisions**
- ...

**Actions**
- [ ] <what> — <who> — <when>

**Blockers**
- ...
```

From here on, fill one entry per ceremony. Even a three-line entry per standup
is real evidence, and three real entries beat thirty invented ones.

### Log

<!-- Add the real entries below, newest last. -->

---

## 6. Progress tracking

| Sprint | Committed | Done | Notes |
|---|---|---|---|
| 1 | 22 | 17 | The mockups (T07) slipped to Sprint 5. |
| 2 | 36 | 36 | Goal met. |
| 3 | 35 | 35 | Goal met. |
| 4 | 43 | 43 | Grew mid-sprint: the audit surfaced T35–T37. |
| 5 | 34 | — | In progress. |

Update this table at every Sprint Review. It is the "seguimiento de avances"
the enunciado asks for, and it takes two minutes.
