import { calculatePercentile, generateLognormalReturn } from './statistics';
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
} from './types';

const PERCENTILES = [10, 25, 50, 75, 90] as const;

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

  const { iterations, volatility } = settings;

  const samples: AccumulationMonteCarloSample[] = [];

  for (let sim = 0; sim < iterations; sim++) {
    let taxAdvPortfolio = (initialSavings * (100 - initialTaxablePct)) / 100;
    let taxablePortfolio = (initialSavings * initialTaxablePct) / 100;

    let crossingYear: number | null = null;
    let crossingPortfolio: number | null = null;

    for (let yearIdx = 0; yearIdx < projections.years.length; yearIdx++) {
      const baseYear = projections.years[yearIdx];

      const taxAdvReturn = generateLognormalReturn(taxAdvReturnRate, volatility);
      const taxReturn = generateLognormalReturn(taxableReturnRate, volatility);

      const taxAdvContribution = baseYear.taxAdvContribution;
      const taxableContribution = baseYear.taxableContribution;
      const taxableWithdrawal = baseYear.taxableWithdrawal;

      taxAdvPortfolio = taxAdvPortfolio * (1 + taxAdvReturn) + taxAdvContribution;
      taxablePortfolio =
        taxablePortfolio * (1 + taxReturn) + taxableContribution - taxableWithdrawal;

      if (taxablePortfolio < 0) taxablePortfolio = 0;
      if (taxAdvPortfolio < 0) taxAdvPortfolio = 0;

      const portfolio = taxAdvPortfolio + taxablePortfolio;

      if (portfolio >= baseYear.fireTarget) {
        crossingYear = baseYear.year;
        crossingPortfolio = portfolio;
        break; // stop on first crossing
      }
    }

    samples.push({
      crossingYear,
      crossingAge: crossingYear !== null ? crossingYear - 1987 : null,
      crossingPortfolio,
    });
  }

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

  const { iterations, volatility, retirementEndAge } = settings;

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

  const fallbackTaxableRatio = initialTaxablePct / 100;
  const taxAdvRatio =
    baseTotal > 0 ? baseTaxAdv / baseTotal : 1 - fallbackTaxableRatio;
  const taxableRatio = 1 - taxAdvRatio;

  const simResults: SimulationResult[] = [];
  const yearlyResults: Record<number, number[]> = {};

  for (let sim = 0; sim < iterations; sim++) {
    let taxAdvPortfolio = options.startingPortfolio * taxAdvRatio;
    let taxablePortfolio = options.startingPortfolio * taxableRatio;

    let portfolioDepleted = false;
    let depletionYear: number | null = null;

    const simYears: SimulationTimelineEntry[] = [];

    for (let yearIdx = retirementIndex; yearIdx < endIndex; yearIdx++) {
      const base = projections.years[yearIdx];
      const year = base.year;

      const taxAdvReturn = generateLognormalReturn(taxAdvReturnRate, volatility);
      const taxReturn = generateLognormalReturn(taxableReturnRate, volatility);

      taxAdvPortfolio = taxAdvPortfolio * (1 + taxAdvReturn);
      taxablePortfolio = taxablePortfolio * (1 + taxReturn);

      const totalExpenses = base.totalExpenses;
      const rentalIncome = base.rentalNetCashFlow;
      const socialSecurityIncome = base.socialSecurityIncome || 0;
      const netExpenses = Math.max(
        0,
        totalExpenses - rentalIncome - socialSecurityIncome,
      );

      if (netExpenses > 0) {
        let grossNeeded = netExpenses;

        for (let iter = 0; iter < 3; iter++) {
          let taxOnWithdrawal = 0;
          const taxableWithdrawal = Math.min(grossNeeded, taxablePortfolio);
          const taxAdvWithdrawal = Math.max(0, grossNeeded - taxableWithdrawal);

          if (taxableWithdrawal > 0) {
            taxOnWithdrawal += taxableWithdrawal * 0.15;
          }

          if (taxAdvWithdrawal > 0) {
            taxOnWithdrawal += taxAdvWithdrawal * 0.31;
          }

          grossNeeded = netExpenses + taxOnWithdrawal;
        }

        const totalWithdrawal = grossNeeded;

        if (taxablePortfolio >= totalWithdrawal) {
          taxablePortfolio -= totalWithdrawal;
        } else {
          const remainingNeeded = totalWithdrawal - taxablePortfolio;
          taxablePortfolio = 0;
          taxAdvPortfolio = Math.max(0, taxAdvPortfolio - remainingNeeded);
        }
      }

      if (taxablePortfolio < 0) taxablePortfolio = 0;
      if (taxAdvPortfolio < 0) taxAdvPortfolio = 0;

      const currentPortfolio = taxAdvPortfolio + taxablePortfolio;

      if (!portfolioDepleted && currentPortfolio < 1000) {
        portfolioDepleted = true;
        depletionYear = year;
      }

      if (!yearlyResults[year]) yearlyResults[year] = [];
      yearlyResults[year].push(currentPortfolio);

      simYears.push({
        year,
        portfolio: currentPortfolio,
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
