# LabSim NIT

Browser-based virtual civil engineering lab, built for Tier-2/3 colleges without reliable lab access.

**Live demo:** deploy with GitHub Pages (steps below) → `https://<your-username>.github.io/<repo-name>/`

## Phase 1 — done (this commit)

Pure HTML/CSS/JS, no build step, no framework.

| Step | File | What it is |
|---|---|---|
| 01 | `index.html` | Landing page — hero, 5 experiment cards (2 live, 3 marked Phase 2) |
| 02 | `slump.html` | Slump test simulator — canvas-drawn cone + live D3 graph |
| 03 | `slump.html` | (folded into 02) D3 line graph of w/c ratio vs slump, live-updating dot |
| 04 | `beam.html` | Beam deflection simulator — D3-animated beam curve + bending moment diagram |
| — | `style.css` | Shared blueprint/technical-drawing design system used by all pages |

Formulas used (simplified for teaching purposes, referenced to IS codes):
- **Slump (IS 1199):** `slump = (w/c ratio − 0.40) × 200`, clamped to 0–80mm
- **Beam deflection (IS 456), centre point load, simply supported:**
  `δ = W·L³ / (48·E·I)`, checked against the serviceability limit `L/360`.
  Assumes `E = 25,000 N/mm²` (typical M25 concrete).

## Deploying to GitHub Pages

```bash
# from inside this folder
git init
git add .
git commit -m "Phase 1: static HTML/CSS/JS build — landing, slump test, beam deflection"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source → Deploy from branch → `main` / root**.
Your site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

No build tools, no `npm install` — it's static HTML, so this is the entire deploy process.

## What's next (Phase 2)

Migrate `index.html` / `slump.html` / `beam.html` into a Vite + React app (`App.jsx`,
`SlumpTest.jsx`, `BeamTest.jsx`), build a shared `ExperimentLayout` component, and add
Sieve Analysis + CBR Test. See `labsim-roadmap.html` for the full 12-step plan.

## Project structure

```
labsim/
├── index.html      Landing page
├── slump.html       Experiment 1 — Slump Test (IS 1199)
├── beam.html         Experiment 2 — Beam Deflection (IS 456)
├── style.css         Shared design system
└── README.md
```
