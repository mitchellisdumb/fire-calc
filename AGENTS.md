# Repository Guidelines

## Project Structure & Module Organization
- `src/components/calculator/` — UI surface composed of `FIRECalculator.tsx`, pre- and post-retirement tabs, and the shared inputs panel (with tooltips, linked/manual toggles, and Monte Carlo controls).
- `src/hooks/useCalculatorConfig.ts` — central form state, schema-based validation, derived withdrawal rate logic, and Monte Carlo settings.
- `src/domain/` — pure financial engine (career timeline, projections, Monte Carlo, taxes, decimal helpers, schemas, statistics). Treat these modules as the single source of truth for business rules.
- `tests/` — Vitest coverage; `tests/domain` exercises calculations and invariants, `tests/components` covers the two stage panels and regression flows.
- Styling lives in `src/index.css` (tooltips, layout primitives) and component-level Tailwind classes. Static assets stay under `public/`; build artefacts land in `dist/` and remain untracked.

## Build, Test, and Development Commands
- `npm install` — install dependencies (already cached locally; no global tooling required).
- `npm run dev` — Vite dev server on `http://localhost:5173`.
- `npm run build` / `npm run preview` — production bundle + smoke test.
- `npm run lint` — ESLint (React hooks rules enforced).
- `npm run test` — Vitest suite (deterministic Monte Carlo, projection invariants, UI interactions).

## Coding Style & Naming Conventions
- TypeScript-first in domain logic; React files currently .tsx-oriented with two-space indentation.
- Components/hooks/context: PascalCase. Utility functions/constants: camelCase.
- Prefer explicit relative imports; avoid barrel files to keep tree-shaking predictable.
- Decimal math (`src/domain/money.ts`) should stay in fixed-point helpers—never reintroduce raw JS floats into engine code.
- When extending form inputs, register new fields in `CalculatorForm`/`schemas.ts`, expose them via `useCalculatorConfig`, and surface tooltips in the inputs panel.

## Testing Guidelines
- Domain changes **must** come with matching tests (`tests/domain/*.test.ts`). Maintain determinism—use seeded randomness when Monte Carlo behaviour changes.
- For UI adjustments, update Testing Library specs under `tests/components/`. Assert against visible text rather than implementation details.
- Keep `tests/domain/engine.invariants.test.ts` aligned with any new guardrails or constraints; update the fuzz/cross-field expectations as assumptions shift.
- Run `npm run test` before reviews; include command output or CI link in PR descriptions when possible.

## Commit & Pull Request Guidelines
- Write imperative, scoped commit messages (`Add stage linking toggle state`, `Refine decimal withdrawal rate`).
- PRs should summarise the financial assumption changes, UI impacts, and any new validation rules. Provide screenshots/GIFs for UI adjustments affecting charts or inputs.
- Include a verification checklist (`npm run lint`, `npm run test`) and call out follow-up tasks in either the PR body or linked issues so downstream work is traceable.
