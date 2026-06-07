# KalimbaTiles — Project Rules for Antigravity / Gemini CLI

## Versioning

The project follows **Semantic Versioning**: `MAJOR.MINOR.PATCH`

| Segment | When to increment | Who decides |
|---------|------------------|-------------|
| `PATCH` (e.g. `2.3.1 → 2.3.2`) | Every normal fix, feature, or improvement | Agent increments automatically |
| `MINOR` (e.g. `2.3.x → 2.4.0`) | Larger feature additions or significant UX changes | **User must explicitly say "new minor version"** |
| `MAJOR` (e.g. `2.x → 3.0.0`) | Full rewrites or breaking architectural changes | **User must explicitly approve** |

**Rules:**
- Always read the current version from `package.json` before bumping.
- Only ever increment the `PATCH` number by default, never jump numbers.
- A build (`npm run build`) must succeed before committing.
- Never push without a successful build.

---

## Commit Message Format

Follow **Conventional Commits** strictly:

```
<type>(<scope>): <short summary>

<optional body — what changed and why, bullet points preferred>
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `refactor` — code restructuring without behaviour change
- `style` — CSS / visual-only changes
- `docs` — README or documentation only
- `chore` — build, config, dependencies
- `perf` — performance improvement

**Scope** is the area of code changed, e.g. `tuner`, `navbar`, `midi`, `kalimba`, `ci`, `css`.

**Examples:**
```
fix(tuner): persistent key colors now survive key deselection

feat(midi): pressing play after song ends restarts from beginning

style(navbar): unify flex gap — remove phantom padding from nav-section

docs: add tuning screenshot and feature description to README

chore: bump patch version to 2.3.2
```

**Rules:**
- Summary line max 72 characters, lowercase after the colon, no period at end.
- Body should explain *what* and *why*, not just *what*.
- No random or vague messages like "fix stuff" or "update".

---

## Workflow

1. Make code changes.
2. Run `npm run build` — fix all TypeScript and lint errors before continuing.
3. Update version in `package.json` (patch bump only unless told otherwise).
4. `git add -A`
5. `git commit -m "..."` with a proper conventional commit message.
6. `git push origin main`

Never commit if the build fails.
