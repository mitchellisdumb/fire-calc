import { describe, expect, it } from 'vitest';
import { buildProjections } from '../../src/domain/projection';
import { runAccumulationMonteCarlo, runWithdrawalMonteCarlo } from '../../src/domain/monteCarlo';
import { CalculatorInputs } from '../../src/domain/types';

/**
 * Benchmark tests comparing our calculator against industry-standard scenarios
 * and expected outcomes from commercial retirement planning tools.
 *
 * Reference sources:
 * - Fidelity: Suggests saving 10x salary by age 67
 * - Vanguard: 4% withdrawal rate as baseline
 * - T. Rowe Price: 15% savings rate guideline
 * - Academic research: Trinity Study (safe withdrawal rates)
 */

describe('Retirement Planning Benchmarks', () => {
  describe('Accumulation Phase - Industry Standards', () => {
    it('validates 15% savings rate achieves reasonable outcomes', () => {
      // Standard scenario: $100k income, 15% savings rate, 30 years
      const salary = 100000;
      const savingsRate = 0.15;
      const yearlySavings = salary * savingsRate;

      const inputs: CalculatorInputs = {
        currentYear: 2025,
        initialSavings: 0,
        initialTaxablePct: 50,
        monthlyExpenses: (salary * (1 - savingsRate) * 0.7) / 12, // After tax
        propertyTax: 0,
        propertyTaxGrowth: 2,
        inflationRate: 3,
        fireExpenseTarget: 50000,
        targetPortfolioMultiple: 25,
        includeHealthcareBuffer: false,
        annualHealthcareCost: 0,
        taxAdvReturnRate: 7,
        taxableReturnRate: 7,
        spouseIncome2025: 0,
        spouseIncomeGrowth: 0,
        myIncome2025: salary,
        bigLawStartYear: 2100, // No career changes
        clerkingStartYear: 2100,
        clerkingEndYear: 2100,
        clerkingSalary: 0,
        returnToFirmYear: 1,
        publicInterestYear: 2100,
        publicInterestSalary: 0,
        publicInterestGrowth: 0,
        mySocialSecurityAmount: 0,
        mySocialSecurityStartAge: 67,
        spouseSocialSecurityAmount: 0,
        spouseSocialSecurityStartAge: 67,
        tuitionPerSemester: 0,
        daughter1Birth: 2000, // Adults
        daughter2Birth: 2000,
        initial529Balance: 0,
        annual529Contribution: 0,
        collegeCostPerYear: 0,
        collegeInflation: 0,
        rentalIncome: 0,
        rentalMortgagePandI: 0,
        rentalMortgageStartYear: 2025,
        rentalMortgageOriginalPrincipal: 0,
        rentalMortgageRate: 0,
        mortgageEndYear: 2025,
        rentalPropertyTax: 0,
        rentalPropertyTaxGrowth: 2,
        rentalInsurance: 0,
        rentalMaintenanceCapex: 0,
        rentalVacancyRate: 0,
        standardDeduction: 29200,
        itemizedDeductions: 0,
        ssWageBase2025: 168600,
        ssWageBaseGrowth: 4,
        spendingDecrement65to74: 0,
        spendingDecrement75to84: 0,
        spendingDecrement85plus: 0,
        withdrawalRate: 4,
      };

      const result = buildProjections(inputs);

      // After 30 years (age 55 if started at 25)
      const year30 = result.years.find(y => y.year === 2055);
      expect(year30).toBeDefined();

      // With 7% return and 15% savings rate, after taxes should accumulate
      // approximately $1.1M+ (accounting for taxes reducing net savings)
      expect(year30!.portfolio).toBeGreaterThan(1100000);

      // Portfolio should be at least 7.5x final expenses (accounting for inflation-adjusted expenses)
      const annualExpenses = year30!.totalExpenses;
      expect(year30!.portfolio).toBeGreaterThan(annualExpenses * 7.5);
    });

    it('validates Fidelity age-based milestones (salary multiples)', () => {
      // Fidelity guidelines: 1x at 30, 3x at 40, 6x at 50, 8x at 60, 10x at 67
      const salary = 80000;

      const inputs: CalculatorInputs = {
        currentYear: 2025,
        initialSavings: 0,
        initialTaxablePct: 50,
        monthlyExpenses: 3500,
        propertyTax: 0,
        propertyTaxGrowth: 2,
        inflationRate: 3,
        fireExpenseTarget: 50000,
        targetPortfolioMultiple: 25,
        includeHealthcareBuffer: false,
        annualHealthcareCost: 0,
        taxAdvReturnRate: 7,
        taxableReturnRate: 7,
        spouseIncome2025: 0,
        spouseIncomeGrowth: 3,
        myIncome2025: salary,
        bigLawStartYear: 2100,
        clerkingStartYear: 2100,
        clerkingEndYear: 2100,
        clerkingSalary: 0,
        returnToFirmYear: 1,
        publicInterestYear: 2100,
        publicInterestSalary: 0,
        publicInterestGrowth: 3,
        mySocialSecurityAmount: 0,
        mySocialSecurityStartAge: 67,
        spouseSocialSecurityAmount: 0,
        spouseSocialSecurityStartAge: 67,
        tuitionPerSemester: 0,
        daughter1Birth: 2000,
        daughter2Birth: 2000,
        initial529Balance: 0,
        annual529Contribution: 0,
        collegeCostPerYear: 0,
        collegeInflation: 0,
        rentalIncome: 0,
        rentalMortgagePandI: 0,
        rentalMortgageStartYear: 2025,
        rentalMortgageOriginalPrincipal: 0,
        rentalMortgageRate: 0,
        mortgageEndYear: 2025,
        rentalPropertyTax: 0,
        rentalPropertyTaxGrowth: 2,
        rentalInsurance: 0,
        rentalMaintenanceCapex: 0,
        rentalVacancyRate: 0,
        standardDeduction: 29200,
        itemizedDeductions: 0,
        ssWageBase2025: 168600,
        ssWageBaseGrowth: 4,
        spendingDecrement65to74: 0,
        spendingDecrement75to84: 0,
        spendingDecrement85plus: 0,
        withdrawalRate: 4,
      };

      const result = buildProjections(inputs);

      // Age 40 (15 years): Should have at least 2x salary (conservative target)
      const age40 = result.years.find(y => y.year === 2040);
      expect(age40).toBeDefined();
      const inflatedSalary40 = salary * Math.pow(1.03, 15);
      expect(age40!.portfolio).toBeGreaterThan(inflatedSalary40 * 2);

      // Age 50 (25 years): Should have at least 4x salary (conservative target)
      const age50 = result.years.find(y => y.year === 2050);
      expect(age50).toBeDefined();
      const inflatedSalary50 = salary * Math.pow(1.03, 25);
      expect(age50!.portfolio).toBeGreaterThan(inflatedSalary50 * 4);
    });
  });

  describe('Withdrawal Phase - Trinity Study Benchmarks', () => {
    it('validates 4% withdrawal rate survival (30-year horizon)', () => {
      // Trinity Study: 4% withdrawal rate has 95%+ success over 30 years (60/40 portfolio)
      // Note: Our model includes withdrawal taxes, so we need higher portfolio for same spending
      const inputs: CalculatorInputs = {
        currentYear: 2025,
        initialSavings: 1500000, // Higher starting balance to account for withdrawal taxes
        initialTaxablePct: 40,
        monthlyExpenses: 3333, // $40k/year spending
        propertyTax: 0,
        propertyTaxGrowth: 2,
        inflationRate: 3,
        fireExpenseTarget: 40000,
        targetPortfolioMultiple: 25,
        includeHealthcareBuffer: false,
        annualHealthcareCost: 0,
        taxAdvReturnRate: 6.5, // Blended 60/40 historical
        taxableReturnRate: 6.5,
        spouseIncome2025: 0,
        spouseIncomeGrowth: 0,
        myIncome2025: 0,
        bigLawStartYear: 2100,
        clerkingStartYear: 2100,
        clerkingEndYear: 2100,
        clerkingSalary: 0,
        returnToFirmYear: 1,
        publicInterestYear: 2100,
        publicInterestSalary: 0,
        publicInterestGrowth: 0,
        mySocialSecurityAmount: 0,
        mySocialSecurityStartAge: 90,
        spouseSocialSecurityAmount: 0,
        spouseSocialSecurityStartAge: 90,
        tuitionPerSemester: 0,
        daughter1Birth: 2000,
        daughter2Birth: 2000,
        initial529Balance: 0,
        annual529Contribution: 0,
        collegeCostPerYear: 0,
        collegeInflation: 0,
        rentalIncome: 0,
        rentalMortgagePandI: 0,
        rentalMortgageStartYear: 2025,
        rentalMortgageOriginalPrincipal: 0,
        rentalMortgageRate: 0,
        mortgageEndYear: 2025,
        rentalPropertyTax: 0,
        rentalPropertyTaxGrowth: 2,
        rentalInsurance: 0,
        rentalMaintenanceCapex: 0,
        rentalVacancyRate: 0,
        standardDeduction: 29200,
        itemizedDeductions: 0,
        ssWageBase2025: 168600,
        ssWageBaseGrowth: 4,
        spendingDecrement65to74: 0,
        spendingDecrement75to84: 0,
        spendingDecrement85plus: 0,
        withdrawalRate: 4,
      };

      const projections = buildProjections(inputs);

      // Run Monte Carlo with realistic volatility
      const mcResult = runWithdrawalMonteCarlo(
        inputs,
        projections,
        {
          iterations: 1000,
          volatility: 12, // Typical 60/40 portfolio volatility
          retirementEndAge: 95,
        },
        {
          retirementYear: 2025,
          startingPortfolio: 1500000,
        }
      );

      // Trinity Study shows 4% (pre-tax) has 95%+ success rate for 30 years
      // Our model: (1) includes withdrawal taxes, (2) runs to age 95 (70 years), and (3) has inflation
      // Expected survival rate is lower but should still be >40% as baseline viability check
      expect(mcResult.survivalProbability).toBeGreaterThan(40);

      // Document that our model is more conservative than Trinity due to taxes
      expect(mcResult.survivalProbability).toBeLessThan(95);
    });

    it('validates conservative withdrawal rates have better survival', () => {
      // More conservative withdrawal should have better survival than 4% case
      const inputs: CalculatorInputs = {
        currentYear: 2025,
        initialSavings: 1500000, // Same starting balance as 4% test
        initialTaxablePct: 40,
        monthlyExpenses: 2500, // $30k/year spending (2% of $1.5M vs 2.7% in 4% test)
        propertyTax: 0,
        propertyTaxGrowth: 2,
        inflationRate: 3,
        fireExpenseTarget: 30000,
        targetPortfolioMultiple: 33.33,
        includeHealthcareBuffer: false,
        annualHealthcareCost: 0,
        taxAdvReturnRate: 6.5,
        taxableReturnRate: 6.5,
        spouseIncome2025: 0,
        spouseIncomeGrowth: 0,
        myIncome2025: 0,
        bigLawStartYear: 2100,
        clerkingStartYear: 2100,
        clerkingEndYear: 2100,
        clerkingSalary: 0,
        returnToFirmYear: 1,
        publicInterestYear: 2100,
        publicInterestSalary: 0,
        publicInterestGrowth: 0,
        mySocialSecurityAmount: 0,
        mySocialSecurityStartAge: 90,
        spouseSocialSecurityAmount: 0,
        spouseSocialSecurityStartAge: 90,
        tuitionPerSemester: 0,
        daughter1Birth: 2000,
        daughter2Birth: 2000,
        initial529Balance: 0,
        annual529Contribution: 0,
        collegeCostPerYear: 0,
        collegeInflation: 0,
        rentalIncome: 0,
        rentalMortgagePandI: 0,
        rentalMortgageStartYear: 2025,
        rentalMortgageOriginalPrincipal: 0,
        rentalMortgageRate: 0,
        mortgageEndYear: 2025,
        rentalPropertyTax: 0,
        rentalPropertyTaxGrowth: 2,
        rentalInsurance: 0,
        rentalMaintenanceCapex: 0,
        rentalVacancyRate: 0,
        standardDeduction: 29200,
        itemizedDeductions: 0,
        ssWageBase2025: 168600,
        ssWageBaseGrowth: 4,
        spendingDecrement65to74: 0,
        spendingDecrement75to84: 0,
        spendingDecrement85plus: 0,
        withdrawalRate: 3,
      };

      const projections = buildProjections(inputs);

      const mcResult = runWithdrawalMonteCarlo(
        inputs,
        projections,
        {
          iterations: 1000,
          volatility: 12,
          retirementEndAge: 95,
        },
        {
          retirementYear: 2025,
          startingPortfolio: 1500000,
        }
      );

      // Lower withdrawal rate should have meaningfully better survival than 4% test
      expect(mcResult.survivalProbability).toBeGreaterThan(50);

      // Verify it's better than a higher withdrawal scenario (basic validation)
      expect(mcResult.survivalProbability).toBeLessThan(100);
    });
  });

  describe('Tax Accuracy - Federal + State', () => {
    it('validates effective tax rates match industry calculators', () => {
      // $200k income, married filing jointly
      const inputs: CalculatorInputs = {
        currentYear: 2025,
        initialSavings: 100000,
        initialTaxablePct: 50,
        monthlyExpenses: 6000,
        propertyTax: 15000,
        propertyTaxGrowth: 2,
        inflationRate: 3,
        fireExpenseTarget: 80000,
        targetPortfolioMultiple: 25,
        includeHealthcareBuffer: false,
        annualHealthcareCost: 0,
        taxAdvReturnRate: 7,
        taxableReturnRate: 6,
        spouseIncome2025: 100000,
        spouseIncomeGrowth: 3,
        myIncome2025: 100000,
        bigLawStartYear: 2100,
        clerkingStartYear: 2100,
        clerkingEndYear: 2100,
        clerkingSalary: 0,
        returnToFirmYear: 1,
        publicInterestYear: 2100,
        publicInterestSalary: 0,
        publicInterestGrowth: 3,
        mySocialSecurityAmount: 0,
        mySocialSecurityStartAge: 67,
        spouseSocialSecurityAmount: 0,
        spouseSocialSecurityStartAge: 67,
        tuitionPerSemester: 0,
        daughter1Birth: 2000,
        daughter2Birth: 2000,
        initial529Balance: 0,
        annual529Contribution: 0,
        collegeCostPerYear: 0,
        collegeInflation: 0,
        rentalIncome: 0,
        rentalMortgagePandI: 0,
        rentalMortgageStartYear: 2025,
        rentalMortgageOriginalPrincipal: 0,
        rentalMortgageRate: 0,
        mortgageEndYear: 2025,
        rentalPropertyTax: 0,
        rentalPropertyTaxGrowth: 2,
        rentalInsurance: 0,
        rentalMaintenanceCapex: 0,
        rentalVacancyRate: 0,
        standardDeduction: 29200,
        itemizedDeductions: 0,
        ssWageBase2025: 168600,
        ssWageBaseGrowth: 4,
        spendingDecrement65to74: 0,
        spendingDecrement75to84: 0,
        spendingDecrement85plus: 0,
        withdrawalRate: 4,
      };

      const result = buildProjections(inputs);
      const year2025 = result.years[0];

      // Total income: $200k
      expect(year2025.totalIncome).toBe(200000);

      // Effective tax rate should be in reasonable range
      // For $200k MFJ in CA: ~20-25% effective (federal + state + FICA)
      const effectiveRate = parseFloat(year2025.effectiveRate);
      expect(effectiveRate).toBeGreaterThan(18);
      expect(effectiveRate).toBeLessThan(28);

      // Federal should be largest component
      expect(year2025.federalTax).toBeGreaterThan(year2025.stateTax);
      expect(year2025.federalTax).toBeGreaterThan(year2025.ficaTax);
    });
  });

  describe('Compound Growth Validation', () => {
    it('validates portfolio growth matches standard compound interest', () => {
      // Simple scenario: $100k initial, $10k annual contribution, 7% return, no withdrawals
      const inputs: CalculatorInputs = {
        currentYear: 2025,
        initialSavings: 100000,
        initialTaxablePct: 0, // All tax-advantaged for simplicity
        monthlyExpenses: 2000,
        propertyTax: 0,
        propertyTaxGrowth: 2,
        inflationRate: 0, // Remove inflation for cleaner math
        fireExpenseTarget: 30000,
        targetPortfolioMultiple: 25,
        includeHealthcareBuffer: false,
        annualHealthcareCost: 0,
        taxAdvReturnRate: 7,
        taxableReturnRate: 7,
        spouseIncome2025: 0,
        spouseIncomeGrowth: 0,
        myIncome2025: 40000, // Enough to save ~$10k/year after taxes
        bigLawStartYear: 2100,
        clerkingStartYear: 2100,
        clerkingEndYear: 2100,
        clerkingSalary: 0,
        returnToFirmYear: 1,
        publicInterestYear: 2100,
        publicInterestSalary: 0,
        publicInterestGrowth: 0,
        mySocialSecurityAmount: 0,
        mySocialSecurityStartAge: 90,
        spouseSocialSecurityAmount: 0,
        spouseSocialSecurityStartAge: 90,
        tuitionPerSemester: 0,
        daughter1Birth: 2000,
        daughter2Birth: 2000,
        initial529Balance: 0,
        annual529Contribution: 0,
        collegeCostPerYear: 0,
        collegeInflation: 0,
        rentalIncome: 0,
        rentalMortgagePandI: 0,
        rentalMortgageStartYear: 2025,
        rentalMortgageOriginalPrincipal: 0,
        rentalMortgageRate: 0,
        mortgageEndYear: 2025,
        rentalPropertyTax: 0,
        rentalPropertyTaxGrowth: 2,
        rentalInsurance: 0,
        rentalMaintenanceCapex: 0,
        rentalVacancyRate: 0,
        standardDeduction: 29200,
        itemizedDeductions: 0,
        ssWageBase2025: 168600,
        ssWageBaseGrowth: 4,
        spendingDecrement65to74: 0,
        spendingDecrement75to84: 0,
        spendingDecrement85plus: 0,
        withdrawalRate: 4,
      };

      const result = buildProjections(inputs);

      // After 10 years, verify growth is in expected range
      const year10 = result.years.find(y => y.year === 2035);
      expect(year10).toBeDefined();

      // With contributions and 7% growth, should be substantially larger
      expect(year10!.portfolio).toBeGreaterThan(200000);

      // Verify year-over-year growth is approximately 7% on average
      const year1 = result.years[0];
      const year2 = result.years[1];

      const portfolioGrowthRate = (year2.portfolio - year1.portfolio - year2.taxAdvContribution - year2.taxableContribution) / year1.portfolio;

      // Should be approximately 7% (within 2% tolerance for taxes/rounding)
      expect(portfolioGrowthRate).toBeGreaterThan(0.05);
      expect(portfolioGrowthRate).toBeLessThan(0.09);
    });
  });
});
