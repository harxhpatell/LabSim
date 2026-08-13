<p align="center">
  <img src="labsim-app/assets/logo.png" alt="LabSim" width="320">
</p>

# LabSim

I go to a Tier-2 college. The civil and mechanical labs are functional but old,
slots fill up fast before exams, and if you miss your turn you're basically
copying someone else's readings. So I built LabSim: a browser-based lab where
you run the experiment yourself, get a real result from real formulas, and
then get grilled on it by an AI afterward like an actual viva.

**Live:** `https://lab-sim-omega.vercel.app/#/`
**Me:** [Harsh Patel](https://github.com/harxhpatell), B.Tech Civil Engineering, NIT Agartala

---

## What's in it

9 experiments, civil and mechanical. Every one runs off the real formula, not
a canned animation — type in numbers and the curve actually moves because the
math ran.

**Civil**

| Experiment | Code | What it does |
|---|---|---|
| Slump Test | IS 1199 | w/c ratio in, canvas-drawn cone slumps, plotted against the IS curve |
| Beam Deflection | IS 456 | span/load/I in, beam actually bends, checked against L/360 |
| Sieve Analysis | IS 2386 | retained weights in, gradation curve + fineness modulus out |
| CBR Test | IS 2720-16 | load-penetration readings in, CBR% at 2.5mm and 5mm off the curve |
| Cube Crushing | IS 516 | failure loads for 3 cubes, mean strength checked against target grade |
| Compaction Test | IS 2720-7 | moisture/wet-mass readings, Proctor curve with OMC and MDD marked |

**Mechanical**

| Experiment | Code | What it does |
|---|---|---|
| Tension Test | IS 1608 | load at each extension, full stress-strain curve, E/yield/UTS/elongation |
| Torsion Test | IS 1717 | torque at each twist angle, shear modulus off the slope |
| Impact Test (Izod) | IS 1598 | pendulum rise angle after break, energy absorbed + toughness |

Plus:

- **AI Viva Coach** — 3 questions after each experiment, based on your actual
  result, not a generic bank. Grades your answer, gives a hint if you're stuck,
  keeps score.
- **PDF Lab Manual** — one click, real formatted report: aim, procedure, your
  inputs, your results, the observation table, your viva score.
- **Accounts** — optional. Sign in and your attempts get saved to a dashboard.
  Skip it and everything still works.

---

## Stack

React + Vite, D3 for the graphs (no charting library doing the thinking, the
curves are driven by the actual math). Gemini runs the viva coach through a
small serverless function on Vercel so the key never touches the browser.
Supabase handles accounts — Postgres with Row Level Security.

Deployed on Vercel instead of GitHub Pages because the viva coach needs a
backend for the API key, and static hosting can't do that.

---

## Project layout

```
labsim-app/
├── api/
│   └── viva.js                only place the Gemini key lives
├── src/
│   ├── App.jsx                 routes
│   ├── index.css                design system, hazard yellow/black
│   ├── components/
│   │   ├── NavBar.jsx            Civil/Mechanical dropdowns, hamburger on mobile
│   │   ├── ExperimentLayout.jsx  shell every experiment plugs into
│   │   └── VivaCoach.jsx         viva chat UI
│   ├── context/AuthContext.jsx
│   ├── lib/supabaseClient.js
│   ├── pages/ (Home, Login, Dashboard)
│   ├── experiments/ (all 9)
│   └── utils/
│       ├── generateLabManual.js  PDF builder
│       └── saveAttempt.js        writes to Supabase if logged in
├── supabase/schema.sql          run once in Supabase's SQL editor
└── vercel.json
```

---

## Formulas

- Slump: `slump = (w/c − 0.40) × 200`, clamped 0–80mm
- Beam deflection: `δ = WL³/(48EI)`, checked against L/360, E = 25,000 N/mm² (M25 assumed)
- Sieve: fineness modulus = Σ(cumulative % retained on 6 standard sieves) ÷ 100
- CBR: `CBR% = (test load / standard load) × 100` at 2.5mm (13.24kN) and 5mm (19.93kN), higher governs
- Cube crushing: `strength = load / (150×150)`, avg of 3 cubes vs fck
- Compaction: `dry density = bulk density / (1 + moisture fraction)`, OMC/MDD from the peak
- Tension: stress = load/area, strain = extension/gauge length, E from elastic-region slope
- Torsion: `G = T·L / (J·θ)`, averaged
- Impact: `E = W·R·(cos β − cos α)`

Some of these are simplified on purpose, and the app says so where it matters.
It's a teaching tool. The point is the shape of the relationship, not
lab-grade decimal precision.

---

## Running it

```bash
git clone https://github.com/harxhpatell/LabSim.git
cd labsim-app
npm install
```

Copy `.env.example` to `.env.local`, fill in three things:

```
GEMINI_API_KEY=...        # aistudio.google.com/apikey, free tier
VITE_SUPABASE_URL=...     # supabase.com, new project, Settings > API
VITE_SUPABASE_ANON_KEY=...
```

For the viva coach to work locally, plain `npm run dev` won't serve `/api`:

```bash
npm install -g vercel
vercel dev
```

Also run `supabase/schema.sql` once in your Supabase project's SQL editor,
sets up the `attempts` table with Row Level Security.

To deploy: import the repo on Vercel, add the same three env vars under
Settings → Environment Variables, deploy. Pushes to `main` auto-redeploy.

---

## What's next

Started as a slump test simulator for one assignment. Now this. Probably a
couple more experiments next, maybe a compressive/hardness test for
mechanical, and a demo video whenever I stop finding small things to fix.
