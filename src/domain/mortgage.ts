// Configuration describing the rental property mortgage. We keep it in one place
// so the projection engine can reason about property cash flow and interest
// deduction without duplicating the amortisation inputs.
export interface MortgageConfig {
  mortgageEndYear: number;
  rentalMortgageStartYear: number;
  rentalMortgageOriginalPrincipal: number;
  rentalMortgageRate: number;
}

// Calculate the total mortgage interest paid during a given calendar year. The
// projection uses this both for tax deductions and to differentiate cash flow
// (which cares about the entire P&I payment) from taxable income (interest only).
export function calculateMortgageInterest(year: number, config: MortgageConfig): number {
  const {
    mortgageEndYear,
    rentalMortgageStartYear,
    rentalMortgageOriginalPrincipal,
    rentalMortgageRate,
  } = config;

  // The loan is assumed to be fully paid by mortgageEndYear, so no further interest
  // is deductible afterwards.
  if (year >= mortgageEndYear) {
    return 0;
  }

  // Standard fixed-rate amortisation. Rates are provided as percentages, hence
  // the division by 100 and 12 to translate to a monthly decimal rate.
  const monthlyRate = rentalMortgageRate / 100 / 12;
  const loanTermMonths = (mortgageEndYear - rentalMortgageStartYear) * 12;

  // Closed-form monthly payment formula avoids simulating the entire amortisation
  // schedule when we just need a yearly slice.
  const monthlyPayment =
    rentalMortgageOriginalPrincipal *
    monthlyRate /
    (1 - Math.pow(1 + monthlyRate, -loanTermMonths));

  const monthsElapsed = Math.max(0, (year - rentalMortgageStartYear) * 12);
  const remainingMonths = Math.max(0, loanTermMonths - monthsElapsed);

  if (remainingMonths <= 0) {
    return 0;
  }

  // Remaining balance after a number of months in a fixed-rate loan can be derived
  // analytically; we use that to avoid iterating from the start year every time.
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

  // Interest is returned as a raw nominal amount for the projection to treat as
  // a deduction and to expose in output tables if needed.
  return annualInterest;
}
