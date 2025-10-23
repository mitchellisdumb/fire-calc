# FIRE Retirement Calculator - README

## Overview

This is a comprehensive Financial Independence/Retire Early (FIRE) calculator built to model a complex, non-standard career trajectory that institutional retirement planning tools cannot accommodate. Unlike tools from Fidelity, T. Rowe Price, or Empower that assume predictable income growth patterns, this calculator handles dramatic income transitions typical of legal careers: BigLaw → Federal Clerking → BigLaw → Public Interest Law.

**Built for:** Dual-income households with complex career paths, rental property income, college savings needs, and California-specific tax considerations.

**Time horizon:** 2025-2065 (40 years)

**Technology:** React application using Recharts for visualization

---

## Why This Calculator Was Built

### The Problem with Institutional Tools

Commercial retirement calculators have three critical limitations for non-standard careers:

1. **Income assumptions**: They assume steady income growth (inflation + 1-3%), making them unsuitable for modeling BigLaw ($225k) → Clerking ($100k) → BigLaw ($260k) → Public Interest ($80k) transitions
2. **Tax precision**: They use "reasonable approximations" rather than precise California state tax calculations, federal tax brackets, and FICA treatment
3. **Employer benefit variations**: They cannot handle varying 401(k) match policies across career changes (BigLaw associates get no match, while clerking and public interest positions typically offer 4% matches)

### What Makes This Calculator Unique

This calculator was purpose-built to handle:
- **Cravath salary scale progression** (lockstep associate advancement without annual raises)
- **Clerking credit** (modeling how firms give partial class year credit for federal clerkships)
- **Separate portfolio tracking** (tax-advantaged vs. taxable accounts with different return rates)
- **California Prop 13** property tax caps (2% annual growth limit on primary and rental properties)
- **Per-daughter 529 account tracking** with forward-looking college reserve calculations
- **Rental property cash flow** with proper mortgage interest deduction and post-payoff income boost
- **Monte Carlo simulation** with both accumulation AND withdrawal phases (not just accumulation)

---

## Key Features

### 1. Non-Standard Career Path Modeling

**The Challenge:** Legal careers don't follow predictable patterns. The Cravath lockstep scale means no annual cost-of-living raises—compensation only increases when you advance to the next associate class year. Federal clerkships interrupt BigLaw careers, and firms give varying amounts of class year credit upon return.

**How It Works:**
- **2025**: Law school income ($40,000 default)
- **2028**: Start BigLaw as 1st year associate ($225,000 - Cravath scale)
- **2029-2030**: Federal clerking ($100,000, with 4% employer match)
- **2031**: Return to BigLaw as 3rd year associate ($260,000 - received 1 year of credit)
- **2031-2035**: Advance through associate years following Cravath lockstep scale
- **2036+**: Transition to public interest law ($80,000 + 3% annual raises, with 4% employer match)

The calculator uses the actual 2025 Cravath scale:
```
1st year: $225,000
2nd year: $235,000
3rd year: $260,000
4th year: $305,000
5th year: $340,000
6th year: $365,000
7th year: $410,000
8th year: $420,000
```

**Why This Matters:** Institutional calculators would incorrectly assume your $225k BigLaw salary grows to $232k, then $239k, etc. In reality, you stay at $225k for your entire first year, then jump to $235k as a second-year associate. The calculator models this correctly, including the career interruption for clerking.

### 2. Dual Portfolio Tracking (Tax-Advantaged vs. Taxable)

**The Challenge:** Different account types have different tax treatments and therefore different effective returns. A taxable brokerage account pays dividend taxes annually, reducing effective returns, while tax-advantaged accounts (401k, IRA) compound without tax drag.

**How It Works:**
- **Tax-advantaged accounts** (401k + IRA): 7% nominal return
  - No annual tax drag from dividends
  - Contributions max out 401(k) + Roth IRA limits for both spouses
  - Includes employer matches (where applicable)
  
- **Taxable brokerage**: 6% nominal return
  - 1% lower to account for dividend taxation
  - Receives overflow contributions when retirement accounts are maxed out
  - Provides flexibility for pre-59½ access without penalties

