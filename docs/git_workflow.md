# Git workflow — GitFlow

Version control conventions for Nexora, and the step-by-step guide for every
team member.

---

## 1. Branch model

```
main ──────────────●────────────────────●──────▶   production (Railway + Pages)
                   │                    │
develop ───●───●───●────●───●───●───●───●──────▶   integration
           │   │        │   │   │   │
feature/   ●   ●        ●   ●   ●   ●              one branch per task
```

| Branch | Purpose | Branches from | Merges into |
|---|---|---|---|
| `main` | What is deployed. Always working. | — | — |
| `develop` | Where features integrate. | `main` | `main` |
| `feature/*` | One task from the backlog. | `develop` | `develop` |
| `fix/*` | A bug found during testing. | `develop` | `develop` |
| `hotfix/*` | An urgent break in production. | `main` | `main` and `develop` |

### Branch naming

`<type>/<task-id>-<short-description-in-kebab-case>`

```
feature/T35-stock-deduction
feature/T43-mockups
fix/T46-duplicate-qr-token
docs/T40-technical-document
```

---

## 2. Commit convention

Conventional Commits, so the history reads as a changelog:

```
<type>: <what changed, imperative, lowercase>
```

| Type | Use for |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Restructuring without changing behaviour |
| `test` | Adding or fixing tests |
| `chore` | Tooling, dependencies, config |

```bash
git commit -m "feat: deduct ingredient stock when an order is placed"
git commit -m "fix: reject orders whose lines exceed available stock"
git commit -m "docs: add data model section to the technical document"
```

**Commit small and often.** Ten honest commits tell a better story than one
giant "final" commit — and the enunciado grades exactly that story.

---

## 3. Day-to-day flow

```bash
# 1. Always start from an up-to-date develop
git checkout develop
git pull origin develop

# 2. Branch for your task
git checkout -b feature/T43-mockups

# 3. Work, and commit as you go
git add .
git commit -m "docs: add login and dashboard mockups"

# 4. Push your branch
git push -u origin feature/T43-mockups

# 5. Open the Pull Request on GitHub: base = develop, compare = your branch
# 6. A teammate reviews and merges it
# 7. Clean up
git checkout develop
git pull origin develop
git branch -d feature/T43-mockups
```

---

## 4. Pull Requests

Every PR into `develop` needs **at least one approving review** from a
teammate. That is part of the Definition of Done, and it is also the evidence
the enunciado asks for.

### PR template

```markdown
## What does this do
<one or two sentences>

## Related story / task
US10 — T35

## How to test it
1. ...
2. ...

## Checklist
- [ ] Acceptance criteria met
- [ ] No errors in the console
- [ ] Tests pass (`pytest tests`)
```

### Reviewing when you are not sure

A useful review does not require knowing the code better than the author. Ask:

- Can I follow what it does without asking?
- Does it do what the story asked for?
- Did I pull the branch and see it work?

"I pulled it, tested it, it works, and I understood it" is a legitimate review.

---

## 5. Where this project stands, and how to fix it

Be honest with yourselves about the starting point:

- **51 commits, one author, no branches, no pull requests.**
- The enunciado requires commits from every member, branch usage, PRs and
  GitFlow, and warns that *missing evidence of individual contribution can
  affect the final grade*.

**History cannot be rewritten honestly.** Do not commit under someone else's
name, and do not fabricate their authorship: `git log` records the real dates,
and any evaluator can read it. Faking it turns a partial gap into a
credibility problem across the whole submission.

What *can* be fixed is everything from today onward, and there is real work
left for it:

| Task | Owner | Branch |
|---|---|---|
| T43 — Mockups | Yesid | `feature/T43-mockups` |
| T40 — Technical document | Marlon | `docs/T40-technical-document` |
| T39 — Test cases and bug log | Marlon | `docs/T39-test-cases` |
| T07 — Mockups in the docs | Yesid | `feature/T07-mockup-links` |
| T44/T45 — Pitches | Team | `docs/T44-pitches` |

Each of those is a real branch, a real PR and real commits from the person who
did the work — and each is something they can defend in the individual
evaluation, which is the part that actually counts.

### One-time setup

```bash
# Create develop from the current state
git checkout master
git pull origin master
git checkout -b develop
git push -u origin develop
```

On GitHub: **Settings → Branches → Add rule** on `main`/`master`, tick
*Require a pull request before merging* and *Require approvals: 1*. Beyond
being good practice, it forces the evidence to exist.

> The repository currently uses `master` as the main branch. Keep the name;
> renaming it now would only break the Railway and Pages deploys.

---

## 6. If something goes wrong

```bash
# I committed on the wrong branch and have not pushed yet
git reset --soft HEAD~1        # undo the commit, keep the changes
git stash                      # park them
git checkout -b feature/T99-correct-branch
git stash pop                  # bring them back

# I need to discard local changes to one file
git checkout -- path/to/file

# My branch is behind develop
git checkout feature/my-branch
git merge develop              # resolve conflicts, commit
```

When in doubt, ask before force-pushing. `git push --force` on a shared branch
erases other people's work.
