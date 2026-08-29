# KeyKalimba — Agent Instructions

## Versioning Rules

The project version is in `package.json`. Follow **Semantic Versioning** (`MAJOR.MINOR.PATCH`).

- **PATCH** (e.g. `2.3.2 → 2.3.3`): Increment automatically for every fix, feature, or improvement.
- **MINOR** (e.g. `2.3.x → 2.4.0`): Only increment when the user explicitly says "new minor version". Reset PATCH to 0.
- **MAJOR** (e.g. `2.x → 3.0.0`): Only increment when the user explicitly approves a major release. Reset MINOR and PATCH to 0.

Always read the current version from `package.json` before deciding what to bump. Never skip patch numbers. Never bump MINOR or MAJOR without explicit user instruction.

## Release & Tag Rules (Tag == Release)

Every Git tag MUST correspond to a published GitHub Release. Never create a raw Git tag without also creating the GitHub Release.

- When publishing a release version (e.g. `v2.5.0`), tag the commit and immediately publish the GitHub Release via GitHub CLI:
  ```bash
  git tag -a v<VERSION> -m "Release v<VERSION>"
  git push origin v<VERSION>
  gh release create v<VERSION> --title "v<VERSION>: <Short Title>" --notes "<Formatted Release Notes>"
  ```
- **Release Notes Style Invariant**: Always adhere strictly to repository conventions:
  - Title: `v<VERSION>: <Feature Focus>` (colon-separated, no emojis in title).
  - Main Heading: `## What's New in KeyKalimba v<MAJOR.MINOR>`
  - Bullet format: `- **Category / Area:** Concise explanation.` (keep tone clean, professional, and free of emoji spam).

## Documentation & Screenshot Rules

- **README Image Cache-Busting**: GitHub proxies README images via its Camo CDN (`camo.githubusercontent.com`). When updating screenshots in `README.md`, always append a version query parameter (`?v=X.Y.Z`) to force GitHub to bypass its proxy cache and display the updated images immediately.
- **Automated Screenshot Generation**: Use the built-in `npm run screenshots` script (`scripts/capture-screenshots.mjs`) to generate iPhone Landscape ($844 \times 390\text{px}$ @ $3\times$ Retina) screenshots. It automatically handles Chrome discovery, 9.7s song playback timing, and tuning visual states.

## Commit Message Rules

Use **Conventional Commits** format. Every commit must follow this structure:

```
<type>(<scope>): <short summary in lowercase, max 72 chars, no period>

<body: what changed and why — use bullet points for multiple changes>
```

**Allowed types:** `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `perf`

**Scope examples:** `tuner`, `navbar`, `midi`, `kalimba`, `css`, `ci`

Good examples:
```
fix(tuner): persistent key colors now survive key deselection
feat(midi): pressing play after song ends restarts from beginning
style(navbar): unify flex gap — remove phantom padding from nav-section
docs: add tuning screenshot and feature description to README
chore: bump patch version to 2.3.3
```

Never write vague messages like "update", "fix stuff", or "changes".

## Workflow — Follow This Every Time

1. Make code changes.
2. Run `npm run build` — resolve all TypeScript errors before proceeding.
3. Bump the PATCH version in `package.json`.
4. `git add -A`
5. `git commit` with a proper conventional commit message.
6. `git push origin main`
7. If creating a release tag, create and push the Git tag and run `gh release create` immediately.

Never commit if `npm run build` fails. Never push without committing first.

## Tech Stack

- React + TypeScript + Vite
- Vanilla CSS (no Tailwind)
- Lucide React for icons
- MidiPlayerJS + Soundfont-player for audio
- Deployed on Netlify via GitHub main branch