**Portfolio Allocation Logic:**
```
IF (annual savings > 0):
    1. Max out tax-advantaged accounts first:
       - Both 401(k)s: $23,500 × 2 = $47,000 (2025, inflates over time)
       - Both Roth IRAs: $7,000 × 2 = $14,000 (2025, inflates over time)
       - Add employer matches
    2. Put overflow into taxable accounts

ELSE IF (annual savings < 0):
    1. Withdraw from taxable accounts first (more flexible, no penalties)
    2. If taxable depleted, flag deficit (don't model early 401k withdrawal penalties)
```

**Why This Matters:** This dynamic allocation creates a natural tax optimization strategy—maxing tax-advantaged space during high-earning BigLaw years, then drawing from taxable accounts first when needed, preserving the tax-advantaged growth for true retirement.

### 3. California-Specific Tax Calculations

**The Challenge:** California has some of the highest state income taxes in the nation (up to 13.3%), and Prop 13 creates unique property tax dynamics. Rental property income requires careful tax treatment of mortgage interest deductions.

**How It Works:**
- **Federal taxes**: Progressive brackets (10% → 12% → 22% → 24% → 32% → 35% → 37%)
- **California state taxes**: Progressive brackets (1% → 2% → 4% → 6% → 8% → 9.3% → 10.3% → 11.3% → 12.3%)
- **FICA**: Social Security (6.2% up to wage base ~$168k in 2025, inflates at 4% annually) + Medicare (1.45% on all wages + 0.9% Additional Medicare Tax over $250k MFJ)
- **Above-the-line deductions**: HSA ($8,550 in 2025) + Dependent Care FSA ($7,500)
- **Standard vs. Itemized**: Calculator uses whichever is greater
- **Rental mortgage interest**: Automatically included in itemized deductions
- **Bracket inflation**: All brackets and deduction limits inflate at general inflation rate (3% default)

**Prop 13 Property Tax Treatment:**
```
Primary Residence:
- $20,000 annual property tax (2025)
- Grows at 2% per year (Prop 13 cap)
- By 2065: $43,822

Rental Property:
- $8,000 annual property tax (2025)
- Also grows at 2% per year (Prop 13 cap)
- Much slower growth than market-rate appreciation
```

**Why This Matters:** California's Prop 13 creates enormous long-term value for property owners. While market values might double every 10-15 years, your property taxes only increase 2% annually. This makes long-term California property ownership far more valuable than simple calculations suggest.

### 4. College Savings (529 Accounts)

**The Challenge:** College costs inflate faster than general inflation (~3.5% vs. 3%), and each daughter has different age-based needs. The calculator must optimize contributions to fully fund college while minimizing overfunding (529 withdrawals for non-education purposes face penalties).

**How It Works:**

**Per-Daughter Account Tracking:**
```
Daughter 1 (born 2021):
- College years: 2039-2042 (ages 18-21)
- Receives contributions: 2028-2042
- Account stops growing: 2043 (when she turns 22)

Daughter 2 (born 2025):
- College years: 2043-2046 (ages 18-21)
- Receives contributions: 2028-2046
- Account stops growing: 2047 (when she turns 22)
```

**Contribution Strategy:**
- Annual contribution is **per daughter** (default: $9,000 each = $18,000 total)
- Contributions start in 2028 (after law school tuition ends)
- Each account only receives contributions while that daughter is under 22
- Contributions capped at 50% of positive annual savings (retirement takes priority)
- Accounts grow at 7% (same as tax-advantaged accounts—529s are tax-advantaged)

**College Cost Calculation:**
```
Base cost: $40,000/year (2025 dollars)
College inflation: 3.5% annually
Daughter 1's college (2039-2042): ~$273k total
Daughter 2's college (2043-2046): ~$312k total
```

**Shortfall Handling:**
If 529 balance < annual college cost, the shortfall is paid from the main portfolio (taxable account first). The calculator warns if final 529 balance > $0 (suggesting over-contribution).

**Why This Matters:** The calculator's forward-looking college reserve calculation is sophisticated. When determining your FIRE target in, say, 2042, it projects: "How much will Daughter 2's remaining college cost? Will her 529 cover it? If not, I need to reserve that shortfall in the main portfolio." This ensures you don't achieve "FIRE" on paper only to discover you lack funds for remaining college costs.

### 5. Rental Property Cash Flow & Taxation

