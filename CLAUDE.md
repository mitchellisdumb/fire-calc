# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository contains a two-stage Financial Independence/Retire Early (FIRE) planner built with React + Vite. It models a BigLaw → Federal Clerking → BigLaw → Public Interest trajectory, California-specific taxes, 529 plans, rental property cash flow, and Monte Carlo survival analysis. The interface presents shared inputs with linked Pre- and Post-Retirement tabs so users can reason about accumulation vs. withdrawal phases without re-entering data.

## Development Commands

### Local Development
```bash
npm install          # Install dependencies
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

### Development Server
- Vite dev server runs on `http://localhost:5173` by default
- Hot module replacement (HMR) is enabled for fast iteration
- TypeScript files (.tsx) are transpiled automatically

## Architecture

### Tech Stack & Layout
- **React 19 + Vite** for the SPA.
- **TypeScript** in `src/domain` (financial logic), `src/hooks` (state orchestration), and `.tsx` components.
- **Vitest + Testing Library** for domain/behaviour coverage.
- **Decimal math** helpers in `src/domain/money.ts` prevent floating-point drift across projections and Monte Carlo.
- UI is built from modular components in `src/components/calculator/` (inputs panel with tooltips, pre-/post-retirement results, Monte Carlo tab).

```
src/
  App.jsx / main.jsx
  components/calculator/  # FIRECalculator.tsx + panels/inputs
  domain/                 # career, projection, Monte Carlo, taxes, schemas, money
  hooks/                  # useCalculatorConfig (validation + linking)
tests/
  domain/                 # engine invariants, Monte Carlo determinism, mortgage math
  components/             # stage panels + regression coverage
```

## Key Implementation Notes

### Validation & Form Flow
- `CalculatorForm` + `CalculatorInput` schemas live in `src/domain/schemas.ts`.
- `useCalculatorConfig` keeps the latest valid inputs while allowing users to explore invalid intermediate states (blank fields, out-of-range numbers). Validation issues are exposed to the inputs panel; engine calls always consume the last known-good configuration.
- Derived withdrawal rate = `100 / targetPortfolioMultiple` when the multiple is finite and > 0; otherwise 0. No clamping happens silently—errors stay visible until resolved.

### Projection Engine (`src/domain/projection.ts`)
- Runs monthly, using decimals to update tax-advantaged and taxable balances independently.
- Allocates savings by maxing retirement accounts (401(k), Roth, employer match) before taxable spillover; handles withdrawals in the reverse order.
- Tracks college reserves per child, Prop 13 property taxes, rental cash flow vs. taxable income, and FIRE readiness thresholds. Outputs include yearly summaries consumed by both panels.

### Monte Carlo (`src/domain/monteCarlo.ts`)
- Uses deterministic seeds and lognormal return sampling (see `generateLognormalReturn` in `statistics.ts`, mocked in tests) to replay accumulation + withdrawal phases.
- Accepts volatility, iterations, success threshold, retirement end age, and linkage state. Stage 2 can run independently when the UI toggle decouples it from Stage 1 projections.
- Returns percentile stats (p10/p25/p50/p75/p90), success probability, and failure narratives consumed by the Post-Retirement tab.

### Career & Tax Modules
- `career.ts` encodes the BigLaw → clerking → BigLaw → public interest path, including Cravath scale, clerkship credit, and employer match rules.
- `taxes.ts` computes federal, California, and FICA obligations with inflation-adjusted brackets, plus above-the-line deductions and rental interest treatment.

### UI Surface
- `CalculatorInputsPanel.tsx` renders all inputs with currency formatting, empty-state tolerance, and explanatory tooltips (see `fieldTooltips`). Linking toggles allow Stage 2 overrides while still displaying Phase 1 outputs when linked.
- `PreRetirementPanel.tsx` and `PostRetirementPanel.tsx` visualise projection outputs, FIRE readiness, Monte Carlo survival, and guardrail messaging.
- Tooltips styled via `src/index.css` with widened popovers for readability.

## Workflow Tips for Claude
- Always update schemas, default form values, and UI inputs together when adding a field.
- When adjusting financial assumptions, modify the domain module first, extend domain tests, then align UI renderers.
- Decimal helpers (`money.ts`) should wrap any new arithmetic; never mix plain numbers with decimals mid-stream.
- Tests to run before handing work back: `npm run lint` and `npm run test`. Monte Carlo tests rely on deterministic seeds—update fixtures if you intentionally change distributions.
- Coordinate documentation changes (`README.md`, `AGENTS.md`) whenever new inputs, toggles, or methodology adjustments ship so human collaborators stay aligned.

### Extending Monte Carlo

The Monte Carlo simulations now live in two helpers: `runAccumulationMonteCarlo` (readiness timing) and `runWithdrawalMonteCarlo` (retirement longevity). Key extension points:

**To change return distribution:**
Modify the `generateNormalReturn()` helper function. Current implementation uses normal distribution; could be changed to log-normal, historical returns, etc.

**To add correlation between asset classes:**
Currently, tax-advantaged and taxable returns are independent. To add correlation, generate correlated random variables using Cholesky decomposition.

**To add additional metrics:**
Track desired metric in simulation loop, then calculate percentiles at end alongside existing metrics (P10, P25, P50, P75, P90).

## State Management

### Shared Inputs via Custom Hook
The `useCalculatorConfig` hook centralizes shared inputs (savings, income, targets) and exposes derived values such as the withdrawal rate implied by the target multiple. UI components consume this hook rather than managing their own copies of the same fields.

