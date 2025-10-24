import { CalculatorInputs } from './types';

// Tax calculation accepts the minimal subset of inputs it needs so callers cannot
// accidentally rely on mutable shared state. This makes the module easy to audit
// and, if the tax rules change, easy to test independently.
export interface TaxParams {
  year: number;
  myIncome: number;
  spouseIncome: number;
  rentalNetForTaxes: number;
  socialSecurityIncome: number;
  inputs: Pick<
    CalculatorInputs,
    | 'currentYear'
    | 'inflationRate'
    | 'standardDeduction'
    | 'itemizedDeductions'
    | 'ssWageBase2025'
    | 'ssWageBaseGrowth'
  >;
}

export interface TaxBreakdown {
  federalTax: number;
  caTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  additionalMedicare: number;
  totalTax: number;
  effectiveRate: string;
}

// Compute federal, California, and payroll taxes for a single year. We treat all
// bracket thresholds as nominal values anchored to 2025 and inflate them so real
// purchasing power stays roughly constant over time.
export function calculateTaxes(params: TaxParams): TaxBreakdown {
  const { year, myIncome, spouseIncome, rentalNetForTaxes, socialSecurityIncome, inputs } = params;
  const {
    currentYear,
    inflationRate,
    standardDeduction,
    itemizedDeductions,
    ssWageBase2025,
    ssWageBaseGrowth,
  } = inputs;

  const wageIncome = myIncome + spouseIncome;
  const provisionalIncome = wageIncome + rentalNetForTaxes + socialSecurityIncome * 0.5;
  const yearsFromNow = year - currentYear;
  const inflationFactor = Math.pow(1 + inflationRate / 100, yearsFromNow);

  const threshold1 = 32000 * inflationFactor;
  const threshold2 = 44000 * inflationFactor;

  // IRS provisional-income rules: 0%, 50%, or 85% of Social Security becomes
  // taxable depending on where provisional income lands relative to thresholds.
  let taxableSS = 0;
  if (provisionalIncome <= threshold1) {
    taxableSS = 0;
  } else if (provisionalIncome <= threshold2) {
    taxableSS = Math.min(socialSecurityIncome * 0.5, (provisionalIncome - threshold1) * 0.5);
  } else {
    const amount1 = (threshold2 - threshold1) * 0.5;
    const amount2 = (provisionalIncome - threshold2) * 0.85;
    taxableSS = Math.min(socialSecurityIncome * 0.85, amount1 + amount2);
  }

  const totalIncome = wageIncome + rentalNetForTaxes + taxableSS;
  const hsaContribution = 8550 * inflationFactor;
  const dependentCareFSA =
    year === 2025
      ? 5000
      : 7500 * Math.pow(1 + inflationRate / 100, Math.max(0, yearsFromNow - 1));

  const adjustedStandardDeduction = standardDeduction * inflationFactor;
  const adjustedItemizedDeductions = itemizedDeductions * inflationFactor;
  const chosenDeduction = Math.max(adjustedStandardDeduction, adjustedItemizedDeductions);

  // Above-the-line deductions (HSA + Dependent Care FSA) plus the larger of
  // standard vs. itemised produce the taxable-income base.
  const totalDeductions = hsaContribution + dependentCareFSA + chosenDeduction;
  const taxableIncome = Math.max(0, totalIncome - totalDeductions);

  // 2025 joint filing brackets, inflated forward. Infinity cap keeps the loop simple.
  const federalBrackets = [
    { limit: 23200 * inflationFactor, rate: 0.1 },
    { limit: 94300 * inflationFactor, rate: 0.12 },
    { limit: 201050 * inflationFactor, rate: 0.22 },
    { limit: 383900 * inflationFactor, rate: 0.24 },
    { limit: 487450 * inflationFactor, rate: 0.32 },
    { limit: 731200 * inflationFactor, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ];

  let federalTax = 0;
  let remainingIncome = taxableIncome;
  let previousLimit = 0;
  for (const bracket of federalBrackets) {
    if (remainingIncome <= 0) break;
    const taxableInBracket = Math.min(remainingIncome, bracket.limit - previousLimit);
    federalTax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
    previousLimit = bracket.limit;
  }

  // California progressive brackets; inflation ensures the model can simulate
  // decades without artificially drifting more taxpayers into higher brackets.
  const caBrackets = [
    { limit: 20198 * inflationFactor, rate: 0.01 },
    { limit: 47884 * inflationFactor, rate: 0.02 },
    { limit: 75576 * inflationFactor, rate: 0.04 },
    { limit: 105146 * inflationFactor, rate: 0.06 },
    { limit: 132590 * inflationFactor, rate: 0.08 },
    { limit: 679278 * inflationFactor, rate: 0.093 },
    { limit: 814732 * inflationFactor, rate: 0.103 },
    { limit: 1000000 * inflationFactor, rate: 0.113 },
    { limit: Infinity, rate: 0.123 },
  ];

  let caTax = 0;
  remainingIncome = taxableIncome;
  previousLimit = 0;
  for (const bracket of caBrackets) {
    if (remainingIncome <= 0) break;
    const taxableInBracket = Math.min(remainingIncome, bracket.limit - previousLimit);
    caTax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
    previousLimit = bracket.limit;
  }

  const ssWageBase = ssWageBase2025 * Math.pow(1 + ssWageBaseGrowth / 100, yearsFromNow);
  const mySSWages = Math.min(myIncome, ssWageBase);
  const spouseSSWages = Math.min(spouseIncome, ssWageBase);
  const socialSecurityTax = (mySSWages + spouseSSWages) * 0.062;

  const medicareTax = wageIncome * 0.0145;
  const additionalMedicare = Math.max(0, wageIncome - 250000) * 0.009;

  const totalTax = federalTax + caTax + socialSecurityTax + medicareTax + additionalMedicare;

  return {
    federalTax: Math.round(federalTax),
    caTax: Math.round(caTax),
    socialSecurityTax: Math.round(socialSecurityTax),
    medicareTax: Math.round(medicareTax),
    additionalMedicare: Math.round(additionalMedicare),
    totalTax: Math.round(totalTax),
    effectiveRate: totalIncome > 0 ? ((totalTax / totalIncome) * 100).toFixed(1) : '0.0',
  };
}
