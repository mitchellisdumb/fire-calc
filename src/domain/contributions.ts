import { CalculatorInputs } from './types';

export function calculateEmployerMatch(
  myIncome: number,
  spouseIncome: number,
  year: number,
  inputs: Pick<CalculatorInputs, 'clerkingStartYear' | 'clerkingEndYear' | 'publicInterestYear'>,
): number {
  const { clerkingStartYear, clerkingEndYear, publicInterestYear } = inputs;
  const spouseMatch = spouseIncome * 0.04;
  let myMatch = 0;

  if (year >= clerkingStartYear && year < clerkingEndYear) {
    myMatch = myIncome * 0.04;
  } else if (year >= publicInterestYear) {
    myMatch = myIncome * 0.04;
  }

  return myMatch + spouseMatch;
}
