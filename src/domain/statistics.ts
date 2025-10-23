export function generateStandardNormal(): number {
  let u1 = 0;
  let u2 = 0;

  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();

  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

export function generateLognormalReturn(arithmeticMean: number, volatility: number): number {
  const mu = arithmeticMean / 100;
  const sigma = volatility / 100;

  const muLog = Math.log(1 + mu) - 0.5 * sigma * sigma;
  const logReturn = muLog + sigma * generateStandardNormal();

  return Math.exp(logReturn) - 1;
}

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
