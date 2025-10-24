import { useCallback, type ReactNode } from 'react';
import { CalculatorFormState } from '../../../hooks/useCalculatorConfig';

// Reusable type describing the setter exposed by useCalculatorConfig. Having it
// here keeps the component generic and prevents us from hard-coding field names.
type UpdateField = <Key extends keyof CalculatorFormState>(
  key: Key,
  value: CalculatorFormState[Key],
) => void;

// Shared currency formatter: renders `$` + comma separators while allowing blank
// states. We centralise this to ensure all currency fields look consistent.
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// Fields that should display as currency; everything else stays as plain numeric
// input (percentage, year, etc.).
const currencyFields: Array<keyof CalculatorFormState> = [
  'initialSavings',
  'monthlyExpenses',
  'propertyTax',
  'fireExpenseTarget',
  'annualHealthcareCost',
  'spouseIncome2025',
  'myIncome2025',
  'clerkingSalary',
  'publicInterestSalary',
  'mySocialSecurityAmount',
  'spouseSocialSecurityAmount',
  'tuitionPerSemester',
  'initial529Balance',
  'annual529Contribution',
  'collegeCostPerYear',
  'rentalIncome',
  'rentalMortgagePandI',
  'rentalMortgageOriginalPrincipal',
  'rentalPropertyTax',
  'rentalInsurance',
  'rentalMaintenanceCapex',
  'standardDeduction',
  'itemizedDeductions',
  'ssWageBase2025',
];

const currencyFieldSet = new Set(currencyFields);

// Tooltips map form fields to audit-friendly explanations so reviewers understand
// why each slider/input matters. We include the Monte Carlo toggles and special
// checkboxes as “virtual” keys.
type TooltipKey = keyof CalculatorFormState | 'includeHealthcareBuffer' | 'mcEnabled';

