import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PostRetirementPanel from '../../src/components/calculator/PostRetirementPanel';
import { RetirementScenario, WithdrawalMonteCarloResult } from '../../src/domain/types';

const linkedScenario: RetirementScenario = {
  year: 2044,
  age: 57,
  startingPortfolio: 2400000,
  percentile: 50,
  probability: 70,
};

const withdrawalResult: WithdrawalMonteCarloResult = {
  survivalProbability: 88.4,
  depletionProbability: 11.6,
  medianDepletionYear: 2075,
  yearlyPercentiles: {
    2044: { p10: 1800000, p25: 2000000, p50: 2400000, p75: 2700000, p90: 3000000 },
    2050: { p10: 1500000, p25: 1900000, p50: 2300000, p75: 2600000, p90: 2950000 },
    2056: { p10: 1200000, p25: 1600000, p50: 2100000, p75: 2500000, p90: 2850000 },
  },
  allSimulations: [],
};

describe('PostRetirementPanel', () => {
  it('disables fields when linked mode is active', () => {
    render(
      <PostRetirementPanel
        linkedMode
        onToggleLinked={vi.fn()}
        linkedScenario={linkedScenario}
        manualScenario={{ retirementYear: 2046, startingPortfolio: 2000000 }}
        onManualScenarioChange={vi.fn()}
        withdrawalResult={withdrawalResult}
        longevityTargetAge={90}
        successThreshold={90}
        mcEnabled
        mcRunning={false}
      />,
    );

    const retirementInput = screen.getByLabelText(/Retirement Year/i);
    expect(retirementInput).toBeDisabled();
    expect(screen.getByText(/Survival probability to age 90/)).toBeInTheDocument();
  });

  it('allows manual editing when link is disabled', () => {
    const handleManualChange = vi.fn();

    render(
      <PostRetirementPanel
        linkedMode={false}
        onToggleLinked={vi.fn()}
        linkedScenario={linkedScenario}
        manualScenario={{ retirementYear: 2046, startingPortfolio: 2000000 }}
        onManualScenarioChange={handleManualChange}
        withdrawalResult={null}
        longevityTargetAge={90}
        successThreshold={90}
        mcEnabled
        mcRunning={false}
      />,
    );

    const retirementInput = screen.getByLabelText(/Retirement Year/i);
    expect(retirementInput).not.toBeDisabled();

    fireEvent.change(retirementInput, { target: { value: '2050' } });
    expect(handleManualChange).toHaveBeenCalledWith('retirementYear', 2050);
  });
});
