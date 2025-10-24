import React from 'react';
import {
  AccumulationMonteCarloResult,
  ProjectionResult,
  RetirementScenario,
} from '../../domain/types';

// Percentiles available for scenario selection—kept in sync with the Monte Carlo
// engine’s outputs.
const PERCENTILE_OPTIONS = [10, 25, 50, 75, 90];

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

  const hasScenario = Boolean(scenarioForSelection && scenarioForSelection.year !== null);
  const scenarioApplied =
    hasScenario &&
    linkedScenario !== null &&
    scenarioForSelection?.year === linkedScenario.year &&
    Math.round(scenarioForSelection.startingPortfolio) ===
      Math.round(linkedScenario.startingPortfolio);

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
          <p className="text-sm text-gray-600 mt-2">
            Deterministic plan reaches FIRE in <span className="font-semibold">{deterministicFireYear.year}</span>
            {' '} (age {deterministicFireYear.year - 1987}) with a portfolio of
            {' '}
            <span className="font-semibold">${deterministicFireYear.portfolio.toLocaleString()}</span>.
          </p>
        ) : (
          <p className="text-sm text-gray-600 mt-2">
            Deterministic projection does not reach the target multiple within the modeled horizon.
          </p>
        )}
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
