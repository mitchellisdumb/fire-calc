import { calculateEmployerMatch } from './contributions';
import { getCravathSalary } from './career';
import { calculateMortgageInterest } from './mortgage';
import { calculateTaxes } from './taxes';
import { CalculatorInputs, ProjectionResult, ProjectionYear } from './types';

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

  let taxAdvPortfolio = (initialSavings * (100 - initialTaxablePct)) / 100;
  let taxablePortfolio = (initialSavings * initialTaxablePct) / 100;
  let daughter1_529 = initial529Balance / 2;
  let daughter2_529 = initial529Balance / 2;
  let fireAchieved = false;
  let fireYear: number | null = null;
  let overfundingWarning: string | null = null;

  const k401Limit2025 = 23500;
  const rothLimit2025 = 7000;

  for (let year = currentYear; year <= currentYear + 62; year++) {
    const yearsFromNow = year - currentYear;
    const inflationFactor = Math.pow(1 + inflationRate / 100, yearsFromNow);

    const daughterAge1 = year - daughter1Birth;
    const daughterAge2 = year - daughter2Birth;

    let myIncome = 0;
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

    const socialSecurityIncome = mySocialSecurity + spouseSocialSecurity;
    const totalIncome = myIncome + spouseIncome + socialSecurityIncome;

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

    let tuition = 0;
    if (year === 2026) {
      tuition = tuitionPerSemester * 2;
    } else if (year === 2027) {
      tuition = tuitionPerSemester;
    }

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

    const propertyTaxMultiplier = Math.pow(1 + propertyTaxGrowth / 100, yearsFromNow);
    let annualExpenses =
      monthlyExpenses * 12 * inflationFactor + propertyTax * propertyTaxMultiplier;

    const myAge = year - 1987;
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

    if (daughterAge1 < 22) {
      daughter1_529 = daughter1_529 * (1 + taxAdvReturnRate / 100);
    }
    if (daughterAge2 < 22) {
      daughter2_529 = daughter2_529 * (1 + taxAdvReturnRate / 100);
    }

    const netSavingsBeforeCollege =
      netIncome + rentalNetCashFlow - annualExpenses - tuition;

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

    const maxTaxAdvContribution = k401Limit * 2 + rothLimit * 2 + employerMatch;

    let taxAdvContribution = 0;
    let taxableContribution = 0;
    let taxableWithdrawal = 0;
    let deficit = false;

    if (netSavings > 0) {
      taxAdvContribution = Math.min(netSavings, maxTaxAdvContribution);
      taxableContribution = Math.max(0, netSavings - maxTaxAdvContribution);
    } else if (netSavings < 0) {
      const withdrawalNeeded = Math.abs(netSavings);
      if (taxablePortfolio >= withdrawalNeeded) {
        taxableWithdrawal = withdrawalNeeded;
      } else {
        deficit = true;
        taxableWithdrawal = taxablePortfolio;
      }
    }

    const taxAdvGrowth = taxAdvPortfolio * (taxAdvReturnRate / 100);
    const taxableGrowth = taxablePortfolio * (taxableReturnRate / 100);

    taxAdvPortfolio = taxAdvPortfolio + taxAdvGrowth + taxAdvContribution;
    taxablePortfolio =
      taxablePortfolio + taxableGrowth + taxableContribution - taxableWithdrawal;

    if (taxablePortfolio < 0) {
      taxablePortfolio = 0;
    }

    const totalPortfolio = taxAdvPortfolio + taxablePortfolio;
    const portfolioGrowth = taxAdvGrowth + taxableGrowth;

    let collegeReserveNeeded = 0;

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
    const sustainableWithdrawal =
      targetPortfolioMultiple > 0 ? totalPortfolio / targetPortfolioMultiple : 0;

    let healthcareBuffer = 0;
    if (includeHealthcareBuffer) {
      const yearsUntilMedicare = Math.max(0, 65 - myAge);
      const healthcareCostInflated = annualHealthcareCost * inflationFactor;
      healthcareBuffer = healthcareCostInflated * yearsUntilMedicare;
    }

    const fireTarget =
      fireTargetExpenses * (targetPortfolioMultiple > 0 ? targetPortfolioMultiple : 0) +
      collegeReserveNeeded +
      healthcareBuffer;

    if (!fireAchieved && totalPortfolio >= fireTarget) {
      fireAchieved = true;
      fireYear = year;
    }

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
      portfolioGrowth: Math.round(portfolioGrowth),
      portfolio: Math.round(totalPortfolio),
      taxAdvPortfolio: Math.round(taxAdvPortfolio),
      taxablePortfolio: Math.round(taxablePortfolio),
      daughter1_529: Math.round(daughter1_529),
      daughter2_529: Math.round(daughter2_529),
      total529: Math.round(daughter1_529 + daughter2_529),
      sustainableWithdrawal: Math.round(sustainableWithdrawal),
      fireTarget: Math.round(fireTarget),
      collegeReserveNeeded: Math.round(collegeReserveNeeded),
      healthcareBuffer: Math.round(healthcareBuffer),
      isFIRE: totalPortfolio >= fireTarget,
      deficit,
    });
  }

  const lastYear = years[years.length - 1];
  if (lastYear.total529 > 0) {
    overfundingWarning = `⚠️ 529 accounts may be overfunded. Final balance: $${lastYear.total529.toLocaleString()}. Consider reducing contributions.`;
  }

  const fireYearObject = fireYear ? years.find((y) => y.year === fireYear) ?? null : null;

  return { years, fireYear: fireYearObject, overfundingWarning };
}