**The Challenge:** Rental property creates both cash flow and taxable income, but these are different numbers. For cash flow, you care about mortgage P&I payments. For taxes, you only deduct mortgage *interest* (not principal). Post-mortgage payoff, cash flow increases dramatically.

**How It Works:**

**Monthly Rental Income:** $5,800 (inflates at 3% annually)

**Expenses:**
```
Property Tax: $8,000/year (grows at 2% - Prop 13)
Insurance: $3,323/year (inflates at 3%)
Maintenance/CapEx: $11,000/year (inflates at 3%)
Vacancy: 5% of gross rental income
Mortgage P&I: $1,633/month until 2050
```

**Two Separate Calculations:**

1. **Cash Flow (what actually hits your bank account):**
   ```
   BEFORE mortgage payoff (2025-2049):
   = (Rental Income × 12) - (P&I × 12) - Property Tax - Insurance - Maintenance - Vacancy

   AFTER mortgage payoff (2050+):
   = (Rental Income × 12) - Property Tax - Insurance - Maintenance - Vacancy
   
   [Note: Cash flow jumps by ~$20k/year in 2050 when mortgage ends]
   ```

2. **Taxable Income (what you report to IRS):**
   ```
   = (Rental Income × 12) - Property Tax - Insurance - Mortgage INTEREST - Maintenance - Vacancy
   
   [Only interest is deductible, not principal payment]
   ```

**Mortgage Interest Calculation:**
The calculator uses a closed-form amortization formula rather than month-by-month iteration:
```javascript
remainingBalance = monthlyPayment × [(1 - (1+r)^-n) / r]

Then calculate interest for 12 months:
for each month:
    interest = balance × monthlyRate
    principal = monthlyPayment - interest
    balance -= principal
```

**Why This Matters:** 
1. The rental provides steady income throughout retirement (unlike W-2 wages that stop)
2. In 2050, your cash flow gets a ~$20k boost when the mortgage is paid off
3. Proper interest deduction reduces your tax burden significantly during high-earning years
4. Monte Carlo withdrawal phase correctly accounts for rental income continuing indefinitely

### 6. Social Security Integration

**The Challenge:** Social Security provides crucial income in later retirement, but timing is highly individual (claiming at 62 vs. 67 vs. 70 creates vastly different benefit amounts). Benefits are also partially taxable and receive COLA adjustments.

**How It Works:**
```
You:
- Annual benefit: $35,000 (in 2055 dollars)
- Start year: 2055 (when you're 68)
- Inflates at general inflation rate (models COLA)

Spouse:
- Annual benefit: $40,000 (in 2057 dollars)
- Start year: 2057 (when spouse is 68)
- Inflates at general inflation rate (models COLA)
```

**Tax Treatment:**
Social Security is included in gross income for tax purposes. (Note: The calculator uses a simplified approach including 100% of benefits rather than the actual 85% inclusion ratio that applies above certain thresholds.)

**Why This Matters:** Social Security can provide $75,000-$100,000+ in annual inflation-adjusted income during your 60s-80s. This dramatically reduces the withdrawal rate needed from your portfolio. The calculator accounts for this in both the deterministic projection and the Monte Carlo withdrawal phase.

### 7. Healthcare Buffer (Optional)

**The Challenge:** Healthcare costs before Medicare eligibility (age 65) can be substantial for early retirees—often $12,000-$18,000 annually for a family. This creates a temporary expense spike that needs separate planning.

**How It Works:**
```
If enabled:
- Annual healthcare cost: $12,000 (inflates at general inflation rate)
- Applied from FIRE year until age 65
- Reserve = annual_cost × years_until_medicare
- Added to FIRE target calculation
```

**Example:**
```
If you achieve FIRE at age 45:
Years until Medicare: 65 - 45 = 20 years
Healthcare buffer: $12,000 × 20 = $240,000 (plus inflation adjustment)
```

**Why This Matters:** Many FIRE calculators ignore the pre-Medicare healthcare gap. By including this optional buffer, you avoid the unpleasant surprise of achieving FIRE only to discover healthcare eats an additional $15,000/year beyond your planned budget.

### 8. Monte Carlo Simulation with Two-Phase Modeling

**The Challenge:** Market returns are volatile. A single deterministic projection (assuming 7% every year) is unrealistic. Professional tools use Monte Carlo simulation, but most only model accumulation OR withdrawal—not both sequentially.

