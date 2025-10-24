import React from 'react';
import { ProjectionResult, RetirementScenario, WithdrawalMonteCarloResult } from '../../domain/types';
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

interface ManualScenario {
  retirementYear: number;
  startingPortfolio: number;
}

interface PostRetirementPanelProps {
  linkedMode: boolean;
  onToggleLinked: (value: boolean) => void;
  linkedScenario: RetirementScenario | null;
  manualScenario: ManualScenario;
  onManualScenarioChange: (field: keyof ManualScenario, value: number) => void;
  withdrawalResult: WithdrawalMonteCarloResult | null;
  longevityTargetAge: number;
  successThreshold: number;
  mcEnabled: boolean;
  mcRunning: boolean;
  projections: ProjectionResult;
  derivedWithdrawalRate: number;
}

// Presents withdrawal-phase Monte Carlo results. Users can either link the
// pre-retirement scenario or override the start year/portfolio manually.
export default function PostRetirementPanel({
  linkedMode,
  onToggleLinked,
  linkedScenario,
  manualScenario,
  onManualScenarioChange,
  withdrawalResult,
  longevityTargetAge,
  successThreshold,
  mcEnabled,
  mcRunning,
  projections,
  derivedWithdrawalRate,
}: PostRetirementPanelProps) {
  const scenarioToShow = linkedMode ? linkedScenario : null;
  const manual = manualScenario;

  // Calculate actual portfolio drawdown rate for the retirement year
  const retirementYear = linkedMode ? (linkedScenario?.year ?? manual.retirementYear) : manual.retirementYear;
  const retirementYearData = projections.years.find(y => y.year === retirementYear);

  const actualDrawdownInfo = retirementYearData ? (() => {
    const netWithdrawal = retirementYearData.totalExpenses -
      retirementYearData.rentalNetCashFlow -
      retirementYearData.socialSecurityIncome;
    const portfolio = linkedMode
      ? (linkedScenario?.startingPortfolio ?? manual.startingPortfolio)
      : manual.startingPortfolio;
    const actualDrawdownRate = portfolio > 0 ? (netWithdrawal / portfolio) * 100 : 0;

    return {
      rate: actualDrawdownRate,
      rentalIncome: retirementYearData.rentalNetCashFlow,
      ssIncome: retirementYearData.socialSecurityIncome,
    };
  })() : null;

  // Success threshold is compared against the Monte Carlo survival probability to
  // give immediate feedback (success ✅ vs. warning ⚠️).
  const survivalGood =
    withdrawalResult && withdrawalResult.survivalProbability >= successThreshold;

  // Sampling every third year keeps the percentile table compact while still
  // showing how the distribution evolves through retirement.
  const yearlyRows = withdrawalResult
    ? Object.entries(withdrawalResult.yearlyPercentiles)
        .map(([year, values]) => ({ year: Number(year), values }))
        .sort((a, b) => a.year - b.year)
        .filter((_, index) => index % 3 === 0)
    : [];

  // Prepare retirement phase data for charts
  const retirementChartData = projections.years
    .filter((y) => y.year >= retirementYear)
    .filter((_, idx) => idx % 2 === 0) // Sample every 2nd year
    .map((year) => {
      const netWithdrawal = Math.max(0,
        year.totalExpenses - year.rentalNetCashFlow - year.socialSecurityIncome
      );
      const percentiles = withdrawalResult?.yearlyPercentiles[year.year];

      return {
        year: year.year,
        expenses: year.totalExpenses,
        rentalIncome: year.rentalNetCashFlow,
        ssIncome: year.socialSecurityIncome,
        portfolioWithdrawal: netWithdrawal,
        passiveIncome: year.rentalNetCashFlow + year.socialSecurityIncome,
        passiveCoveragePercent:
          year.totalExpenses > 0
            ? ((year.rentalNetCashFlow + year.socialSecurityIncome) / year.totalExpenses) * 100
            : 0,
        p10: percentiles?.p10 ?? null,
        p25: percentiles?.p25 ?? null,
        p50: percentiles?.p50 ?? null,
        p75: percentiles?.p75 ?? null,
        p90: percentiles?.p90 ?? null,
      };
    });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (value: number) => `${value.toFixed(0)}%`;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Post-Retirement Setup</h2>
            <p className="text-sm text-gray-600">
              Evaluate portfolio survival through age {longevityTargetAge} with a {successThreshold}% success goal.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={linkedMode}
              onChange={(event) => onToggleLinked(event.target.checked)}
              className="rounded"
            />
            Link to pre-retirement scenario
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              className="block text-xs text-gray-500 uppercase tracking-wide"
              htmlFor="retirement-year-input"
            >
              Retirement Year
            </label>
            <input
              id="retirement-year-input"
              type="number"
              value={linkedMode ? scenarioToShow?.year ?? '' : manual.retirementYear}
              onChange={(event) => onManualScenarioChange('retirementYear', Number(event.target.value))}
              disabled={linkedMode}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
          <div>
            <label
              className="block text-xs text-gray-500 uppercase tracking-wide"
              htmlFor="retirement-age-display"
            >
              Retirement Age
            </label>
            <input
              id="retirement-age-display"
              type="number"
              value={linkedMode ? scenarioToShow?.age ?? '' : manual.retirementYear - 1987}
              disabled
              className="w-full px-3 py-2 border rounded text-sm bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label
              className="block text-xs text-gray-500 uppercase tracking-wide"
              htmlFor="starting-portfolio-input"
            >
              Starting Portfolio ($)
            </label>
            <input
              id="starting-portfolio-input"
              type="number"
              value={linkedMode ? Math.round(scenarioToShow?.startingPortfolio ?? 0) : Math.round(manual.startingPortfolio)}
              onChange={(event) => onManualScenarioChange('startingPortfolio', Number(event.target.value))}
              disabled={linkedMode}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>
      </section>

      {!mcEnabled ? (
        <section className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
          Enable Monte Carlo in the inputs above to evaluate retirement durability.
        </section>
      ) : !withdrawalResult ? (
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          {mcRunning ? 'Running Monte Carlo simulations…' : 'Run the Monte Carlo analysis to see withdrawal survival probabilities.'}
        </section>
      ) : (
        <>
          <section className={`border rounded-lg p-5 shadow-sm ${survivalGood ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <h3 className="text-md font-semibold text-gray-800">Survival Overview</h3>
            <p className="text-sm text-gray-700 mt-2">
              Survival probability to age {longevityTargetAge}:{' '}
              <span className="font-semibold">{withdrawalResult.survivalProbability.toFixed(1)}%</span>
              {survivalGood ? ' ✅ Meets threshold' : ' ⚠ Below threshold'}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              Depletion probability: <span className="font-semibold">{withdrawalResult.depletionProbability.toFixed(1)}%</span>
              {withdrawalResult.medianDepletionYear && (
                <> (median depletion year {withdrawalResult.medianDepletionYear})</>
              )}
            </p>
            {actualDrawdownInfo && (
              <>
                <p className="text-sm text-gray-700 mt-3 pt-3 border-t border-gray-200">
                  Target withdrawal rate: <span className="font-semibold">{derivedWithdrawalRate.toFixed(2)}%</span>
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Actual portfolio drawdown: <span className="font-semibold">{actualDrawdownInfo.rate.toFixed(2)}%</span>
                  {' '}(after passive income: ${actualDrawdownInfo.rentalIncome.toLocaleString()} rental
                  {actualDrawdownInfo.ssIncome > 0 &&
                    `, $${actualDrawdownInfo.ssIncome.toLocaleString()} Social Security`})
                </p>
              </>
            )}
          </section>

          {/* Portfolio Drawdown with Monte Carlo Bands */}
          <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Portfolio Balance Over Time</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={retirementChartData} margin={{ left: 80, right: 20, top: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                <YAxis
                  tickFormatter={formatCurrency}
                  label={{ value: 'Portfolio (Nominal $)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="p90"
                  stroke="#d1d5db"
                  fill="#f3f4f6"
                  name="P90 (Optimistic)"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="p75"
                  stroke="#9ca3af"
                  fill="#e5e7eb"
                  name="P75"
                  fillOpacity={0.4}
                />
                <Area
                  type="monotone"
                  dataKey="p50"
                  stroke="#6b7280"
                  fill="#d1d5db"
                  name="P50 (Median)"
                  fillOpacity={0.5}
                />
                <Area
                  type="monotone"
                  dataKey="p25"
                  stroke="#4b5563"
                  fill="#9ca3af"
                  name="P25"
                  fillOpacity={0.4}
                />
                <Area
                  type="monotone"
                  dataKey="p10"
                  stroke="#374151"
                  fill="#6b7280"
                  name="P10 (Pessimistic)"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          {/* Income Sources Breakdown */}
          <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Income Sources in Retirement</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={retirementChartData} margin={{ left: 80, right: 20, top: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                <YAxis
                  tickFormatter={formatCurrency}
                  label={{ value: 'Income (Nominal $)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="rentalIncome"
                  stackId="1"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  name="Rental Income"
                />
                <Area
                  type="monotone"
                  dataKey="ssIncome"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  name="Social Security"
                />
                <Area
                  type="monotone"
                  dataKey="portfolioWithdrawal"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  name="Portfolio Withdrawal"
                />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          {/* Passive Income Coverage */}
          <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Expense Coverage by Passive Income</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={retirementChartData} margin={{ left: 80, right: 60, top: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                <YAxis
                  yAxisId="left"
                  tickFormatter={formatCurrency}
                  label={{ value: 'Amount (Nominal $)', angle: -90, position: 'insideLeft' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={formatPercent}
                  domain={[0, 100]}
                  label={{ value: 'Coverage %', angle: 90, position: 'insideRight' }}
                />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name.includes('%') ? formatPercent(value) : formatCurrency(value)
                  }
                />
                <Legend />
                <Bar yAxisId="left" dataKey="expenses" fill="#ef4444" name="Total Expenses" />
                <Bar yAxisId="left" dataKey="passiveIncome" fill="#10b981" name="Passive Income (Rental + SS)" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="passiveCoveragePercent"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name="Coverage % (right axis)"
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </section>

          {/* Portfolio Withdrawal Amount */}
          <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Annual Portfolio Withdrawal</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={retirementChartData} margin={{ left: 80, right: 20, top: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                <YAxis
                  tickFormatter={formatCurrency}
                  label={{ value: 'Withdrawal (Nominal $)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="portfolioWithdrawal" fill="#10b981" name="Net Withdrawal from Portfolio" />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Portfolio Percentiles During Retirement</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="px-3 py-2 text-left">Year</th>
                    <th className="px-3 py-2 text-right">P10</th>
                    <th className="px-3 py-2 text-right">P25</th>
                    <th className="px-3 py-2 text-right">P50</th>
                    <th className="px-3 py-2 text-right">P75</th>
                    <th className="px-3 py-2 text-right">P90</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyRows.map((row) => (
                    <tr key={row.year} className="border-b border-gray-100">
                      <td className="px-3 py-2">{row.year}</td>
                      <td className="px-3 py-2 text-right">${row.values.p10.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">${row.values.p25.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">${row.values.p50.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">${row.values.p75.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">${row.values.p90.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
