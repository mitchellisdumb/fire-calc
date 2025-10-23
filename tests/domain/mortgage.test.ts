import { describe, expect, it } from 'vitest';
import { calculateMortgageInterest, MortgageConfig } from '../../src/domain/mortgage';

const config: MortgageConfig = {
  mortgageEndYear: 2051,
  rentalMortgageStartYear: 2020,
  rentalMortgageOriginalPrincipal: 400000,
  rentalMortgageRate: 2.75,
};

describe('calculateMortgageInterest', () => {
  it('matches expected monthly payment interest for early years', () => {
    const interest2025 = calculateMortgageInterest(2025, config);
    expect(interest2025).toBeGreaterThan(9000);
    expect(interest2025).toBeLessThan(11000);
  });

  it('drops to zero after payoff year', () => {
    expect(calculateMortgageInterest(2051, config)).toBe(0);
  });
});
