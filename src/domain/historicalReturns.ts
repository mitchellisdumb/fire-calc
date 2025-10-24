/**
 * Historical stock market returns for Monte Carlo simulation.
 *
 * Data source: S&P 500 total returns (including dividends), 1928-2024
 * Source: Robert Shiller data, Yahoo Finance, and Federal Reserve Economic Data
 *
 * Returns are real (inflation-adjusted) annual total returns.
 */

export interface HistoricalReturn {
  year: number;
  nominalReturn: number; // Total return including dividends
  inflation: number;
  realReturn: number; // Nominal return minus inflation
}

function createSeededRandom(seed: number): () => number {
  // Ensure non-zero seed to avoid degenerate LCG output
  let state = (seed >>> 0) || 1;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/**
 * S&P 500 historical annual returns (1928-2024)
 * Real returns adjusted for CPI inflation
 */
export const SP500_HISTORICAL_RETURNS: HistoricalReturn[] = [
  { year: 1928, nominalReturn: 43.61, inflation: -1.16, realReturn: 44.77 },
  { year: 1929, nominalReturn: -8.42, inflation: 0.58, realReturn: -9.00 },
  { year: 1930, nominalReturn: -24.90, inflation: -2.34, realReturn: -22.56 },
  { year: 1931, nominalReturn: -43.34, inflation: -9.32, realReturn: -34.02 },
  { year: 1932, nominalReturn: -8.19, inflation: -10.27, realReturn: 2.08 },
  { year: 1933, nominalReturn: 53.99, inflation: -5.09, realReturn: 59.08 },
  { year: 1934, nominalReturn: -1.44, inflation: 3.11, realReturn: -4.55 },
  { year: 1935, nominalReturn: 47.67, inflation: 2.23, realReturn: 45.44 },
  { year: 1936, nominalReturn: 33.92, inflation: 1.45, realReturn: 32.47 },
  { year: 1937, nominalReturn: -35.03, inflation: 3.56, realReturn: -38.59 },
  { year: 1938, nominalReturn: 31.12, inflation: -2.78, realReturn: 33.90 },
  { year: 1939, nominalReturn: -0.41, inflation: -1.42, realReturn: 1.01 },
  { year: 1940, nominalReturn: -9.78, inflation: 0.71, realReturn: -10.49 },
  { year: 1941, nominalReturn: -11.59, inflation: 5.00, realReturn: -16.59 },
  { year: 1942, nominalReturn: 20.34, inflation: 10.88, realReturn: 9.46 },
  { year: 1943, nominalReturn: 25.90, inflation: 6.13, realReturn: 19.77 },
  { year: 1944, nominalReturn: 19.75, inflation: 1.67, realReturn: 18.08 },
  { year: 1945, nominalReturn: 36.44, inflation: 2.30, realReturn: 34.14 },
  { year: 1946, nominalReturn: -8.07, inflation: 8.33, realReturn: -16.40 },
  { year: 1947, nominalReturn: 5.71, inflation: 14.36, realReturn: -8.65 },
  { year: 1948, nominalReturn: 5.50, inflation: 8.07, realReturn: -2.57 },
  { year: 1949, nominalReturn: 18.79, inflation: -1.24, realReturn: 20.03 },
  { year: 1950, nominalReturn: 31.71, inflation: 1.26, realReturn: 30.45 },
  { year: 1951, nominalReturn: 24.02, inflation: 7.88, realReturn: 16.14 },
  { year: 1952, nominalReturn: 18.37, inflation: 1.93, realReturn: 16.44 },
  { year: 1953, nominalReturn: -0.99, inflation: 0.75, realReturn: -1.74 },
  { year: 1954, nominalReturn: 52.62, inflation: 0.37, realReturn: 52.25 },
  { year: 1955, nominalReturn: 31.56, inflation: -0.37, realReturn: 31.93 },
  { year: 1956, nominalReturn: 6.56, inflation: 1.49, realReturn: 5.07 },
  { year: 1957, nominalReturn: -10.78, inflation: 3.56, realReturn: -14.34 },
  { year: 1958, nominalReturn: 43.36, inflation: 2.85, realReturn: 40.51 },
  { year: 1959, nominalReturn: 11.96, inflation: 0.69, realReturn: 11.27 },
  { year: 1960, nominalReturn: 0.47, inflation: 1.72, realReturn: -1.25 },
  { year: 1961, nominalReturn: 26.89, inflation: 1.01, realReturn: 25.88 },
  { year: 1962, nominalReturn: -8.73, inflation: 1.00, realReturn: -9.73 },
  { year: 1963, nominalReturn: 22.80, inflation: 1.64, realReturn: 21.16 },
  { year: 1964, nominalReturn: 16.48, inflation: 1.28, realReturn: 15.20 },
  { year: 1965, nominalReturn: 12.45, inflation: 1.59, realReturn: 10.86 },
  { year: 1966, nominalReturn: -10.06, inflation: 3.02, realReturn: -13.08 },
  { year: 1967, nominalReturn: 23.98, inflation: 3.09, realReturn: 20.89 },
  { year: 1968, nominalReturn: 11.06, inflation: 4.72, realReturn: 6.34 },
  { year: 1969, nominalReturn: -8.50, inflation: 6.20, realReturn: -14.70 },
  { year: 1970, nominalReturn: 4.01, inflation: 5.57, realReturn: -1.56 },
  { year: 1971, nominalReturn: 14.31, inflation: 3.27, realReturn: 11.04 },
  { year: 1972, nominalReturn: 18.98, inflation: 3.41, realReturn: 15.57 },
  { year: 1973, nominalReturn: -14.66, inflation: 8.71, realReturn: -23.37 },
  { year: 1974, nominalReturn: -26.47, inflation: 12.34, realReturn: -38.81 },
  { year: 1975, nominalReturn: 37.20, inflation: 6.94, realReturn: 30.26 },
  { year: 1976, nominalReturn: 23.84, inflation: 4.86, realReturn: 18.98 },
  { year: 1977, nominalReturn: -7.18, inflation: 6.70, realReturn: -13.88 },
  { year: 1978, nominalReturn: 6.56, inflation: 9.02, realReturn: -2.46 },
  { year: 1979, nominalReturn: 18.44, inflation: 13.29, realReturn: 5.15 },
  { year: 1980, nominalReturn: 32.42, inflation: 12.52, realReturn: 19.90 },
  { year: 1981, nominalReturn: -4.91, inflation: 8.92, realReturn: -13.83 },
  { year: 1982, nominalReturn: 21.55, inflation: 3.83, realReturn: 17.72 },
  { year: 1983, nominalReturn: 22.56, inflation: 3.79, realReturn: 18.77 },
  { year: 1984, nominalReturn: 6.27, inflation: 3.95, realReturn: 2.32 },
  { year: 1985, nominalReturn: 31.73, inflation: 3.80, realReturn: 27.93 },
  { year: 1986, nominalReturn: 18.67, inflation: 1.10, realReturn: 17.57 },
  { year: 1987, nominalReturn: 5.25, inflation: 4.43, realReturn: 0.82 },
  { year: 1988, nominalReturn: 16.61, inflation: 4.42, realReturn: 12.19 },
  { year: 1989, nominalReturn: 31.69, inflation: 4.65, realReturn: 27.04 },
  { year: 1990, nominalReturn: -3.10, inflation: 6.11, realReturn: -9.21 },
  { year: 1991, nominalReturn: 30.47, inflation: 3.06, realReturn: 27.41 },
  { year: 1992, nominalReturn: 7.62, inflation: 2.90, realReturn: 4.72 },
  { year: 1993, nominalReturn: 10.08, inflation: 2.75, realReturn: 7.33 },
  { year: 1994, nominalReturn: 1.32, inflation: 2.67, realReturn: -1.35 },
  { year: 1995, nominalReturn: 37.58, inflation: 2.54, realReturn: 35.04 },
  { year: 1996, nominalReturn: 22.96, inflation: 3.32, realReturn: 19.64 },
  { year: 1997, nominalReturn: 33.36, inflation: 1.70, realReturn: 31.66 },
  { year: 1998, nominalReturn: 28.58, inflation: 1.61, realReturn: 26.97 },
  { year: 1999, nominalReturn: 21.04, inflation: 2.68, realReturn: 18.36 },
  { year: 2000, nominalReturn: -9.10, inflation: 3.39, realReturn: -12.49 },
  { year: 2001, nominalReturn: -11.89, inflation: 1.55, realReturn: -13.44 },
  { year: 2002, nominalReturn: -22.10, inflation: 2.38, realReturn: -24.48 },
  { year: 2003, nominalReturn: 28.68, inflation: 1.88, realReturn: 26.80 },
  { year: 2004, nominalReturn: 10.88, inflation: 3.26, realReturn: 7.62 },
  { year: 2005, nominalReturn: 4.91, inflation: 3.42, realReturn: 1.49 },
  { year: 2006, nominalReturn: 15.79, inflation: 2.54, realReturn: 13.25 },
  { year: 2007, nominalReturn: 5.49, inflation: 4.08, realReturn: 1.41 },
  { year: 2008, nominalReturn: -37.00, inflation: 0.09, realReturn: -37.09 },
  { year: 2009, nominalReturn: 26.46, inflation: 2.72, realReturn: 23.74 },
  { year: 2010, nominalReturn: 15.06, inflation: 1.50, realReturn: 13.56 },
  { year: 2011, nominalReturn: 2.11, inflation: 2.96, realReturn: -0.85 },
  { year: 2012, nominalReturn: 16.00, inflation: 1.74, realReturn: 14.26 },
  { year: 2013, nominalReturn: 32.39, inflation: 1.50, realReturn: 30.89 },
  { year: 2014, nominalReturn: 13.69, inflation: 0.76, realReturn: 12.93 },
  { year: 2015, nominalReturn: 1.38, inflation: 0.73, realReturn: 0.65 },
  { year: 2016, nominalReturn: 11.96, inflation: 2.07, realReturn: 9.89 },
  { year: 2017, nominalReturn: 21.83, inflation: 2.11, realReturn: 19.72 },
  { year: 2018, nominalReturn: -4.38, inflation: 1.91, realReturn: -6.29 },
  { year: 2019, nominalReturn: 31.49, inflation: 2.29, realReturn: 29.20 },
  { year: 2020, nominalReturn: 18.40, inflation: 1.36, realReturn: 17.04 },
  { year: 2021, nominalReturn: 28.71, inflation: 7.04, realReturn: 21.67 },
  { year: 2022, nominalReturn: -18.11, inflation: 6.45, realReturn: -24.56 },
  { year: 2023, nominalReturn: 26.29, inflation: 3.35, realReturn: 22.94 },
  { year: 2024, nominalReturn: 25.00, inflation: 2.90, realReturn: 22.10 },
];

/**
 * Calculate statistics from historical returns
 */
export function calculateHistoricalStatistics(returns: HistoricalReturn[]): {
  meanNominalReturn: number;
  meanRealReturn: number;
  stdDevNominal: number;
  stdDevReal: number;
  worstYear: HistoricalReturn;
  bestYear: HistoricalReturn;
} {
  const nominalReturns = returns.map(r => r.nominalReturn);
  const realReturns = returns.map(r => r.realReturn);

  const meanNominal = nominalReturns.reduce((sum, r) => sum + r, 0) / nominalReturns.length;
  const meanReal = realReturns.reduce((sum, r) => sum + r, 0) / realReturns.length;

  const varianceNominal = nominalReturns.reduce((sum, r) => sum + Math.pow(r - meanNominal, 2), 0) / nominalReturns.length;
  const varianceReal = realReturns.reduce((sum, r) => sum + Math.pow(r - meanReal, 2), 0) / realReturns.length;

  const stdDevNominal = Math.sqrt(varianceNominal);
  const stdDevReal = Math.sqrt(varianceReal);

  const worstYear = returns.reduce((worst, current) =>
    current.realReturn < worst.realReturn ? current : worst
  );

  const bestYear = returns.reduce((best, current) =>
    current.realReturn > best.realReturn ? current : best
  );

  return {
    meanNominalReturn: meanNominal,
    meanRealReturn: meanReal,
    stdDevNominal,
    stdDevReal,
    worstYear,
    bestYear,
  };
}

/**
 * Generate a random historical sequence by sampling with replacement (bootstrap)
 * @param returns Historical returns data
 * @param length Number of years to sample
 * @param seed Optional seed for reproducibility (uses year as index mod)
 */
export function generateHistoricalSequence(
  returns: HistoricalReturn[],
  length: number,
  seed?: number
): number[] {
  const sequence: number[] = [];
  const random = seed !== undefined ? createSeededRandom(seed) : Math.random;

  for (let i = 0; i < length; i++) {
    const index = Math.floor(random() * returns.length);

    sequence.push(returns[index].nominalReturn / 100); // Convert percentage to decimal
  }

  return sequence;
}

/**
 * Generate a sequential historical simulation starting from a given year
 * Wraps around if simulation extends beyond available data
 * @param returns Historical returns data
 * @param startYear Starting year (e.g., 1928)
 * @param length Number of years to simulate
 */
export function generateSequentialHistory(
  returns: HistoricalReturn[],
  startYear: number,
  length: number
): number[] {
  const sequence: number[] = [];
  const startIndex = returns.findIndex(r => r.year === startYear);

  if (startIndex === -1) {
    throw new Error(`Start year ${startYear} not found in historical data`);
  }

  for (let i = 0; i < length; i++) {
    const index = (startIndex + i) % returns.length; // Wrap around
    sequence.push(returns[index].nominalReturn / 100);
  }

  return sequence;
}

/**
 * Get available year range for historical simulation
 */
export function getHistoricalYearRange(): { minYear: number; maxYear: number } {
  return {
    minYear: SP500_HISTORICAL_RETURNS[0].year,
    maxYear: SP500_HISTORICAL_RETURNS[SP500_HISTORICAL_RETURNS.length - 1].year,
  };
}
