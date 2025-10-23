import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { buildProjections } from '../../domain/projection';
import {
  runAccumulationMonteCarlo,
  runWithdrawalMonteCarlo,
} from '../../domain/monteCarlo';
import {
  AccumulationMonteCarloResult,
  ProjectionResult,
  RetirementScenario,
  WithdrawalMonteCarloResult,
} from '../../domain/types';
import { useCalculatorConfig } from '../../hooks/useCalculatorConfig';
import CalculatorInputsPanel from './inputs/CalculatorInputsPanel';
import PreRetirementPanel from './PreRetirementPanel';
import PostRetirementPanel from './PostRetirementPanel';

type ActiveTab = 'pre' | 'post';
const DEFAULT_PERCENTILE = 50;

interface ManualScenarioState {
  retirementYear: number;
  startingPortfolio: number;
}

export default function FIRECalculator() {
  const {
    currentYear,
    state,
    updateField,
    calculatorInputs,
    mcSettings,
    derivedWithdrawalRate,
  } = useCalculatorConfig();

  const [activeTab, setActiveTab] = useState<ActiveTab>('pre');
  const [selectedPercentile, setSelectedPercentile] = useState<number>(DEFAULT_PERCENTILE);
  const [accumulationResult, setAccumulationResult] = useState<AccumulationMonteCarloResult | null>(null);
  const [withdrawalResult, setWithdrawalResult] = useState<WithdrawalMonteCarloResult | null>(null);
  const [linkedScenario, setLinkedScenario] = useState<RetirementScenario | null>(null);
  const [linkedMode, setLinkedMode] = useState(true);
  const [manualScenario, setManualScenario] = useState<ManualScenarioState>({
    retirementYear: currentYear + 20,
    startingPortfolio: calculatorInputs.initialSavings,
  });
  const [manualDirty, setManualDirty] = useState(false);
  const [mcRunning, setMcRunning] = useState(false);

  const projections = useMemo<ProjectionResult>(
    () => buildProjections(calculatorInputs),
    [calculatorInputs],
  );

  const defaultScenario = useMemo(() => {
    const retirementYear = projections.fireYear?.year ?? currentYear + 20;
    const startingPortfolio = projections.fireYear?.portfolio ?? calculatorInputs.initialSavings;
    return {
      retirementYear,
      startingPortfolio,
    };
  }, [projections.fireYear, currentYear, calculatorInputs.initialSavings]);

  useEffect(() => {
    if (!manualDirty) {
      setManualScenario({
        retirementYear: defaultScenario.retirementYear,
        startingPortfolio: defaultScenario.startingPortfolio,
      });
    }
  }, [defaultScenario, manualDirty]);

  useEffect(() => {
    if (!state.mcEnabled) {
      setAccumulationResult(null);
      setWithdrawalResult(null);
    }
  }, [state.mcEnabled]);

  const deriveScenario = useCallback(
    (percentile: number, result: AccumulationMonteCarloResult | null): RetirementScenario | null => {
      if (!result) return null;
      const entry = result.percentiles.find((item) => item.percentile === percentile);
      if (!entry || entry.year === null || entry.age === null || entry.portfolio === null) {
        return null;
      }

      return {
        year: entry.year,
        age: entry.age,
        startingPortfolio: Math.max(entry.portfolio, 0),
        percentile: entry.percentile,
        probability: entry.successRate,
      };
    },
    [],
  );

  const scenarioForSelection = deriveScenario(selectedPercentile, accumulationResult);

  const scenarioFallback: RetirementScenario = scenarioForSelection ?? (
    projections.fireYear
      ? {
          year: projections.fireYear.year,
          age: projections.fireYear.year - 1987,
          startingPortfolio: projections.fireYear.portfolio,
          percentile: selectedPercentile,
          probability: 100,
        }
      : {
          year: defaultScenario.retirementYear,
          age: defaultScenario.retirementYear - 1987,
          startingPortfolio: defaultScenario.startingPortfolio,
          percentile: selectedPercentile,
          probability: 0,
        }
  );

  const scenarioUsedForWithdrawal: RetirementScenario = linkedMode
    ? linkedScenario ?? scenarioFallback
    : {
        year: manualScenario.retirementYear,
        age: manualScenario.retirementYear - 1987,
        startingPortfolio: manualScenario.startingPortfolio,
        percentile: selectedPercentile,
        probability: 0,
      };

  const handleRunMonteCarlo = useCallback(() => {
    if (!mcSettings.enabled) {
      setAccumulationResult(null);
      setWithdrawalResult(null);
      return;
    }

    setMcRunning(true);

    setTimeout(() => {
      const accumulation = runAccumulationMonteCarlo(
        calculatorInputs,
        projections,
        mcSettings,
      );

      setAccumulationResult(accumulation);

      const derived = deriveScenario(selectedPercentile, accumulation);
      if (linkedMode && derived) {
        setLinkedScenario(derived);
      }

      const scenario = linkedMode
        ? derived ?? linkedScenario ?? scenarioFallback
        : scenarioUsedForWithdrawal;

      const withdrawal = runWithdrawalMonteCarlo(
        calculatorInputs,
        projections,
        mcSettings,
        {
          retirementYear: scenario.year,
          startingPortfolio: scenario.startingPortfolio,
        },
      );

      setWithdrawalResult(withdrawal);
      setMcRunning(false);
    }, 100);
  }, [
    mcSettings,
    calculatorInputs,
    projections,
    deriveScenario,
    selectedPercentile,
    linkedMode,
    linkedScenario,
    scenarioFallback,
    scenarioUsedForWithdrawal,
  ]);

  const handleApplyScenario = useCallback(() => {
    if (!scenarioForSelection) return;
    setLinkedScenario(scenarioForSelection);
    setLinkedMode(true);
    setActiveTab('post');
  }, [scenarioForSelection]);

  const handleManualScenarioChange = useCallback(
    (field: keyof ManualScenarioState, value: number) => {
      setManualDirty(true);
      setManualScenario((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleToggleLinked = useCallback(
    (value: boolean) => {
      setLinkedMode(value);
      if (value && scenarioForSelection) {
        setLinkedScenario(scenarioForSelection);
        setManualDirty(false);
      }
    },
    [scenarioForSelection],
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-8 bg-white rounded-xl shadow-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-orange-600 bg-clip-text text-transparent">
          FIRE Retirement Calculator
        </h1>
        <p className="text-gray-600 text-sm">
          Financial Independence, Retire Early – Model your path to freedom
        </p>
      </div>

      <CalculatorInputsPanel
        state={state}
        updateField={updateField}
        currentYear={currentYear}
        derivedWithdrawalRate={derivedWithdrawalRate}
        mcRunning={mcRunning}
        onRunMonteCarlo={handleRunMonteCarlo}
      />

      <div className="mt-8 border-b border-gray-200">
        <nav className="flex space-x-6" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('pre')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pre'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pre-Retirement Planner
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('post')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'post'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Post-Retirement Planner
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'pre' ? (
          <PreRetirementPanel
            projections={projections}
            accumulationResult={accumulationResult}
            targetMultiple={state.targetPortfolioMultiple}
            derivedWithdrawalRate={derivedWithdrawalRate}
            selectedPercentile={selectedPercentile}
            onSelectPercentile={setSelectedPercentile}
            scenarioForSelection={scenarioForSelection}
            onApplyScenario={handleApplyScenario}
            linkedScenario={linkedScenario}
            mcEnabled={mcSettings.enabled}
            mcRunning={mcRunning}
          />
        ) : (
          <PostRetirementPanel
            linkedMode={linkedMode}
            onToggleLinked={handleToggleLinked}
            linkedScenario={linkedScenario}
            manualScenario={manualScenario}
            onManualScenarioChange={handleManualScenarioChange}
            withdrawalResult={withdrawalResult}
            longevityTargetAge={mcSettings.retirementEndAge}
            successThreshold={mcSettings.targetSurvival}
            mcEnabled={mcSettings.enabled}
            mcRunning={mcRunning}
          />
        )}
      </div>
    </div>
  );
}