const fieldTooltips: Partial<Record<TooltipKey, string>> = {
  initialSavings: "Starting combined balance across taxable and tax-deferred accounts in base-year dollars.",
  initialTaxablePct: "Share of the starting portfolio held in taxable accounts; the remainder flows into tax-advantaged accounts.",
  monthlyExpenses: "Current monthly spending that drives the baseline budget and inflates at the general inflation rate each year.",
  propertyTax: "Current annual property tax bill; future years grow using the Property Tax Growth percentage.",
  propertyTaxGrowth: "Annual percentage increase applied to the property tax line (2% approximates California Prop 13).",
  inflationRate: "General CPI assumption applied to wages, living expenses, and tax brackets throughout the projection.",
  fireExpenseTarget: "Desired annual retirement spending in today's dollars; escalated each year by the inflation rate.",
  targetPortfolioMultiple: "Target nest egg expressed as a multiple of annual spending; used to derive the effective withdrawal rate.",
  includeHealthcareBuffer: "Adds the healthcare buffer amount to retirement spending until Medicare eligibility when enabled.",
  annualHealthcareCost: "Additional annual healthcare cost prior to Medicare; specified in today's dollars and inflated each year.",
  spendingDecrement65to74: "Annual real spending reduction applied between ages 65 and 74 to reflect lower discretionary costs.",
  spendingDecrement75to84: "Annual real spending reduction applied between ages 75 and 84.",
  spendingDecrement85plus: "Annual real spending reduction applied from age 85 onward.",
  taxAdvReturnRate: "Nominal annual return assumption for tax-advantaged accounts before subtracting inflation.",
  taxableReturnRate: "Nominal annual return assumption for taxable accounts after accounting for dividend and tax drag.",
  spouseIncome2025: "Spouse's gross W-2 income in the base year; grows with the Spouse Income Growth rate while employed.",
  spouseIncomeGrowth: "Annual percentage increase applied to spouse income to reflect raises and promotions.",
  myIncome2025: "Your own salary in the base year before BigLaw begins.",
  bigLawStartYear: "Calendar year you enter BigLaw; used to start the BigLaw compensation ladder.",
  clerkingStartYear: "Calendar year you begin clerking; salary and savings adjust accordingly.",
  clerkingEndYear: "Calendar year the clerkship ends and BigLaw resumes.",
  clerkingSalary: "Gross annual pay while clerking.",
  returnToFirmYear: "Associate class year credit when returning to BigLaw post-clerkship (e.g., 3 = third-year associate).",
  publicInterestYear: "Calendar year you transition into public interest work.",
  publicInterestSalary: "Starting salary for the public interest role.",
  publicInterestGrowth: "Annual percentage change applied to the public interest salary schedule.",
  mySocialSecurityAmount: "Estimated annual Social Security benefit for you at the chosen claiming age (nominal dollars).",
  mySocialSecurityStartAge: "Age when your Social Security benefit begins.",
  spouseSocialSecurityAmount: "Estimated annual Social Security benefit for your spouse at the selected claiming age.",
  spouseSocialSecurityStartAge: "Age when the spouse's Social Security benefit starts.",
  tuitionPerSemester: "Law school tuition per semester stated in base-year dollars; grows with the college inflation rate.",
  daughter1Birth: "Birth year for child #1; drives their college timeline and 529 withdrawals.",
  daughter2Birth: "Birth year for child #2; drives their college timeline and 529 withdrawals.",
  initial529Balance: "Combined current balance across both 529 plans.",
  annual529Contribution: "Total annual contribution per child into their 529 account.",
  collegeCostPerYear: "All-in annual cost of attendance per child before inflation adjustments.",
  collegeInflation: "Annual percentage increase applied to college costs and tuition.",
  rentalIncome: "Monthly gross rent collected from the rental property; increases with the general inflation rate.",
  rentalMortgagePandI: "Monthly principal and interest payment on the rental mortgage schedule.",
  mortgageEndYear: "First calendar year in which the rental mortgage is fully paid off.",
  rentalPropertyTax: "Current annual property tax for the rental; inflates with the rental property tax growth rate.",
  rentalPropertyTaxGrowth: "Annual percentage change applied to the rental property tax line item.",
  rentalInsurance: "Annual insurance premium for the rental property.",
  rentalMaintenanceCapex: "Annual reserve for maintenance and capital improvements on the rental.",
  rentalVacancyRate: "Percentage of the rental year assumed to be vacant; reduces rental income accordingly.",
  standardDeduction: "Standard deduction amount; the model uses the higher of standard or itemized deductions each year.",
  itemizedDeductions: "Other itemized deductions available (mortgage interest, SALT, etc.); compared against the standard deduction.",
  ssWageBase2025: "Social Security wage base limit for the base year (wages above this avoid the 6.2% OASDI tax).",
  ssWageBaseGrowth: "Assumed annual growth rate applied to the Social Security wage base.",
  mcEnabled: "Toggle to run randomized return scenarios; leave off for the deterministic projection.",
  mcIterations: "Number of Monte Carlo simulation runs; higher values improve stability but take longer.",
  mcVolatility: "Standard deviation of annual returns used for Monte Carlo draws.",
  mcTargetSurvival: "Required percentage of successful Monte Carlo runs that finish above zero.",
  mcRetirementEndAge: "Final age evaluated in Monte Carlo survival calculations.",
};

const TooltipIcon = ({ field }: { field: TooltipKey }) => {
  const tooltip = fieldTooltips[field];
  if (!tooltip) {
    return null;
  }
  return (
    <span
      className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700"
      data-tooltip={tooltip}
      aria-label={tooltip}
      role="img"
    >
      ?
    </span>
  );
};

// Wrapper to render a label + tooltip icon. Keeps the JSX below concise and makes
// it obvious which tooltip copy maps to which field.
const FieldLabel = ({
  field,
  text,
  className = 'block text-sm text-gray-600',
}: {
  field: TooltipKey;
  text: string;
  className?: string;
}) => (
  <label className={className}>
    <span className="inline-flex items-center gap-1">
      {text}
      <TooltipIcon field={field} />
    </span>
  </label>
);

// Variant for checkbox-style controls (include healthcare buffer, MC toggle).
const FieldCheckboxLabel = ({
  field,
  text,
  children,
}: {
  field: TooltipKey;
  text: string;
  children: ReactNode;
}) => (
  <label className="flex items-center gap-2 text-sm text-gray-600">
    {children}
    <span className="inline-flex items-center gap-1">
      {text}
      <TooltipIcon field={field} />
    </span>
  </label>
);

// Currency-formatted fields switch to text inputs so we can display `$` and commas
// without fighting the browser’s numeric input restrictions.
const getInputType = (key: keyof CalculatorFormState): 'number' | 'text' =>
  currencyFieldSet.has(key) ? 'text' : 'number';

