import { CalculatorFormState } from '../../../hooks/useCalculatorConfig';

type UpdateField = <Key extends keyof CalculatorFormState>(
  key: Key,
  value: CalculatorFormState[Key],
) => void;

interface CalculatorInputsPanelProps {
  state: CalculatorFormState;
  updateField: UpdateField;
  currentYear: number;
  derivedWithdrawalRate: number;
  mcRunning: boolean;
  onRunMonteCarlo: () => void;
}

export default function CalculatorInputsPanel({
  state,
  updateField,
  currentYear,
  derivedWithdrawalRate,
  mcRunning,
  onRunMonteCarlo,
}: CalculatorInputsPanelProps) {
  const {
    initialSavings,
    initialTaxablePct,
    monthlyExpenses,
    propertyTax,
    propertyTaxGrowth,
    inflationRate,
    fireExpenseTarget,
    targetPortfolioMultiple,
    includeHealthcareBuffer,
    annualHealthcareCost,
    spendingDecrement65to74,
    spendingDecrement75to84,
    spendingDecrement85plus,
    taxAdvReturnRate,
    taxableReturnRate,
    spouseIncome2025,
    spouseIncomeGrowth,
    myIncome2025,
    bigLawStartYear,
    clerkingStartYear,
    clerkingEndYear,
    clerkingSalary,
    returnToFirmYear,
    publicInterestYear,
    publicInterestSalary,
    publicInterestGrowth,
    mySocialSecurityAmount,
    mySocialSecurityStartAge,
    spouseSocialSecurityAmount,
    spouseSocialSecurityStartAge,
    tuitionPerSemester,
    daughter1Birth,
    daughter2Birth,
    initial529Balance,
    annual529Contribution,
    collegeCostPerYear,
    collegeInflation,
    rentalIncome,
    rentalMortgagePandI,
    mortgageEndYear,
    rentalPropertyTax,
    rentalPropertyTaxGrowth,
    rentalInsurance,
    rentalMaintenanceCapex,
    rentalVacancyRate,
    standardDeduction,
    itemizedDeductions,
    mcEnabled,
    mcIterations,
    mcVolatility,
    mcTargetSurvival,
    mcRetirementEndAge,
  } = state;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <details className="bg-white border border-gray-200 rounded-lg shadow-sm" open>
        <summary className="cursor-pointer font-semibold text-lg px-4 py-3 border-b">
          Current Portfolio & Savings
        </summary>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Current Portfolio Balance</label>
            <input
              type="number"
              value={initialSavings}
              onChange={(e) => updateField('initialSavings', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Taxable Allocation (%)</label>
            <input
              type="number"
              value={initialTaxablePct}
              onChange={(e) => updateField('initialTaxablePct', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div className="text-xs text-gray-500 md:col-span-2">
            {currentYear} starting balance split between taxable and tax-advantaged accounts. This drives initial asset allocation for growth projections.
          </div>
        </div>
      </details>

      <details className="bg-white border border-gray-200 rounded-lg shadow-sm" open>
        <summary className="cursor-pointer font-semibold text-lg px-4 py-3 border-b">
          Living Expenses
        </summary>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Monthly Expenses</label>
            <input
              type="number"
              value={monthlyExpenses}
              onChange={(e) => updateField('monthlyExpenses', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Annual Property Tax</label>
            <input
              type="number"
              value={propertyTax}
              onChange={(e) => updateField('propertyTax', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Property Tax Growth (%)</label>
            <input
              type="number"
              step="0.1"
              value={propertyTaxGrowth}
              onChange={(e) => updateField('propertyTaxGrowth', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Inflation Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={inflationRate}
              onChange={(e) => updateField('inflationRate', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
        </div>
      </details>

      <details className="bg-white border border-gray-200 rounded-lg shadow-sm" open>
        <summary className="cursor-pointer font-semibold text-lg px-4 py-3 border-b">
          FIRE Target & Spending
        </summary>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Annual FIRE Spending Target</label>
            <input
              type="number"
              value={fireExpenseTarget}
              onChange={(e) => updateField('fireExpenseTarget', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">
              Target Portfolio Multiple (× annual spending)
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              value={targetPortfolioMultiple}
              onChange={(e) => updateField('targetPortfolioMultiple', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              Equivalent real withdrawal rate: {derivedWithdrawalRate.toFixed(2)}%
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={includeHealthcareBuffer}
                onChange={(e) => updateField('includeHealthcareBuffer', e.target.checked)}
                className="rounded"
              />
              Include healthcare buffer until Medicare eligibility
            </label>
          </div>
          {includeHealthcareBuffer && (
            <div>
              <label className="block text-sm text-gray-600">Annual Healthcare Cost</label>
              <input
                type="number"
                value={annualHealthcareCost}
                onChange={(e) => updateField('annualHealthcareCost', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
          )}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500">Spend Decrement 65-74 (%/yr)</label>
              <input
                type="number"
                step="0.5"
                value={spendingDecrement65to74}
                onChange={(e) => updateField('spendingDecrement65to74', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Spend Decrement 75-84 (%/yr)</label>
              <input
                type="number"
                step="0.5"
                value={spendingDecrement75to84}
                onChange={(e) => updateField('spendingDecrement75to84', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Spend Decrement 85+ (%/yr)</label>
              <input
                type="number"
                step="0.5"
                value={spendingDecrement85plus}
                onChange={(e) => updateField('spendingDecrement85plus', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
          </div>
        </div>
      </details>

      <details className="bg-white border border-gray-200 rounded-lg shadow-sm" open>
        <summary className="cursor-pointer font-semibold text-lg px-4 py-3 border-b">
          Investment Returns
        </summary>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Tax-Advantaged Return (%)</label>
            <input
              type="number"
              step="0.1"
              value={taxAdvReturnRate}
              onChange={(e) => updateField('taxAdvReturnRate', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Taxable Return (%)</label>
            <input
              type="number"
              step="0.1"
              value={taxableReturnRate}
              onChange={(e) => updateField('taxableReturnRate', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
        </div>
      </details>

      <details className="bg-white border border-gray-200 rounded-lg shadow-sm" open>
        <summary className="cursor-pointer font-semibold text-lg px-4 py-3 border-b">
          Career & Income
        </summary>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Spouse Income (2025)</label>
              <input
                type="number"
                value={spouseIncome2025}
                onChange={(e) => updateField('spouseIncome2025', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Spouse Income Growth (%)</label>
              <input
                type="number"
                step="0.1"
                value={spouseIncomeGrowth}
                onChange={(e) => updateField('spouseIncomeGrowth', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600">My Income (2025)</label>
              <input
                type="number"
                value={myIncome2025}
                onChange={(e) => updateField('myIncome2025', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">BigLaw Start Year</label>
              <input
                type="number"
                value={bigLawStartYear}
                onChange={(e) => updateField('bigLawStartYear', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Clerking Start Year</label>
              <input
                type="number"
                value={clerkingStartYear}
                onChange={(e) => updateField('clerkingStartYear', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Clerking End Year</label>
              <input
                type="number"
                value={clerkingEndYear}
                onChange={(e) => updateField('clerkingEndYear', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Clerking Salary</label>
              <input
                type="number"
                value={clerkingSalary}
                onChange={(e) => updateField('clerkingSalary', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Return-to-Firm Class Year</label>
              <input
                type="number"
                value={returnToFirmYear}
                onChange={(e) => updateField('returnToFirmYear', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Public Interest Start</label>
              <input
                type="number"
                value={publicInterestYear}
                onChange={(e) => updateField('publicInterestYear', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Public Interest Salary</label>
              <input
                type="number"
                value={publicInterestSalary}
                onChange={(e) => updateField('publicInterestSalary', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Public Interest Growth (%)</label>
              <input
                type="number"
                step="0.1"
                value={publicInterestGrowth}
                onChange={(e) => updateField('publicInterestGrowth', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600">My Social Security ($)</label>
              <input
                type="number"
                value={mySocialSecurityAmount}
                onChange={(e) => updateField('mySocialSecurityAmount', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">My SS Start Age</label>
              <input
                type="number"
                value={mySocialSecurityStartAge}
                onChange={(e) => updateField('mySocialSecurityStartAge', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Spouse Social Security ($)</label>
              <input
                type="number"
                value={spouseSocialSecurityAmount}
                onChange={(e) => updateField('spouseSocialSecurityAmount', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Spouse SS Start Age</label>
              <input
                type="number"
                value={spouseSocialSecurityStartAge}
                onChange={(e) => updateField('spouseSocialSecurityStartAge', Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
          </div>
        </div>
      </details>

      <details className="bg-white border border-gray-200 rounded-lg shadow-sm" open>
        <summary className="cursor-pointer font-semibold text-lg px-4 py-3 border-b">
          Kids & College
        </summary>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Daughter #1 Birth Year</label>
            <input
              type="number"
              value={daughter1Birth}
              onChange={(e) => updateField('daughter1Birth', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Daughter #2 Birth Year</label>
            <input
              type="number"
              value={daughter2Birth}
              onChange={(e) => updateField('daughter2Birth', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Initial 529 Balance (total)</label>
            <input
              type="number"
              value={initial529Balance}
              onChange={(e) => updateField('initial529Balance', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Annual 529 Contribution (per child)</label>
            <input
              type="number"
              value={annual529Contribution}
              onChange={(e) => updateField('annual529Contribution', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">College Cost per Year</label>
            <input
              type="number"
              value={collegeCostPerYear}
              onChange={(e) => updateField('collegeCostPerYear', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">College Inflation (%)</label>
            <input
              type="number"
              step="0.1"
              value={collegeInflation}
              onChange={(e) => updateField('collegeInflation', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600">Law School Tuition per Semester (2026 dollars)</label>
            <input
              type="number"
              value={tuitionPerSemester}
              onChange={(e) => updateField('tuitionPerSemester', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
        </div>
      </details>

      <details className="bg-white border border-gray-200 rounded-lg shadow-sm" open>
        <summary className="cursor-pointer font-semibold text-lg px-4 py-3 border-b">
          Rental Property
        </summary>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Monthly Rental Income</label>
            <input
              type="number"
              value={rentalIncome}
              onChange={(e) => updateField('rentalIncome', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Monthly P&I Payment</label>
            <input
              type="number"
              value={rentalMortgagePandI}
              onChange={(e) => updateField('rentalMortgagePandI', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Mortgage Payoff Year</label>
            <input
              type="number"
              value={mortgageEndYear}
              onChange={(e) => updateField('mortgageEndYear', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Property Tax (Prop 13)</label>
            <input
              type="number"
              value={rentalPropertyTax}
              onChange={(e) => updateField('rentalPropertyTax', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Property Tax Growth (%)</label>
            <input
              type="number"
              step="0.1"
              value={rentalPropertyTaxGrowth}
              onChange={(e) => updateField('rentalPropertyTaxGrowth', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Insurance (inflates)</label>
            <input
              type="number"
              value={rentalInsurance}
              onChange={(e) => updateField('rentalInsurance', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Maintenance / CapEx</label>
            <input
              type="number"
              value={rentalMaintenanceCapex}
              onChange={(e) => updateField('rentalMaintenanceCapex', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Vacancy Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={rentalVacancyRate}
              onChange={(e) => updateField('rentalVacancyRate', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
        </div>
      </details>

      <details className="bg-white border border-gray-200 rounded-lg shadow-sm" open>
        <summary className="cursor-pointer font-semibold text-lg px-4 py-3 border-b">
          Tax Settings
        </summary>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Standard Deduction (MFJ)</label>
            <input
              type="number"
              value={standardDeduction}
              onChange={(e) => updateField('standardDeduction', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Itemized Deductions</label>
            <input
              type="number"
              value={itemizedDeductions}
              onChange={(e) => updateField('itemizedDeductions', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div className="md:col-span-2 text-xs text-gray-500">
            Calculator uses greater of standard vs itemized deductions. Above-the-line contributions (HSA, Dependent Care FSA) applied automatically.
          </div>
        </div>
      </details>

      <details className="bg-white border border-gray-200 rounded-lg shadow-sm" open>
        <summary className="cursor-pointer font-semibold text-lg px-4 py-3 border-b">
          Monte Carlo Settings
        </summary>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={mcEnabled}
              onChange={(e) => updateField('mcEnabled', e.target.checked)}
              className="rounded"
            />
            Enable Monte Carlo simulation (randomized returns)
          </label>

          <div>
            <label className="block text-sm text-gray-600">Iterations</label>
            <input
              type="number"
              value={mcIterations}
              onChange={(e) => updateField('mcIterations', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
              min={100}
              step={100}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Volatility (%)</label>
            <input
              type="number"
              step="0.5"
              value={mcVolatility}
              onChange={(e) => updateField('mcVolatility', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Target Survival Rate (%)</label>
            <input
              type="number"
              step="1"
              value={mcTargetSurvival}
              onChange={(e) => updateField('mcTargetSurvival', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Retirement End Age</label>
            <input
              type="number"
              value={mcRetirementEndAge}
              onChange={(e) => updateField('mcRetirementEndAge', Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-between bg-blue-50 border border-blue-100 px-4 py-3 rounded">
            <div className="text-sm text-blue-700">
              Run Monte Carlo to stress-test market volatility and withdrawal phase (takes ~1s for 1,000 runs).
            </div>
            <button
              type="button"
              onClick={onRunMonteCarlo}
              disabled={!mcEnabled || mcRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {mcRunning ? 'Running…' : 'Run Monte Carlo'}
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
