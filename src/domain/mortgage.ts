export interface MortgageConfig {
  mortgageEndYear: number;
  rentalMortgageStartYear: number;
  rentalMortgageOriginalPrincipal: number;
  rentalMortgageRate: number;
}

export function calculateMortgageInterest(year: number, config: MortgageConfig): number {
  const {
    mortgageEndYear,
    rentalMortgageStartYear,
    rentalMortgageOriginalPrincipal,
    rentalMortgageRate,
  } = config;

  if (year >= mortgageEndYear) {
    return 0;
  }

  const monthlyRate = rentalMortgageRate / 100 / 12;
  const loanTermMonths = (mortgageEndYear - rentalMortgageStartYear) * 12;

  const monthlyPayment =
    rentalMortgageOriginalPrincipal *
    monthlyRate /
    (1 - Math.pow(1 + monthlyRate, -loanTermMonths));

  const monthsElapsed = Math.max(0, (year - rentalMortgageStartYear) * 12);
  const remainingMonths = Math.max(0, loanTermMonths - monthsElapsed);

  if (remainingMonths <= 0) {
    return 0;
  }

  const compoundFactor = Math.pow(1 + monthlyRate, monthsElapsed);
  let remainingBalance =
    rentalMortgageOriginalPrincipal * compoundFactor -
    monthlyPayment * (compoundFactor - 1) / monthlyRate;

  let annualInterest = 0;
  const monthsThisYear = Math.min(12, remainingMonths);

  for (let month = 0; month < monthsThisYear; month++) {
    const interest = remainingBalance * monthlyRate;
    annualInterest += interest;
    const principal = monthlyPayment - interest;
    remainingBalance -= principal;
  }

  return annualInterest;
}
