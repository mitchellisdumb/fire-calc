import { describe, expect, it, vi } from 'vitest';
import {
  runAccumulationMonteCarlo,
  runWithdrawalMonteCarlo,
} from '../../src/domain/monteCarlo';
import { createDefaultInputs } from './fixtures';
import { buildProjections } from '../../src/domain/projection';
import { WithdrawalSimulationOptions } from '../../src/domain/types';

describe('runAccumulationMonteCarlo', () => {
  it('returns readiness probabilities and percentiles', () => {
    const inputs = createDefaultInputs();
    const projections = buildProjections(inputs);

    const result = runAccumulationMonteCarlo(inputs, projections, {
      iterations: 200,
      volatility: 15,
      targetSurvival: 90,
      retirementEndAge: 90,
    });

    expect(result.samples.length).toBe(200);
    expect(result.readinessByYear.length).toBeGreaterThan(0);
    expect(result.percentiles.length).toBe(5);

    const successful = result.percentiles.find((p) => p.percentile === 50);
    if (successful && successful.year !== null) {
      expect(successful.portfolio).toBeGreaterThan(0);
    }
  });

  it('uses deterministic historical returns without random fallback', () => {
    const inputs = createDefaultInputs();
    const projections = buildProjections(inputs);
    const randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Historical Monte Carlo should not call Math.random() when seeded.');
    });

    try {
      const result = runAccumulationMonteCarlo(inputs, projections, {
        iterations: 10,
        volatility: 15,
        targetSurvival: 90,
        retirementEndAge: 90,
        useHistoricalReturns: true,
        historicalSeed: 123,
        stockAllocation: 50,
        bondReturn: 4,
      });
      expect(result.historical).toBeTruthy();
      expect(result.historical?.sequenceStartYears).toHaveLength(10);
      result.historical?.sequenceStartYears.forEach((year) => {
        if (year !== null) {
          expect(year).toBeGreaterThanOrEqual(1928);
          expect(year).toBeLessThanOrEqual(2024);
        }
      });
      expect(result.historical?.stockAllocation).toBeCloseTo(50, 5);
      expect(result.historical?.bondReturn).toBe(4);
      expect(randomSpy).not.toHaveBeenCalled();
    } finally {
      randomSpy.mockRestore();
    }
  });
});

describe('runWithdrawalMonteCarlo', () => {
  it('produces survival probability and yearly percentiles', () => {
    const inputs = createDefaultInputs();
    const projections = buildProjections(inputs);

    const options: WithdrawalSimulationOptions = {
      retirementYear: 2045,
      startingPortfolio: projections.years.find((y) => y.year === 2045)?.portfolio ?? 2000000,
    };

    const result = runWithdrawalMonteCarlo(inputs, projections, {
      iterations: 200,
      volatility: 15,
      targetSurvival: 90,
      retirementEndAge: 90,
    }, options);

    expect(result.allSimulations).toHaveLength(200);
    expect(result.survivalProbability).toBeGreaterThanOrEqual(0);
    expect(result.survivalProbability).toBeLessThanOrEqual(100);
    expect(result.depletionProbability).toBeGreaterThanOrEqual(0);
    expect(Object.keys(result.yearlyPercentiles).length).toBeGreaterThan(0);
  });

  it('uses seeded historical returns without random fallback', () => {
    const inputs = createDefaultInputs();
    const projections = buildProjections(inputs);
    const options: WithdrawalSimulationOptions = {
      retirementYear: 2045,
      startingPortfolio: projections.years.find((y) => y.year === 2045)?.portfolio ?? 2000000,
    };
    const randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Historical Monte Carlo should not call Math.random() when seeded.');
    });

    try {
      const result = runWithdrawalMonteCarlo(
        inputs,
        projections,
        {
          iterations: 10,
          volatility: 15,
          targetSurvival: 90,
          retirementEndAge: 90,
          useHistoricalReturns: true,
          historicalSeed: 456,
          stockAllocation: 50,
          bondReturn: 4,
        },
        options,
      );
      expect(result.historical).toBeTruthy();
      expect(result.historical?.sequenceStartYears).toHaveLength(10);
      expect(result.historical?.stockAllocation).toBeCloseTo(50, 5);
      expect(result.historical?.bondReturn).toBe(4);
      expect(randomSpy).not.toHaveBeenCalled();
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('applies custom historical allocation metadata', () => {
    const inputs = createDefaultInputs();
    const projections = buildProjections(inputs);
    const options: WithdrawalSimulationOptions = {
      retirementYear: 2045,
      startingPortfolio: projections.years.find((y) => y.year === 2045)?.portfolio ?? 2000000,
    };

    const result = runWithdrawalMonteCarlo(
      inputs,
      projections,
      {
        iterations: 5,
        volatility: 15,
        targetSurvival: 90,
        retirementEndAge: 90,
        useHistoricalReturns: true,
        stockAllocation: 65,
        bondReturn: 2.5,
        historicalSeed: 789,
      },
      options,
    );

    expect(result.historical).toBeTruthy();
    expect(result.historical?.stockAllocation).toBeCloseTo(65, 5);
    expect(result.historical?.bondReturn).toBeCloseTo(2.5, 5);
  });
});
