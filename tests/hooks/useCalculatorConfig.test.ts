import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalculatorConfig } from '../../src/hooks/useCalculatorConfig';

describe('useCalculatorConfig', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    expect(result.current.currentYear).toBe(2025);
    expect(result.current.state.initialSavings).toBe(500000);
    expect(result.current.state.monthlyExpenses).toBe(10000);
    expect(result.current.state.mcEnabled).toBe(false);
    expect(result.current.validationIssues).toEqual([]);
  });

  it('provides valid calculator inputs on mount', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    const { calculatorInputs } = result.current;

    expect(calculatorInputs).toBeDefined();
    expect(calculatorInputs.initialSavings).toBe(500000);
    expect(calculatorInputs.currentYear).toBe(2025);
    expect(calculatorInputs.withdrawalRate).toBeGreaterThan(0);
  });

  it('calculates derived withdrawal rate from target multiple', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    // Initial state has targetPortfolioMultiple = 20
    expect(result.current.state.targetPortfolioMultiple).toBe(20);
    expect(result.current.derivedWithdrawalRate).toBeCloseTo(5.0, 2); // 100/20 = 5%
  });

  it('updates state when updateField is called', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    act(() => {
      result.current.updateField('initialSavings', 750000);
    });

    expect(result.current.state.initialSavings).toBe(750000);
  });

  it('validates field updates and surfaces issues', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    act(() => {
      // Set an invalid value (negative savings)
      result.current.updateField('initialSavings', -1000);
    });

    expect(result.current.validationIssues.length).toBeGreaterThan(0);
    expect(result.current.validationIssues.some((issue) =>
      issue.includes('initialSavings')
    )).toBe(true);
  });

  it('preserves last valid inputs when validation fails', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    const initialInputs = result.current.calculatorInputs;

    act(() => {
      // Invalid value
      result.current.updateField('initialSavings', -1000);
    });

    // Calculator inputs should still have last valid value
    expect(result.current.calculatorInputs).toEqual(initialInputs);
  });

  it('clears validation issues when field becomes valid', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    act(() => {
      result.current.updateField('initialSavings', -1000);
    });

    expect(result.current.validationIssues.length).toBeGreaterThan(0);

    act(() => {
      result.current.updateField('initialSavings', 500000);
    });

    expect(result.current.validationIssues).toEqual([]);
  });

  it('updates derived withdrawal rate when target multiple changes', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    act(() => {
      result.current.updateField('targetPortfolioMultiple', 25);
    });

    expect(result.current.derivedWithdrawalRate).toBeCloseTo(4.0, 2); // 100/25 = 4%
  });

  it('returns zero withdrawal rate for invalid multiples', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    act(() => {
      result.current.updateField('targetPortfolioMultiple', 0);
    });

    expect(result.current.derivedWithdrawalRate).toBe(0);
  });

  it('provides Monte Carlo settings object', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    const { mcSettings } = result.current;

    expect(mcSettings).toHaveProperty('enabled');
    expect(mcSettings).toHaveProperty('iterations');
    expect(mcSettings).toHaveProperty('volatility');
    expect(mcSettings).toHaveProperty('targetSurvival');
    expect(mcSettings).toHaveProperty('retirementEndAge');
    expect(mcSettings).toHaveProperty('useHistoricalReturns');
  });

  it('updates MC settings when MC fields change', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    act(() => {
      result.current.updateField('mcEnabled', true);
      result.current.updateField('mcIterations', 5000);
      result.current.updateField('mcVolatility', 20);
    });

    expect(result.current.mcSettings.enabled).toBe(true);
    expect(result.current.mcSettings.iterations).toBe(5000);
    expect(result.current.mcSettings.volatility).toBe(20);
  });

  it('memoizes mcSettings to prevent unnecessary re-renders', () => {
    const { result, rerender } = renderHook(() => useCalculatorConfig());

    const firstMcSettings = result.current.mcSettings;

    // Update unrelated field
    act(() => {
      result.current.updateField('initialSavings', 600000);
    });

    rerender();

    // MC settings object should be same reference (memoized)
    expect(result.current.mcSettings).toBe(firstMcSettings);
  });

  it('validates cross-field constraints', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    act(() => {
      // Set clerking start after clerking end (invalid)
      result.current.updateField('clerkingStartYear', 2031);
      result.current.updateField('clerkingEndYear', 2029);
    });

    expect(result.current.validationIssues.length).toBeGreaterThan(0);
    expect(result.current.validationIssues.some((issue) =>
      issue.toLowerCase().includes('clerking')
    )).toBe(true);
  });

  it('handles NaN values gracefully', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    act(() => {
      result.current.updateField('initialSavings', NaN);
    });

    // Should generate validation error
    expect(result.current.validationIssues.length).toBeGreaterThan(0);
  });

  it('handles Infinity values gracefully', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    act(() => {
      result.current.updateField('initialSavings', Infinity);
    });

    // Should generate validation error
    expect(result.current.validationIssues.length).toBeGreaterThan(0);
  });

  it('validates integer-only fields', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    act(() => {
      // Years should be integers
      result.current.updateField('clerkingStartYear', 2029.5);
    });

    expect(result.current.validationIssues.some((issue) =>
      issue.includes('integer')
    )).toBe(true);
  });

  it('enforces numeric bounds on fields', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    act(() => {
      // Savings way above maximum
      result.current.updateField('initialSavings', 2_000_000_000);
    });

    expect(result.current.validationIssues.length).toBeGreaterThan(0);
  });

  it('allows valid values within bounds', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    act(() => {
      result.current.updateField('initialSavings', 750000);
      result.current.updateField('monthlyExpenses', 8000);
      result.current.updateField('targetPortfolioMultiple', 25);
    });

    expect(result.current.validationIssues).toEqual([]);
    expect(result.current.calculatorInputs.initialSavings).toBe(750000);
  });

  it('updates calculator inputs when valid changes occur', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    act(() => {
      result.current.updateField('spouseIncome2025', 250000);
    });

    expect(result.current.calculatorInputs.spouseIncome2025).toBe(250000);
  });

  it('includes withdrawal rate in calculator inputs', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    const withdrawalRate = result.current.calculatorInputs.withdrawalRate;

    expect(withdrawalRate).toBeGreaterThan(0);
    expect(withdrawalRate).toBeLessThan(10);
    expect(withdrawalRate).toBeCloseTo(result.current.derivedWithdrawalRate, 2);
  });

  it('toggles boolean fields correctly', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    const initialValue = result.current.state.includeHealthcareBuffer;

    act(() => {
      result.current.updateField('includeHealthcareBuffer', !initialValue);
    });

    expect(result.current.state.includeHealthcareBuffer).toBe(!initialValue);
  });

  it('maintains type safety for updateField', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    // This test just ensures TypeScript types are correct - if it compiles, it passes
    act(() => {
      result.current.updateField('initialSavings', 600000); // number
      result.current.updateField('mcEnabled', true); // boolean
      result.current.updateField('clerkingStartYear', 2029); // number (year)
    });

    expect(result.current.state.initialSavings).toBe(600000);
    expect(result.current.state.mcEnabled).toBe(true);
    expect(result.current.state.clerkingStartYear).toBe(2029);
  });

  it('provides current year consistently', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    expect(result.current.currentYear).toBe(2025);
    expect(result.current.calculatorInputs.currentYear).toBe(2025);
  });

  it('initializes with useHistoricalReturns false', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    expect(result.current.state.mcUseHistoricalReturns).toBe(false);
    expect(result.current.mcSettings.useHistoricalReturns).toBe(false);
  });

  it('updates useHistoricalReturns setting', () => {
    const { result } = renderHook(() => useCalculatorConfig());

    act(() => {
      result.current.updateField('mcUseHistoricalReturns', true);
    });

    expect(result.current.state.mcUseHistoricalReturns).toBe(true);
    expect(result.current.mcSettings.useHistoricalReturns).toBe(true);
  });
});
