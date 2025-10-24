import { calculateEmployerMatch } from './contributions'
import { getCravathSalary } from './career'
import { calculateMortgageInterest } from './mortgage'
import { calculateTaxes } from './taxes'
import { CalculatorInputs, ProjectionResult, ProjectionYear } from './types'
import { add, clampMin, dec, percentage, toNumber } from './money'

// The projection engine is the deterministic backbone for both planner stages.
// Given a set of user inputs it walks year-by-year, modelling income, savings,
// investment growth, taxes, college spending, rental property flows, and FIRE
// thresholds. Outputs are consumed both by the deterministic UI and by the Monte
// Carlo engine (which replays the same timeline with stochastic returns).
export function buildProjections(inputs: CalculatorInputs): ProjectionResult {
  const {
    currentYear,
    initialSavings,
    initialTaxablePct,
    monthlyExpenses,
    propertyTax,
    propertyTaxGrowth,
    rentalIncome,
    rentalMortgagePandI,
    mortgageEndYear,
    rentalPropertyTax,
    rentalPropertyTaxGrowth,
    rentalInsurance,
    rentalMaintenanceCapex,
    rentalVacancyRate,
    inflationRate,
    fireExpenseTarget,
    targetPortfolioMultiple,
    includeHealthcareBuffer,
    annualHealthcareCost,
    taxAdvReturnRate,
    taxableReturnRate,
    spouseIncome2025,
    spouseIncomeGrowth,
    myIncome2025,
    bigLawStartYear,
    clerkingStartYear,
    clerkingEndYear,
    clerkingSalary,
    returnToFirmYear,
    publicInterestYear,
    publicInterestSalary,
    publicInterestGrowth,
    tuitionPerSemester,
    daughter1Birth,
    daughter2Birth,
    initial529Balance,
    annual529Contribution,
    collegeCostPerYear,
    collegeInflation,
    standardDeduction,
    itemizedDeductions,
    rentalMortgageStartYear,
    rentalMortgageOriginalPrincipal,
    rentalMortgageRate,
    mySocialSecurityAmount,
    mySocialSecurityStartAge,
    spouseSocialSecurityAmount,
    spouseSocialSecurityStartAge,
    spendingDecrement65to74,
    spendingDecrement75to84,
    spendingDecrement85plus,
    ssWageBase2025,
    ssWageBaseGrowth,
  } = inputs;

  const years: ProjectionYear[] = [];

  // Split the initial portfolio into tax-advantaged vs. taxable components so we
  // can track different return rates and withdrawal rules downstream.
  let taxAdvPortfolio = dec(initialSavings)
    .mul(dec(100).sub(initialTaxablePct))
    .div(100)
  let taxablePortfolio = dec(initialSavings).mul(initialTaxablePct).div(100)
  // 529 accounts are tracked per child to make over-funding warnings simpler.
  let daughter1_529 = initial529Balance / 2;
  let daughter2_529 = initial529Balance / 2;
  let fireAchieved = false;
  let fireYear: number | null = null;
  let overfundingWarning: string | null = null;

  // Retirement account limits are anchored to 2025 and inflated later; we keep the
  // base constants here for clarity.
  const k401Limit2025 = 23500;
  const rothLimit2025 = 7000;

  // We project 63 years (current year + 62) which comfortably covers accumulation,
  // retirement, and longevity tail scenarios.
  for (let year = currentYear; year <= currentYear + 62; year++) {
    const yearsFromNow = year - currentYear;
    const inflationFactor = Math.pow(1 + inflationRate / 100, yearsFromNow);

    const daughterAge1 = year - daughter1Birth;
    const daughterAge2 = year - daughter2Birth;

    let myIncome = 0;
    // Income is determined by the user’s career stage. The order matters: BigLaw,
    // clerking, return-to-firm credit, and eventually public interest.
    if (year < bigLawStartYear) {
      myIncome = myIncome2025;
    } else if (year >= bigLawStartYear && year < clerkingStartYear) {
      const yearsAtBigLaw = year - bigLawStartYear + 1;
      myIncome = getCravathSalary(yearsAtBigLaw);
    } else if (year >= clerkingStartYear && year < clerkingEndYear) {
      const clerkingYears = year - clerkingStartYear;
      myIncome = clerkingSalary * Math.pow(1 + inflationRate / 100, clerkingYears);
    } else if (year >= clerkingEndYear && year < publicInterestYear) {
      const yearsBack = year - clerkingEndYear;
      const associateYear = returnToFirmYear + yearsBack;
      myIncome = getCravathSalary(associateYear);
    } else {
      const piYears = year - publicInterestYear;
      myIncome = publicInterestSalary * Math.pow(1 + publicInterestGrowth / 100, piYears);
    }

    // Spouse income is simpler—steady growth from the base year.
    const spouseIncome =
      spouseIncome2025 * Math.pow(1 + spouseIncomeGrowth / 100, yearsFromNow);

    const mySocialSecurityStartYear = 1987 + mySocialSecurityStartAge;
    const spouseSocialSecurityStartYear = 1989 + spouseSocialSecurityStartAge;

    let mySocialSecurity = 0;
    let spouseSocialSecurity = 0;

    if (year >= mySocialSecurityStartYear) {
      const ssYears = year - mySocialSecurityStartYear;
      mySocialSecurity =
        mySocialSecurityAmount * Math.pow(1 + inflationRate / 100, ssYears);
    }

    if (year >= spouseSocialSecurityStartYear) {
      const ssYears = year - spouseSocialSecurityStartYear;
      spouseSocialSecurity =
        spouseSocialSecurityAmount * Math.pow(1 + inflationRate / 100, ssYears);
    }

    // Social Security is treated as another income stream when it turns on.
    const socialSecurityIncome = mySocialSecurity + spouseSocialSecurity;
    const totalIncome = myIncome + spouseIncome + socialSecurityIncome;

    // Rental property cash flow is projected separately to respect Prop 13 caps
    // and maintenance/inflation dynamics.
    const adjustedRentalIncome = rentalIncome * inflationFactor;
    const adjustedRentalPropertyTax =
      rentalPropertyTax * Math.pow(1 + rentalPropertyTaxGrowth / 100, yearsFromNow);
    const adjustedRentalInsurance = rentalInsurance * inflationFactor;
    const adjustedMaintenance = rentalMaintenanceCapex * inflationFactor;
    const vacancyLoss = adjustedRentalIncome * 12 * (rentalVacancyRate / 100);

    const mortgageInterest = calculateMortgageInterest(year, {
      mortgageEndYear,
      rentalMortgageStartYear,
      rentalMortgageOriginalPrincipal,
      rentalMortgageRate,
    });

    const rentalNetForTaxes =
      adjustedRentalIncome * 12 -
      adjustedRentalPropertyTax -
      adjustedRentalInsurance -
      mortgageInterest -
      adjustedMaintenance -
      vacancyLoss;

    // Cash flow view subtracts the full P&I payment while the mortgage is active.
    const rentalNetCashFlow =
      year < mortgageEndYear
        ? adjustedRentalIncome * 12 -
          rentalMortgagePandI * 12 -
          adjustedRentalPropertyTax -
          adjustedRentalInsurance -
          adjustedMaintenance -
          vacancyLoss
        : adjustedRentalIncome * 12 -
          adjustedRentalPropertyTax -
          adjustedRentalInsurance -
          adjustedMaintenance -
          vacancyLoss;

    // Law school tuition is modelled explicitly for 2026/2027; these payments are
    // treated as expenses before savings are determined.
    let tuition = 0;
    if (year === 2026) {
      tuition = tuitionPerSemester * 2;
    } else if (year === 2027) {
      tuition = tuitionPerSemester;
    }

    // Taxes depend on the year-specific income mix plus inflation-adjusted
    // thresholds. We delegate to the tax module to keep this file manageable.
    const taxes = calculateTaxes({
      year,
      myIncome,
      spouseIncome,
      rentalNetForTaxes,
      socialSecurityIncome,
      inputs: {
        currentYear,
        inflationRate,
        standardDeduction,
        itemizedDeductions,
        ssWageBase2025,
        ssWageBaseGrowth,
      },
    });

    const netIncome = totalIncome - taxes.totalTax;

    // Core living expenses include inflation-adjusted spending, property tax, and
    // later the retirement spending decrements once the household ages.
    const propertyTaxMultiplier = Math.pow(1 + propertyTaxGrowth / 100, yearsFromNow);
    let annualExpenses =
      monthlyExpenses * 12 * inflationFactor + propertyTax * propertyTaxMultiplier;

    const myAge = year - 1987;
    // Spending reductions apply multiplicatively by cohort (65-74, 75-84, 85+).
    // We keep the logic explicit here so auditors can verify the exponent maths.
    if (myAge >= 65) {
      let cumulativeDecrement = 1.0;

      const yearsIn65to74 = Math.min(Math.max(0, myAge - 65), 10);
      if (yearsIn65to74 > 0) {
        cumulativeDecrement *= Math.pow(
          1 - spendingDecrement65to74 / 100,
          yearsIn65to74,
        );
      }

      const yearsIn75to84 = Math.min(Math.max(0, myAge - 75), 10);
      if (yearsIn75to84 > 0) {
        cumulativeDecrement *= Math.pow(
          1 - spendingDecrement75to84 / 100,
          yearsIn75to84,
        );
      }

      const yearsIn85plus = Math.max(0, myAge - 85);
      if (yearsIn85plus > 0) {
        cumulativeDecrement *= Math.pow(
          1 - spendingDecrement85plus / 100,
          yearsIn85plus,
        );
      }

      annualExpenses *= cumulativeDecrement;
    }

    let daughter1CollegeCost = 0;
    let daughter2CollegeCost = 0;

    // College costs are only incurred between ages 18-21 inclusive. Costs inflate
    // at the higher education-specific rate (often above CPI).
    if (daughterAge1 >= 18 && daughterAge1 < 22) {
      const collegeYearsFromBase = year - 2025;
      daughter1CollegeCost =
        collegeCostPerYear * Math.pow(1 + collegeInflation / 100, collegeYearsFromBase);
    }

    if (daughterAge2 >= 18 && daughterAge2 < 22) {
      const collegeYearsFromBase = year - 2025;
      daughter2CollegeCost =
        collegeCostPerYear * Math.pow(1 + collegeInflation / 100, collegeYearsFromBase);
    }

    // 529 balances continue compounding while the beneficiary is under 22. We use
    // the tax-advantaged growth rate because the accounts are tax-sheltered.
    if (daughterAge1 < 22) {
      daughter1_529 = daughter1_529 * (1 + taxAdvReturnRate / 100);
    }
    if (daughterAge2 < 22) {
      daughter2_529 = daughter2_529 * (1 + taxAdvReturnRate / 100);
    }

    // Net savings before 529 contributions determines how much cash flow we have
    // available to service new investments or college shortfalls.
    const netSavingsBeforeCollege =
      netIncome + rentalNetCashFlow - annualExpenses - tuition;

    // We prioritise retirement accounts and base expenses before 529 contributions.
    // When positive savings exist we contribute equally per child, capped at half
    // of net savings so retirement remains the dominant savings bucket.
    let actual529Contribution = 0;
    if (year >= 2028 && netSavingsBeforeCollege > 0) {
      const d1NeedsContribution = daughterAge1 < 22;
      const d2NeedsContribution = daughterAge2 < 22;

      let d1Contribution = d1NeedsContribution ? annual529Contribution : 0;
      let d2Contribution = d2NeedsContribution ? annual529Contribution : 0;
      const totalContributionNeeded = d1Contribution + d2Contribution;

      actual529Contribution = Math.min(
        totalContributionNeeded,
        netSavingsBeforeCollege * 0.5,
      );

      if (totalContributionNeeded > 0) {
        const d1Share = d1Contribution / totalContributionNeeded;
        const d2Share = d2Contribution / totalContributionNeeded;
        daughter1_529 += actual529Contribution * d1Share;
        daughter2_529 += actual529Contribution * d2Share;
      }
    }

    // If costs exceed available 529 balances we defer the shortfall to taxable
    // portfolios later in the pipeline, reducing investable assets that year.
    let college529Shortfall = 0;

    if (daughter1CollegeCost > 0) {
      if (daughter1_529 >= daughter1CollegeCost) {
        daughter1_529 -= daughter1CollegeCost;
      } else {
        college529Shortfall += daughter1CollegeCost - daughter1_529;
        daughter1_529 = 0;
      }
    }

    if (daughter2CollegeCost > 0) {
      if (daughter2_529 >= daughter2CollegeCost) {
        daughter2_529 -= daughter2CollegeCost;
      } else {
        college529Shortfall += daughter2CollegeCost - daughter2_529;
        daughter2_529 = 0;
      }
    }

    const totalExpenses = annualExpenses + tuition + college529Shortfall;
    const netSavings = netSavingsBeforeCollege - actual529Contribution - college529Shortfall;

    // Retirement account limits chase inflation so the planner keeps real-space
    // contributions consistent through time.
    const k401Limit = k401Limit2025 * inflationFactor;
    const rothLimit = rothLimit2025 * inflationFactor;
    const employerMatch = calculateEmployerMatch(
      myIncome,
      spouseIncome,
      year,
      {
        clerkingStartYear,
        clerkingEndYear,
        publicInterestYear,
      },
    );

    // Maximum advantaged savings = two 401(k)s + two Roth IRAs + employer match.
    const maxTaxAdvContribution = k401Limit * 2 + rothLimit * 2 + employerMatch;

    let taxAdvContribution = 0;
    let taxableContribution = 0;
    let taxableWithdrawal = 0;
    let deficit = false;

    if (netSavings > 0) {
      // Positive savings: fill tax-advantaged space first, overflow into taxable.
      taxAdvContribution = Math.min(netSavings, maxTaxAdvContribution);
      taxableContribution = Math.max(0, netSavings - maxTaxAdvContribution);
    } else if (netSavings < 0) {
      const withdrawalNeeded = Math.abs(netSavings);
      if (taxablePortfolio >= withdrawalNeeded) {
        // Mild deficit: draw from taxable savings to cover the gap.
        taxableWithdrawal = withdrawalNeeded;
      } else {
        // Severe deficit: deplete taxable accounts and flag the shortfall so the UI
        // can surface an “unsustainable” year to the user.
        deficit = true;
        taxableWithdrawal = taxablePortfolio;
      }
    }

    const prevTaxAdvPortfolio = taxAdvPortfolio;
    const prevTaxablePortfolio = taxablePortfolio;

    const taxAdvGrowth = taxAdvPortfolio.mul(taxAdvReturnRate).div(100);
    const taxableGrowth = taxablePortfolio.mul(taxableReturnRate).div(100);

    taxAdvPortfolio = taxAdvPortfolio.add(taxAdvGrowth).add(taxAdvContribution);
    taxablePortfolio = taxablePortfolio
      .add(taxableGrowth)
      .add(taxableContribution)
      .sub(taxableWithdrawal);

    taxAdvPortfolio = clampMin(taxAdvPortfolio, 0);
    taxablePortfolio = clampMin(taxablePortfolio, 0);

    const portfolioGrowth = taxAdvGrowth.add(taxableGrowth);
    const totalPortfolio = taxAdvPortfolio.add(taxablePortfolio);

    let collegeReserveNeeded = 0;

    // Forward-looking college reserve: ensure FIRE target includes any still-
    // unfunded semesters. We project future contribution and cost trajectories
    // from the current age all the way until 22.
    if (daughterAge1 < 22) {
      let future529Balance = daughter1_529;
      let futureCollegeCosts = 0;

      for (let age = daughterAge1; age < 22; age++) {
        if (age >= 18) {
          const yearOfCollege = daughter1Birth + age;
          const yearsFromBase = yearOfCollege - 2025;
          const costThisYear =
            collegeCostPerYear *
            Math.pow(1 + collegeInflation / 100, yearsFromBase);
          futureCollegeCosts += costThisYear;
        }

        if (age < 22) {
          const futureYear = daughter1Birth + age;
          const contribution = futureYear <= 2027 ? 0 : annual529Contribution;
          future529Balance =
            future529Balance * (1 + taxAdvReturnRate / 100) + contribution;
        }
      }

      collegeReserveNeeded += Math.max(0, futureCollegeCosts - future529Balance);
    }

    // Repeat the same future reserve logic for the second child.
    if (daughterAge2 < 22) {
      let future529Balance = daughter2_529;
      let futureCollegeCosts = 0;

      for (let age = daughterAge2; age < 22; age++) {
        if (age >= 18) {
          const yearOfCollege = daughter2Birth + age;
          const yearsFromBase = yearOfCollege - 2025;
          const costThisYear =
            collegeCostPerYear *
            Math.pow(1 + collegeInflation / 100, yearsFromBase);
          futureCollegeCosts += costThisYear;
        }

        if (age < 22) {
          const futureYear = daughter2Birth + age;
          const contribution = futureYear <= 2027 ? 0 : annual529Contribution;
          future529Balance =
            future529Balance * (1 + taxAdvReturnRate / 100) + contribution;
        }
      }

      collegeReserveNeeded += Math.max(0, futureCollegeCosts - future529Balance);
    }

    const fireTargetExpenses = fireExpenseTarget * inflationFactor;
    const sustainableWithdrawalDec =
      targetPortfolioMultiple > 0
        ? totalPortfolio.div(targetPortfolioMultiple)
        : dec(0);

    // Healthcare buffer: optional reserve that covers pre-Medicare costs when
    // retiring early. If enabled we add `annualHealthcareCost` for each year until 65.
    let healthcareBuffer = 0;
    if (includeHealthcareBuffer) {
      const yearsUntilMedicare = Math.max(0, 65 - myAge);
      const healthcareCostInflated = annualHealthcareCost * inflationFactor;
      healthcareBuffer = healthcareCostInflated * yearsUntilMedicare;
    }

    // FIRE target combines the classic spending multiple with any outstanding
    // college commitments and optional healthcare buffer.
    const fireTargetDec = dec(fireTargetExpenses)
      .mul(targetPortfolioMultiple > 0 ? targetPortfolioMultiple : 0)
      .add(collegeReserveNeeded)
      .add(healthcareBuffer);

    if (!fireAchieved && totalPortfolio.greaterThanOrEqualTo(fireTargetDec)) {
      fireAchieved = true;
      fireYear = year;
    }

    // Persist the year’s snapshot for downstream charts, tables, and Monte Carlo.
    years.push({
      year,
      myIncome: Math.round(myIncome),
      spouseIncome: Math.round(spouseIncome),
      socialSecurityIncome: Math.round(socialSecurityIncome),
      totalIncome: Math.round(totalIncome),
      federalTax: taxes.federalTax,
      stateTax: taxes.caTax,
      ficaTax: Math.round(
        taxes.socialSecurityTax + taxes.medicareTax + taxes.additionalMedicare,
      ),
      totalTax: taxes.totalTax,
      effectiveRate: taxes.effectiveRate,
      netIncome: Math.round(netIncome),
      tuition: Math.round(tuition),
      expenses: Math.round(annualExpenses),
      contribution529: Math.round(actual529Contribution),
      daughter1CollegeCost: Math.round(daughter1CollegeCost),
      daughter2CollegeCost: Math.round(daughter2CollegeCost),
      college529Shortfall: Math.round(college529Shortfall),
      totalExpenses: Math.round(totalExpenses),
      rentalNetCashFlow: Math.round(rentalNetCashFlow),
      mortgageInterest: Math.round(mortgageInterest),
      rentalInsurance: Math.round(adjustedRentalInsurance),
      adjustedRentalIncome: Math.round(adjustedRentalIncome),
      netSavings: Math.round(netSavings),
      taxAdvContribution: Math.round(taxAdvContribution),
      taxableContribution: Math.round(taxableContribution),
      taxableWithdrawal: Math.round(taxableWithdrawal),
      portfolioGrowth: Math.round(toNumber(portfolioGrowth)),
      portfolio: Math.round(toNumber(totalPortfolio)),
      taxAdvPortfolio: Math.round(toNumber(taxAdvPortfolio)),
      taxablePortfolio: Math.round(toNumber(taxablePortfolio)),
      daughter1_529: Math.round(daughter1_529),
      daughter2_529: Math.round(daughter2_529),
      total529: Math.round(daughter1_529 + daughter2_529),
      sustainableWithdrawal: Math.round(toNumber(sustainableWithdrawalDec)),
      fireTarget: Math.round(toNumber(fireTargetDec)),
      collegeReserveNeeded: Math.round(collegeReserveNeeded),
      healthcareBuffer: Math.round(healthcareBuffer),
      isFIRE: totalPortfolio.greaterThanOrEqualTo(fireTargetDec),
      deficit,
    });
  }

  const lastYear = years[years.length - 1];
  if (lastYear.total529 > 0) {
    overfundingWarning = `⚠️ 529 accounts may be overfunded. Final balance: $${lastYear.total529.toLocaleString()}. Consider reducing contributions.`;
  }

  // FIRE year saved as the actual year object to simplify UI lookups.
  const fireYearObject = fireYear ? years.find((y) => y.year === fireYear) ?? null : null;

  return { years, fireYear: fireYearObject, overfundingWarning };
}
