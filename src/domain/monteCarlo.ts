import {
  calculatePercentile,
  generateLognormalReturn,
  initializeHistoricalSequence,
  getNextHistoricalReturn,
  resetHistoricalSequence,
} from './statistics'
import {
  AccumulationMonteCarloResult,
  AccumulationMonteCarloSample,
  CalculatorInputs,
  MonteCarloSettings,
  ProjectionResult,
  ReadinessPercentile,
  ReadinessProbabilityPoint,
  SimulationResult,
  SimulationTimelineEntry,
  WithdrawalMonteCarloResult,
  WithdrawalSimulationOptions,
  YearlyPercentiles,
} from './types'
import { clampMin, dec, toNumber } from './money'

// Percentiles we expose in the UI and API responses. Keeping this constant array
// here avoids magic numbers sprinkled throughout the code.
const PERCENTILES = [10, 25, 50, 75, 90] as const;
const HISTORICAL_DRAWS_PER_YEAR = 2; // tax-advantaged and taxable return draws per simulation year

// Transform a map of year → array of balances into per-year percentile summaries.
// This powers the post-retirement chart shading (p10/p25/p50/p75/p90 bands).
function buildYearlyPercentiles(yearlyResults: Record<number, number[]>): Record<number, YearlyPercentiles> {
  const percentileByYear: Record<number, YearlyPercentiles> = {};

  for (const [yearKey, values] of Object.entries(yearlyResults)) {
    const sorted = [...values].sort((a, b) => a - b);
    const year = Number(yearKey);

    percentileByYear[year] = {
      p10: Math.round(calculatePercentile(sorted, 10)),
      p25: Math.round(calculatePercentile(sorted, 25)),
      p50: Math.round(calculatePercentile(sorted, 50)),
      p75: Math.round(calculatePercentile(sorted, 75)),
      p90: Math.round(calculatePercentile(sorted, 90)),
    };
  }

  return percentileByYear;
}

// Run the accumulation-phase Monte Carlo: we replay the deterministic projection
// and layer stochastic annual returns to estimate when FIRE readiness is hit.
export function runAccumulationMonteCarlo(
  inputs: CalculatorInputs,
  projections: ProjectionResult,
  settings: MonteCarloSettings,
): AccumulationMonteCarloResult {
  const {
    initialSavings,
    initialTaxablePct,
    taxAdvReturnRate,
    taxableReturnRate,
  } = inputs;

  const { iterations, volatility, useHistoricalReturns = false } = settings;

  const samples: AccumulationMonteCarloSample[] = [];

  for (let sim = 0; sim < iterations; sim++) {
    // Initialize historical sequence for this simulation if needed
    if (useHistoricalReturns) {
      initializeHistoricalSequence(projections.years.length * HISTORICAL_DRAWS_PER_YEAR, sim);
    }

    // Start each simulation from the same initial state the deterministic
    // projection uses so the randomised results remain directly comparable.
    let taxAdvPortfolio = dec(initialSavings)
      .mul(dec(100).sub(initialTaxablePct))
      .div(100)
    let taxablePortfolio = dec(initialSavings).mul(initialTaxablePct).div(100)

    let crossingYear: number | null = null;
    let crossingPortfolio: number | null = null;

    for (let yearIdx = 0; yearIdx < projections.years.length; yearIdx++) {
      const baseYear = projections.years[yearIdx];

      // Generate returns based on mode
      const taxAdvReturn = useHistoricalReturns
        ? getNextHistoricalReturn()
        : generateLognormalReturn(taxAdvReturnRate, volatility);
      const taxReturn = useHistoricalReturns
        ? getNextHistoricalReturn()
        : generateLognormalReturn(taxableReturnRate, volatility);

      const taxAdvContribution = dec(baseYear.taxAdvContribution);
      const taxableContribution = dec(baseYear.taxableContribution);
      const taxableWithdrawal = dec(baseYear.taxableWithdrawal);

      taxAdvPortfolio = taxAdvPortfolio.mul(1 + taxAdvReturn).add(taxAdvContribution);
      taxablePortfolio = taxablePortfolio
        .mul(1 + taxReturn)
        .add(taxableContribution)
        .sub(taxableWithdrawal);

      taxAdvPortfolio = clampMin(taxAdvPortfolio, 0);
      taxablePortfolio = clampMin(taxablePortfolio, 0);

      const portfolio = taxAdvPortfolio.add(taxablePortfolio);

      // We stop as soon as FIRE is attained in a simulation because later years
      // do not change the “time to readiness” metric.
      if (portfolio.greaterThanOrEqualTo(baseYear.fireTarget)) {
        crossingYear = baseYear.year;
        crossingPortfolio = toNumber(portfolio);
        break; // stop on first crossing
      }
    }

    samples.push({
      crossingYear,
      crossingAge: crossingYear !== null ? crossingYear - 1987 : null,
      crossingPortfolio,
    });

    // Reset historical sequence for next simulation
    if (useHistoricalReturns) {
      resetHistoricalSequence();
    }
  }

  // For each calendar year report the probability of having achieved FIRE by then.
  const readinessByYear: ReadinessProbabilityPoint[] = projections.years.map((year) => {
    const successes = samples.filter(
      (sample) => sample.crossingYear !== null && sample.crossingYear <= year.year,
    ).length;

    const probability =
      iterations > 0 ? Math.round((successes / iterations) * 1000) / 10 : 0;

    return {
      year: year.year,
      age: year.year - 1987,
      probability,
    };
  });

  const successfulSamples = samples.filter(
    (sample): sample is Required<AccumulationMonteCarloSample> =>
      sample.crossingYear !== null && sample.crossingPortfolio !== null,
  );

  const successRateOverall =
    iterations > 0 ? (successfulSamples.length / iterations) * 100 : 0;

  const percentiles: ReadinessPercentile[] = PERCENTILES.map((percentile) => {
    if (successfulSamples.length === 0 || successRateOverall < percentile) {
      return {
        percentile,
        year: null,
        age: null,
        portfolio: null,
        successRate: successRateOverall,
      };
    }

    const sorted = successfulSamples
      .map((sample) => ({
        year: sample.crossingYear as number,
        age: sample.crossingAge as number,
        portfolio: sample.crossingPortfolio as number,
      }))
      .sort((a, b) => a.year - b.year);

    const yearsArray = sorted.map((entry) => entry.year);
    const agesArray = sorted.map((entry) => entry.age);
    const portfoliosArray = sorted.map((entry) => entry.portfolio);

    const rawYear = calculatePercentile(yearsArray, percentile);
    const rawAge = calculatePercentile(agesArray, percentile);
    const rawPortfolio = calculatePercentile(portfoliosArray, percentile);

    const roundedYear = Math.round(rawYear);
    const roundedAge = Math.round(rawAge);
    const roundedPortfolio = Math.round(rawPortfolio);

    const readinessPoint =
      readinessByYear.find((point) => point.year === roundedYear) ??
      readinessByYear.find((point) => point.year > roundedYear) ??
      readinessByYear[readinessByYear.length - 1];

    return {
      percentile,
      year: roundedYear,
      age: roundedAge,
      portfolio: roundedPortfolio,
      successRate: readinessPoint?.probability ?? successRateOverall,
    };
  });

  return {
    samples,
    readinessByYear,
    percentiles,
  };
}

