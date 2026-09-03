# KeyKalimba — Agent Instructions

## Versioning & Release Rules

- **Routine Work & Commits**: Develop small fixes, UI adjustments, and regular features on feature branches, verify locally, merge to `main`, and push. Do **NOT** create Git tags or GitHub Releases for routine commits.
- **Milestone Releases (Major / Minor)**: ONLY create Git tags and GitHub Releases when releasing a significant milestone (e.g. `v2.6.0`, `v3.0.0`):
  - Every Git tag MUST correspond to a published GitHub Release (`Tag == Release`).
  - When publishing a milestone:
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
chore: bump version to 2.5.0
```

Never write vague messages like "update", "fix stuff", or "changes".

## Workflow — Follow This Every Time

1. **Feature Branch**: Create and work in a dedicated branch for new features/fixes (`git checkout -b feat/<name>`).
2. **Local Development & Verification**:
   - Run `npm run dev` to test locally.
   - Verify layout responsiveness across desktop and iPhone Landscape ($844 \times 390$) ensuring no element overlaps.
3. **Build Integrity Check**: Run `npm run build` — resolve all TypeScript and build errors before proceeding.
4. **User Review & Testing**: Present the local build / screenshots to the user for testing and explicit approval.
5. **Merge & Push to Main**:
   - Merge feature branch into `main`.
   - Delete local feature branch.
   - Push `main` to origin.
6. **Milestone Release Tag** (*Only for major/minor version milestones*):
   - Bump version in `package.json`.
   - Run `npm run screenshots` if visual changes affect documentation.
   - Create and push Git tag & GitHub Release via `gh release create`.

Never commit if `npm run build` fails. Never push without committing first.

## Tech Stack

- React + TypeScript + Vite
- Vanilla CSS (no Tailwind)
- Lucide React for icons
- MidiPlayerJS + Soundfont-player for audio
- Deployed on Netlify via GitHub main branch
