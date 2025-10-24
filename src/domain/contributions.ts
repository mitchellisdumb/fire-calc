import { CalculatorInputs } from './types';

// Employer match calculations are centralised here so the projection engine can
// reuse the same logic regardless of who initiates the scenario. BigLaw associates
// in this model receive no match; only clerking/public-interest roles do.
export function calculateEmployerMatch(
  myIncome: number,
  spouseIncome: number,
  year: number,
  inputs: Pick<CalculatorInputs, 'clerkingStartYear' | 'clerkingEndYear' | 'publicInterestYear'>,
): number {
  const { clerkingStartYear, clerkingEndYear, publicInterestYear } = inputs;
  // The spouse has a stable 4% match throughout the entire horizon.
  const spouseMatch = spouseIncome * 0.04;
  let myMatch = 0;

  // During federal clerkships the judiciary typically matches 4%, so we apply it
  // across the clerking window.
  if (year >= clerkingStartYear && year < clerkingEndYear) {
    myMatch = myIncome * 0.04;
  // Public interest employers in this scenario also provide a 4% match.
  } else if (year >= publicInterestYear) {
    myMatch = myIncome * 0.04;
  }

  return myMatch + spouseMatch;
}