// Simulate the withdrawal phase. We reuse deterministic projection cash flows but
// expose toggles so the user can either link to accumulation outputs or override
// the starting portfolio/age entirely.
export function runWithdrawalMonteCarlo(
  inputs: CalculatorInputs,
  projections: ProjectionResult,
  settings: MonteCarloSettings,
  options: WithdrawalSimulationOptions,
): WithdrawalMonteCarloResult {
  const {
    taxAdvReturnRate,
    taxableReturnRate,
    initialTaxablePct,
  } = inputs;

  const { iterations, volatility, retirementEndAge, useHistoricalReturns = false } = settings;

  const retirementIndex = projections.years.findIndex(
    (year) => year.year === options.retirementYear,
  );

  if (retirementIndex === -1) {
    throw new Error('Retirement year is outside the projection timeline.');
  }

  const retirementEndYear = 1987 + retirementEndAge;
  const maxIndex = projections.years.findIndex((year) => year.year > retirementEndYear);
  const endIndex = maxIndex === -1 ? projections.years.length : maxIndex;

  const baseYear = projections.years[retirementIndex];
  const baseTaxAdv = Math.max(0, baseYear.taxAdvPortfolio);
  const baseTaxable = Math.max(0, baseYear.taxablePortfolio);
  const baseTotal = baseTaxAdv + baseTaxable;

  // When Stage 2 is linked we inherit the deterministic portfolio split. If the
  // user runs Phase 2 independently, fall back to the initial taxable percentage.
  const fallbackTaxableRatio = initialTaxablePct / 100;
  const taxAdvRatio =
    baseTotal > 0 ? baseTaxAdv / baseTotal : 1 - fallbackTaxableRatio;
  const taxableRatio = 1 - taxAdvRatio;

  const simResults: SimulationResult[] = [];
  const yearlyResults: Record<number, number[]> = {};

  for (let sim = 0; sim < iterations; sim++) {
    // Initialize historical sequence for this simulation if needed
    if (useHistoricalReturns) {
      const simulationLength = endIndex - retirementIndex;
      initializeHistoricalSequence(simulationLength * HISTORICAL_DRAWS_PER_YEAR, sim);
    }

    let taxAdvPortfolio = dec(options.startingPortfolio).mul(taxAdvRatio)
    let taxablePortfolio = dec(options.startingPortfolio).mul(taxableRatio)

    let portfolioDepleted = false;
    let depletionYear: number | null = null;

    const simYears: SimulationTimelineEntry[] = [];

    for (let yearIdx = retirementIndex; yearIdx < endIndex; yearIdx++) {
      const base = projections.years[yearIdx];
      const year = base.year;

      // Generate returns based on mode
      const taxAdvReturn = useHistoricalReturns
        ? getNextHistoricalReturn()
        : generateLognormalReturn(taxAdvReturnRate, volatility);
      const taxReturn = useHistoricalReturns
        ? getNextHistoricalReturn()
        : generateLognormalReturn(taxableReturnRate, volatility);

      taxAdvPortfolio = taxAdvPortfolio.mul(1 + taxAdvReturn)
      taxablePortfolio = taxablePortfolio.mul(1 + taxReturn)

      // Deterministic projection already rolled up total expenses, rental income,
      // and Social Security. We recompute net expenses here so Monte Carlo only
      // focuses on market volatility and withdrawal taxation.
      const totalExpenses = dec(base.totalExpenses)
      const rentalIncome = dec(base.rentalNetCashFlow)
      const socialSecurityIncome = dec(base.socialSecurityIncome || 0)
      const netExpenses = totalExpenses.sub(rentalIncome).sub(socialSecurityIncome)

      if (netExpenses.greaterThan(0)) {
        let grossNeeded = netExpenses

        // Estimate taxes on withdrawals iteratively. We assume taxable withdrawals
        // face 15% long-term capital gains and tax-advantaged withdrawals face a
        // 31% marginal rate (federal + CA). Three iterations is enough to converge
        // because the tax impact shrinks each round.
        for (let iter = 0; iter < 3; iter++) {
          let taxOnWithdrawal = dec(0)
          const taxableWithdrawal = grossNeeded.lessThanOrEqualTo(taxablePortfolio)
            ? grossNeeded
            : taxablePortfolio
          const taxAdvWithdrawal = grossNeeded.sub(taxableWithdrawal)

          if (taxableWithdrawal.greaterThan(0)) {
            taxOnWithdrawal = taxOnWithdrawal.add(taxableWithdrawal.mul(0.15))
          }

          if (taxAdvWithdrawal.greaterThan(0)) {
            taxOnWithdrawal = taxOnWithdrawal.add(taxAdvWithdrawal.mul(0.31))
          }

          grossNeeded = netExpenses.add(taxOnWithdrawal)
        }

        if (taxablePortfolio.greaterThanOrEqualTo(grossNeeded)) {
          taxablePortfolio = taxablePortfolio.sub(grossNeeded)
        } else {
          const remainingNeeded = grossNeeded.sub(taxablePortfolio)
          taxablePortfolio = dec(0)
          taxAdvPortfolio = clampMin(taxAdvPortfolio.sub(remainingNeeded), 0)
        }
      }

      taxablePortfolio = clampMin(taxablePortfolio, 0)
      taxAdvPortfolio = clampMin(taxAdvPortfolio, 0)

      const currentPortfolio = taxAdvPortfolio.add(taxablePortfolio)

      // Mark the first year the combined balance dips below ~$1k as “depleted”.
      if (!portfolioDepleted && currentPortfolio.lessThan(1000)) {
        portfolioDepleted = true;
        depletionYear = year;
      }

      if (!yearlyResults[year]) yearlyResults[year] = []
      yearlyResults[year].push(toNumber(currentPortfolio))

      simYears.push({
        year,
        portfolio: toNumber(currentPortfolio),
        fireAchieved: yearIdx === retirementIndex,
        retired: true,
      });
    }

    const finalPortfolio =
      simYears.length > 0 ? simYears[simYears.length - 1].portfolio : 0;

    simResults.push({
      fireYear: options.retirementYear,
      fireAge: options.retirementYear - 1987,
      finalPortfolio,
      retirementYear: options.retirementYear,
      portfolioDepleted,
      depletionYear,
      timeline: simYears,
    });

    // Reset historical sequence for next simulation
    if (useHistoricalReturns) {
      resetHistoricalSequence();
    }
  }

  const survivedSimulations = simResults.filter((sim) => !sim.portfolioDepleted);
  const survivalProbability =
    iterations > 0 ? (survivedSimulations.length / iterations) * 100 : 0;

  const depletionYears = simResults
    .filter((sim) => sim.portfolioDepleted && sim.depletionYear !== null)
    .map((sim) => sim.depletionYear as number)
    .sort((a, b) => a - b);

  const depletionProbability =
    iterations > 0 ? (depletionYears.length / iterations) * 100 : 0;

  const medianDepletionYear =
    depletionYears.length > 0
      ? Math.round(calculatePercentile(depletionYears, 50))
      : null;

  const yearlyPercentiles = buildYearlyPercentiles(yearlyResults);

  return {
    survivalProbability,
    depletionProbability,
    medianDepletionYear,
    yearlyPercentiles,
    allSimulations: simResults,
  };
}
