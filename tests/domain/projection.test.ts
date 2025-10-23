import { describe, expect, it } from 'vitest';
import { buildProjections } from '../../src/domain/projection';
import { createDefaultInputs } from './fixtures';

describe('buildProjections', () => {
  it('produces a multi-decade projection with FIRE milestone', () => {
    const inputs = createDefaultInputs();
    const result = buildProjections(inputs);

    expect(result.years.length).toBeGreaterThan(50);
    const firstYear = result.years[0];
    expect(firstYear.year).toBe(inputs.currentYear);
    expect(firstYear.myIncome).toBe(inputs.myIncome2025);
    expect(firstYear.totalExpenses).toBeGreaterThan(120000);

    expect(result.fireYear).not.toBeNull();
    if (result.fireYear) {
      expect(result.fireYear.year).toBeGreaterThanOrEqual(2040);
      expect(result.fireYear.year).toBeLessThanOrEqual(2060);
    }
  });
});
