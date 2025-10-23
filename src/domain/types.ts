export interface CalculatorInputs {
  currentYear: number;
  initialSavings: number;
  initialTaxablePct: number;
  monthlyExpenses: number;
  propertyTax: number;
  propertyTaxGrowth: number;
  inflationRate: number;
  fireExpenseTarget: number;
  targetPortfolioMultiple: number;
  withdrawalRate: number;
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
}

export interface ProjectionYear {
  year: number;
  myIncome: number;
  spouseIncome: number;
  socialSecurityIncome: number;
  totalIncome: number;
  federalTax: number;
  stateTax: number;
  ficaTax: number;
  totalTax: number;
  effectiveRate: string;
  netIncome: number;
  tuition: number;
  expenses: number;
  contribution529: number;
  daughter1CollegeCost: number;
  daughter2CollegeCost: number;
  college529Shortfall: number;
  totalExpenses: number;
  rentalNetCashFlow: number;
  mortgageInterest: number;
  rentalInsurance: number;
  adjustedRentalIncome: number;
  netSavings: number;
  taxAdvContribution: number;
  taxableContribution: number;
  taxableWithdrawal: number;
  portfolioGrowth: number;
  portfolio: number;
  taxAdvPortfolio: number;
  taxablePortfolio: number;
  daughter1_529: number;
  daughter2_529: number;
  total529: number;
  sustainableWithdrawal: number;
  fireTarget: number;
  collegeReserveNeeded: number;
  healthcareBuffer: number;
  isFIRE: boolean;
  deficit: boolean;
}

export interface ProjectionResult {
  years: ProjectionYear[];
  fireYear: ProjectionYear | null;
  overfundingWarning: string | null;
}

export interface MonteCarloSettings {
  iterations: number;
  volatility: number;
  targetSurvival: number;
  retirementEndAge: number;
}

export interface SimulationTimelineEntry {
  year: number;
  portfolio: number;
  fireAchieved: boolean;
  retired: boolean;
}

export interface SimulationResult {
  fireYear: number | null;
  fireAge: number | null;
  finalPortfolio: number;
  retirementYear: number | null;
  portfolioDepleted: boolean;
  depletionYear: number | null;
  timeline: SimulationTimelineEntry[];
}

export interface YearlyPercentiles {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface AccumulationMonteCarloSample {
  crossingYear: number | null;
  crossingAge: number | null;
  crossingPortfolio: number | null;
}

export interface ReadinessProbabilityPoint {
  year: number;
  age: number;
  probability: number;
}

export interface ReadinessPercentile {
  percentile: number;
  year: number | null;
  age: number | null;
  portfolio: number | null;
  successRate: number;
}

export interface AccumulationMonteCarloResult {
  samples: AccumulationMonteCarloSample[];
  readinessByYear: ReadinessProbabilityPoint[];
  percentiles: ReadinessPercentile[];
}

export interface RetirementScenario {
  year: number;
  age: number;
  startingPortfolio: number;
  percentile: number;
  probability: number;
}

export interface WithdrawalMonteCarloResult {
  survivalProbability: number;
  depletionProbability: number;
  medianDepletionYear: number | null;
  yearlyPercentiles: Record<number, YearlyPercentiles>;
  allSimulations: SimulationResult[];
}

export interface WithdrawalSimulationOptions {
  retirementYear: number;
  startingPortfolio: number;
}
