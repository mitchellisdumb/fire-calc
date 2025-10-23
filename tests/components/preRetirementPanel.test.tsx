import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PreRetirementPanel from '../../src/components/calculator/PreRetirementPanel';
import { AccumulationMonteCarloResult, ProjectionResult, RetirementScenario } from '../../src/domain/types';

const makeProjection = (): ProjectionResult => ({
  years: [],
  fireYear: {
    year: 2045,
    myIncome: 250000,
    spouseIncome: 210000,
    socialSecurityIncome: 0,
    totalIncome: 460000,
    federalTax: 100000,
    stateTax: 40000,
    ficaTax: 16000,
    totalTax: 156000,
    effectiveRate: '33.9',
    netIncome: 304000,
    tuition: 0,
    expenses: 160000,
    contribution529: 0,
    daughter1CollegeCost: 0,
    daughter2CollegeCost: 0,
    college529Shortfall: 0,
    totalExpenses: 160000,
    rentalNetCashFlow: 30000,
    mortgageInterest: 0,
    rentalInsurance: 0,
    adjustedRentalIncome: 0,
    netSavings: 144000,
    taxAdvContribution: 60000,
    taxableContribution: 50000,
    taxableWithdrawal: 0,
    portfolioGrowth: 100000,
    portfolio: 2500000,
    taxAdvPortfolio: 1800000,
    taxablePortfolio: 700000,
    daughter1_529: 0,
    daughter2_529: 0,
    total529: 0,
    sustainableWithdrawal: 100000,
    fireTarget: 2400000,
    collegeReserveNeeded: 0,
    healthcareBuffer: 0,
    isFIRE: true,
    deficit: false,
  },
  overfundingWarning: null,
});

const makeAccumulationResult = (): AccumulationMonteCarloResult => ({
  samples: [],
  readinessByYear: [
    { year: 2035, age: 48, probability: 10 },
    { year: 2040, age: 53, probability: 45 },
    { year: 2045, age: 58, probability: 75 },
    { year: 2050, age: 63, probability: 92 },
  ],
  percentiles: [
    { percentile: 10, year: 2038, age: 51, portfolio: 1800000, successRate: 32 },
    { percentile: 25, year: 2041, age: 54, portfolio: 2100000, successRate: 54 },
    { percentile: 50, year: 2044, age: 57, portfolio: 2400000, successRate: 70 },
    { percentile: 75, year: 2047, age: 60, portfolio: 2650000, successRate: 85 },
    { percentile: 90, year: 2050, age: 63, portfolio: 2900000, successRate: 90 },
  ],
});

describe('PreRetirementPanel', () => {
  it('shows target multiple information', () => {
    render(
      <PreRetirementPanel
        projections={makeProjection()}
        accumulationResult={null}
        targetMultiple={25}
        derivedWithdrawalRate={4}
        selectedPercentile={50}
        onSelectPercentile={vi.fn()}
        scenarioForSelection={null}
        onApplyScenario={vi.fn()}
        linkedScenario={null}
        mcEnabled={false}
        mcRunning={false}
      />,
    );

    expect(
      screen.getByText((content) =>
        content.includes('Target portfolio:') && content.includes('annual spending'),
      ),
    ).toBeInTheDocument();
  });

  it('renders percentile scenario when Monte Carlo data is present', () => {
    const onSelect = vi.fn();
    const apply = vi.fn();
    const scenario: RetirementScenario = {
      year: 2044,
      age: 57,
      startingPortfolio: 2400000,
      percentile: 50,
      probability: 70,
    };

    render(
      <PreRetirementPanel
        projections={makeProjection()}
        accumulationResult={makeAccumulationResult()}
        targetMultiple={25}
        derivedWithdrawalRate={4}
        selectedPercentile={50}
        onSelectPercentile={onSelect}
        scenarioForSelection={scenario}
        onApplyScenario={apply}
        linkedScenario={null}
        mcEnabled
        mcRunning={false}
      />,
    );

    const select = screen.getByLabelText(/Percentile/i);
    fireEvent.change(select, { target: { value: '75' } });
    expect(onSelect).toHaveBeenCalledWith(75);

    const summary = screen.getByTestId('scenario-summary');
    expect(summary.textContent).toContain('P50 readiness');
    expect(summary.textContent).toContain('2044');

    fireEvent.click(screen.getByRole('button', { name: /Use in Withdrawal Planner/i }));
    expect(apply).toHaveBeenCalled();
  });
});
