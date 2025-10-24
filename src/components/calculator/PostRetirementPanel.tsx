import React from 'react';
import { RetirementScenario, WithdrawalMonteCarloResult } from '../../domain/types';

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
}: PostRetirementPanelProps) {
  const scenarioToShow = linkedMode ? linkedScenario : null;
  const manual = manualScenario;

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
