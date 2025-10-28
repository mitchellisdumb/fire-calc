import React from 'react';
import {
  AccumulationMonteCarloResult,
  ProjectionResult,
  RetirementScenario,
} from '../../domain/types';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

// Percentiles available for scenario selection—kept in sync with the Monte Carlo
// engine’s outputs.
const PERCENTILE_OPTIONS = [10, 25, 50, 75, 90];
const DEFAULT_CHART_MARGIN = { left: 80, right: 20, top: 10, bottom: 20 };
const WIDE_RIGHT_CHART_MARGIN = { ...DEFAULT_CHART_MARGIN, right: 60 };
const buildYAxisLabel = (value: string) => ({
  value,
  angle: -90,
  position: 'left' as const,
  offset: 0,
  dx: -10,
  style: { textAnchor: 'middle' as const },
});

interface PreRetirementPanelProps {
  projections: ProjectionResult;
  accumulationResult: AccumulationMonteCarloResult | null;
  targetMultiple: number;
  derivedWithdrawalRate: number;
  selectedPercentile: number;
  onSelectPercentile: (value: number) => void;
  scenarioForSelection: RetirementScenario | null;
  onApplyScenario: () => void;
  linkedScenario: RetirementScenario | null;
  mcEnabled: boolean;
  mcRunning: boolean;
}

