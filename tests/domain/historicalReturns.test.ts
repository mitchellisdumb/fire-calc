import { describe, it, expect } from 'vitest';
import {
  SP500_HISTORICAL_RETURNS,
  generateHistoricalSequence,
  generateSequentialHistory,
} from '../../src/domain/historicalReturns';

describe('historicalReturns', () => {
  describe('SP500_HISTORICAL_RETURNS', () => {
    it('contains 97 years of data (1928-2024)', () => {
      expect(SP500_HISTORICAL_RETURNS).toHaveLength(97);
    });

    it('has correct year range', () => {
      const years = SP500_HISTORICAL_RETURNS.map((r) => r.year);
      expect(Math.min(...years)).toBe(1928);
      expect(Math.max(...years)).toBe(2024);
    });

    it('has all required fields for each entry', () => {
      SP500_HISTORICAL_RETURNS.forEach((entry) => {
        expect(entry).toHaveProperty('year');
        expect(entry).toHaveProperty('nominalReturn');
        expect(entry).toHaveProperty('inflation');
        expect(entry).toHaveProperty('realReturn');

        expect(typeof entry.year).toBe('number');
        expect(typeof entry.nominalReturn).toBe('number');
        expect(typeof entry.inflation).toBe('number');
        expect(typeof entry.realReturn).toBe('number');
      });
    });

    it('has finite values for all returns', () => {
      SP500_HISTORICAL_RETURNS.forEach((entry) => {
        expect(Number.isFinite(entry.nominalReturn)).toBe(true);
        expect(Number.isFinite(entry.inflation)).toBe(true);
        expect(Number.isFinite(entry.realReturn)).toBe(true);
      });
    });

    it('has years in chronological order', () => {
      for (let i = 1; i < SP500_HISTORICAL_RETURNS.length; i++) {
        const prevYear = SP500_HISTORICAL_RETURNS[i - 1].year;
        const currYear = SP500_HISTORICAL_RETURNS[i].year;
        expect(currYear).toBe(prevYear + 1);
      }
    });

    it('includes famous crash years with negative returns', () => {
      // 1929 - Great Depression
      const crash1929 = SP500_HISTORICAL_RETURNS.find((r) => r.year === 1929);
      expect(crash1929).toBeDefined();
      expect(crash1929!.nominalReturn).toBeLessThan(0);

      // 2008 - Financial Crisis
      const crash2008 = SP500_HISTORICAL_RETURNS.find((r) => r.year === 2008);
      expect(crash2008).toBeDefined();
      expect(crash2008!.nominalReturn).toBeLessThan(0);
    });

    it('real return approximately equals nominal minus inflation', () => {
      SP500_HISTORICAL_RETURNS.forEach((entry) => {
        // Real return ≈ nominal - inflation (Fisher approximation)
        const expected = entry.nominalReturn - entry.inflation;
        const actual = entry.realReturn;

        // Allow small discrepancy due to exact formula: (1+nominal)/(1+inflation) - 1
        expect(Math.abs(actual - expected)).toBeLessThan(2);
      });
    });

    it('has realistic return ranges', () => {
      const nominalReturns = SP500_HISTORICAL_RETURNS.map((r) => r.nominalReturn);

      // Historical S&P 500 has ranged from about -43% to +54%
      expect(Math.min(...nominalReturns)).toBeGreaterThan(-50);
      expect(Math.max(...nominalReturns)).toBeLessThan(60);
    });
  });

  describe('generateHistoricalSequence', () => {
    it('returns array of correct length', () => {
      const sequence = generateHistoricalSequence(SP500_HISTORICAL_RETURNS, 30);
      expect(sequence).toHaveLength(30);
    });

    it('returns decimal returns (not percentages)', () => {
      const sequence = generateHistoricalSequence(SP500_HISTORICAL_RETURNS, 10);

      sequence.forEach((returnValue) => {
        // Returns should be in decimal form (e.g., 0.10 for 10%, not 10)
        expect(Math.abs(returnValue)).toBeLessThan(1); // Most returns are < 100%
      });
    });

    it('samples from actual historical data', () => {
      const sequence = generateHistoricalSequence(SP500_HISTORICAL_RETURNS, 100);

      // Every value should match one of the historical nominal returns (in decimal form)
      const historicalValues = SP500_HISTORICAL_RETURNS.map((r) => r.nominalReturn / 100);

      sequence.forEach((returnValue) => {
        const found = historicalValues.some(
          (historical) => Math.abs(returnValue - historical) < 0.0001
        );
        expect(found).toBe(true);
      });
    });

    it('produces different sequences without seed', () => {
      const seq1 = generateHistoricalSequence(SP500_HISTORICAL_RETURNS, 30);
      const seq2 = generateHistoricalSequence(SP500_HISTORICAL_RETURNS, 30);

      // Should be different (very unlikely to be identical by chance)
      const identical = seq1.every((val, idx) => val === seq2[idx]);
      expect(identical).toBe(false);
    });

    it('produces identical sequences with same seed', () => {
      const seed = 12345;
      const seq1 = generateHistoricalSequence(SP500_HISTORICAL_RETURNS, 30, seed);
      const seq2 = generateHistoricalSequence(SP500_HISTORICAL_RETURNS, 30, seed);

      expect(seq1).toEqual(seq2);
    });

    it('produces different sequences with different seeds', () => {
      const seq1 = generateHistoricalSequence(SP500_HISTORICAL_RETURNS, 30, 111);
      const seq2 = generateHistoricalSequence(SP500_HISTORICAL_RETURNS, 30, 222);

      const identical = seq1.every((val, idx) => val === seq2[idx]);
      expect(identical).toBe(false);
    });

    it('uses seeded randomness instead of deterministic rotation', () => {
      const seed = 42;
      const length = 25;
      const rotation = Array.from({ length }, (_, i) => {
        const idx = (seed + i) % SP500_HISTORICAL_RETURNS.length;
        return SP500_HISTORICAL_RETURNS[idx].nominalReturn / 100;
      });
      const sequence = generateHistoricalSequence(SP500_HISTORICAL_RETURNS, length, seed);

      expect(sequence).not.toEqual(rotation);
    });

    it('handles short sequences (1 year)', () => {
      const sequence = generateHistoricalSequence(SP500_HISTORICAL_RETURNS, 1);
      expect(sequence).toHaveLength(1);
      expect(typeof sequence[0]).toBe('number');
      expect(Number.isFinite(sequence[0])).toBe(true);
    });

    it('handles long sequences (100+ years)', () => {
      const sequence = generateHistoricalSequence(SP500_HISTORICAL_RETURNS, 150);
      expect(sequence).toHaveLength(150);

      sequence.forEach((returnValue) => {
        expect(Number.isFinite(returnValue)).toBe(true);
      });
    });

    it('bootstrap sampling allows repetition', () => {
      // With 97 historical values and 97 samples, we should see some repetition
      const sequence = generateHistoricalSequence(SP500_HISTORICAL_RETURNS, 97);
      const uniqueValues = new Set(sequence);

      // Should have fewer unique values than total (with high probability)
      expect(uniqueValues.size).toBeLessThan(sequence.length);
    });

    it('returns all finite numbers', () => {
      const sequence = generateHistoricalSequence(SP500_HISTORICAL_RETURNS, 50);

      sequence.forEach((returnValue) => {
        expect(Number.isFinite(returnValue)).toBe(true);
        expect(Number.isNaN(returnValue)).toBe(false);
      });
    });
  });

  describe('generateSequentialHistory', () => {
    it('returns correct length sequence', () => {
      const sequence = generateSequentialHistory(SP500_HISTORICAL_RETURNS, 1950, 10);
      expect(sequence).toHaveLength(10);
    });

    it('returns sequential years starting from start year', () => {
      const startYear = 1950;
      const length = 10;
      const sequence = generateSequentialHistory(SP500_HISTORICAL_RETURNS, startYear, length);

      // Get the actual years from data
      const actualYears = SP500_HISTORICAL_RETURNS.slice(
        startYear - 1928,
        startYear - 1928 + length
      ).map((r) => r.nominalReturn / 100);

      expect(sequence).toEqual(actualYears);
    });

    it('correctly pulls Great Depression sequence', () => {
      // 1929-1932: Great Depression years
      const sequence = generateSequentialHistory(SP500_HISTORICAL_RETURNS, 1929, 4);

      // All should be negative returns during crash
      expect(sequence[0]).toBeLessThan(0); // 1929 crash
      expect(sequence[1]).toBeLessThan(0); // 1930 continued decline
      expect(sequence[2]).toBeLessThan(0); // 1931 continued decline
      expect(sequence[3]).toBeLessThan(0); // 1932 bottom
    });

    it('correctly pulls 2008 financial crisis', () => {
      const sequence = generateSequentialHistory(SP500_HISTORICAL_RETURNS, 2008, 2);

      // 2008 should be large negative return
      expect(sequence[0]).toBeLessThan(-0.30); // Worse than -30%

      // 2009 should be strong positive recovery
      expect(sequence[1]).toBeGreaterThan(0.20); // Better than +20%
    });

    it('correctly pulls 1990s bull market', () => {
      // 1995-1999: Tech boom
      const sequence = generateSequentialHistory(SP500_HISTORICAL_RETURNS, 1995, 5);

      // All should be strong positive returns
      sequence.forEach((returnValue) => {
        expect(returnValue).toBeGreaterThan(0.15); // Each year >15%
      });
    });

    it('wraps around when exceeding data range', () => {
      // Start near end of data
      const sequence = generateSequentialHistory(SP500_HISTORICAL_RETURNS, 2020, 10);

      // Should wrap back to 1928 after 2024
      expect(sequence).toHaveLength(10);

      // First values should be from 2020-2024
      const expected2020 = SP500_HISTORICAL_RETURNS.find((r) => r.year === 2020);
      expect(sequence[0]).toBeCloseTo(expected2020!.nominalReturn / 100, 4);

      // Later values should wrap around to 1928+
      const expected1928 = SP500_HISTORICAL_RETURNS.find((r) => r.year === 1928);
      expect(sequence[5]).toBeCloseTo(expected1928!.nominalReturn / 100, 4);
    });

    it('handles single year request', () => {
      const sequence = generateSequentialHistory(SP500_HISTORICAL_RETURNS, 1950, 1);
      expect(sequence).toHaveLength(1);

      const expected = SP500_HISTORICAL_RETURNS.find((r) => r.year === 1950);
      expect(sequence[0]).toBeCloseTo(expected!.nominalReturn / 100, 4);
    });

    it('returns decimal returns not percentages', () => {
      const sequence = generateSequentialHistory(SP500_HISTORICAL_RETURNS, 1950, 10);

      sequence.forEach((returnValue) => {
        // Should be decimal form
        expect(Math.abs(returnValue)).toBeLessThan(1);
      });
    });

    it('returns all finite numbers', () => {
      const sequence = generateSequentialHistory(SP500_HISTORICAL_RETURNS, 1950, 20);

      sequence.forEach((returnValue) => {
        expect(Number.isFinite(returnValue)).toBe(true);
        expect(Number.isNaN(returnValue)).toBe(false);
      });
    });

    it('preserves exact historical values', () => {
      const startYear = 2000;
      const length = 5;
      const sequence = generateSequentialHistory(SP500_HISTORICAL_RETURNS, startYear, length);

      // Manually verify against known data
      for (let i = 0; i < length; i++) {
        const year = startYear + i;
        const historical = SP500_HISTORICAL_RETURNS.find((r) => r.year === year);
        expect(sequence[i]).toBeCloseTo(historical!.nominalReturn / 100, 6);
      }
    });
  });
});
