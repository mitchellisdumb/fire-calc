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
      expect(() =>
        runAccumulationMonteCarlo(inputs, projections, {
          iterations: 10,
          volatility: 15,
          targetSurvival: 90,
          retirementEndAge: 90,
          useHistoricalReturns: true,
        }),
      ).not.toThrow();
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
      expect(() =>
        runWithdrawalMonteCarlo(
          inputs,
          projections,
          {
            iterations: 10,
            volatility: 15,
            targetSurvival: 90,
            retirementEndAge: 90,
            useHistoricalReturns: true,
          },
          options,
        ),
      ).not.toThrow();
      expect(randomSpy).not.toHaveBeenCalled();
    } finally {
      randomSpy.mockRestore();
    }
  });
});