// Parse user input, tolerating $ and comma characters. Blank strings become NaN
// so validation can flag the field while still showing the cleared value.
const parseNumericInput = (value: string): number => {
  const trimmed = value.trim();
  if (trimmed === '') {
    return Number.NaN;
  }
  const normalized = trimmed.replace(/[$,]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

interface CalculatorInputsPanelProps {
  state: CalculatorFormState;
  updateField: UpdateField;
  currentYear: number;
  derivedWithdrawalRate: number;
  mcRunning: boolean;
  validationIssues: string[];
  onRunMonteCarlo: () => void;
}

export default function CalculatorInputsPanel({
  state,
  updateField,
  currentYear,
  derivedWithdrawalRate,
  validationIssues,
  mcRunning,
  onRunMonteCarlo,
}: CalculatorInputsPanelProps) {
  // Prepare display values (currency strings, blank when NaN) so the template
  // below stays focused on layout rather than formatting details.
  const getDisplayValue = useCallback(
    <Key extends keyof CalculatorFormState>(key: Key) => {
      const rawValue = state[key];
      if (typeof rawValue !== 'number') {
        return rawValue;
      }
      if (!Number.isFinite(rawValue)) {
        return '';
      }
      if (currencyFieldSet.has(key)) {
        return currencyFormatter.format(rawValue);
      }
      return rawValue;
    },
    [state],
  );

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

  // Sections are grouped to mirror how the projection engine consumes inputs:
  // current portfolio, expenses, FIRE targets, career timeline, etc. This layout
  // helps auditors trace a field directly to the relevant domain module.
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {validationIssues.length > 0 && (
        <div className="lg:col-span-2 border border-red-200 bg-red-50 text-red-800 text-sm rounded-lg px-4 py-3">
          <p className="font-semibold mb-1">Please review the highlighted validation issues:</p>
          <ul className="list-disc list-inside space-y-1">
            {validationIssues.map((issue, index) => (
              <li key={`${issue}-${index}`}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
      <details className="bg-white border border-gray-200 rounded-lg shadow-sm" open>
        <summary className="cursor-pointer font-semibold text-lg px-4 py-3 border-b">
          Current Portfolio & Savings
        </summary>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel field="initialSavings" text="Current Portfolio Balance" />
            <input
              type={getInputType('initialSavings')}
                inputMode="decimal"
              value={getDisplayValue('initialSavings')}
              onChange={(e) => updateField('initialSavings', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="initialTaxablePct" text="Taxable Allocation (%)" />
            <input
              type={getInputType('initialTaxablePct')}
                inputMode="decimal"
              value={getDisplayValue('initialTaxablePct')}
              onChange={(e) => updateField('initialTaxablePct', parseNumericInput(e.target.value))}
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
            <FieldLabel field="monthlyExpenses" text="Monthly Expenses" />
            <input
              type={getInputType('monthlyExpenses')}
                inputMode="decimal"
              value={getDisplayValue('monthlyExpenses')}
              onChange={(e) => updateField('monthlyExpenses', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="propertyTax" text="Annual Property Tax" />
            <input
              type={getInputType('propertyTax')}
                inputMode="decimal"
              value={getDisplayValue('propertyTax')}
              onChange={(e) => updateField('propertyTax', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="propertyTaxGrowth" text="Property Tax Growth (%)" />
            <input
              type={getInputType('propertyTaxGrowth')}
                inputMode="decimal"
              step="0.1"
              value={getDisplayValue('propertyTaxGrowth')}
              onChange={(e) => updateField('propertyTaxGrowth', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="inflationRate" text="Inflation Rate (%)" />
            <input
              type={getInputType('inflationRate')}
                inputMode="decimal"
              step="0.1"
              value={getDisplayValue('inflationRate')}
              onChange={(e) => updateField('inflationRate', parseNumericInput(e.target.value))}
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
            <FieldLabel field="fireExpenseTarget" text="Annual FIRE Spending Target" />
            <input
              type={getInputType('fireExpenseTarget')}
                inputMode="decimal"
              value={getDisplayValue('fireExpenseTarget')}
              onChange={(e) => updateField('fireExpenseTarget', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="targetPortfolioMultiple" text="Target Portfolio Multiple (× annual spending)" />
            <input
              type={getInputType('targetPortfolioMultiple')}
                inputMode="decimal"
              step="0.5"
              min="1"
              value={getDisplayValue('targetPortfolioMultiple')}
              onChange={(e) => updateField('targetPortfolioMultiple', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              Equivalent real withdrawal rate: {derivedWithdrawalRate.toFixed(2)}%
            </p>
          </div>
          <div className="md:col-span-2">
            <FieldCheckboxLabel field="includeHealthcareBuffer" text="Include healthcare buffer until Medicare eligibility">
              <input
                type="checkbox"
                checked={includeHealthcareBuffer}
                onChange={(e) => updateField('includeHealthcareBuffer', e.target.checked)}
                className="rounded"
              />
            </FieldCheckboxLabel>
          </div>
          {includeHealthcareBuffer && (
            <div>
              <FieldLabel field="annualHealthcareCost" text="Annual Healthcare Cost" />
              <input
                type={getInputType('annualHealthcareCost')}
                inputMode="decimal"
                value={getDisplayValue('annualHealthcareCost')}
                onChange={(e) => updateField('annualHealthcareCost', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
          )}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <FieldLabel
                field="spendingDecrement65to74"
                text="Spend Decrement 65-74 (%/yr)"
                className="block text-xs text-gray-500"
              />
              <input
                type={getInputType('spendingDecrement65to74')}
                inputMode="decimal"
                step="0.5"
                value={getDisplayValue('spendingDecrement65to74')}
                onChange={(e) => updateField('spendingDecrement65to74', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <FieldLabel
                field="spendingDecrement75to84"
                text="Spend Decrement 75-84 (%/yr)"
                className="block text-xs text-gray-500"
              />
              <input
                type={getInputType('spendingDecrement75to84')}
                inputMode="decimal"
                step="0.5"
                value={getDisplayValue('spendingDecrement75to84')}
                onChange={(e) => updateField('spendingDecrement75to84', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <FieldLabel
                field="spendingDecrement85plus"
                text="Spend Decrement 85+ (%/yr)"
                className="block text-xs text-gray-500"
              />
              <input
                type={getInputType('spendingDecrement85plus')}
                inputMode="decimal"
                step="0.5"
                value={getDisplayValue('spendingDecrement85plus')}
                onChange={(e) => updateField('spendingDecrement85plus', parseNumericInput(e.target.value))}
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
            <FieldLabel field="taxAdvReturnRate" text="Tax-Advantaged Return (%)" />
            <input
              type={getInputType('taxAdvReturnRate')}
                inputMode="decimal"
              step="0.1"
              value={getDisplayValue('taxAdvReturnRate')}
              onChange={(e) => updateField('taxAdvReturnRate', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="taxableReturnRate" text="Taxable Return (%)" />
            <input
              type={getInputType('taxableReturnRate')}
                inputMode="decimal"
              step="0.1"
              value={getDisplayValue('taxableReturnRate')}
              onChange={(e) => updateField('taxableReturnRate', parseNumericInput(e.target.value))}
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
            <FieldLabel field="spouseIncome2025" text="Spouse Income (2025)" />
              <input
                type={getInputType('spouseIncome2025')}
                inputMode="decimal"
                value={getDisplayValue('spouseIncome2025')}
                onChange={(e) => updateField('spouseIncome2025', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
            <FieldLabel field="spouseIncomeGrowth" text="Spouse Income Growth (%)" />
              <input
                type={getInputType('spouseIncomeGrowth')}
                inputMode="decimal"
                step="0.1"
                value={getDisplayValue('spouseIncomeGrowth')}
                onChange={(e) => updateField('spouseIncomeGrowth', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <FieldLabel field="myIncome2025" text="My Income (2025)" />
              <input
                type={getInputType('myIncome2025')}
                inputMode="decimal"
                value={getDisplayValue('myIncome2025')}
                onChange={(e) => updateField('myIncome2025', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <FieldLabel field="bigLawStartYear" text="BigLaw Start Year" />
              <input
                type={getInputType('bigLawStartYear')}
                inputMode="decimal"
                value={getDisplayValue('bigLawStartYear')}
                onChange={(e) => updateField('bigLawStartYear', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <FieldLabel field="clerkingStartYear" text="Clerking Start Year" />
              <input
                type={getInputType('clerkingStartYear')}
                inputMode="decimal"
                value={getDisplayValue('clerkingStartYear')}
                onChange={(e) => updateField('clerkingStartYear', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <FieldLabel field="clerkingEndYear" text="Clerking End Year" />
              <input
                type={getInputType('clerkingEndYear')}
                inputMode="decimal"
                value={getDisplayValue('clerkingEndYear')}
                onChange={(e) => updateField('clerkingEndYear', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <FieldLabel field="clerkingSalary" text="Clerking Salary" />
              <input
                type={getInputType('clerkingSalary')}
                inputMode="decimal"
                value={getDisplayValue('clerkingSalary')}
                onChange={(e) => updateField('clerkingSalary', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <FieldLabel field="returnToFirmYear" text="Return-to-Firm Class Year" />
              <input
                type={getInputType('returnToFirmYear')}
                inputMode="decimal"
                value={getDisplayValue('returnToFirmYear')}
                onChange={(e) => updateField('returnToFirmYear', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <FieldLabel field="publicInterestYear" text="Public Interest Start" />
              <input
                type={getInputType('publicInterestYear')}
                inputMode="decimal"
                value={getDisplayValue('publicInterestYear')}
                onChange={(e) => updateField('publicInterestYear', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <FieldLabel field="publicInterestSalary" text="Public Interest Salary" />
              <input
                type={getInputType('publicInterestSalary')}
                inputMode="decimal"
                value={getDisplayValue('publicInterestSalary')}
                onChange={(e) => updateField('publicInterestSalary', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <FieldLabel field="publicInterestGrowth" text="Public Interest Growth (%)" />
              <input
                type={getInputType('publicInterestGrowth')}
                inputMode="decimal"
                step="0.1"
                value={getDisplayValue('publicInterestGrowth')}
                onChange={(e) => updateField('publicInterestGrowth', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
            <FieldLabel field="mySocialSecurityAmount" text="My Social Security ($)" />
              <input
                type={getInputType('mySocialSecurityAmount')}
                inputMode="decimal"
                value={getDisplayValue('mySocialSecurityAmount')}
                onChange={(e) => updateField('mySocialSecurityAmount', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
            <FieldLabel field="mySocialSecurityStartAge" text="My SS Start Age" />
              <input
                type={getInputType('mySocialSecurityStartAge')}
                inputMode="decimal"
                value={getDisplayValue('mySocialSecurityStartAge')}
                onChange={(e) => updateField('mySocialSecurityStartAge', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
            <FieldLabel field="spouseSocialSecurityAmount" text="Spouse Social Security ($)" />
              <input
                type={getInputType('spouseSocialSecurityAmount')}
                inputMode="decimal"
                value={getDisplayValue('spouseSocialSecurityAmount')}
                onChange={(e) => updateField('spouseSocialSecurityAmount', parseNumericInput(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
            <FieldLabel field="spouseSocialSecurityStartAge" text="Spouse SS Start Age" />
              <input
                type={getInputType('spouseSocialSecurityStartAge')}
                inputMode="decimal"
                value={getDisplayValue('spouseSocialSecurityStartAge')}
                onChange={(e) => updateField('spouseSocialSecurityStartAge', parseNumericInput(e.target.value))}
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
            <FieldLabel field="daughter1Birth" text="Daughter #1 Birth Year" />
            <input
              type={getInputType('daughter1Birth')}
                inputMode="decimal"
              value={getDisplayValue('daughter1Birth')}
              onChange={(e) => updateField('daughter1Birth', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="daughter2Birth" text="Daughter #2 Birth Year" />
            <input
              type={getInputType('daughter2Birth')}
                inputMode="decimal"
              value={getDisplayValue('daughter2Birth')}
              onChange={(e) => updateField('daughter2Birth', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="initial529Balance" text="Initial 529 Balance (total)" />
            <input
              type={getInputType('initial529Balance')}
                inputMode="decimal"
              value={getDisplayValue('initial529Balance')}
              onChange={(e) => updateField('initial529Balance', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="annual529Contribution" text="Annual 529 Contribution (per child)" />
            <input
              type={getInputType('annual529Contribution')}
                inputMode="decimal"
              value={getDisplayValue('annual529Contribution')}
              onChange={(e) => updateField('annual529Contribution', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="collegeCostPerYear" text="College Cost per Year" />
            <input
              type={getInputType('collegeCostPerYear')}
                inputMode="decimal"
              value={getDisplayValue('collegeCostPerYear')}
              onChange={(e) => updateField('collegeCostPerYear', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="collegeInflation" text="College Inflation (%)" />
            <input
              type={getInputType('collegeInflation')}
                inputMode="decimal"
              step="0.1"
              value={getDisplayValue('collegeInflation')}
              onChange={(e) => updateField('collegeInflation', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel field="tuitionPerSemester" text="Law School Tuition per Semester (2026 dollars)" />
            <input
              type={getInputType('tuitionPerSemester')}
                inputMode="decimal"
              value={getDisplayValue('tuitionPerSemester')}
              onChange={(e) => updateField('tuitionPerSemester', parseNumericInput(e.target.value))}
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
            <FieldLabel field="rentalIncome" text="Monthly Rental Income" />
            <input
              type={getInputType('rentalIncome')}
                inputMode="decimal"
              value={getDisplayValue('rentalIncome')}
              onChange={(e) => updateField('rentalIncome', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="rentalMortgagePandI" text="Monthly P&I Payment" />
            <input
              type={getInputType('rentalMortgagePandI')}
                inputMode="decimal"
              value={getDisplayValue('rentalMortgagePandI')}
              onChange={(e) => updateField('rentalMortgagePandI', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="mortgageEndYear" text="Mortgage Payoff Year" />
            <input
              type={getInputType('mortgageEndYear')}
                inputMode="decimal"
              value={getDisplayValue('mortgageEndYear')}
              onChange={(e) => updateField('mortgageEndYear', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="rentalPropertyTax" text="Property Tax (Prop 13)" />
            <input
              type={getInputType('rentalPropertyTax')}
                inputMode="decimal"
              value={getDisplayValue('rentalPropertyTax')}
              onChange={(e) => updateField('rentalPropertyTax', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="rentalPropertyTaxGrowth" text="Property Tax Growth (%)" />
            <input
              type={getInputType('rentalPropertyTaxGrowth')}
                inputMode="decimal"
              step="0.1"
              value={getDisplayValue('rentalPropertyTaxGrowth')}
              onChange={(e) => updateField('rentalPropertyTaxGrowth', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="rentalInsurance" text="Insurance (inflates)" />
            <input
              type={getInputType('rentalInsurance')}
                inputMode="decimal"
              value={getDisplayValue('rentalInsurance')}
              onChange={(e) => updateField('rentalInsurance', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="rentalMaintenanceCapex" text="Maintenance / CapEx" />
            <input
              type={getInputType('rentalMaintenanceCapex')}
                inputMode="decimal"
              value={getDisplayValue('rentalMaintenanceCapex')}
              onChange={(e) => updateField('rentalMaintenanceCapex', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="rentalVacancyRate" text="Vacancy Rate (%)" />
            <input
              type={getInputType('rentalVacancyRate')}
                inputMode="decimal"
              step="0.1"
              value={getDisplayValue('rentalVacancyRate')}
              onChange={(e) => updateField('rentalVacancyRate', parseNumericInput(e.target.value))}
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
            <FieldLabel field="standardDeduction" text="Standard Deduction (MFJ)" />
            <input
              type={getInputType('standardDeduction')}
                inputMode="decimal"
              value={getDisplayValue('standardDeduction')}
              onChange={(e) => updateField('standardDeduction', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="itemizedDeductions" text="Itemized Deductions" />
            <input
              type={getInputType('itemizedDeductions')}
                inputMode="decimal"
              value={getDisplayValue('itemizedDeductions')}
              onChange={(e) => updateField('itemizedDeductions', parseNumericInput(e.target.value))}
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
          <FieldCheckboxLabel field="mcEnabled" text="Enable Monte Carlo simulation (randomized returns)">
            <input
              type="checkbox"
              checked={mcEnabled}
              onChange={(e) => updateField('mcEnabled', e.target.checked)}
              className="rounded"
            />
          </FieldCheckboxLabel>

          <div>
            <FieldLabel field="mcIterations" text="Iterations" />
            <input
              type={getInputType('mcIterations')}
                inputMode="decimal"
              value={getDisplayValue('mcIterations')}
              onChange={(e) => updateField('mcIterations', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
              min={100}
              step={100}
            />
          </div>
          <div>
            <FieldLabel field="mcVolatility" text="Volatility (%)" />
            <input
              type={getInputType('mcVolatility')}
                inputMode="decimal"
              step="0.5"
              value={getDisplayValue('mcVolatility')}
              onChange={(e) => updateField('mcVolatility', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="mcTargetSurvival" text="Target Survival Rate (%)" />
            <input
              type={getInputType('mcTargetSurvival')}
                inputMode="decimal"
              step="1"
              value={getDisplayValue('mcTargetSurvival')}
              onChange={(e) => updateField('mcTargetSurvival', parseNumericInput(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <FieldLabel field="mcRetirementEndAge" text="Retirement End Age" />
            <input
              type={getInputType('mcRetirementEndAge')}
                inputMode="decimal"
              value={getDisplayValue('mcRetirementEndAge')}
              onChange={(e) => updateField('mcRetirementEndAge', parseNumericInput(e.target.value))}
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