**How It Works:**

**Phase 1 - Accumulation (Still Working):**
```
FOR each simulation:
    FOR each year until retirement:
        - Use deterministic cash flows (your actual income/expenses from base case)
        - Apply random returns: N(mean=7%, stddev=15%) for tax-adv
                               N(mean=6%, stddev=15%) for taxable
        - Add contributions, subtract withdrawals
        - Check if portfolio ≥ FIRE target
        - If YES, switch to Phase 2
```

**Phase 2 - Withdrawal (Retired):**
```
    FOR remaining years until 2065:
        - Stop W-2 income (but keep rental + Social Security)
        - Calculate withdrawal needed: expenses - rental - SS
        - Apply random returns to portfolio
        - Withdraw from taxable first, then tax-advantaged
        - Track if portfolio depletes (falls below $1,000)
```

**Random Number Generation:**
Uses Box-Muller transform to generate normally distributed returns:
```javascript
u1 = random(), u2 = random()
z = sqrt(-2 × ln(u1)) × cos(2π × u2)
return = mean + (z × stddev)
```

**Output Metrics:**
- **FIRE Success Rate**: % of simulations that achieve FIRE target
- **Portfolio Survival Rate**: % that never deplete after retirement
- **Median FIRE Year**: 50th percentile of achievement years
- **FIRE Age Range**: 10th-90th percentile span
- **Final Portfolio Distribution**: 10th/50th/90th percentiles at age 78

**Visualization:**
The chart shows percentile bands (P10, P25, P50, P75, P90) over time, with the base case overlaid for comparison. This reveals:
- How much uncertainty exists in each year
- Whether your base case is optimistic, pessimistic, or realistic
- The probability of portfolio survival through 2065

**Why This Matters:** Real retirement planning requires understanding uncertainty. A single projection showing "FIRE in 2047" is dangerously misleading if market volatility means you could achieve it anywhere from 2042-2052. Monte Carlo simulation reveals this range, helping you make informed decisions about when it's truly safe to retire.

---

## Design Decisions & Rationale

### Why These Specific Numbers?

**3.5% withdrawal rate instead of 4%:**
The traditional "4% rule" was based on 30-year retirements. For 40+ year horizons (retiring at 45 and living to 95), research suggests 3.5% is more conservative and appropriate.

**7% tax-advantaged return vs. 6% taxable:**
The 1% difference represents dividend taxation drag. Taxable accounts pay taxes on dividends annually, reducing compound growth. This is a simplified but reasonable approximation.

**$135,000 FIRE spending target:**
Based on detailed expense analysis from earlier conversations:
- Monthly expenses: $10,000 (inflates at 3%)
- Property tax: $20,000 (grows at 2% - Prop 13)
- Additional buffer for increased travel/healthcare in retirement
- Total: ~$135,000/year in today's dollars

**$9,000 per daughter 529 contributions:**
Calculated to exactly fund college costs with minimal overfunding:
- Daughter 1 needs ~$273k over 2039-2042
- Daughter 2 needs ~$312k over 2043-2046
- $9,000/year per daughter, growing at 7%, funds these costs with ~$0 left over

**No BigLaw 401(k) match for associates:**
This reflects confirmed policy at major law firms—associates typically don't receive 401(k) matches, though partners do. Government employers (clerking) and nonprofits (public interest) typically offer 4% matches.

### Why Inflation Variations?

The calculator uses different inflation rates for different categories:

| Category | Rate | Rationale |
|----------|------|-----------|
| General expenses | 3.0% | Historical long-term average |
| Property tax (Prop 13) | 2.0% | California law caps increases |
| College costs | 3.5% | Education inflation historically exceeds general inflation |
| Tax brackets | 3.0% | Simplified; IRS uses prior-year CPI |
| Social Security wage base | 4.0% | Historical wage growth average |
| Cravath scale | 0.0% | Lockstep scale is set during your first year and doesn't adjust |

### Why No Cravath Scale Inflation?

BigLaw compensation works differently than most careers. The Cravath scale represents the market-clearing price for associate labor in a given year. When you start as a first-year in 2028, your class's scale is set (e.g., $225k for first-years that year). As you advance through associate years, you follow that scale's progression ($225k → $235k → $260k...), but the scale itself doesn't get annual cost-of-living adjustments.

