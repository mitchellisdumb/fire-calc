import { generateHistoricalSequence, SP500_HISTORICAL_RETURNS } from './historicalReturns';

// Box–Muller transform returning a standard normal (mean 0, variance 1). This is
// used as the basis for generating lognormal investment returns inside Monte Carlo.
// We reject 0 because ln(0) would explode; rerolling keeps the distribution intact.
export function generateStandardNormal(): number {
  let u1 = 0;
  let u2 = 0;

  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();

  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

// Convert the user-provided arithmetic return/volatility inputs into a lognormal
// draw so we preserve non-negative balances and capture fat-tailed behaviour.
export function generateLognormalReturn(arithmeticMean: number, volatility: number): number {
  const mu = arithmeticMean / 100;
  const sigma = volatility / 100;

  const muLog = Math.log(1 + mu) - 0.5 * sigma * sigma;
  const logReturn = muLog + sigma * generateStandardNormal();

  return Math.exp(logReturn) - 1;
}

// State for historical simulation mode
let historicalSequenceCache: number[] | null = null;
let historicalSequenceIndex = 0;
let historicalSequenceFirstYear: number | null = null;

/**
 * Initialize historical simulation mode
 * @param sequenceLength Length of the sequence needed
 * @param seed Optional seed for reproducible simulations
 */
export function initializeHistoricalSequence(sequenceLength: number, seed?: number): void {
  const { values, firstYear } = generateHistoricalSequence(
    SP500_HISTORICAL_RETURNS,
    sequenceLength,
    seed
  );
  historicalSequenceCache = values;
  historicalSequenceFirstYear = firstYear ?? null;
  historicalSequenceIndex = 0;
}

/**
 * Get next return from historical sequence
 * Returns random historical return if not initialized
 */
export function getNextHistoricalReturn(): number {
  if (!historicalSequenceCache || historicalSequenceIndex >= historicalSequenceCache.length) {
    // Fallback: return a random historical year
    const randomIndex = Math.floor(Math.random() * SP500_HISTORICAL_RETURNS.length);
    historicalSequenceFirstYear ??= SP500_HISTORICAL_RETURNS[randomIndex].year;
    return SP500_HISTORICAL_RETURNS[randomIndex].nominalReturn / 100;
  }

  const returnValue = historicalSequenceCache[historicalSequenceIndex];
  historicalSequenceIndex++;
  return returnValue;
}

export function getHistoricalSequenceFirstYear(): number | null {
  return historicalSequenceFirstYear;
}

/**
 * Reset historical simulation state
 */
export function resetHistoricalSequence(): void {
  historicalSequenceCache = null;
  historicalSequenceIndex = 0;
  historicalSequenceFirstYear = null;
}

// Compute an interpolated percentile from a sorted array. We use linear
// interpolation between the nearest ranks to avoid stair-step behaviour when the
// sample size is small.
export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) {
    return sortedValues[lower];
  }

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}
