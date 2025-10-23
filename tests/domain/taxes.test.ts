import { describe, expect, it } from 'vitest';
import { calculateTaxes } from '../../src/domain/taxes';
import { createDefaultInputs } from './fixtures';

describe('calculateTaxes', () => {
  it('calculates combined federal, state, and FICA for baseline year', () => {
    const inputs = createDefaultInputs();
    const taxes = calculateTaxes({
      year: 2028,
      myIncome: 225000,
      spouseIncome: 218545,
      rentalNetForTaxes: 20000,
      socialSecurityIncome: 0,
      inputs,
    });

    expect(taxes.totalTax).toBeGreaterThan(90000);
    expect(taxes.federalTax).toBeLessThan(taxes.totalTax);
    expect(Number(taxes.effectiveRate)).toBeGreaterThan(25);
    expect(Number(taxes.effectiveRate)).toBeLessThan(40);
  });

  it('handles low provisional income with non-taxable social security', () => {
    const inputs = createDefaultInputs();
    const taxes = calculateTaxes({
      year: 2040,
      myIncome: 0,
      spouseIncome: 0,
      rentalNetForTaxes: 10000,
      socialSecurityIncome: 20000,
      inputs,
    });

    expect(taxes.totalTax).toBe(0);
    expect(taxes.federalTax).toBe(0);
    expect(Number(taxes.effectiveRate)).toBe(0);
  });
});
