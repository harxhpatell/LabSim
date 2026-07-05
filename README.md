# LabSim — Phase 2 (React + Vite)

Browser-based virtual civil engineering lab. This is the Phase 2 rebuild — the same
Phase 1 experiments (Slump Test, Beam Deflection) rebuilt as React components, plus
two new experiments (Sieve Analysis, CBR Test), all sharing one layout.

## What's here (Phase 2 — done)

| Step | What it is |
|---|---|
| 05 | Migrated to Vite + React. `App.jsx` holds routing; each experiment is its own component. |
| 06 | `ExperimentLayout.jsx` — shared shell every experiment plugs into (header, inputs panel, stage panel, observation table). |
| 07 | Two new experiments: **Sieve Analysis** (IS 2386) and **CBR Test** (IS 2720-16), both built on the same layout with zero new CSS. |

### Project structure

```
labsim-app/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx                    routes: / /slump /beam /sieve /cbr
    ├── index.css                  shared design system (hazard-yellow/black theme)
    ├── components/
    │   ├── NavBar.jsx
    │   ├── Footer.jsx
    │   └── ExperimentLayout.jsx   shared header + inputs/stage/table slots
    ├── pages/
    │   └── Home.jsx               landing page, experiment cards
    └── experiments/
        ├── SlumpTest.jsx          IS 1199 — canvas cone + D3 curve
        ├── BeamTest.jsx           IS 456 — D3 deflected beam + BMD
        ├── SieveAnalysis.jsx      IS 2386 — data-entry table + D3 gradation curve (log scale)
        └── CBR.jsx                IS 2720-16 — data-entry table + D3 load-penetration curve
```

Every experiment now also logs readings (Slump, Beam) or takes direct data entry
(Sieve, CBR) into an observation table at the bottom of the page — this is the
`table` slot in `ExperimentLayout`.

## Run it locally

```bash
cd labsim-app
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Deploy to GitHub Pages

This uses **HashRouter** (routes look like `/#/slump`) and relative asset paths
(`base: './'` in `vite.config.js`), so it works from a GitHub Pages subpath with
zero extra server config — no 404.html redirect trick needed.

```bash
git add .
git commit -m "Phase 2: migrate to React, add Sieve Analysis + CBR Test"
git push

npm run deploy   # builds and pushes ./dist to the gh-pages branch
```

Then in your GitHub repo: **Settings → Pages → Source → Deploy from branch → `gh-pages` / root**.

Live at: `https://harxhpatell.github.io/LabSim/`

> If your repo name isn't `LabSim`, update the `homepage` field in `package.json` to match.

## Formulas used

- **Slump (IS 1199):** `slump = (w/c ratio − 0.40) × 200`, clamped to 0–80mm.
- **Beam deflection (IS 456)**, centre point load, simply supported:
  `δ = W·L³ / (48·E·I)`, checked against `L/360`. `E = 25,000 N/mm²` (M25 concrete).
- **Sieve analysis (IS 2386):** standard 6-sieve + pan set; fineness modulus = sum of
  cumulative % retained on the six sieves ÷ 100.
- **CBR (IS 2720-16):** `CBR% = (test load / standard load) × 100` at 2.5mm
  (standard load 13.24kN) and 5.0mm (standard load 19.93kN); the higher value governs.

## What's next (Phase 3)

Per the original roadmap: AI viva coach (Anthropic API), PDF lab-manual generator
(jsPDF), and Supabase auth + student dashboard.

---

## Phase 3 — AI Viva Coach, PDF Lab Manual, Student Auth (all done)

### Part 1 — AI Viva Coach (now on Gemini, not Anthropic)

Same as before: after finishing any experiment, the **AI Viva Coach** panel asks 3
conceptual questions grounded in the student's actual result data, grades free-text
answers, gives one hint per question, and tracks a score out of 3.

It now runs on **Google Gemini** (`gemini-2.5-flash`) instead of the Anthropic API —
still via a serverless function so the key never reaches the browser.

```
api/viva.js   — serverless function, calls Gemini's generateContent endpoint
```

**Get a Gemini API key:** go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey),
sign in with a Google account, click **Create API key**. It's free to generate; Gemini's
Flash tier has a genuine free usage tier (unlike Anthropic), so testing this costs nothing
under normal use.

**Deploy:** in Vercel, **Settings → Environment Variables**, add `GEMINI_API_KEY` = your key.

### Part 2 — PDF Lab Manual Generator

Every experiment page now has a **"Download Lab Manual (PDF)"** button next to the title.
Clicking it generates a branded PDF (via `jsPDF` + `jspdf-autotable`) containing:

- Aim and step-by-step procedure for that experiment's IS code
- The inputs the student set and the results they got
- The full observation table
- Their AI viva score, if they took one

```
src/utils/generateLabManual.js   — shared PDF builder, called from every experiment
```

This runs entirely client-side — no backend, no API key, works on GitHub Pages too.

### Part 3 — Supabase Auth + Student Dashboard

Students can now optionally create an account to save every experiment attempt and viva
score to a personal dashboard. The app still works fully without signing in — this is
additive, not a gate.

```
src/lib/supabaseClient.js       — Supabase client (reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
src/context/AuthContext.jsx     — session state + signUp/signIn/signOut
src/utils/saveAttempt.js        — no-op if logged out; inserts a row if logged in
src/pages/Login.jsx             — email/password sign in and sign up
src/pages/Dashboard.jsx         — attempt history, viva score average
supabase/schema.sql             — run once in your Supabase project
```

**Set up Supabase (about 5 minutes):**

1. Go to [supabase.com](https://supabase.com) → **New project**. Free tier is enough.
2. Once it's ready: **SQL Editor → New query** → paste in the contents of `supabase/schema.sql` → **Run**.
   This creates the `attempts` table with Row Level Security, so each student can only
   ever see their own rows — not because the code hides other people's data, but because
   the database itself refuses the query.
3. **Settings → API** → copy the **Project URL** and the **anon public** key.
4. In Vercel: **Settings → Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key

   (These are prefixed `VITE_` on purpose — Vite exposes them to the browser. That's fine;
   the anon key is meant to be public. Row Level Security is what actually protects data,
   not keeping this key secret.)
5. By default Supabase requires email confirmation before sign-in works. For a class demo
   where you don't want students waiting on confirmation emails, you can turn this off in
   **Authentication → Providers → Email → uncheck "Confirm email"** — fine for a hackathon
   demo, but re-enable it if this ever handles real student accounts at scale.

### Local development with all three features

```bash
cp .env.example .env.local   # fill in GEMINI_API_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install -g vercel         # one-time
vercel dev                    # runs Vite + /api together, reading .env.local
```

### What's next (Phase 4, per the original roadmap)

Cube Crushing experiment (IS 516) and general polish — animations, mobile responsiveness
pass, and a proper landing-page demo video. Say the word when you want to start.