### Two-Phase UI Composition
- `PreRetirementPanel` focuses on accumulation readiness, Monte Carlo percentiles, and selecting the scenario to link to withdrawal planning.
- `PostRetirementPanel` evaluates withdrawal durability, toggling between linked and manual scenarios while reporting survival metrics.

### Domain Module Responsibilities
- `projection.ts`: deterministic cash-flow model that feeds both panels.
- `monteCarlo.ts`: exports `runAccumulationMonteCarlo` and `runWithdrawalMonteCarlo` so the phases can simulate independently.

### Validation & Precision
- `domain/schemas.ts` enforces numeric bounds and cross-field rules, returning user-friendly issues that surface above the form.
- Monetary calculations now use high-precision helpers in `domain/money.ts` (Decimal.js) to avoid float drift when compounding or applying returns.
- `tests/domain/engine.invariants.test.ts` fuzzes random plan inputs and locks down deterministic Monte Carlo behaviour (with a mocked RNG) to guard against regressions.

## Future Enhancements Backlog
- **Advanced return modeling**: introduce Student-t or block-bootstrap Monte Carlo, plus stochastic inflation correlated with assets.
- **Withdrawal guardrails**: support floor/ceiling or Guyton–Klinger style rules alongside fixed multiples.
- **Expanded tax coverage**: add non-CA state modules, capital-gains harvesting, Roth conversions, and RMD handling.
- **Scenario management**: allow saving/comparing multiple plans side by side with diff views.
- **Data export**: provide CSV/JSON downloads of yearly (or monthly) projections and assumption summaries.
- **Methodology documentation**: generate a versioned “assumptions & math” appendix directly from engine comments.
- **Accessibility & UX**: richer tooltips, inline explanations for critical inputs, and confidence-band charts for both phases.
- **Privacy posture**: document where data lives (client-only vs. server) and outline deletion/consent policies if server storage arrives.
- Calculation dependencies are explicit via `useMemo` dependency array

### Performance: useMemo Dependency Array
The main projection uses `useMemo` with comprehensive dependency array. Any input change triggers recalculation. For 40-year projections this is near-instantaneous. Monte Carlo (5000+ iterations) can take 5-10 seconds.

## Data Validation Notes

**No formal validation:** User inputs are not validated beyond basic HTML input constraints (e.g., `type="number"`). Invalid inputs may produce nonsensical results rather than errors.

**Edge cases to consider when extending:**
- Years crossing boundaries (e.g., setting clerking start > end year)
- Negative income or expenses
- Division by zero in withdrawal rate
- 529 contributions exceeding savings
- Portfolio depletion during accumulation phase

## Performance Considerations

**Chart rendering:** Recharts handles 40 years × 5 percentiles (200 data points) efficiently. Larger datasets may require optimization.

**Large simulations:** 10,000+ Monte Carlo iterations can block the UI despite setTimeout wrapper. Consider Web Workers for truly non-blocking simulation.

**Memory usage:** Each Monte Carlo simulation stores full 40-year trajectory. 10,000 simulations × 40 years × multiple metrics = significant memory. Current implementation is acceptable for <5000 iterations.

## Known Limitations

See README.md "Limitations & Future Enhancements" section for comprehensive list. Key limitations relevant to development:

1. **No capital gains tax on taxable withdrawals**: Simplified model assumes withdrawals are tax-free
2. **Simplified Social Security taxation**: Uses 100% inclusion vs. actual 85% inclusion ratio
3. **No RMD enforcement**: Post-73 required minimum distributions not modeled
4. **Single projection period**: Cannot easily compare scenarios side-by-side
5. **No early 401k withdrawal penalties**: Calculator flags deficits but doesn't model penalty structure

## Inflation Rates Reference

Different categories use different inflation rates:

| Category | Rate | Location in code |
|----------|------|------------------|
| General expenses | 3.0% | `inflationRate` state |
| Property tax | 2.0% | `propertyTaxGrowth` state (Prop 13 cap) |
| Rental property tax | 2.0% | `rentalPropertyTaxGrowth` state |
| College costs | 3.5% | `collegeInflation` state |
| Tax brackets | 3.0% | Uses `inflationRate` |
| Social Security wage base | 4.0% | Hardcoded in FICA calculation |
| Cravath scale | 0.0% | No inflation (lockstep scale is fixed) |

## Testing Strategy

- **Vitest suite**: Automated coverage under `tests/domain` exercises mortgage amortization, tax brackets, deterministic projections, and Monte Carlo statistics. Run with `npm run test`.
- **Component testing**: Testing Library (`@testing-library/react`) is installed; create specs under `tests/components` when UI behaviour needs coverage.
- **Scenario validation**: When assumptions change, update fixtures and extend tests instead of manual console scripts.
- **Regression focus**: Add targeted specs for new financial rules (e.g., additional career phases or account types) to keep projections stable.

## Code Style Notes

- **ESLint configuration**: See `eslint.config.js`
- **Unused vars pattern**: `^[A-Z_]` ignored (allows React component constants)
- **TypeScript**: Shared across domain modules, hooks, and calculator components; `.tsx` files live in `src/components`
- **Comments**: Use concise comments to explain financial assumptions rather than React mechanics
- **State organization**: Managed centrally by `useCalculatorConfig`, keeping UI components presentational