// Displays deterministic FIRE milestones alongside accumulation-phase Monte Carlo
// readiness. Also allows the user to pin a percentile scenario for use in the
// withdrawal planner.
export default function PreRetirementPanel({
  projections,
  accumulationResult,
  targetMultiple,
  derivedWithdrawalRate,
  selectedPercentile,
  onSelectPercentile,
  scenarioForSelection,
  onApplyScenario,
  linkedScenario,
  mcEnabled,
  mcRunning,
}: PreRetirementPanelProps) {
  const deterministicFireYear = projections.fireYear;

  // Thin out the readiness table: show every other year once probabilities are
  // near-certain, otherwise sample every 5th year so the table stays readable.
  const readinessRows = accumulationResult
    ? accumulationResult.readinessByYear.filter((point, index) => {
        if (point.probability >= 99) return index % 2 === 0;
        return index % 5 === 0 || point.probability >= 5;
      })
    : [];

  const historicalMeta = accumulationResult?.historical ?? null;
  const historicalStartYears = historicalMeta?.sequenceStartYears.filter(
    (year): year is number => typeof year === 'number' && Number.isFinite(year),
  ) ?? [];
  const historicalFirstYear = historicalStartYears.length > 0 ? historicalStartYears[0] : null;
  const historicalMinYear = historicalStartYears.length > 0 ? Math.min(...historicalStartYears) : null;
  const historicalMaxYear = historicalStartYears.length > 0 ? Math.max(...historicalStartYears) : null;
  const historicalBondAllocation = historicalMeta
    ? Math.max(0, Math.round((100 - historicalMeta.stockAllocation) * 10) / 10)
    : null;

  const hasScenario = Boolean(scenarioForSelection && scenarioForSelection.year !== null);
  const scenarioApplied =
    hasScenario &&
    linkedScenario !== null &&
    scenarioForSelection?.year === linkedScenario.year &&
    Math.round(scenarioForSelection.startingPortfolio) ===
      Math.round(linkedScenario.startingPortfolio);

  // Truncate pre-retirement charts at retirement + 5 years for focus
  const chartEndYear = deterministicFireYear
    ? deterministicFireYear.year + 5
    : projections.years[projections.years.length - 1].year;

  // Prepare chart data - sample every 2nd year to keep charts readable
  const chartData = projections.years
    .filter((y) => y.year <= chartEndYear)
    .filter((_, idx) => idx % 2 === 0)
    .map((year) => ({
      year: year.year,
      age: year.year - 1987,
      portfolio: year.portfolio,
      taxAdv: year.taxAdvPortfolio,
      taxable: year.taxablePortfolio,
      income: year.totalIncome,
      expenses: year.totalExpenses,
      savings: year.netSavings,
      taxAdvContribution: year.taxAdvContribution,
      taxableContribution: year.taxableContribution,
      contribution529: year.contribution529,
      totalTax: year.totalTax,
      effectiveRate: parseFloat(year.effectiveRate),
      rentalCashFlow: year.rentalNetCashFlow,
      fireTarget: year.fireTarget,
      readinessProbability:
        accumulationResult?.readinessByYear.find((r) => r.year === year.year)?.probability ?? null,
    }));

  // 529 data extends to 2047 (when youngest daughter graduates) regardless of retirement
  const chart529Data = projections.years
    .filter((y) => y.year <= 2047)
    .filter((_, idx) => idx % 2 === 0)
    .map((year) => ({
      year: year.year,
      age: year.year - 1987,
      daughter1_529: year.daughter1_529,
      daughter2_529: year.daughter2_529,
    }));

  // Monte Carlo data for percentile bands
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  const formatAgeTick = (value: number) => `Age ${value}`;
  const showReadinessOverlay = mcEnabled && Boolean(accumulationResult);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Pre-Retirement Targets</h2>
        <p className="text-sm text-gray-600">
          Target portfolio: <span className="font-semibold">{targetMultiple.toFixed(1)}×</span> annual
          spending
          {' '}(<span className="font-semibold">{derivedWithdrawalRate.toFixed(2)}%</span> real withdrawal rate).
        </p>
        {deterministicFireYear ? (
          <>
            <p className="text-sm text-gray-600 mt-2">
              Deterministic plan reaches FIRE in <span className="font-semibold">{deterministicFireYear.year}</span>
              {' '} (age {deterministicFireYear.year - 1987}) with a portfolio of
              {' '}
              <span className="font-semibold">${deterministicFireYear.portfolio.toLocaleString()}</span>.
            </p>
            {(() => {
              const netWithdrawal = deterministicFireYear.totalExpenses -
                deterministicFireYear.rentalNetCashFlow -
                deterministicFireYear.socialSecurityIncome;
              const actualDrawdownRate = deterministicFireYear.portfolio > 0
                ? (netWithdrawal / deterministicFireYear.portfolio) * 100
                : 0;

              return (
                <p className="text-sm text-gray-600 mt-2">
                  Actual portfolio drawdown: <span className="font-semibold">{actualDrawdownRate.toFixed(2)}%</span>
                  {' '}(after passive income: ${deterministicFireYear.rentalNetCashFlow.toLocaleString()} rental
                  {deterministicFireYear.socialSecurityIncome > 0 &&
                    `, $${deterministicFireYear.socialSecurityIncome.toLocaleString()} Social Security`}).
                </p>
              );
            })()}
          </>
        ) : (
          <p className="text-sm text-gray-600 mt-2">
            Deterministic projection does not reach the target multiple within the modeled horizon.
          </p>
        )}
      </section>

      {/* Portfolio Growth Chart */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <h3 className="text-md font-semibold text-gray-800 mb-3">Portfolio Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={DEFAULT_CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="age"
              label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
              tickFormatter={formatAgeTick}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatCurrency}
              label={buildYAxisLabel('Portfolio (Nominal $)')}
            />
            {showReadinessOverlay && (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
                label={{ value: 'Readiness %', angle: 90, position: 'insideRight' }}
              />
            )}
            <Tooltip
              labelFormatter={formatAgeTick}
              formatter={(value: number | string | Array<number | string>, name: string) => {
                if (typeof value !== 'number') return value;
                return name.includes('%') ? `${value.toFixed(1)}%` : formatCurrency(value);
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="taxAdv"
              yAxisId="left"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              name="Tax-Advantaged"
            />
            <Area
              type="monotone"
              dataKey="taxable"
              yAxisId="left"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              name="Taxable"
            />
            <Line
              type="monotone"
              dataKey="fireTarget"
              yAxisId="left"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="FIRE Target"
              dot={false}
            />
            {showReadinessOverlay && (
              <Line
                type="monotone"
                dataKey="readinessProbability"
                yAxisId="right"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="Readiness Probability (%)"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      {/* Income vs Expenses Chart */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <h3 className="text-md font-semibold text-gray-800 mb-3">Annual Cash Flow</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={DEFAULT_CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="age"
              label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
              tickFormatter={formatAgeTick}
            />
            <YAxis
              tickFormatter={formatCurrency}
              label={buildYAxisLabel('Amount (Nominal $)')}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={formatAgeTick}
            />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Total Income" />
            <Bar dataKey="expenses" fill="#ef4444" name="Total Expenses" />
            <Bar dataKey="rentalCashFlow" fill="#8b5cf6" name="Rental Cash Flow" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Annual Savings/Contributions Chart */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <h3 className="text-md font-semibold text-gray-800 mb-3">Annual Savings & Contributions</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={DEFAULT_CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="age"
              label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
              tickFormatter={formatAgeTick}
            />
            <YAxis
              tickFormatter={formatCurrency}
              label={buildYAxisLabel('Contribution (Nominal $)')}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={formatAgeTick}
            />
            <Legend />
            <Bar dataKey="taxAdvContribution" fill="#10b981" name="Tax-Advantaged" />
            <Bar dataKey="taxableContribution" fill="#3b82f6" name="Taxable" />
            <Bar dataKey="contribution529" fill="#f59e0b" name="529 Plans" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* 529 Growth Chart */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <h3 className="text-md font-semibold text-gray-800 mb-3">529 College Savings Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chart529Data} margin={DEFAULT_CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="age"
              label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
              tickFormatter={formatAgeTick}
            />
            <YAxis
              tickFormatter={formatCurrency}
              label={buildYAxisLabel('529 Balance (Nominal $)')}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={formatAgeTick}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="daughter1_529"
              stroke="#ec4899"
              fill="#ec4899"
              name="Daughter 1 (2021)"
            />
            <Area
              type="monotone"
              dataKey="daughter2_529"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              name="Daughter 2 (2025)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* Tax Burden Chart */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <h3 className="text-md font-semibold text-gray-800 mb-3">Tax Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={WIDE_RIGHT_CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="age"
              label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
              tickFormatter={formatAgeTick}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatCurrency}
              label={buildYAxisLabel('Tax (Nominal $)')}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={formatPercent}
              label={{ value: 'Rate (%)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip
              labelFormatter={formatAgeTick}
              formatter={(value: number, name: string) =>
                name === 'Effective Tax Rate' ? formatPercent(value) : formatCurrency(value)
              }
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="totalTax"
              stroke="#ef4444"
              strokeWidth={2}
              name="Total Tax ($)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="effectiveRate"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Effective Tax Rate (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {!mcEnabled ? (
        <section className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
          Enable Monte Carlo in the inputs above to evaluate retirement readiness probabilities.
        </section>
      ) : !accumulationResult ? (
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          {mcRunning ? 'Running Monte Carlo simulations…' : 'Run the Monte Carlo analysis to see readiness probabilities and percentile scenarios.'}
        </section>
      ) : (
        <>
          {historicalMeta && (
            <section className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-4 text-sm text-blue-800">
              <p>
                Historical sampling first draw:
                {' '}
                <span className="font-semibold">
                  {historicalFirstYear !== null ? historicalFirstYear : 'N/A'}
                </span>
                {historicalMinYear !== null && historicalMaxYear !== null && historicalMinYear !== historicalMaxYear && (
                  <>
                    {' '} (range {historicalMinYear}–{historicalMaxYear})
                  </>
                )}
                .
              </p>
              <p className="mt-1">
                Allocation:
                {' '}
                <span className="font-semibold">{historicalMeta.stockAllocation.toFixed(1)}% equities</span>
                {historicalBondAllocation !== null && (
                  <>
                    {' '} / <span className="font-semibold">{historicalBondAllocation.toFixed(1)}% bonds</span>
                  </>
                )}
                , bond sleeve return assumption{' '}
                <span className="font-semibold">{historicalMeta.bondReturn.toFixed(1)}%</span>.
              </p>
            </section>
          )}
          <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Readiness Probability Timeline</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="px-3 py-2 text-left">Year</th>
                    <th className="px-3 py-2 text-left">Age</th>
                    <th className="px-3 py-2 text-right">Ready Probability</th>
                  </tr>
                </thead>
                <tbody>
                  {readinessRows.map((point) => (
                    <tr key={point.year} className="border-b border-gray-100">
                      <td className="px-3 py-2">{point.year}</td>
                      <td className="px-3 py-2">{point.age}</td>
                      <td className="px-3 py-2 text-right">{point.probability.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-md font-semibold text-gray-800">Select a Percentile Scenario</h3>
                <p className="text-sm text-gray-600">
                  Choose which Monte Carlo percentile should define your "ready to retire" date.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600" htmlFor="scenario-percentile">
                  Percentile
                </label>
                <select
                  id="scenario-percentile"
                  className="border rounded px-3 py-1 text-sm"
                  value={selectedPercentile}
                  onChange={(event) => onSelectPercentile(Number(event.target.value))}
                >
                  {PERCENTILE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      P{option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {scenarioForSelection ? (
              <div
                data-testid="scenario-summary"
                className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm text-gray-700"
              >
                <p>
                  <span className="font-semibold">P{selectedPercentile}</span> readiness:
                  {' '}<span className="font-semibold">{scenarioForSelection.year}</span>
                  {' '} (age {scenarioForSelection.age}).
                </p>
                <p className="mt-1">
                  Portfolio at readiness: <span className="font-semibold">${Math.round(scenarioForSelection.startingPortfolio).toLocaleString()}</span>
                  {' '}(success probability {scenarioForSelection.probability.toFixed(1)}%).
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={onApplyScenario}
                    disabled={scenarioApplied}
                    className={`px-4 py-2 rounded text-sm font-medium ${
                      scenarioApplied
                        ? 'bg-green-100 text-green-600 cursor-default'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {scenarioApplied ? 'Scenario Linked to Withdrawal' : 'Use in Withdrawal Planner'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                The selected percentile does not succeed within the modeled horizon. Try a lower percentile or adjust savings assumptions.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
