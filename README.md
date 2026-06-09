# 3D Interactive Website

A scroll-driven 3D marketing site for Rapid Rise AI, built with **Vite**,
**React**, and **Three.js** (via [react-three-fiber](https://github.com/pmndrs/react-three-fiber)
and [drei](https://github.com/pmndrs/drei)). The hero orb, expertise carousel,
and pricing wave are all rendered on a single WebGL canvas driven by scroll
position.

## Requirements

- **Node 20+** (the repo pins **Node 22** via [`.nvmrc`](.nvmrc); run `nvm use`)
- npm (a `package-lock.json` is committed — use `npm ci` for reproducible installs)

## Getting started

```bash
git clone https://github.com/RapidRiseAi/claude-testing.git
cd claude-testing
npm ci            # clean, lockfile-exact install (use `npm install` if adding deps)
npm run dev       # dev server with hot reload → http://localhost:5173
```

## Scripts

| Command           | What it does                                                        |
| ----------------- | ------------------------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with hot module reload.                   |
| `npm run build`   | Production build into `dist/`.                                      |
| `npm run preview` | Serve the production build locally to sanity-check it.              |
| `npm run lint`    | ESLint over `src/` (see [`eslint.config.js`](eslint.config.js)).    |
| `npm test`        | Run the headless-browser verification checks (see below).           |

## Testing

The checks in `scripts/check-*.mjs` boot the production build and drive a
headless WebGL browser (Chromium with SwiftShader) to assert real behaviour:

- `check-snap.mjs` — an off-stop scroll auto-snaps to the nearest stop.
- `check-wheel.mjs` — each wheel notch advances exactly one card/section.

They exit non-zero on failure, so they double as CI gates. First time, install
the browser, then run:

```bash
npx playwright install --with-deps chromium
npm test
```

The other `scripts/shoot-*.mjs`, `diag.mjs`, and `q.mjs` are **diagnostic
screenshot/inspection harnesses** (output to `shots/`, which is gitignored) —
handy for eyeballing the 3D scene, not pass/fail tests.

## Recommended local workflow

```bash
npm run lint && npm run build && npm test   # gate before pushing
```

Then commit and push to a feature branch and open a PR. CI
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs lint + build as
hard gates on every pull request, and runs the verification tests as a
**non-blocking** step — they're sensitive to the software-rendered (SwiftShader)
browser used in CI, so `npm test` on real hardware locally is the reliable
pass/fail signal.

## Versioning

`npm version patch|minor|major` bumps `package.json` and creates a matching git
tag — use it for releases.

## Project layout

```
src/
  components/
    objects/   # individual 3D meshes (e.g. FloatingObject)
    scene/     # the WebGL scene: HeroOrb, Lights, particles, environment
    ui/        # DOM overlay: hero, navbar, carousel, pricing, loading
  hooks/       # useScrollProgress, useScrollSnap
  pages/       # routed pages (Home, About, Pricing, Services, Proof, …)
  data/        # static content (services)
  utils/       # scroll layout, carousel state, texture/geometry helpers
scripts/       # Playwright-driven verification + screenshot harnesses
public/        # static assets served as-is
```
