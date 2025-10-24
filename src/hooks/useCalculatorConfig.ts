import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalculatorInputs } from '../domain/types'
import {
  CalculatorForm,
  CalculatorInput,
  convertFormToInput,
  validateCalculatorForm,
} from '../domain/schemas'

const CURRENT_YEAR = 2025

const initialFormState: CalculatorForm = {
  currentYear: CURRENT_YEAR,
  initialSavings: 500000,
  initialTaxablePct: 60,
  monthlyExpenses: 10000,
  propertyTax: 20000,
  propertyTaxGrowth: 2,
  inflationRate: 3,
  fireExpenseTarget: 135000,
  targetPortfolioMultiple: 25,
  includeHealthcareBuffer: true,
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
  mcIterations: 1000,
  mcVolatility: 15,
  mcTargetSurvival: 90,
  mcRetirementEndAge: 90,
  withdrawalRate: 4,
}

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

  const safeTargetMultiple = Number.isFinite(state.targetPortfolioMultiple)
    ? Math.max(state.targetPortfolioMultiple, 1)
    : 1
  const derivedWithdrawalRate = useMemo(
    () => (safeTargetMultiple > 0 ? 100 / safeTargetMultiple : 0),
    [safeTargetMultiple],
  )

  const rawInputs = useMemo(
    () => ({
      ...state,
      currentYear: CURRENT_YEAR,
      targetPortfolioMultiple: safeTargetMultiple,
      withdrawalRate: derivedWithdrawalRate,
    }),
    [state, safeTargetMultiple, derivedWithdrawalRate],
  )

  useEffect(() => {
    const validation = convertFormToInput(rawInputs, CURRENT_YEAR)
    if (validation.success && validation.data) {
      setLastValidInputs(validation.data)
      setValidationIssues([])
    } else if (!validation.success) {
      setValidationIssues(validation.issues)
    }
  }, [rawInputs])

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
