import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalculatorInputs } from '../domain/types'
import {
  CalculatorForm,
  CalculatorInput,
  convertFormToInput,
  validateCalculatorForm,
} from '../domain/schemas'

const CURRENT_YEAR = 2025

// Default scenario representing the household we're modelling. Keeping the values
// inline (rather than fetching from an API or config file) makes it obvious to a
// reviewer which assumptions back the initial projections.
const initialFormState: CalculatorForm = {
  currentYear: CURRENT_YEAR,
  initialSavings: 500000,
  initialTaxablePct: 60,
  monthlyExpenses: 10000,
  propertyTax: 20000,
  propertyTaxGrowth: 2,
  inflationRate: 3,
  fireExpenseTarget: 135000,
  targetPortfolioMultiple: 20,
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
  withdrawalRate: 4,
}

// Validate the seed data once during module initialisation. If the schema
// constraints ever reject these defaults we want to fail fast during development.
const initialValidated = convertFormToInput(initialFormState, CURRENT_YEAR)

if (!initialValidated.success || !initialValidated.data) {
  throw new Error('Invalid initial calculator configuration')
}

export function useCalculatorConfig() {
  const [state, setState] = useState<CalculatorForm>(initialFormState)
  const [lastValidInputs, setLastValidInputs] = useState<CalculatorInput>(
    initialValidated.data,
  )
  const [validationIssues, setValidationIssues] = useState<string[]>([])

  // Consumers call updateField whenever an input changes. We allow temporarily
  // invalid data (e.g., blank fields) so the UI feels responsive, but we keep a
  // running list of validation issues to display alongside the form.
  const updateField = useCallback(
    <Key extends keyof CalculatorForm>(key: Key, value: CalculatorForm[Key]) => {
      setState((prev) => {
        const candidate: CalculatorForm = {
          ...prev,
          [key]: value,
        }
        const validation = validateCalculatorForm(candidate)
        if (!validation.success || !validation.data) {
          setValidationIssues(validation.issues)
          return candidate
        }
        setValidationIssues([])
        return validation.data
      })
    },
    [],
  )

  // Withdrawal rate is 100 / multiple, but only when the multiple is valid. This
  // lets the UI highlight errors without silently substituting a different value.
  const derivedWithdrawalRate = useMemo(() => {
    const target = state.targetPortfolioMultiple
    if (!Number.isFinite(target) || target <= 0) {
      return 0
    }
    return 100 / target
  }, [state.targetPortfolioMultiple])

  const rawInputs = useMemo(
    () => ({
      ...state,
      currentYear: CURRENT_YEAR,
      withdrawalRate: derivedWithdrawalRate,
    }),
    [state, derivedWithdrawalRate],
  )

  // Convert into calculator-ready inputs whenever raw state changes. Successful
  // conversions reset the validation messages; failures keep the last verified
  // inputs while exposing the error list to the UI.
  useEffect(() => {
    const validation = convertFormToInput(rawInputs, CURRENT_YEAR)
    if (validation.success && validation.data) {
      setLastValidInputs(validation.data)
      setValidationIssues([])
    } else if (!validation.success) {
      setValidationIssues(validation.issues)
    }
  }, [rawInputs])

  // Monte Carlo settings are memoised separately so components do not re-render
  // when unrelated fields change (e.g., editing taxable return rate).
  const mcSettings = useMemo(
    () => ({
      enabled: state.mcEnabled,
      iterations: state.mcIterations,
      volatility: state.mcVolatility,
      targetSurvival: state.mcTargetSurvival,
      retirementEndAge: state.mcRetirementEndAge,
    }),
    [
      state.mcEnabled,
      state.mcIterations,
      state.mcVolatility,
      state.mcTargetSurvival,
      state.mcRetirementEndAge,
    ],
  )

  return {
    currentYear: CURRENT_YEAR,
    state,
    updateField,
    calculatorInputs: lastValidInputs as CalculatorInputs,
    mcSettings,
    validationIssues,
    derivedWithdrawalRate,
  }
}

export type CalculatorFormState = CalculatorForm
