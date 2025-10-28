import { CalculatorInputs } from './types'

// UI form state extends the deterministic calculator inputs with Monte Carlo-only
// toggles. Keeping one interface lets us share validation between accumulation
// and withdrawal surfaces.
export interface CalculatorForm extends CalculatorInputs {
  mcEnabled: boolean
  mcIterations: number
  mcVolatility: number
  mcTargetSurvival: number
  mcRetirementEndAge: number
  mcUseHistoricalReturns: boolean
  mcStockAllocation: number
  mcBondReturn: number
}

// Generic validation result used by both synchronous checks and form-to-input
// conversions. We collect every issue so the UI can show a list rather than
// failing on the first invalid field.
export interface ValidationResult<T> {
  success: boolean
  data?: T
  issues: string[]
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

// Many fields are user editable, so we harden the validator against NaN / +/- Infinity.
const ensureFinite = (value: number, label: string, issues: string[]) => {
  if (!Number.isFinite(value)) {
    issues.push(`${label} must be a finite number.`)
  }
}

export const validateCalculatorForm = (form: CalculatorForm): ValidationResult<CalculatorForm> => {
  const issues: string[] = []

  // Scalar numeric bounds. These guard both UI edits and programmatic updates
  // (e.g., linking/unlinking phases) and should mirror the business assumptions.
  const numericBounds: Array<[keyof CalculatorForm, number, number]> = [
    ['initialSavings', 0, 1_000_000_000],
    ['initialTaxablePct', 0, 100],
    ['monthlyExpenses', 0, 1_000_000],
    ['propertyTax', 0, 1_000_000],
    ['propertyTaxGrowth', -10, 20],
    ['inflationRate', -5, 20],
    ['fireExpenseTarget', 0, 5_000_000],
    ['targetPortfolioMultiple', 1, 100],
    ['annualHealthcareCost', 0, 1_000_000],
    ['taxAdvReturnRate', -50, 50],
    ['taxableReturnRate', -50, 50],
    ['spouseIncome2025', 0, 10_000_000],
    ['spouseIncomeGrowth', -10, 20],
    ['myIncome2025', 0, 10_000_000],
    ['clerkingSalary', 0, 10_000_000],
    ['publicInterestSalary', 0, 10_000_000],
    ['publicInterestGrowth', -10, 20],
    ['mySocialSecurityAmount', 0, 500_000],
    ['spouseSocialSecurityAmount', 0, 500_000],
    ['tuitionPerSemester', 0, 500_000],
    ['initial529Balance', 0, 10_000_000],
    ['annual529Contribution', 0, 500_000],
    ['collegeCostPerYear', 0, 1_000_000],
    ['collegeInflation', -10, 20],
    ['rentalIncome', 0, 1_000_000],
    ['rentalMortgagePandI', 0, 1_000_000],
    ['rentalMortgageOriginalPrincipal', 0, 10_000_000],
    ['rentalMortgageRate', 0, 25],
    ['rentalPropertyTax', 0, 1_000_000],
    ['rentalPropertyTaxGrowth', -10, 20],
    ['rentalInsurance', 0, 1_000_000],
    ['rentalMaintenanceCapex', 0, 1_000_000],
    ['rentalVacancyRate', 0, 100],
    ['standardDeduction', 0, 1_000_000],
    ['itemizedDeductions', 0, 1_000_000],
    ['ssWageBase2025', 0, 1_000_000],
    ['ssWageBaseGrowth', -10, 20],
    ['spendingDecrement65to74', 0, 20],
    ['spendingDecrement75to84', 0, 20],
    ['spendingDecrement85plus', 0, 20],
    ['mcIterations', 1, 100_000],
    ['mcVolatility', 0, 100],
    ['mcTargetSurvival', 0, 100],
    ['mcStockAllocation', 0, 100],
    ['mcBondReturn', -20, 20],
  ]

  numericBounds.forEach(([key, min, max]) => {
    const value = form[key]
    ensureFinite(value, key, issues)
    if (value < min || value > max) {
      issues.push(`${String(key)} must be between ${min} and ${max}.`)
    }
  })

  // Integer-only fields (years/ages). Reject fractional values so downstream
  // modules can safely rely on calendar arithmetic.
  const integerFields: Array<[keyof CalculatorForm, number, number]> = [
    ['bigLawStartYear', 1900, 2100],
    ['clerkingStartYear', 1900, 2100],
    ['clerkingEndYear', 1900, 2100],
    ['returnToFirmYear', 1, 40],
    ['publicInterestYear', 1900, 2100],
    ['mySocialSecurityStartAge', 50, 80],
    ['spouseSocialSecurityStartAge', 50, 80],
    ['daughter1Birth', 1900, 2100],
    ['daughter2Birth', 1900, 2100],
    ['rentalMortgageStartYear', 1900, 2100],
    ['mortgageEndYear', 1900, 2200],
    ['mcRetirementEndAge', 60, 120],
  ]

  integerFields.forEach(([key, min, max]) => {
    const value = form[key] as number
    if (!Number.isInteger(value)) {
      issues.push(`${String(key)} must be an integer.`)
    } else if (value < min || value > max) {
      issues.push(`${String(key)} must be between ${min} and ${max}.`)
    }
  })

  // Cross-field checks: enforce timeline ordering so the career pipeline remains
  // logically consistent.
  if (form.bigLawStartYear > form.clerkingStartYear) {
    issues.push('BigLaw start year must be on or before the clerking start year.')
  }
  if (form.clerkingStartYear > form.clerkingEndYear) {
    issues.push('Clerking end year must be after the start year.')
  }

  const sanitized: CalculatorForm = {
    ...form,
    initialTaxablePct: clamp(form.initialTaxablePct, 0, 100),
    targetPortfolioMultiple: Math.max(1, form.targetPortfolioMultiple),
    mcStockAllocation: clamp(form.mcStockAllocation, 0, 100),
  }

  if (issues.length > 0) {
    return { success: false, issues }
  }

  return { success: true, data: sanitized, issues }
}

export type CalculatorInput = CalculatorInputs

export const convertFormToInput = (
  form: CalculatorForm,
  currentYear: number,
): ValidationResult<CalculatorInput> => {
  const issues: string[] = []

  if (!Number.isInteger(currentYear) || currentYear < 1900 || currentYear > 2100) {
    issues.push('currentYear must be between 1900 and 2100.')
  }

  // Reuse the core validator so any UI edits and programmatic updates share the
  // same guardrails. We return the original validation issues so the UI can
  // continue displaying them while preserving last known-good inputs.
  const baseValidation = validateCalculatorForm(form)
  if (!baseValidation.success || !baseValidation.data) {
    return { success: false, issues: baseValidation.issues }
  }

  const safeForm = baseValidation.data
  const withdrawalRate = 100 / safeForm.targetPortfolioMultiple

  const data: CalculatorInput = {
    ...safeForm,
    currentYear,
    withdrawalRate,
  }

  return { success: issues.length === 0, data, issues }
}