In reality, Cravath periodically announces new scales (every few years), which applies to NEW incoming first-years. But once you're in the system, you follow your class's scale. Since this would require predicting Cravath's future announcements, the calculator uses the 2025 scale throughout—a simplification that errs on the conservative side.

### Why Stop 529 Growth at Age 22?

529 funds withdrawn for non-qualified education expenses face income tax + 10% penalty on earnings. Once a daughter turns 22 and finishes college, leftover 529 funds become:
1. Penalty-laden for non-education use
2. Only useful if transferred to another beneficiary
3. Effectively "frozen" in the context of this model

Rather than model complex scenarios (Will you have grandchildren? Will you go back to school?), the calculator freezes the accounts—no growth, no contributions, no withdrawals. This conservative approach prevents overfunding while flagging any significant leftover balances.

---

## Unique Quirks & Edge Cases

### The "College Reserve Paradox"

**The Quirk:** You might have $5M in your portfolio but not achieve FIRE because your daughter is about to start college.

**Why It Happens:** The FIRE target includes a forward-looking college reserve. If Daughter 2 is 17, the calculator projects her college costs (ages 18-21), compares against her projected 529 balance, and adds any shortfall to your FIRE target.

**Example:**
```
2042: You have $5M portfolio
FIRE target calculation:
- Base: $135k ÷ 3.5% = $3.86M (inflated)
- College reserve: Daughter 2's 2043-2046 costs = ~$1.8M
- Total FIRE target: $5.66M
Result: Not FIRE yet

2047: You have $7.5M portfolio
FIRE target calculation:
- Base: $135k ÷ 3.5% = $3.86M (inflated)
- College reserve: $0 (Daughter 2 finished college)
- Total FIRE target: $3.86M (inflated)
Result: FIRE achieved!
```

**Why This Is Smart Design:** It prevents the false sense of security from "FIRE-ing" right before major expenses. Better to know you need to work 3 more years than to retire, watch your portfolio drain for college, and have to return to work.

### The 50% 529 Contribution Cap

**The Quirk:** Even if you want to contribute more to 529s, the calculator caps contributions at 50% of positive annual savings.

**Why It Exists:** This enforces "retirement savings > college savings" priority. If you over-prioritize 529s during lean years, you might fully fund college but fall short on retirement. The 50% cap prevents this while still allowing substantial college contributions during high-earning years.

**Example:**
```
2029: You're clerking, tight budget, $30k positive savings
- Could technically contribute $18k to 529s
- But that leaves only $12k for retirement accounts
- Cap enforces: Max $15k to 529s, ensuring $15k for retirement

2033: You're 6th year BigLaw, $200k positive savings
- Could contribute $18k to 529s (per-daughter max)
- Cap allows it: $18k is only 9% of savings
- Retirement accounts get the remaining $182k
```

### The Deficit Flag (⚠)

**The Quirk:** Some years might show a ⚠ symbol indicating a deficit.

**What It Means:** Your expenses exceeded income by more than your taxable account balance. In reality, you'd either:
1. Tap tax-advantaged accounts early (with 10% penalty)
2. Go into debt
3. Adjust lifestyle expenses

**Why The Calculator Doesn't Model This:** Early 401(k) withdrawals have complex penalty structures and tax consequences. Rather than oversimplify this, the calculator flags the problem and assumes you'd find a solution (part-time work, cut expenses, etc.).

**When This Happens:** Usually only during law school years with tuition payments. Once you start earning, deficits should disappear.

### Monte Carlo "Survival Rate" vs. "Success Rate"

**The Quirk:** You can have a 100% Success Rate but only 85% Survival Rate.

**What It Means:**
- **Success Rate**: % of simulations that achieve FIRE target (reach the portfolio number needed to retire)
- **Survival Rate**: % that never deplete after retirement (of those that retired)

**Example:**
```
1000 simulations:
- 1000 achieve FIRE (100% success)
- Of those 1000:
  - 850 never deplete through 2065 (85% survival)
  - 150 deplete at some point (15% failure)
```

**Why Both Matter:**
- Success Rate: "Can I reach FIRE given my career trajectory?"
- Survival Rate: "Will my portfolio last once I stop working?"

Both need to be high (>90%) for a truly safe plan.

