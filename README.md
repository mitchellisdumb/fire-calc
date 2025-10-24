# FIRE Calculator

## Overview
This project is a two-stage Financial Independence / Retire Early (FIRE) planner tailored for legal careers that leave mainstream calculators behind. It models the full lifecycle from aggressive accumulation (BigLaw → clerking → BigLaw → public interest) through retirement withdrawals while respecting California-specific taxes, 529 funding, rental property cash flow, and sequence-of-returns risk. The UI now presents a shared input surface with linked Pre‑Retirement and Post‑Retirement tabs so users can explore the transition between phases without re-entering data.

## Feature Highlights
- **Career-aware income engine** — encodes the 2025 Cravath scale, clerkship credit, public-interest raises, and employer match rules. Adjustments live in `src/domain/career.ts`.
- **Precision cash-flow projection** — `src/domain/projection.ts` calculates monthly balances using high-precision decimal math (`src/domain/money.ts`), allocates savings across tax-advantaged/taxable accounts, handles 529 plans per child, and applies Prop 13 caps to property taxes.
- **Tax modelling** — federal, FICA, and California brackets inflate with CPI; standard vs. itemised deductions and rental interest are reconciled each year in `src/domain/taxes.ts`.
- **Monte Carlo survival analysis** — `src/domain/monteCarlo.ts` replays accumulation and withdrawal phases with deterministic seeds, adjustable volatility, and success thresholds; the UI allows linking/unlinking phase inputs so users can run Stage 2 independently.
- **Robust validation** — the form schema (`src/domain/schemas.ts`) enforces cross-field rules and preserves the last known-good configuration while surfacing inline issues rather than silently clamping.

## Architecture
- React 19 + Vite SPA (`src/main.jsx`, `src/App.jsx`)
- View layer in `src/components/calculator/`, with `FIRECalculator.tsx` orchestrating tabs plus Monte Carlo controls.
- State management through `src/hooks/useCalculatorConfig.ts`, which coordinates validation, derived withdrawal rates, and Monte Carlo settings.
- Business logic isolated under `src/domain/` for deterministic testing; number handling uses decimal helpers to avoid floating drift.
- Styling handled via Tailwind-friendly utility classes plus custom tooltip styles (`src/index.css`).

## Development Workflow
```bash
npm install          # dependencies (already vendored locally for CI caching)
npm run dev          # Vite dev server on http://localhost:5173
npm run build        # production bundle
npm run preview      # serve the production build
npm run lint         # ESLint (see eslint.config.js)
npm run test         # Vitest suite (domain + component coverage)
```

Vitest tests cover projection invariants, Monte Carlo determinism, mortgage math, and the two-stage components (`tests/components/preRetirementPanel.test.tsx`, `tests/components/postRetirementPanel.test.tsx`). When adding new calculations, extend the relevant domain tests first and mirror the behaviour in the UI suite.

## Project Structure
```
src/
  components/calculator/    # Pre/Post retirement panels, inputs, charts
  domain/                   # Engine math, schemas, statistics
  hooks/                    # useCalculatorConfig orchestration
  App.jsx / index.css       # Shell + global styles
tests/
  components/               # UI behaviour
  domain/                   # Financial invariants
```

## Documentation
- `AGENTS.md` — contributor quickstart for humans/agents working on the repo
- `CLAUDE.md` — AI-specific guidance with architecture notes
- `critical-audit.md` — open improvement backlog kept in sync with refactor milestones

Please update both the README and agent docs when business assumptions shift (e.g., tax law changes, career timeline tweaks) so users see the same inputs reflected in the engine and UX.
