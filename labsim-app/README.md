# LabSim

A browser-based virtual civil engineering lab — built for Tier-2/3 colleges where
physical lab access is limited, but the syllabus still expects a real result.

**Live:** `https://lab-sim-omega.vercel.app/#/`
**Built by:** [Harsh Patel](https://github.com/harxhpatell) — B.Tech Civil Engineering, NIT Agartala

---

## What it does

Six standard IS-code experiments, simulated in the browser with real formulas and
live graphs — not canned animations:

| Experiment | IS Code | What it simulates |
|---|---|---|
| Slump Test | IS 1199 | Concrete workability from water/cement ratio, with a canvas-drawn cone and a live D3 curve |
| Beam Deflection | IS 456 | A simply-supported beam's mid-span deflection under a centre point load, checked against the L/360 limit |
| Sieve Analysis | IS 2386 | Particle-size distribution from retained weights, plotted as a grain-size curve with fineness modulus |
| CBR Test | IS 2720-16 | California Bearing Ratio from a load-penetration curve, read off at 2.5mm and 5mm |
| Cube Crushing Test | IS 516 | Compressive strength of 3 concrete cubes from failure load, checked against the target grade (fck) |
| Compaction Test | IS 2720-7 | Standard Proctor test — dry density vs moisture content curve, reads off OMC and Max. Dry Density |

On top of the experiments themselves:

- 🤖 **AI Viva Coach** — after finishing an experiment, get asked 3 conceptual
  questions grounded in your actual results, graded live, with hints on request
- 📄 **PDF Lab Manual** — download a formatted lab report (aim, procedure,
  inputs, results, observation table, viva score) for any experiment, one click
- 👤 **Student accounts** — optional sign-in to save every attempt and viva score
  to a personal dashboard. Everything still works fully without an account.

---

## Tech stack

- **Frontend:** React + Vite, React Router (`HashRouter`), D3.js for all graphs, `jsPDF` for reports
- **AI:** Google Gemini (`gemini-2.5-flash`) via a Vercel serverless function — the API key never touches the browser
- **Auth + database:** Supabase (email/password auth, Postgres with Row Level Security)
- **Hosting:** Vercel (frontend + serverless functions in one deploy)

---

## Project structure

```
labsim-app/
├── api/
│   └── viva.js                serverless function — talks to Gemini, holds the API key
├── src/
│   ├── App.jsx                 routes: / /slump /beam /sieve /cbr /cube /proctor /login /dashboard
│   ├── index.css                design system (hazard-yellow/black theme), incl. mobile breakpoints
│   ├── components/
│   │   ├── NavBar.jsx            hamburger menu below 860px
│   │   ├── Footer.jsx
│   │   ├── ExperimentLayout.jsx shared shell every experiment plugs into
│   │   └── VivaCoach.jsx         AI viva chat UI
│   ├── context/
│   │   └── AuthContext.jsx       Supabase session state
│   ├── lib/
│   │   └── supabaseClient.js
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   └── Dashboard.jsx
│   ├── experiments/
│   │   ├── SlumpTest.jsx
│   │   ├── BeamTest.jsx
│   │   ├── SieveAnalysis.jsx
│   │   ├── CBR.jsx
│   │   ├── CubeCrushing.jsx
│   │   └── CompactionTest.jsx
│   └── utils/
│       ├── generateLabManual.js  PDF builder (jsPDF + autoTable)
│       └── saveAttempt.js        writes to Supabase if logged in, no-op otherwise
├── supabase/
│   └── schema.sql               run once in Supabase's SQL editor
├── vercel.json
└── .env.example
```

---

## Formulas used

- **Slump (IS 1199):** `slump = (w/c ratio − 0.40) × 200`, clamped to 0–80mm
- **Beam deflection (IS 456)**, centre point load, simply supported:
  `δ = W·L³ / (48·E·I)`, checked against `L/360`. `E = 25,000 N/mm²` (M25 concrete assumed)
- **Sieve analysis (IS 2386):** standard 6-sieve + pan set; fineness modulus = sum of
  cumulative % retained on the six sieves ÷ 100
- **CBR (IS 2720-16):** `CBR% = (test load / standard load) × 100` at 2.5mm
  (standard load 13.24kN) and 5.0mm (standard load 19.93kN); the higher value governs
- **Cube crushing (IS 516):** `strength = failure load / (150mm × 150mm)`, averaged
  over 3 cubes and checked against the target grade (fck)
- **Compaction test (IS 2720-7):** `dry density = bulk density / (1 + moisture fraction)`,
  where bulk density = wet mass ÷ standard Proctor mould volume (1000 cm³); OMC/MDD
  read off the peak of the entered data points

---
## Roadmap

- [x] **Phase 1** — static HTML/CSS/JS build, hazard-yellow branding
- [x] **Phase 2** — React + Vite migration, shared `ExperimentLayout`, Sieve Analysis + CBR added
- [x] **Phase 3** — AI Viva Coach (Gemini), PDF lab manual generator, Supabase auth + dashboard
- [x] **Phase 4a** — Mobile responsiveness pass (hamburger nav, scrollable tables, tighter spacing on small screens)
- [x] **Phase 4b** — Cube Crushing (IS 516) and Compaction Test (IS 2720-7) added — 6 experiments live
- [ ] **Phase 4c** — Demo video, further polish

---

## License

Not yet licensed — all rights reserved by default. Add a `LICENSE` file if you want to
open this up for others to use or contribute to.
