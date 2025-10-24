import { describe, expect, it } from 'vitest';
import { buildProjections } from '../../src/domain/projection';
import { CalculatorInputs } from '../../src/domain/types';

// Base configuration for 529 tests
const baseInputs: CalculatorInputs = {
  currentYear: 2025,
  initialSavings: 500000,
  initialTaxablePct: 60,
  monthlyExpenses: 10000,
  propertyTax: 20000,
  propertyTaxGrowth: 2,
  inflationRate: 3,
  fireExpenseTarget: 135000,
  targetPortfolioMultiple: 20,
  includeHealthcareBuffer: false,
  annualHealthcareCost: 12000,
  taxAdvReturnRate: 7,
  taxableReturnRate: 6,
  spouseIncome2025: 200000,
  spouseIncomeGrowth: 3,
  myIncome2025: 40000,
  bigLawStartYear: 2028,
  clerkingStartYear: 2029,
  clerkingEndYear: 2031,
  clerkingSalary: 100000,
  returnToFirmYear: 3,
  publicInterestYear: 2036,
  publicInterestSalary: 110000,
  publicInterestGrowth: 3,
  mySocialSecurityAmount: 35000,
  mySocialSecurityStartAge: 68,
  spouseSocialSecurityAmount: 40000,
  spouseSocialSecurityStartAge: 70,
  tuitionPerSemester: 30000,
  daughter1Birth: 2021,
  daughter2Birth: 2025,
  initial529Balance: 0,
  annual529Contribution: 9000,
  collegeCostPerYear: 40000,
  collegeInflation: 3.5,
  rentalIncome: 5800,
  rentalMortgagePandI: 1633,
  rentalMortgageStartYear: 2020,
  rentalMortgageOriginalPrincipal: 400000,
  rentalMortgageRate: 2.75,
  mortgageEndYear: 2051,
  rentalPropertyTax: 8000,
  rentalPropertyTaxGrowth: 2,
  rentalInsurance: 3323,
  rentalMaintenanceCapex: 11000,
  rentalVacancyRate: 5,
  standardDeduction: 29200,
  itemizedDeductions: 0,
  ssWageBase2025: 168600,
  ssWageBaseGrowth: 4,
  spendingDecrement65to74: 1,
  spendingDecrement75to84: 4,
  spendingDecrement85plus: 2,
  withdrawalRate: 4,
};

