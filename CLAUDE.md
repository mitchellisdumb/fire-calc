# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a FIRE (Financial Independence/Retire Early) retirement calculator built as a React single-page application. It models complex career trajectories—specifically BigLaw → Federal Clerking → BigLaw → Public Interest Law transitions—with comprehensive tax calculations, 529 college savings, rental property cash flow, and Monte Carlo simulation capabilities.

See README.md for detailed feature documentation and rationale behind design decisions.

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

### Tech Stack
- **React 19**: UI framework with functional components and hooks
- **Vite**: Build tool and dev server
- **Recharts**: Chart library for visualizations (LineChart, AreaChart)
- **TypeScript**: Domain logic (`src/domain`), state hooks (`src/hooks`), and modular calculator components (`src/components/calculator`)

### File Structure
```
src/
├── main.jsx                       # React entry point
├── App.jsx                        # Root component (renders calculator shell)
├── components/
│   └── calculator/                # UI surface split into focused components
├── domain/                        # Financial math and simulation helpers
├── hooks/                         # Shared React hooks (useCalculatorConfig)
├── App.css                        # App-specific styles
└── index.css                      # Global styles
tests/
└── domain/                        # Vitest coverage for core financial logic
```

### Modular Calculator Design
Stateful form management lives in `useCalculatorConfig`, domain helpers reside in `src/domain`, and presentation components under `src/components/calculator` compose the UI. The architecture separates pure financial calculations from React rendering, making the Monte Carlo and projection engines directly testable.

## Critical Implementation Details

### Income Calculation Logic

The calculator handles multiple career phases with different income rules:

**Phase detection:**
- Law school (2025-2027): Base income only
- BigLaw (2028-2028): Cravath scale starting year 1
- Clerking (2029-2030): Fixed salary + 401k match (4%)
- Return to BigLaw (2031-2035): Cravath scale with class year credit
- Public Interest (2036+): Fixed salary + annual raises (3%) + 401k match (4%)

**Cravath scale progression:**
The scale is lockstep with no annual inflation adjustments. Once a cohort's scale is set, it remains fixed. The calculator uses the 2025 scale throughout (conservative assumption). Class year advances annually when in BigLaw.

**Key function:** `getCravathSalary(associateYear)` - returns 2025 scale values for years 1-8

### Tax Calculation

**Three separate tax types:**
1. **Federal income tax**: Progressive brackets (10% → 37%)
2. **California state tax**: Progressive brackets (1% → 12.3%)
3. **FICA**: Social Security (6.2% up to wage base) + Medicare (1.45% + Additional Medicare Tax)

**Above-the-line deductions applied first:**
- HSA: $8,550 (2025 value, inflates)
- Dependent Care FSA: $7,500 (2025 value, inflates)

**Standard vs. itemized deductions:**
Calculator uses whichever is greater. Rental mortgage interest is automatically added to itemized deductions.

**All tax brackets inflate at general inflation rate** (default 3%) to maintain real purchasing power.

### Portfolio Allocation Logic

**Two account types tracked separately:**
- **Tax-advantaged** (401k + IRA): 7% return, no dividend drag
- **Taxable** (brokerage): 6% return, accounts for dividend taxation

**Contribution priority:**
1. Max out both 401(k)s: $23,500 each (2025 limit, inflates)
2. Max out both Roth IRAs: $7,000 each (2025 limit, inflates)
3. Add employer matches (when applicable)
4. Overflow → taxable accounts

**Withdrawal priority (reverse):**
1. Withdraw from taxable first (flexible, no penalties)
2. Tax-advantaged withdrawal only if taxable depleted

### 529 College Savings

**Per-daughter tracking:**
- Daughter 1 (born 2021): College years 2039-2042
- Daughter 2 (born 2025): College years 2043-2046

**Key rules:**
- Contributions capped at 50% of positive annual savings (enforces retirement priority)
- Each account stops growing/contributing when daughter turns 22
- College cost inflation (3.5%) exceeds general inflation (3.0%)
- Shortfalls paid from main portfolio (taxable first)
- Warning if final balance > $0 (suggests over-contribution)

### Rental Property

**Two separate calculations:**

1. **Cash flow** (what hits bank account):
   - Before mortgage payoff: Income - P&I - property tax - insurance - maintenance - vacancy
   - After mortgage payoff: Income - property tax - insurance - maintenance - vacancy

2. **Taxable income** (what's reported to IRS):
   - Income - property tax - insurance - mortgage INTEREST - maintenance - vacancy
   - Only interest is deductible, not principal

**Mortgage amortization:**
Uses closed-form calculation (not month-by-month iteration) for efficiency. Interest deduction calculated annually based on remaining balance.

**Prop 13 property tax cap:**
Both primary residence and rental property taxes grow at 2% annually (California law), creating significant long-term value versus market-rate appreciation.

### Monte Carlo Simulation

**Two-phase modeling:**

**Phase 1 - Accumulation (Still Working):**
- Deterministic cash flows (actual income/expenses from base case)
- Random returns: N(mean=7%, stddev=15%) for tax-adv, N(mean=6%, stddev=15%) for taxable
- Check annually if portfolio ≥ FIRE target
- Switch to Phase 2 when FIRE achieved

**Phase 2 - Withdrawal (Retired):**
- Stop W-2 income (rental + Social Security continue)
- Calculate withdrawal needed: expenses - rental - SS
- Random returns applied to portfolio
- Track portfolio depletion (< $1,000 = failed simulation)

**Random number generation:**
Box-Muller transform for normally distributed returns:
```javascript
u1 = random(), u2 = random()
z = sqrt(-2 × ln(u1)) × cos(2π × u2)
return = mean + (z × stddev)
```

**Performance optimization:**
Simulations wrapped in `setTimeout(..., 100)` to avoid blocking UI thread. "Running..." state provides user feedback.

## Common Development Tasks

### Modifying FIRE Target Calculation

The FIRE target is calculated in the main projection loop. Current formula:
```javascript
fireTarget = (fireExpenseTarget × inflationFactor × targetPortfolioMultiple)
           + collegeReserveNeeded
           + healthcareBuffer
```

To add a new component (e.g., relocation buffer, elder care reserve):
1. Add state variable for the amount
2. Calculate the reserve in the projection loop
3. Add to `fireTarget` calculation
4. Display in UI form section

### Adding a New Income Source

1. Add state variable(s) for amount and timing
2. Update income calculation section in projection loop
3. Add to `totalIncome`
4. Update tax calculation if source has special treatment (e.g., municipal bond interest)
5. Add UI form fields

### Adding a New Expense Category

1. Add state variable for amount
2. Choose inflation treatment (general, Prop 13, education, or none)
3. Add to expense calculation section
4. Add to `totalExpenses`
5. Add UI form fields

### Modifying Tax Calculations

Federal and California tax brackets are hardcoded in the projection loop. To update:
1. Find the tax calculation section (~line 400-600 range)
2. Update bracket thresholds and rates
3. Ensure bracket inflation is applied consistently
4. Test with known tax scenarios to verify accuracy

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
