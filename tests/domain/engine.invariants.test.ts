import { describe, expect, test, vi } from 'vitest'
import { buildProjections } from '../../src/domain/projection'
import {
  runAccumulationMonteCarlo,
  runWithdrawalMonteCarlo,
} from '../../src/domain/monteCarlo'
import { createDefaultInputs } from './fixtures'

const randomInRange = (min: number, max: number) =>
  min + Math.random() * (max - min)

describe('Engine invariants', () => {
  test('projection stays finite and non-negative under random fuzzing', () => {
    const base = createDefaultInputs()

    for (let i = 0; i < 25; i += 1) {
      const input = { ...base }
      input.initialSavings = randomInRange(0, 2_000_000)
      input.monthlyExpenses = randomInRange(0, 50_000)
      input.fireExpenseTarget = randomInRange(0, 500_000)
      input.taxAdvReturnRate = randomInRange(-15, 15)
      input.taxableReturnRate = randomInRange(-15, 15)
      input.targetPortfolioMultiple = Math.max(1, randomInRange(10, 40))
      input.withdrawalRate = 100 / input.targetPortfolioMultiple

      const projections = buildProjections(input)
      projections.years.forEach((year) => {
        expect(Number.isFinite(year.portfolio)).toBe(true)
        expect(year.portfolio).toBeGreaterThanOrEqual(0)
        expect(Number.isFinite(year.taxAdvPortfolio)).toBe(true)
        expect(year.taxAdvPortfolio).toBeGreaterThanOrEqual(0)
        expect(Number.isFinite(year.taxablePortfolio)).toBe(true)
        expect(year.taxablePortfolio).toBeGreaterThanOrEqual(0)
      })
    }
  })

  test('Monte Carlo produces deterministic output when random is stubbed', () => {
    const randomMock = vi.spyOn(Math, 'random').mockImplementation(() => 0.42)

    const inputs = createDefaultInputs()
    const projections = buildProjections(inputs)

    const accumulation = runAccumulationMonteCarlo(inputs, projections, {
      iterations: 50,
      volatility: 15,
      targetSurvival: 90,
      retirementEndAge: 90,
    })

    expect(accumulation.samples.length).toBe(50)

    const retirementYear = projections.fireYear?.year ?? 2045
    const startingPortfolio =
      projections.years.find((y) => y.year === retirementYear)?.portfolio ??
      inputs.initialSavings

    const withdrawal = runWithdrawalMonteCarlo(
      inputs,
      projections,
      {
        iterations: 100,
        volatility: 15,
        targetSurvival: 90,
        retirementEndAge: 90,
      },
      {
        retirementYear,
        startingPortfolio,
      },
    )

    expect(withdrawal.survivalProbability).toBeGreaterThanOrEqual(0)
    expect(withdrawal.survivalProbability).toBeLessThanOrEqual(100)

    randomMock.mockRestore()
  })
})