describe('529 College Savings Edge Cases', () => {
  it('handles 529 overfunding correctly', () => {
    // Set up scenario where 529 contributions far exceed college costs
    const inputs: CalculatorInputs = {
      ...baseInputs,
      initial529Balance: 200000, // Large initial balance
      annual529Contribution: 20000, // Aggressive contributions
      collegeCostPerYear: 30000, // Moderate college costs
    };

    const result = buildProjections(inputs);

    // Find the last year in the projection
    const lastYear = result.years[result.years.length - 1];

    // Should have overfunding warning
    expect(result.overfundingWarning).not.toBeNull();
    expect(result.overfundingWarning).toContain('529 accounts may be overfunded');

    // Should still have balance after both kids graduate
    expect(lastYear.total529).toBeGreaterThan(0);

    // Verify balances during college years
    const daughter1CollegeStart = 2039; // 2021 + 18
    const daughter1GraduationYear = 2042; // 2021 + 21
    const duringCollege = result.years.find(y => y.year === daughter1CollegeStart);
    expect(duringCollege).toBeDefined();

    // Should have enough to cover costs without shortfall
    expect(duringCollege!.college529Shortfall).toBe(0);
  });

  it('handles 529 underfunding with shortfalls', () => {
    // Set up scenario where 529 contributions are insufficient
    const inputs: CalculatorInputs = {
      ...baseInputs,
      initial529Balance: 0, // No initial balance
      annual529Contribution: 3000, // Low contributions
      collegeCostPerYear: 60000, // High college costs
    };

    const result = buildProjections(inputs);

    // Find years when daughter 1 is in college (ages 18-21)
    const daughter1CollegeYears = result.years.filter(y => {
      const age = y.year - 2021;
      return age >= 18 && age < 22;
    });

    // Should have shortfalls during at least some college years
    const yearsWithShortfall = daughter1CollegeYears.filter(y => y.college529Shortfall > 0);
    expect(yearsWithShortfall.length).toBeGreaterThan(0);

    // Total shortfall should be substantial
    const totalShortfall = daughter1CollegeYears.reduce((sum, y) => sum + y.college529Shortfall, 0);
    expect(totalShortfall).toBeGreaterThan(50000);

    // Verify 529 balances deplete to zero
    const lastCollegeYear = daughter1CollegeYears[daughter1CollegeYears.length - 1];
    expect(lastCollegeYear.daughter1_529).toBe(0);
  });

  it('handles zero 529 contributions correctly', () => {
    const inputs: CalculatorInputs = {
      ...baseInputs,
      initial529Balance: 0,
      annual529Contribution: 0,
      collegeCostPerYear: 40000,
    };

    const result = buildProjections(inputs);

    // All college years should have full shortfalls
    const daughter1CollegeYears = result.years.filter(y => {
      const age = y.year - 2021;
      return age >= 18 && age < 22;
    });

    daughter1CollegeYears.forEach(year => {
      expect(year.daughter1CollegeCost).toBeGreaterThan(0);
      expect(year.college529Shortfall).toBeGreaterThanOrEqual(year.daughter1CollegeCost);
      expect(year.daughter1_529).toBe(0);
    });
  });

  it('handles college cost inflation correctly', () => {
    const inputs: CalculatorInputs = {
      ...baseInputs,
      collegeCostPerYear: 40000,
      collegeInflation: 5, // High inflation
    };

    const result = buildProjections(inputs);

    // Compare costs across years
    const daughter1FirstYear = result.years.find(y => y.year === 2039); // 2021 + 18
    const daughter2FirstYear = result.years.find(y => y.year === 2043); // 2025 + 18

    expect(daughter1FirstYear).toBeDefined();
    expect(daughter2FirstYear).toBeDefined();

    // Daughter 2's costs should be higher due to inflation
    expect(daughter2FirstYear!.daughter2CollegeCost).toBeGreaterThan(daughter1FirstYear!.daughter1CollegeCost);

    // Calculate expected inflation factor
    const yearsApart = 4;
    const expectedRatio = Math.pow(1.05, yearsApart);
    const actualRatio = daughter2FirstYear!.daughter2CollegeCost / daughter1FirstYear!.daughter1CollegeCost;

    // Should be within 1% of expected ratio
    expect(Math.abs(actualRatio - expectedRatio) / expectedRatio).toBeLessThan(0.01);
  });

  it('handles 529 growth rate correctly', () => {
    const inputs: CalculatorInputs = {
      ...baseInputs,
      initial529Balance: 100000,
      annual529Contribution: 0, // No contributions to isolate growth
      taxAdvReturnRate: 7, // 7% return
      collegeCostPerYear: 0, // No costs to isolate growth
      daughter1Birth: 2010, // Born in 2010, age 15 in 2025
      daughter2Birth: 2014, // Born in 2014, age 11 in 2025
    };

    const result = buildProjections(inputs);

    const year2025 = result.years.find(y => y.year === 2025);
    const year2026 = result.years.find(y => y.year === 2026);

    expect(year2025).toBeDefined();
    expect(year2026).toBeDefined();

    // Verify 529 balances grow over time
    const initial = year2025!.total529;
    const afterOneYear = year2026!.total529;

    // Balance should increase
    expect(afterOneYear).toBeGreaterThan(initial);

    // Growth should be approximately 7%
    const actualGrowthRate = (afterOneYear - initial) / initial;

    // Should be within reasonable range of 7% (accounting for Decimal precision)
    expect(actualGrowthRate).toBeGreaterThan(0.06);
    expect(actualGrowthRate).toBeLessThan(0.08);
  });

  it('handles partial 529 depletion correctly', () => {
    const inputs: CalculatorInputs = {
      ...baseInputs,
      initial529Balance: 80000, // Enough for partial coverage
      annual529Contribution: 5000,
      collegeCostPerYear: 50000, // High costs
    };

    const result = buildProjections(inputs);

    const daughter1CollegeYears = result.years.filter(y => {
      const age = y.year - 2021;
      return age >= 18 && age < 22;
    });

    // Should have some years with full coverage and some with shortfalls
    const yearsFullyCovered = daughter1CollegeYears.filter(y => y.college529Shortfall === 0);
    const yearsWithShortfall = daughter1CollegeYears.filter(y => y.college529Shortfall > 0);

    // With these parameters, should have at least one year with shortfall
    expect(yearsWithShortfall.length).toBeGreaterThan(0);
  });

  it('includes college reserve in FIRE target correctly', () => {
    const inputs: CalculatorInputs = {
      ...baseInputs,
      initial529Balance: 0,
      annual529Contribution: 5000,
      collegeCostPerYear: 50000,
    };

    const result = buildProjections(inputs);

    // Find a year before college starts
    const preCollegeYear = result.years.find(y => y.year === 2030);
    expect(preCollegeYear).toBeDefined();

    // Should have college reserve included in FIRE target
    expect(preCollegeYear!.collegeReserveNeeded).toBeGreaterThan(0);

    // FIRE target should exceed base target due to college reserve
    const baseFireTarget = baseInputs.fireExpenseTarget * baseInputs.targetPortfolioMultiple;
    expect(preCollegeYear!.fireTarget).toBeGreaterThan(baseFireTarget);

    // After kids graduate, college reserve should be zero
    const postCollegeYear = result.years.find(y => y.year === 2050);
    expect(postCollegeYear).toBeDefined();
    expect(postCollegeYear!.collegeReserveNeeded).toBe(0);
  });

  it('handles contribution capping at 50% of net savings', () => {
    const inputs: CalculatorInputs = {
      ...baseInputs,
      annual529Contribution: 50000, // Request very high contribution
      monthlyExpenses: 3000, // Low expenses to create high savings
    };

    const result = buildProjections(inputs);

    // Find a year with high net savings
    const highSavingsYear = result.years.find(y => y.year === 2032);
    expect(highSavingsYear).toBeDefined();

    // Actual contribution should be capped
    if (highSavingsYear!.contribution529 > 0) {
      const netSavingsBeforeCollege =
        highSavingsYear!.netIncome +
        highSavingsYear!.rentalNetCashFlow -
        highSavingsYear!.totalExpenses +
        highSavingsYear!.contribution529 +
        highSavingsYear!.college529Shortfall;

      // Contribution should not exceed 50% of net savings before college
      expect(highSavingsYear!.contribution529).toBeLessThanOrEqual(netSavingsBeforeCollege * 0.5 + 1); // +1 for rounding
    }
  });
});
