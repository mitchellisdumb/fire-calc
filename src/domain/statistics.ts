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
