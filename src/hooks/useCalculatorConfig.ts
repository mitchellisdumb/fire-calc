import { useCallback, useMemo, useState } from 'react';
import { CalculatorInputs } from '../domain/types';

const CURRENT_YEAR = 2025;

export interface CalculatorFormState {
  initialSavings: number;
  initialTaxablePct: number;
  monthlyExpenses: number;
  propertyTax: number;
  propertyTaxGrowth: number;
  inflationRate: number;
  fireExpenseTarget: number;
  targetPortfolioMultiple: number;
  includeHealthcareBuffer: boolean;
  annualHealthcareCost: number;
  taxAdvReturnRate: number;
  taxableReturnRate: number;
  spouseIncome2025: number;
  spouseIncomeGrowth: number;
  myIncome2025: number;
  bigLawStartYear: number;
  clerkingStartYear: number;
  clerkingEndYear: number;
  clerkingSalary: number;
  returnToFirmYear: number;
  publicInterestYear: number;
  publicInterestSalary: number;
  publicInterestGrowth: number;
  mySocialSecurityAmount: number;
  mySocialSecurityStartAge: number;
  spouseSocialSecurityAmount: number;
  spouseSocialSecurityStartAge: number;
  tuitionPerSemester: number;
  daughter1Birth: number;
  daughter2Birth: number;
  initial529Balance: number;
  annual529Contribution: number;
  collegeCostPerYear: number;
  collegeInflation: number;
  rentalIncome: number;
  rentalMortgagePandI: number;
  rentalMortgageStartYear: number;
  rentalMortgageOriginalPrincipal: number;
  rentalMortgageRate: number;
  mortgageEndYear: number;
  rentalPropertyTax: number;
  rentalPropertyTaxGrowth: number;
  rentalInsurance: number;
  rentalMaintenanceCapex: number;
  rentalVacancyRate: number;
  standardDeduction: number;
  itemizedDeductions: number;
  ssWageBase2025: number;
  ssWageBaseGrowth: number;
  spendingDecrement65to74: number;
  spendingDecrement75to84: number;
  spendingDecrement85plus: number;
  mcEnabled: boolean;
  mcIterations: number;
  mcVolatility: number;
  mcTargetSurvival: number;
  mcRetirementEndAge: number;
}

const initialState: CalculatorFormState = {
  initialSavings: 500000,
  initialTaxablePct: 60,
  monthlyExpenses: 10000,
  propertyTax: 20000,
  propertyTaxGrowth: 2,
  inflationRate: 3,
  fireExpenseTarget: 135000,
  targetPortfolioMultiple: 25,
  includeHealthcareBuffer: true,
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
  ssWageBaseGrowth: 4.0,
  spendingDecrement65to74: 1,
  spendingDecrement75to84: 4,
  spendingDecrement85plus: 2,
  mcEnabled: false,
  mcIterations: 1000,
  mcVolatility: 15,
  mcTargetSurvival: 90,
  mcRetirementEndAge: 90,
};

export function useCalculatorConfig() {
  const [state, setState] = useState<CalculatorFormState>(initialState);

  const updateField = useCallback(
    <Key extends keyof CalculatorFormState>(
      key: Key,
      value: CalculatorFormState[Key],
    ) => {
      if (key === 'targetPortfolioMultiple') {
        const numericValue = Number(value);
        value = (Number.isFinite(numericValue) && numericValue > 0
          ? numericValue
          : 1) as CalculatorFormState[Key];
      }
      setState((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const safeTargetMultiple = Math.max(state.targetPortfolioMultiple, 1);

  const derivedWithdrawalRate = useMemo(
    () => 100 / safeTargetMultiple,
    [safeTargetMultiple],
  );

  const calculatorInputs = useMemo<CalculatorInputs>(
    () => ({
      currentYear: CURRENT_YEAR,
      initialSavings: state.initialSavings,
      initialTaxablePct: state.initialTaxablePct,
      monthlyExpenses: state.monthlyExpenses,
      propertyTax: state.propertyTax,
      propertyTaxGrowth: state.propertyTaxGrowth,
      inflationRate: state.inflationRate,
      fireExpenseTarget: state.fireExpenseTarget,
      targetPortfolioMultiple: safeTargetMultiple,
      withdrawalRate: derivedWithdrawalRate,
      includeHealthcareBuffer: state.includeHealthcareBuffer,
      annualHealthcareCost: state.annualHealthcareCost,
      taxAdvReturnRate: state.taxAdvReturnRate,
      taxableReturnRate: state.taxableReturnRate,
      spouseIncome2025: state.spouseIncome2025,
      spouseIncomeGrowth: state.spouseIncomeGrowth,
      myIncome2025: state.myIncome2025,
      bigLawStartYear: state.bigLawStartYear,
      clerkingStartYear: state.clerkingStartYear,
      clerkingEndYear: state.clerkingEndYear,
      clerkingSalary: state.clerkingSalary,
      returnToFirmYear: state.returnToFirmYear,
      publicInterestYear: state.publicInterestYear,
      publicInterestSalary: state.publicInterestSalary,
      publicInterestGrowth: state.publicInterestGrowth,
      mySocialSecurityAmount: state.mySocialSecurityAmount,
      mySocialSecurityStartAge: state.mySocialSecurityStartAge,
      spouseSocialSecurityAmount: state.spouseSocialSecurityAmount,
      spouseSocialSecurityStartAge: state.spouseSocialSecurityStartAge,
      tuitionPerSemester: state.tuitionPerSemester,
      daughter1Birth: state.daughter1Birth,
      daughter2Birth: state.daughter2Birth,
      initial529Balance: state.initial529Balance,
      annual529Contribution: state.annual529Contribution,
      collegeCostPerYear: state.collegeCostPerYear,
      collegeInflation: state.collegeInflation,
      rentalIncome: state.rentalIncome,
      rentalMortgagePandI: state.rentalMortgagePandI,
      rentalMortgageStartYear: state.rentalMortgageStartYear,
      rentalMortgageOriginalPrincipal: state.rentalMortgageOriginalPrincipal,
      rentalMortgageRate: state.rentalMortgageRate,
      mortgageEndYear: state.mortgageEndYear,
      rentalPropertyTax: state.rentalPropertyTax,
      rentalPropertyTaxGrowth: state.rentalPropertyTaxGrowth,
      rentalInsurance: state.rentalInsurance,
      rentalMaintenanceCapex: state.rentalMaintenanceCapex,
      rentalVacancyRate: state.rentalVacancyRate,
      standardDeduction: state.standardDeduction,
      itemizedDeductions: state.itemizedDeductions,
      ssWageBase2025: state.ssWageBase2025,
      ssWageBaseGrowth: state.ssWageBaseGrowth,
      spendingDecrement65to74: state.spendingDecrement65to74,
      spendingDecrement75to84: state.spendingDecrement75to84,
      spendingDecrement85plus: state.spendingDecrement85plus,
    }),
    [state],
  );

  const mcSettings = useMemo(
    () => ({
      enabled: state.mcEnabled,
      iterations: state.mcIterations,
      volatility: state.mcVolatility,
      targetSurvival: state.mcTargetSurvival,
      retirementEndAge: state.mcRetirementEndAge,
    }),
    [
      state.mcEnabled,
      state.mcIterations,
      state.mcVolatility,
      state.mcTargetSurvival,
      state.mcRetirementEndAge,
    ],
  );

  return {
    currentYear: CURRENT_YEAR,
    state,
    updateField,
    calculatorInputs,
    mcSettings,
    derivedWithdrawalRate,
  };
}
