import { describe, it, expect } from 'vitest';
import { calculateEmployerMatch } from '../../src/domain/contributions';

describe('contributions', () => {
  describe('calculateEmployerMatch', () => {
    const baseInputs = {
      clerkingStartYear: 2029,
      clerkingEndYear: 2031,
      publicInterestYear: 2036,
    };

    it('calculates spouse match at 4% for all years', () => {
      const spouseIncome = 200000;
      const myIncome = 0;

      // Spouse gets match regardless of year
      const match2025 = calculateEmployerMatch(myIncome, spouseIncome, 2025, baseInputs);
      const match2030 = calculateEmployerMatch(myIncome, spouseIncome, 2030, baseInputs);
      const match2040 = calculateEmployerMatch(myIncome, spouseIncome, 2040, baseInputs);

      expect(match2025).toBe(8000); // 200k * 0.04
      expect(match2030).toBe(8000);
      expect(match2040).toBe(8000);
    });

    it('returns zero for my match during BigLaw years (no match)', () => {
      const myIncome = 300000;
      const spouseIncome = 200000;

      // BigLaw years (2025-2028) - no match for me
      const match2025 = calculateEmployerMatch(myIncome, spouseIncome, 2025, baseInputs);
      const match2028 = calculateEmployerMatch(myIncome, spouseIncome, 2028, baseInputs);

      // Only spouse match (8k)
      expect(match2025).toBe(8000);
      expect(match2028).toBe(8000);
    });

    it('calculates 4% match during clerking years', () => {
      const myIncome = 100000;
      const spouseIncome = 200000;

      // Clerking years (2029-2030)
      const match2029 = calculateEmployerMatch(myIncome, spouseIncome, 2029, baseInputs);
      const match2030 = calculateEmployerMatch(myIncome, spouseIncome, 2030, baseInputs);

      // My match (4k) + spouse match (8k) = 12k
      expect(match2029).toBe(12000);
      expect(match2030).toBe(12000);
    });

    it('returns to zero for my match after clerking, before public interest', () => {
      const myIncome = 300000;
      const spouseIncome = 200000;

      // Years 2031-2035: back to BigLaw, no match for me
      const match2031 = calculateEmployerMatch(myIncome, spouseIncome, 2031, baseInputs);
      const match2035 = calculateEmployerMatch(myIncome, spouseIncome, 2035, baseInputs);

      // Only spouse match (8k)
      expect(match2031).toBe(8000);
      expect(match2035).toBe(8000);
    });

    it('calculates 4% match during public interest years', () => {
      const myIncome = 110000;
      const spouseIncome = 200000;

      // Public interest years (2036+)
      const match2036 = calculateEmployerMatch(myIncome, spouseIncome, 2036, baseInputs);
      const match2040 = calculateEmployerMatch(myIncome, spouseIncome, 2040, baseInputs);
      const match2050 = calculateEmployerMatch(myIncome, spouseIncome, 2050, baseInputs);

      // My match (4.4k) + spouse match (8k) = 12.4k
      expect(match2036).toBe(12400);
      expect(match2040).toBe(12400);
      expect(match2050).toBe(12400);
    });

    it('handles clerking end year boundary correctly', () => {
      const myIncome = 100000;
      const spouseIncome = 200000;

      // Last clerking year (inclusive)
      const match2030 = calculateEmployerMatch(myIncome, spouseIncome, 2030, baseInputs);
      expect(match2030).toBe(12000); // Should have match

      // First year after clerking (exclusive)
      const match2031 = calculateEmployerMatch(myIncome, spouseIncome, 2031, baseInputs);
      expect(match2031).toBe(8000); // Should NOT have match
    });

    it('handles public interest boundary correctly', () => {
      const myIncome = 110000;
      const spouseIncome = 200000;

      // Year before public interest
      const match2035 = calculateEmployerMatch(myIncome, spouseIncome, 2035, baseInputs);
      expect(match2035).toBe(8000); // No match yet

      // First public interest year
      const match2036 = calculateEmployerMatch(myIncome, spouseIncome, 2036, baseInputs);
      expect(match2036).toBe(12400); // Should have match
    });

    it('correctly combines both employer matches', () => {
      const myIncome = 100000;
      const spouseIncome = 250000;

      // During clerking
      const matchClerking = calculateEmployerMatch(myIncome, spouseIncome, 2029, baseInputs);
      expect(matchClerking).toBe(14000); // 4k + 10k

      // During public interest
      const matchPI = calculateEmployerMatch(myIncome, spouseIncome, 2036, baseInputs);
      expect(matchPI).toBe(14000); // 4k + 10k
    });

    it('handles zero income correctly', () => {
      const match = calculateEmployerMatch(0, 0, 2029, baseInputs);
      expect(match).toBe(0);
    });

    it('handles high incomes correctly (no cap on match)', () => {
      const myIncome = 500000;
      const spouseIncome = 500000;

      // During public interest with high income
      const match = calculateEmployerMatch(myIncome, spouseIncome, 2036, baseInputs);

      // 4% of each income
      expect(match).toBe(40000); // 20k + 20k
    });

    it('returns numeric values for all valid inputs', () => {
      const myIncome = 100000;
      const spouseIncome = 200000;

      for (let year = 2025; year <= 2050; year++) {
        const match = calculateEmployerMatch(myIncome, spouseIncome, year, baseInputs);
        expect(typeof match).toBe('number');
        expect(Number.isFinite(match)).toBe(true);
        expect(match).toBeGreaterThanOrEqual(0);
      }
    });

    it('matches timeline transitions correctly', () => {
      const myIncome = 100000;
      const spouseIncome = 200000;
      const expectedSpouseOnly = 8000;
      const expectedBoth = 12000;

      // Timeline: BigLaw → Clerking → BigLaw → Public Interest
      const timeline = [
        { year: 2025, expected: expectedSpouseOnly, phase: 'BigLaw' },
        { year: 2028, expected: expectedSpouseOnly, phase: 'BigLaw' },
        { year: 2029, expected: expectedBoth, phase: 'Clerking' },
        { year: 2030, expected: expectedBoth, phase: 'Clerking' },
        { year: 2031, expected: expectedSpouseOnly, phase: 'Return to BigLaw' },
        { year: 2035, expected: expectedSpouseOnly, phase: 'BigLaw' },
        { year: 2036, expected: expectedBoth, phase: 'Public Interest' },
        { year: 2040, expected: expectedBoth, phase: 'Public Interest' },
      ];

      timeline.forEach(({ year, expected, phase }) => {
        const match = calculateEmployerMatch(myIncome, spouseIncome, year, baseInputs);
        expect(match).toBe(expected);
      });
    });

    it('handles edge case where clerking starts and ends in same year', () => {
      const edgeInputs = {
        clerkingStartYear: 2029,
        clerkingEndYear: 2029, // Same year
        publicInterestYear: 2036,
      };

      const myIncome = 100000;
      const spouseIncome = 200000;

      // Year 2029 should NOT have clerking match (start <= year < end)
      const match = calculateEmployerMatch(myIncome, spouseIncome, 2029, edgeInputs);
      expect(match).toBe(8000); // Only spouse match
    });
  });
});
