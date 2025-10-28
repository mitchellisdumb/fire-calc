import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalculatorInputsPanel from '../../src/components/calculator/inputs/CalculatorInputsPanel';

describe('CalculatorInputsPanel', () => {
  const mockUpdateField = vi.fn();
  const mockOnRunMonteCarlo = vi.fn();

  const defaultProps = {
    state: {
      currentYear: 2025,
      initialSavings: 500000,
      initialTaxablePct: 60,
      monthlyExpenses: 10000,
      propertyTax: 20000,
      propertyTaxGrowth: 2,
      inflationRate: 3,
      fireExpenseTarget: 135000,
      targetPortfolioMultiple: 20,
      withdrawalRate: 5,
      includeHealthcareBuffer: false,
      annualHealthcareCost: 12000,
      taxAdvReturnRate: 7,
      taxableReturnRate: 6,
      spouseIncome2025: 200000,
      spouseIncomeGrowth: 3,
      myIncome2025: 40000,
      bigLawStartYear: 2028,
      clerkingStartYear: 2029,
      clerkingEndYear: 2031,
      clerkingSalary: 100000,
      returnToFirmYear: 3,
      publicInterestYear: 2036,
      publicInterestSalary: 110000,
      publicInterestGrowth: 3,
      mySocialSecurityAmount: 35000,
      mySocialSecurityStartAge: 68,
      spouseSocialSecurityAmount: 40000,
      spouseSocialSecurityStartAge: 70,
      tuitionPerSemester: 30000,
      daughter1Birth: 2021,
      daughter2Birth: 2025,
      initial529Balance: 0,
      annual529Contribution: 9000,
      collegeCostPerYear: 40000,
      collegeInflation: 3.5,
      rentalIncome: 5800,
      rentalMortgagePandI: 1633,
      rentalMortgageStartYear: 2020,
      rentalMortgageOriginalPrincipal: 400000,
      rentalMortgageRate: 2.75,
      mortgageEndYear: 2051,
      rentalPropertyTax: 8000,
      rentalPropertyTaxGrowth: 2,
      rentalInsurance: 3323,
      rentalMaintenanceCapex: 11000,
      rentalVacancyRate: 5,
      standardDeduction: 29200,
      itemizedDeductions: 0,
      ssWageBase2025: 168600,
      ssWageBaseGrowth: 4,
      spendingDecrement65to74: 1,
      spendingDecrement75to84: 4,
      spendingDecrement85plus: 2,
      mcEnabled: false,
      mcIterations: 2000,
      mcVolatility: 15,
      mcTargetSurvival: 90,
      mcRetirementEndAge: 90,
      mcUseHistoricalReturns: false,
      mcStockAllocation: 50,
      mcBondReturn: 4,
    },
    updateField: mockUpdateField,
    currentYear: 2025,
    derivedWithdrawalRate: 5.0,
    validationIssues: [],
    mcRunning: false,
    onRunMonteCarlo: mockOnRunMonteCarlo,
  };

  beforeEach(() => {
    mockUpdateField.mockClear();
    mockOnRunMonteCarlo.mockClear();
  });

  it('renders input panel', () => {
    render(<CalculatorInputsPanel {...defaultProps} />);

    // Just verify the component renders without error
    expect(screen.getByText('Monte Carlo Settings')).toBeInTheDocument();
  });

  it('displays initial savings with currency formatting', () => {
    render(<CalculatorInputsPanel {...defaultProps} />);

    const input = screen.getByDisplayValue('$500,000');
    expect(input).toBeInTheDocument();
  });

  it('calls updateField when checkbox changes', async () => {
    const user = userEvent.setup();
    render(<CalculatorInputsPanel {...defaultProps} />);

    const checkbox = screen.getByLabelText(/Enable Monte Carlo simulation/i);
    await user.click(checkbox);

    expect(mockUpdateField).toHaveBeenCalledWith('mcEnabled', true);
  });

  it('displays validation errors when present', () => {
    const propsWithErrors = {
      ...defaultProps,
      validationIssues: ['Initial savings must be positive', 'Invalid year range'],
    };

    render(<CalculatorInputsPanel {...propsWithErrors} />);

    expect(screen.getByText(/Please review the highlighted validation issues/i)).toBeInTheDocument();
    expect(screen.getByText('Initial savings must be positive')).toBeInTheDocument();
    expect(screen.getByText('Invalid year range')).toBeInTheDocument();
  });

  it('shows derived withdrawal rate', () => {
    render(<CalculatorInputsPanel {...defaultProps} />);

    expect(screen.getByText(/5.00%/)).toBeInTheDocument();
  });

  it('enables Monte Carlo checkbox interaction', async () => {
    const user = userEvent.setup();
    render(<CalculatorInputsPanel {...defaultProps} />);

    const checkbox = screen.getByLabelText(/Enable Monte Carlo simulation/i);
    await user.click(checkbox);

    expect(mockUpdateField).toHaveBeenCalledWith('mcEnabled', true);
  });

  it('enables historical returns checkbox interaction', async () => {
    const user = userEvent.setup();
    render(<CalculatorInputsPanel {...defaultProps} />);

    const checkbox = screen.getByLabelText(/Use historical S&P 500 returns/i);
    await user.click(checkbox);

    expect(mockUpdateField).toHaveBeenCalledWith('mcUseHistoricalReturns', true);
  });

  it('disables Run Monte Carlo button when MC is disabled', () => {
    render(<CalculatorInputsPanel {...defaultProps} />);

    const button = screen.getByRole('button', { name: /Run Monte Carlo/i });
    expect(button).toBeDisabled();
  });

  it('enables Run Monte Carlo button when MC is enabled', () => {
    const propsWithMC = {
      ...defaultProps,
      state: { ...defaultProps.state, mcEnabled: true },
    };

    render(<CalculatorInputsPanel {...propsWithMC} />);

    const button = screen.getByRole('button', { name: /Run Monte Carlo/i });
    expect(button).not.toBeDisabled();
  });

  it('calls onRunMonteCarlo when button clicked', async () => {
    const user = userEvent.setup();
    const propsWithMC = {
      ...defaultProps,
      state: { ...defaultProps.state, mcEnabled: true },
    };

    render(<CalculatorInputsPanel {...propsWithMC} />);

    const button = screen.getByRole('button', { name: /Run Monte Carlo/i });
    await user.click(button);

    expect(mockOnRunMonteCarlo).toHaveBeenCalledTimes(1);
  });

  it('shows "Running…" text when Monte Carlo is running', () => {
    const propsRunning = {
      ...defaultProps,
      state: { ...defaultProps.state, mcEnabled: true },
      mcRunning: true,
    };

    render(<CalculatorInputsPanel {...propsRunning} />);

    expect(screen.getByText('Running…')).toBeInTheDocument();
  });

  it('disables Run button when Monte Carlo is running', () => {
    const propsRunning = {
      ...defaultProps,
      state: { ...defaultProps.state, mcEnabled: true },
      mcRunning: true,
    };

    render(<CalculatorInputsPanel {...propsRunning} />);

    const button = screen.getByRole('button', { name: /Running…/i });
    expect(button).toBeDisabled();
  });

  it('shows historical allocation controls when historical mode is enabled', () => {
    const props = {
      ...defaultProps,
      state: {
        ...defaultProps.state,
        mcEnabled: true,
        mcUseHistoricalReturns: true,
      },
    };

    render(<CalculatorInputsPanel {...props} />);

    expect(screen.getByLabelText(/Equity Allocation \(%\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bond Return Assumption \(%\)/i)).toBeInTheDocument();
  });

  it('renders many input fields', () => {
    render(<CalculatorInputsPanel {...defaultProps} />);

    // Just verify we have many inputs rendered
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(20);
  });

  it('handles healthcare buffer toggle', async () => {
    const user = userEvent.setup();
    render(<CalculatorInputsPanel {...defaultProps} />);

    const checkbox = screen.getByLabelText(/Include healthcare buffer/i);
    await user.click(checkbox);

    expect(mockUpdateField).toHaveBeenCalledWith('includeHealthcareBuffer', true);
  });

  it('handles input changes', async () => {
    const user = userEvent.setup();
    render(<CalculatorInputsPanel {...defaultProps} />);

    // Find a currency input
    const input = screen.getByDisplayValue('$500,000');

    await user.clear(input);
    await user.type(input, '750000');

    // Should have called updateField
    expect(mockUpdateField).toHaveBeenCalled();
  });

  it('renders details elements as collapsible sections', () => {
    render(<CalculatorInputsPanel {...defaultProps} />);

    const detailsElements = screen.getAllByRole('group');
    expect(detailsElements.length).toBeGreaterThan(5);
  });

  it('shows tooltips for input fields', () => {
    render(<CalculatorInputsPanel {...defaultProps} />);

    // Tooltips are rendered as spans with ? character
    const tooltips = screen.getAllByText('?');
    expect(tooltips.length).toBeGreaterThan(20); // We have many tooltips
  });
});