### Why Rental Income Continues Forever

**The Quirk:** Even in retirement, even in Monte Carlo simulations, rental income never stops.

**Why:** The calculator assumes you retain the rental property for life (or at least through 2065). This is conservative—you might eventually sell, which would create a large capital gain and change your financial picture. But modeling rental income continuing:
1. Is more conservative (doesn't assume a windfall from sale)
2. Provides steady income during retirement
3. Gets a boost in 2050 when the mortgage is paid off

If you plan to sell the rental property, adjust your FIRE spending target downward to account for the future sale proceeds.

---

## Usage Guidelines

### Baseline Scenario (Default Values)

The calculator comes pre-loaded with realistic values for a Los Angeles-based legal career:

| Setting | Default | Notes |
|---------|---------|-------|
| Initial portfolio | $500,000 | Starting point in 2025 |
| Initial taxable % | 60% | $300k taxable, $200k tax-advantaged |
| Monthly expenses | $10,000 | Inflates at 3%/year |
| Primary property tax | $20,000 | Grows at 2%/year (Prop 13) |
| FIRE spending target | $135,000 | Annual retirement expenses |
| Withdrawal rate | 3.5% | Conservative for 40+ year horizon |
| Law school tuition | $30,000/semester | 2026-2027 only |
| Spouse income | $200,000 | Grows at 3%/year |
| Rental income | $5,800/month | Grows at 3%/year |
| 529 contributions | $9,000/daughter/year | Optimized for zero leftover |
| College costs | $40,000/year | Inflates at 3.5%/year |

### Adjusting for Your Situation

**If your career path differs:**
- Adjust BigLaw start year, clerking dates, and public interest transition year
- Change the "return as associate year" dropdown if your firm gives different credit
- Modify Cravath scale salaries if you're at a different market rate firm

**If your expenses differ:**
- Start with monthly expenses: housing, food, transportation, etc.
- Add property tax separately (it grows differently under Prop 13)
- Set FIRE spending target to your desired retirement lifestyle
- Consider enabling healthcare buffer if you plan to retire before 65

**If you don't have a rental property:**
- Set rental income to $0
- Set all rental expenses to $0
- This removes rental cash flow from projections

**If your daughters' ages differ:**
- Update birth years to match your actual children
- Adjust 529 initial balance to current saved amount
- Fine-tune annual contribution to avoid overfunding warning

**If you want to model Social Security:**
- Update start years based on your planned claiming age
- Adjust benefit amounts based on your SSA.gov estimates
- Remember benefits inflate with COLA (modeled as general inflation)

### Interpreting the Results

**The Green Banner:**
```
🎉 FIRE Achieved in 2047!
You'll be 60 and your spouse will be 62 (22 years from now)
```
This means your portfolio reaches the FIRE target (including college reserves and healthcare buffer if enabled) in 2047.

**The Warning Triangle (⚠):**
Indicates a year with negative savings exceeding your taxable account balance. Review that year's income/expenses to understand the shortfall.

**The 529 Overfunding Warning:**
```
⚠️ 529 accounts may be overfunded. Final balance: $64,565
```
Reduce your annual 529 contribution to avoid leftover funds that face penalties for non-education use.

**Monte Carlo Results:**
```
FIRE Success Rate: 95.2%
Portfolio Survival: 88.7%
Median FIRE Year: 2047
FIRE Age Range: 58-62 (10th-90th percentile)
```
- **95.2% success**: In 952 of 1000 simulations, you reach your FIRE target
- **88.7% survival**: Of those that retired, 887 portfolios lasted through 2065
- **Age 58-62 range**: 80% of simulations achieve FIRE between these ages

**What's a "Good" Result?**
- FIRE Success Rate > 90%: High confidence you'll reach the target
- Survival Rate > 90%: High confidence portfolio lasts through retirement
- Both > 90%: Safe to plan around your FIRE timeline
- Either < 85%: Consider working longer, reducing spending, or increasing savings rate

### Common Adjustments After First Run

**If FIRE year is too far away:**
1. Reduce FIRE spending target (live on less in retirement)
2. Increase 401(k)/IRA contributions during high-earning years
3. Extend BigLaw career (delay public interest transition)
4. Increase spouse income growth rate
5. Add additional income sources

**If 529 warning appears:**
1. Reduce annual 529 contribution by $500-$1000
2. Re-run to verify overfunding warning disappears
3. Small shortfalls ($20-50k total) are fine—paid from main portfolio

**If Monte Carlo shows low survival rate:**
1. Reduce withdrawal rate from 3.5% to 3.25% or 3.0%
2. Increase FIRE target (build larger cushion)
3. Enable healthcare buffer if currently disabled
4. Verify Social Security estimates are realistic

**If deficit warnings appear:**
1. Check if they're only during law school (expected with tuition)
2. Verify rental property cash flow is positive
3. Consider reducing expenses during lean years
4. Ensure spouse income is accurate

---

## Technical Implementation Notes

### Performance Considerations

**useMemo Dependency Array:**
The main projection calculation uses React's useMemo with a comprehensive dependency array (~40 variables). Any input change triggers recalculation. For large Monte Carlo simulations (5000+ iterations), this can take 5-10 seconds.

**Monte Carlo Optimization:**
The simulation wraps calculations in setTimeout(..., 100) to avoid blocking the UI thread. A "Running..." state provides feedback during calculation.

**Chart Rendering:**
Recharts handles 40 years × 5 percentiles (200 data points) efficiently. The area chart visualization makes percentile bands intuitive.

### Data Flow

```
User Input (useState)
    ↓
Main Projection (useMemo)
    ↓
Year-by-year calculation (2025-2065)
    ├→ Income calculation (career phase logic)
    ├→ Tax calculation (federal + CA + FICA)
    ├→ Expense calculation (living + tuition + property tax)
    ├→ 529 handling (contributions + college costs)
    ├→ Portfolio allocation (tax-adv vs taxable)
    ├→ Investment returns
    ├→ FIRE target check
    ↓
Chart Data (derived from projection)
    ↓
Visualization (Recharts)
```

### Extending the Calculator

**To add a new income source:**
1. Add state variable for the income amount and start year
2. Update income calculation section in the projection loop
3. Include in `totalIncome` calculation
4. Update tax calculation if needed (e.g., if source has special tax treatment)

**To add a new expense category:**
1. Add state variable for the expense amount
2. Decide inflation treatment (general, Prop 13, education, or none)
3. Add to expense calculation section
4. Include in `totalExpenses` calculation

**To modify FIRE target formula:**
Locate the "CALCULATE FIRE TARGET" section in the projection loop. The current formula is:
```javascript
fireTarget = (fireExpenseTarget × inflationFactor × targetPortfolioMultiple)
           + collegeReserveNeeded
           + healthcareBuffer
```
Add your component to this calculation.

**To add asset tracking (e.g., home equity):**
1. Add state for initial value and appreciation rate
2. Calculate value each year with appreciation
3. Display in the year-by-year table
4. Decide if it should count toward FIRE target (generally not, unless you plan to sell)

---

## Limitations & Future Enhancements

### Current Limitations

1. **No capital gains tax on taxable withdrawals**: The calculator withdraws from taxable accounts without modeling capital gains tax. This makes results slightly optimistic. A future version could track cost basis and calculate LTCG tax on withdrawals.

2. **Simplified Social Security taxation**: Uses 100% inclusion rather than the actual 85% maximum inclusion ratio. Makes results slightly pessimistic on taxes.

3. **No Roth conversion ladder modeling**: Many FIRE folks convert traditional IRA → Roth IRA to access funds before 59½ without penalties. This advanced strategy isn't modeled.

4. **No RMD (Required Minimum Distribution) calculations**: After age 73, you must withdraw from tax-advantaged accounts. This isn't enforced in the calculator.

5. **No estate planning / legacy considerations**: The calculator stops at 2065 (age 78). Doesn't model legacy goals or extended longevity scenarios.

6. **Single 40-year projection period**: Can't easily model "what if I work 3 more years?" without manually changing dates. A scenario comparison feature would be valuable.

### Potential Enhancements

**Phase 1 (Highest Value):**
- Capital gains tax on taxable withdrawals
- Scenario comparison (side-by-side projections with different assumptions)
- Roth conversion ladder optimization

**Phase 2 (Advanced Features):**
- RMD calculations and forced withdrawals
- Health Savings Account (HSA) as a stealth retirement account
- Detailed expense breakdown visualization
- Inflation-adjusted dollars toggle (switch between nominal and real dollars)

**Phase 3 (Long-term Improvements):**
- Historical market data backtesting (instead of random returns)
- Correlation between asset classes (stocks don't move independently)
- Tax-gain harvesting strategy modeling
- Geographic arbitrage scenarios (moving to lower-cost locations)

---

## FAQ

**Q: Should I use the deterministic projection or Monte Carlo results for planning?**

A: Both. The deterministic projection (base case) shows your most likely path assuming average returns. Monte Carlo shows the range of possibilities given market volatility. Use Monte Carlo to understand risk—if your survival rate is below 90%, you need a bigger cushion. Plan around the median Monte Carlo result, not the base case.

**Q: Why doesn't BigLaw salary grow every year like my spouse's salary?**

A: BigLaw compensation follows the Cravath lockstep scale, which only increases when you advance to the next associate class year. There are no annual cost-of-living raises. Your spouse likely has a traditional job with merit-based or inflation-based annual increases.

**Q: The 529 warning says I'm overfunded by $64k. Is this a problem?**

A: Yes, reduce your annual 529 contribution. Leftover 529 funds face income tax + 10% penalty on earnings if withdrawn for non-education purposes. Better to contribute less and pay any small shortfall from your main portfolio (no penalties).

**Q: Should I enable the healthcare buffer?**

A: If you plan to retire before age 65 (Medicare eligibility), yes. Healthcare costs for early retirees typically run $12,000-$18,000 annually for a family. The buffer ensures you have this explicitly reserved rather than drawing more heavily from your portfolio than planned.

**Q: My Monte Carlo success rate is 95% but survival rate is only 82%. What should I do?**

A: This means you'll likely reach FIRE, but there's an 18% chance your portfolio depletes during retirement. Either: (1) reduce your withdrawal rate from 3.5% to 3.0%, (2) increase your FIRE spending target (builds a bigger cushion), or (3) plan for part-time work in early retirement.

**Q: Can I model my spouse doing a similar career change?**

A: The calculator currently assumes spouse has steady income growth. To model a career change, you'd need to modify the spouse income calculation section to include phase logic similar to "my income." This would require editing the source code.

**Q: Why does rental cash flow jump so much in 2050?**

A: Your rental mortgage is paid off in 2050. Before: Cash flow = rent - P&I - taxes - insurance - maintenance. After: Cash flow = rent - taxes - insurance - maintenance. Eliminating the ~$1,633/month mortgage payment ($19,596/year) creates a significant boost.

**Q: How often should I update the calculator with actual results?**

A: Annually at minimum. Update: actual portfolio balance, actual income earned, actual expenses, actual 529 balances, and any major life changes (career decisions, additional children, etc.). This keeps the projection grounded in reality rather than becoming purely theoretical.

---

## Credits & Acknowledgments

This calculator was built through an iterative conversation-based development process, starting from institutional calculator research and culminating in a purpose-built tool for non-standard career paths.

**Key Research Inputs:**
- Professional FIRE calculators: Fidelity RPS, Pralana Gold, FIRECalc
- California Franchise Tax Board data (state brackets)
- IRS Publication 17 (federal taxes and deductions)
- Cravath salary scale (2025)
- SSA.gov life tables and benefit calculators
- Prop 13 documentation (California Legislative Analyst's Office)
- Trinity Study and subsequent safe withdrawal rate research

**Development Methodology:**
The calculator was built through a detailed requirement gathering process, including:
1. Comparative analysis of institutional calculators to identify gaps
2. Detailed career trajectory documentation
3. California-specific tax research
4. Iterative refinement through code auditing and bug fixing
5. Monte Carlo enhancement for uncertainty modeling

---

## License & Disclaimer

This calculator is provided as-is for personal financial planning purposes. It is not professional financial advice. The projections are based on assumptions that may not reflect actual future results.

**Important Notes:**
- Past market performance doesn't guarantee future results
- Tax laws change; current tax brackets may not reflect future law
- Career trajectories rarely follow exact plans
- Unexpected expenses (medical, family, etc.) can materially alter outcomes
- Consider consulting a certified financial planner for personalized advice

**No Warranty:**
This software is provided "as is" without warranty of any kind, express or implied. The author assumes no liability for financial decisions made based on calculator outputs.
