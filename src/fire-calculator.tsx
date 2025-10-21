import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

/**
 * FIRE RETIREMENT CALCULATOR WITH MONTE CARLO SIMULATION
 * 
 * PURPOSE:
 * Comprehensive financial planning tool for modeling Financial Independence/Retire Early (FIRE)
 * with complex career trajectory (BigLaw → Clerking → BigLaw → Public Interest).
 * 
 * KEY FEATURES:
 * - Deterministic base case projection (2025-2065)
 * - Monte Carlo simulation with both accumulation and withdrawal phases
 * - Tax calculations (Federal, California, FICA)
 * - 529 college savings with per-daughter tracking
 * - Rental property with mortgage amortization and Prop 13 tax caps
 * - Social Security income modeling
 * - Healthcare buffer option for pre-Medicare years
 * 
 * AUTHOR NOTES:
 * - All dollar amounts in nominal (not inflation-adjusted) terms unless specified
 * - "2025 dollars" means the base year value before inflation adjustments
 * - Inflation is applied consistently to most categories; Prop 13 limits property tax growth to 2%
 */
export default function FIRECalculator() {
  const [currentYear] = useState(2025);
  
  // ============================================================================
  // CURRENT STATUS
  // ============================================================================
  // Initial portfolio allocation between taxable and tax-advantaged accounts
  // This represents the starting split; allocation evolves over time based on
  // contribution patterns (we max out tax-advantaged first, overflow to taxable)
  const [initialSavings, setInitialSavings] = useState(500000);
  const [initialTaxablePct, setInitialTaxablePct] = useState(60);
  
  // ============================================================================
  // LIVING EXPENSES
  // ============================================================================
  // Monthly expenses inflate at general inflation rate (3% default)
  // Property tax grows at Prop 13 cap (2% default) - California-specific
  const [monthlyExpenses, setMonthlyExpenses] = useState(10000);
  const [propertyTax, setPropertyTax] = useState(20000);
  const [propertyTaxGrowth, setPropertyTaxGrowth] = useState(2);
  const [inflationRate, setInflationRate] = useState(3);
  
  // ============================================================================
  // FIRE TARGET SETTINGS
  // ============================================================================
  // Target annual spending in retirement (inflates with general inflation)
  // Withdrawal rate: 3.5% is conservative for 40+ year horizon (vs traditional 4% rule)
  // Healthcare buffer: Optional additional reserve for pre-Medicare years (until age 65)
  const [fireExpenseTarget, setFireExpenseTarget] = useState(135000);
  const [withdrawalRate, setWithdrawalRate] = useState(3.5);
  const [includeHealthcareBuffer, setIncludeHealthcareBuffer] = useState(false);
  const [annualHealthcareCost, setAnnualHealthcareCost] = useState(12000);
  
  // ============================================================================
  // INVESTMENT RETURNS
  // ============================================================================
  // Tax-advantaged (401k, IRA): 7% - no dividend drag
  // Taxable brokerage: 6% - accounts for dividend taxation reducing effective return
  // These are nominal returns (not inflation-adjusted)
  const [taxAdvReturnRate, setTaxAdvReturnRate] = useState(7);
  const [taxableReturnRate, setTaxableReturnRate] = useState(6);
  
  // ============================================================================
  // INCOME - SPOUSE
  // ============================================================================
  // Spouse has steady W-2 income with regular annual raises throughout timeline
  const [spouseIncome2025, setSpouseIncome2025] = useState(200000);
  const [spouseIncomeGrowth, setSpouseIncomeGrowth] = useState(3);
  
  // ============================================================================
  // INCOME - MY CAREER TIMELINE
  // ============================================================================
  // Complex trajectory: Law school → BigLaw → Clerking → BigLaw → Public Interest
  // 
  // RATIONALE FOR TIMELINE:
  // - BigLaw uses Cravath lockstep scale (no annual raises, only class year progression)
  // - Clerking provides partial credit: 2 years clerking = return as 3rd year associate
  // - Public interest provides 401k match; BigLaw does not (for associates)
  const [myIncome2025, setMyIncome2025] = useState(40000);
  const [bigLawStartYear, setBigLawStartYear] = useState(2028);
  const [clerkingStartYear, setClerkingStartYear] = useState(2029);
  const [clerkingEndYear, setClerkingEndYear] = useState(2031);
  const [clerkingSalary, setClerkingSalary] = useState(100000);
  const [returnToFirmYear, setReturnToFirmYear] = useState(3);
  const [publicInterestYear, setPublicInterestYear] = useState(2036);
  const [publicInterestSalary, setPublicInterestSalary] = useState(80000);
  const [publicInterestGrowth, setPublicInterestGrowth] = useState(3);
  
  // ============================================================================
  // SOCIAL SECURITY
  // ============================================================================
  // Social Security income starts at specified ages (typically 62-70)
  // Inflates with general inflation rate to model COLA adjustments
  const [mySocialSecurityAmount, setMySocialSecurityAmount] = useState(35000);
  const [mySocialSecurityStartYear, setMySocialSecurityStartYear] = useState(2055);
  const [spouseSocialSecurityAmount, setSpouseSocialSecurityAmount] = useState(40000);
  const [spouseSocialSecurityStartYear, setSpouseSocialSecurityStartYear] = useState(2057);
  
  // ============================================================================
  // LAW SCHOOL TUITION
  // ============================================================================
  // Fixed payments 2026-2027 (no inflation adjustment)
  // Paid from after-tax income, reduces available savings
  const [tuitionPerSemester, setTuitionPerSemester] = useState(30000);
  
  // ============================================================================
  // COLLEGE SAVINGS (529 ACCOUNTS)
  // ============================================================================
  // APPROACH: Track separate 529 accounts per daughter
  // - Contributions start 2028 (after law school)
  // - Each daughter's account stops growing/contributing when she turns 22
  // - Shortfalls (when 529 balance insufficient) paid from main portfolio
  // - College inflation separate from general inflation (education costs rise faster)
  const [daughter1Birth, setDaughter1Birth] = useState(2021);
  const [daughter2Birth, setDaughter2Birth] = useState(2025);
  const [initial529Balance, setInitial529Balance] = useState(0);
  const [annual529Contribution, setAnnual529Contribution] = useState(9000);
  const [collegeCostPerYear, setCollegeCostPerYear] = useState(40000);
  const [collegeInflation, setCollegeInflation] = useState(3.5);
  
  // ============================================================================
  // RENTAL PROPERTY
  // ============================================================================
  // APPROACH: Model full cash flow and tax treatment
  // - Rental income inflates with general inflation
  // - Property tax capped at 2% (California Prop 13)
  // - Mortgage interest is tax-deductible (calculated via amortization)
  // - Vacancy and maintenance are tax-deductible (Real Estate Professional status)
  // - Cash flow calculation: Income - expenses - P&I (before payoff) or just income - expenses (after payoff)
  // - Tax calculation: Income - expenses - mortgage interest (not full P&I, only interest)
  // - After mortgage payoff (2050), cash flow increases significantly
  const [rentalIncome, setRentalIncome] = useState(5800);
  const [rentalMortgagePandI, setRentalMortgagePandI] = useState(1633);
  const [rentalMortgagePrincipal] = useState(355621.78);
  const [rentalMortgageRate] = useState(2.75);
  const [mortgageEndYear, setMortgageEndYear] = useState(2050);
  const [rentalPropertyTax, setRentalPropertyTax] = useState(8000);
  const [rentalPropertyTaxGrowth, setRentalPropertyTaxGrowth] = useState(2);
  const [rentalInsurance, setRentalInsurance] = useState(3323);
  const [rentalMaintenanceCapex, setRentalMaintenanceCapex] = useState(11000);
  const [rentalVacancyRate, setRentalVacancyRate] = useState(5);
  
  // ============================================================================
  // TAX SETTINGS
  // ============================================================================
  // APPROACH: Calculate federal, state (CA), and FICA separately
  // - Standard vs itemized: Use greater of the two (standard deduction inflates)
  // - Above-the-line deductions: HSA, Dependent Care FSA (applied before standard/itemized choice)
  // - Rental mortgage interest: Automatically added to itemized deductions
  // - Tax brackets inflate at general inflation rate
  // - FICA: Social Security (6.2% up to wage base), Medicare (1.45% + 0.9% over $250k MFJ)
  const [standardDeduction, setStandardDeduction] = useState(29200);
  const [itemizedDeductions, setItemizedDeductions] = useState(0);
  
  // ============================================================================
  // MONTE CARLO SETTINGS
  // ============================================================================
  // PURPOSE: Model market uncertainty via random returns
  // - Uses Box-Muller transform for normally distributed returns
  // - Volatility = standard deviation of annual returns (15% = typical stock market)
  // - Simulations track both accumulation (working) and withdrawal (retired) phases
  const [mcEnabled, setMcEnabled] = useState(false);
  const [mcIterations, setMcIterations] = useState(1000);
  const [mcVolatility, setMcVolatility] = useState(15);
  const [mcRunning, setMcRunning] = useState(false);
  const [mcResults, setMcResults] = useState(null);
  
  // ============================================================================
  // CRAVATH SALARY SCALE
  // ============================================================================
  /**
   * Returns BigLaw base salary for given associate year (2025 Cravath scale)
   * 
   * RATIONALE:
   * - Cravath sets market for BigLaw compensation
   * - Scale is lockstep (no performance-based variance)
   * - No annual raises; progression only via class year advancement
   * - Scale is set during first year and remains fixed (no updating for inflation)
   * 
   * @param {number} associateYear - Associate class year (1-8)
   * @returns {number} Annual base salary (excludes bonuses)
   */
  const getCravathSalary = (associateYear) => {
    const scale = {
      1: 225000, 2: 235000, 3: 260000, 4: 305000,
      5: 340000, 6: 365000, 7: 410000, 8: 420000
    };
    return scale[associateYear] || 420000;
  };
  
  // ============================================================================
  // MORTGAGE INTEREST CALCULATION (CLOSED-FORM AMORTIZATION)
  // ============================================================================
  /**
   * Calculates annual mortgage interest for rental property using closed-form formula
   * 
   * APPROACH:
   * Instead of iterating month-by-month from loan origination, we:
   * 1. Calculate remaining balance at start of year using amortization formula
   * 2. Calculate interest for that year's 12 months
   * 
   * RATIONALE:
   * - More efficient than month-by-month iteration
   * - Mathematically equivalent result
   * - Interest is tax-deductible; principal payment is not
   * 
   * @param {number} year - Year to calculate interest for
   * @returns {number} Total interest paid during that year
   */
  const calculateMortgageInterest = (year) => {
    if (year >= mortgageEndYear) return 0;
    
    const monthlyRate = rentalMortgageRate / 100 / 12;
    const monthlyPayment = rentalMortgagePandI;
    const monthsElapsed = (year - currentYear) * 12;
    
    // Calculate total months from start to payoff
    const totalMonths = (mortgageEndYear - currentYear) * 12;
    const remainingMonths = totalMonths - monthsElapsed;
    
    if (remainingMonths <= 0) return 0;
    
    // Remaining balance formula: PMT * [(1 - (1+r)^-n) / r]
    const remainingBalance = monthlyPayment * ((1 - Math.pow(1 + monthlyRate, -remainingMonths)) / monthlyRate);
    
    // Calculate interest for the 12 months of this year
    let balance = remainingBalance;
    let annualInterest = 0;
    
    for (let month = 0; month < 12 && balance > 0; month++) {
      const interest = balance * monthlyRate;
      annualInterest += interest;
      const principal = monthlyPayment - interest;
      balance -= principal;
    }
    
    return annualInterest;
  };
  
  // ============================================================================
  // EMPLOYER 401K MATCH CALCULATION
  // ============================================================================
  /**
   * Calculates employer 401k match based on employment type
   * 
   * MATCH POLICIES:
   * - Spouse: 4% match throughout career (standard corporate benefit)
   * - Me - BigLaw: NO MATCH (confirmed policy for associates)
   * - Me - Clerking: 4% match (government employer)
   * - Me - Public Interest: 4% match (nonprofit employer)
   * 
   * @param {number} myIncome - My annual income
   * @param {number} spouseIncome - Spouse's annual income
   * @param {number} year - Year to calculate match for
   * @returns {number} Total employer match from both jobs
   */
  const calculateEmployerMatch = (myIncome, spouseIncome, year) => {
    let myMatch = 0;
    const spouseMatch = spouseIncome * 0.04;
    
    // I get match during clerking and public interest, not BigLaw
    if (year >= clerkingStartYear && year < clerkingEndYear) {
      myMatch = myIncome * 0.04;
    } else if (year >= publicInterestYear) {
      myMatch = myIncome * 0.04;
    }
    
    return myMatch + spouseMatch;
  };
  
  // ============================================================================
  // TAX CALCULATION
  // ============================================================================
  /**
   * Calculates federal, California state, and FICA taxes
   * 
   * TAX STRUCTURE:
   * 1. Above-the-line deductions: HSA, Dependent Care FSA (reduce AGI)
   * 2. Choose greater of: Standard deduction OR Itemized deductions
   * 3. Apply progressive tax brackets (federal and CA)
   * 4. Calculate FICA separately (flat rate on wages, with SS wage cap)
   * 
   * INFLATION ADJUSTMENTS:
   * - Standard deduction: Inflates at general inflation rate
   * - Tax brackets: Inflate at general inflation rate (simplified; real IRS uses prior year CPI)
   * - HSA limit: Inflates at general inflation rate
   * - Social Security wage base: Inflates at 4% (historical average)
   * 
   * FILING STATUS: Married Filing Jointly (MFJ)
   * 
   * @param {number} myIncome - W-2 wages for taxpayer
   * @param {number} spouseIncome - W-2 wages for spouse
   * @param {number} rentalNetForTaxes - Rental income minus expenses and mortgage interest
   * @param {number} socialSecurityIncome - Combined Social Security benefits
   * @param {number} year - Tax year
   * @returns {object} Detailed tax breakdown
   */
  const calculateTaxes = (myIncome, spouseIncome, rentalNetForTaxes, socialSecurityIncome, year) => {
    const wageIncome = myIncome + spouseIncome;
    
    // Social Security is typically partially taxable, but for simplicity we include full amount
    // (Real calculation would apply 85% inclusion ratio above certain thresholds)
    const totalIncome = wageIncome + rentalNetForTaxes + socialSecurityIncome;
    
    const yearsFromNow = year - currentYear;
    const inflationFactor = Math.pow(1 + inflationRate / 100, yearsFromNow);
    
    // Above-the-line deductions (reduce AGI before standard/itemized choice)
    const hsaContribution = 8550 * inflationFactor;
    const dependentCareFSA = year === 2025 ? 5000 : 7500 * Math.pow(1 + inflationRate / 100, Math.max(0, yearsFromNow - 1));
    
    // Standard vs itemized - use whichever is greater
    const adjustedStandardDeduction = standardDeduction * inflationFactor;
    const adjustedItemizedDeductions = itemizedDeductions * inflationFactor;
    const chosenDeduction = Math.max(adjustedStandardDeduction, adjustedItemizedDeductions);
    
    const totalDeductions = hsaContribution + dependentCareFSA + chosenDeduction;
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    
    // Federal tax brackets (2025 MFJ) - inflate at general inflation rate
    const federalBrackets = [
      { limit: 23200 * inflationFactor, rate: 0.10 },
      { limit: 94300 * inflationFactor, rate: 0.12 },
      { limit: 201050 * inflationFactor, rate: 0.22 },
      { limit: 383900 * inflationFactor, rate: 0.24 },
      { limit: 487450 * inflationFactor, rate: 0.32 },
      { limit: 731200 * inflationFactor, rate: 0.35 },
      { limit: Infinity, rate: 0.37 }
    ];
    
    let federalTax = 0;
    let remainingIncome = taxableIncome;
    let previousLimit = 0;
    
    for (const bracket of federalBrackets) {
      if (remainingIncome <= 0) break;
      const taxableInBracket = Math.min(remainingIncome, bracket.limit - previousLimit);
      federalTax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
      previousLimit = bracket.limit;
    }
    
    // California tax brackets (2025 MFJ) - inflate at general inflation rate
    const caBrackets = [
      { limit: 20198 * inflationFactor, rate: 0.01 },
      { limit: 47884 * inflationFactor, rate: 0.02 },
      { limit: 75576 * inflationFactor, rate: 0.04 },
      { limit: 105146 * inflationFactor, rate: 0.06 },
      { limit: 132590 * inflationFactor, rate: 0.08 },
      { limit: 679278 * inflationFactor, rate: 0.093 },
      { limit: 814732 * inflationFactor, rate: 0.103 },
      { limit: 1000000 * inflationFactor, rate: 0.113 },
      { limit: Infinity, rate: 0.123 }
    ];
    
    let caTax = 0;
    remainingIncome = taxableIncome;
    previousLimit = 0;
    
    for (const bracket of caBrackets) {
      if (remainingIncome <= 0) break;
      const taxableInBracket = Math.min(remainingIncome, bracket.limit - previousLimit);
      caTax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
      previousLimit = bracket.limit;
    }
    
    // FICA (Federal Insurance Contributions Act) - applies to W-2 wages only
    // Social Security: 6.2% up to wage base (indexed to wage growth, ~4% annually)
    // Medicare: 1.45% on all wages
    // Additional Medicare: 0.9% on wages over $250k (MFJ threshold)
    const ssWageBase = 168600 * Math.pow(1.04, yearsFromNow);
    const mySSWages = Math.min(myIncome, ssWageBase);
    const spouseSSWages = Math.min(spouseIncome, ssWageBase);
    const socialSecurityTax = (mySSWages + spouseSSWages) * 0.062;
    
    const medicareTax = wageIncome * 0.0145;
    const additionalMedicare = Math.max(0, wageIncome - 250000) * 0.009;
    
    const totalTax = federalTax + caTax + socialSecurityTax + medicareTax + additionalMedicare;
    
    return {
      federalTax: Math.round(federalTax),
      caTax: Math.round(caTax),
      socialSecurityTax: Math.round(socialSecurityTax),
      medicareTax: Math.round(medicareTax),
      additionalMedicare: Math.round(additionalMedicare),
      totalTax: Math.round(totalTax),
      effectiveRate: (totalTax / totalIncome * 100).toFixed(1)
    };
  };
  
  // ============================================================================
  // BOX-MULLER TRANSFORM (MONTE CARLO RANDOM NUMBER GENERATION)
  // ============================================================================
  /**
   * Generates random numbers from normal distribution using Box-Muller transform
   * 
   * APPROACH:
   * - Takes uniform random numbers [0,1] and converts to normal distribution
   * - More accurate than approximation methods for tails of distribution
   * 
   * USAGE IN MONTE CARLO:
   * - Generate random annual returns: generateNormalRandom(7, 15) = 7% mean, 15% std dev
   * - Models realistic market volatility (returns vary around expected value)
   * 
   * @param {number} mean - Expected return (center of distribution)
   * @param {number} stdDev - Volatility (standard deviation)
   * @returns {number} Random return drawn from normal distribution
   */
  const generateNormalRandom = (mean, stdDev) => {
    let u1 = 0, u2 = 0;
    while(u1 === 0) u1 = Math.random();
    while(u2 === 0) u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  };
  
  /**
   * Calculates specified percentile from sorted array
   * Uses linear interpolation between points for accuracy
   */
  const calculatePercentile = (sortedArr, percentile) => {
    const index = (percentile / 100) * (sortedArr.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (lower === upper) return sortedArr[lower];
    return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
  };
  
  // ============================================================================
  // MAIN PROJECTION CALCULATION (DETERMINISTIC BASE CASE)
  // ============================================================================
  /**
   * Calculates year-by-year financial projection from 2025-2065
   * 
   * APPROACH:
   * 1. Calculate income for year (salary progression, rental income, social security)
   * 2. Calculate taxes (federal, state, FICA)
   * 3. Calculate expenses (living costs, tuition, property tax)
   * 4. Handle 529 contributions and college costs
   * 5. Calculate net savings and allocate to portfolios
   * 6. Apply investment returns
   * 7. Check FIRE achievement
   * 
   * PORTFOLIO ALLOCATION LOGIC:
   * - Positive savings: Max out tax-advantaged accounts first (401k + IRA + match)
   *                     Overflow goes to taxable accounts
   * - Negative savings: Withdraw from taxable first, flag deficit if exhausted
   * - This creates dynamic allocation that evolves based on earning capacity
   * 
   * FIRE TARGET CALCULATION:
   * - Base: Annual expenses / withdrawal rate
   * - Plus: Forward-looking college reserve (projected shortfall not covered by 529s)
   * - Plus: Healthcare buffer (optional, for pre-Medicare years)
   * 
   * @returns {object} Year-by-year projections, FIRE year, and warnings
   */
  const projections = useMemo(() => {
    const years = [];
    
    // Initialize portfolio split per user's current allocation
    let taxAdvPortfolio = initialSavings * (100 - initialTaxablePct) / 100;
    let taxablePortfolio = initialSavings * initialTaxablePct / 100;
    
    // Initialize 529 accounts (split initial balance 50/50)
    let daughter1_529 = initial529Balance / 2;
    let daughter2_529 = initial529Balance / 2;
    
    let fireAchieved = false;
    let fireYear = null;
    let overfundingWarning = null;
    
    // 2025 contribution limits (inflate over time)
    const k401Limit2025 = 23500;
    const rothLimit2025 = 7000;
    
    // Loop through each year from 2025 to 2065 (40-year horizon)
    for (let year = currentYear; year <= currentYear + 40; year++) {
      const yearsFromNow = year - currentYear;
      const inflationFactor = Math.pow(1 + inflationRate / 100, yearsFromNow);
      
      const daughterAge1 = year - daughter1Birth;
      const daughterAge2 = year - daughter2Birth;
      
      // =====================================================================
      // INCOME CALCULATION
      // =====================================================================
      
      // My income: Complex career trajectory
      let myIncome = 0;
      
      if (year < bigLawStartYear) {
        // Law school years
        myIncome = myIncome2025;
      } else if (year >= bigLawStartYear && year < clerkingStartYear) {
        // First stint at BigLaw (before clerking)
        const yearsAtBigLaw = year - bigLawStartYear + 1;
        myIncome = getCravathSalary(yearsAtBigLaw);
      } else if (year >= clerkingStartYear && year < clerkingEndYear) {
        // Clerking period (inflates with general inflation)
        const clerkingYears = year - clerkingStartYear;
        myIncome = clerkingSalary * Math.pow(1 + inflationRate / 100, clerkingYears);
      } else if (year >= clerkingEndYear && year < publicInterestYear) {
        // Return to BigLaw (with class year credit from clerking)
        const yearsBack = year - clerkingEndYear;
        const associateYear = returnToFirmYear + yearsBack;
        myIncome = getCravathSalary(associateYear);
      } else {
        // Public interest (inflates with specified growth rate)
        const piYears = year - publicInterestYear;
        myIncome = publicInterestSalary * Math.pow(1 + publicInterestGrowth / 100, piYears);
      }
      
      // Spouse income: Steady growth throughout career
      const spouseIncome = spouseIncome2025 * Math.pow(1 + spouseIncomeGrowth / 100, yearsFromNow);
      
      // Social Security income (starts at specified years, inflates with general inflation)
      let mySocialSecurity = 0;
      let spouseSocialSecurity = 0;
      
      if (year >= mySocialSecurityStartYear) {
        const ssYears = year - mySocialSecurityStartYear;
        mySocialSecurity = mySocialSecurityAmount * Math.pow(1 + inflationRate / 100, ssYears);
      }
      
      if (year >= spouseSocialSecurityStartYear) {
        const ssYears = year - spouseSocialSecurityStartYear;
        spouseSocialSecurity = spouseSocialSecurityAmount * Math.pow(1 + inflationRate / 100, ssYears);
      }
      
      const socialSecurityIncome = mySocialSecurity + spouseSocialSecurity;
      const totalIncome = myIncome + spouseIncome + socialSecurityIncome;
      
      // =====================================================================
      // RENTAL PROPERTY CALCULATIONS
      // =====================================================================
      
      // All rental property components inflate with general inflation rate
      const adjustedRentalIncome = rentalIncome * inflationFactor;
      const adjustedRentalPropertyTax = rentalPropertyTax * Math.pow(1 + rentalPropertyTaxGrowth / 100, yearsFromNow);
      const adjustedRentalInsurance = rentalInsurance * inflationFactor;
      const adjustedMaintenance = rentalMaintenanceCapex * inflationFactor;
      const vacancyLoss = adjustedRentalIncome * 12 * (rentalVacancyRate / 100);
      
      // Mortgage interest (tax-deductible)
      const mortgageInterest = calculateMortgageInterest(year);
      
      // For tax purposes: Include mortgage interest as deduction
      const rentalNetForTaxes = (adjustedRentalIncome * 12) - adjustedRentalPropertyTax - adjustedRentalInsurance - mortgageInterest - adjustedMaintenance - vacancyLoss;
      
      // For cash flow: Full P&I payment before payoff, just expenses after
      // IMPORTANT: After mortgage payoff (2050), rental income increases significantly
      // because we're no longer making P&I payments (only taxes, insurance, maintenance)
      const rentalNetCashFlow = year < mortgageEndYear 
        ? (adjustedRentalIncome * 12) - (rentalMortgagePandI * 12) - adjustedRentalPropertyTax - adjustedRentalInsurance - adjustedMaintenance - vacancyLoss
        : (adjustedRentalIncome * 12) - adjustedRentalPropertyTax - adjustedRentalInsurance - adjustedMaintenance - vacancyLoss;
      
      // =====================================================================
      // TUITION (LAW SCHOOL)
      // =====================================================================
      
      // Fixed tuition payments 2026-2027, paid from after-tax income
      let tuition = 0;
      if (year === 2026) {
        tuition = tuitionPerSemester * 2;
      } else if (year === 2027) {
        tuition = tuitionPerSemester;
      }
      
      // =====================================================================
      // TAX CALCULATION
      // =====================================================================
      
      const taxes = calculateTaxes(myIncome, spouseIncome, rentalNetForTaxes, socialSecurityIncome, year);
      const netIncome = totalIncome - taxes.totalTax;
      
      // =====================================================================
      // LIVING EXPENSES
      // =====================================================================
      
      // Monthly expenses inflate at general inflation rate
      // Property tax grows at Prop 13 cap (California-specific 2% limit)
      const propertyTaxMultiplier = Math.pow(1 + propertyTaxGrowth / 100, yearsFromNow);
      const annualExpenses = (monthlyExpenses * 12 * inflationFactor) + (propertyTax * propertyTaxMultiplier);
      
      // =====================================================================
      // COLLEGE COSTS (529 ACCOUNTS)
      // =====================================================================
      
      // Calculate inflated college costs for each daughter (ages 18-21)
      let daughter1CollegeCost = 0;
      let daughter2CollegeCost = 0;
      
      if (daughterAge1 >= 18 && daughterAge1 < 22) {
        const collegeYearsFromBase = year - 2025;
        daughter1CollegeCost = collegeCostPerYear * Math.pow(1 + collegeInflation / 100, collegeYearsFromBase);
      }
      
      if (daughterAge2 >= 18 && daughterAge2 < 22) {
        const collegeYearsFromBase = year - 2025;
        daughter2CollegeCost = collegeCostPerYear * Math.pow(1 + collegeInflation / 100, collegeYearsFromBase);
      }
      
      // 529 growth (only if daughter is still under 22)
      // RATIONALE: After college, leftover 529 funds would face penalties for non-education use
      // We freeze them (no growth, no contributions) as they're effectively "done"
      if (daughterAge1 < 22) {
        daughter1_529 = daughter1_529 * (1 + taxAdvReturnRate / 100);
      }
      if (daughterAge2 < 22) {
        daughter2_529 = daughter2_529 * (1 + taxAdvReturnRate / 100);
      }
      
      // 529 contributions
      // - Annual amount is PER DAUGHTER
      // - Contributes to each daughter's account while she's under 22
      // - No contributions 2025-2027 (law school years)
      // - Capped at 50% of positive net savings (prioritize retirement over college)
      const netSavingsBeforeCollege = netIncome + rentalNetCashFlow - annualExpenses - tuition;
      
      let actual529Contribution = 0;
      if (year >= 2028 && netSavingsBeforeCollege > 0) {
        const d1NeedsContribution = daughterAge1 < 22;
        const d2NeedsContribution = daughterAge2 < 22;
        
        // Calculate total contribution needed (sum of per-daughter amounts)
        let d1Contribution = d1NeedsContribution ? annual529Contribution : 0;
        let d2Contribution = d2NeedsContribution ? annual529Contribution : 0;
        let totalContributionNeeded = d1Contribution + d2Contribution;
        
        // Cap at 50% of available savings
        actual529Contribution = Math.min(totalContributionNeeded, netSavingsBeforeCollege * 0.5);
        
        // Allocate proportionally to who needs it
        if (totalContributionNeeded > 0) {
          const d1Share = d1Contribution / totalContributionNeeded;
          const d2Share = d2Contribution / totalContributionNeeded;
          daughter1_529 += actual529Contribution * d1Share;
          daughter2_529 += actual529Contribution * d2Share;
        }
      }
      
      // Pay college costs from 529 accounts
      // If 529 balance insufficient, shortfall is paid from main portfolio
      let college529Shortfall = 0;
      
      if (daughter1CollegeCost > 0) {
        if (daughter1_529 >= daughter1CollegeCost) {
          daughter1_529 -= daughter1CollegeCost;
        } else {
          college529Shortfall += (daughter1CollegeCost - daughter1_529);
          daughter1_529 = 0;
        }
      }
      
      if (daughter2CollegeCost > 0) {
        if (daughter2_529 >= daughter2CollegeCost) {
          daughter2_529 -= daughter2CollegeCost;
        } else {
          college529Shortfall += (daughter2CollegeCost - daughter2_529);
          daughter2_529 = 0;
        }
      }
      
      const totalExpenses = annualExpenses + tuition + college529Shortfall;
      const netSavings = netSavingsBeforeCollege - actual529Contribution - college529Shortfall;
      
      // =====================================================================
      // PORTFOLIO CONTRIBUTIONS
      // =====================================================================
      
      // Calculate contribution limits (inflate over time)
      const limitInflationFactor = inflationFactor;
      const k401Limit = k401Limit2025 * limitInflationFactor;
      const rothLimit = rothLimit2025 * limitInflationFactor;
      const employerMatch = calculateEmployerMatch(myIncome, spouseIncome, year);
      
      // Max tax-advantaged contribution: (401k × 2) + (IRA × 2) + employer match
      const maxTaxAdvContribution = (k401Limit * 2) + (rothLimit * 2) + employerMatch;
      
      let taxAdvContribution = 0;
      let taxableContribution = 0;
      let taxableWithdrawal = 0;
      let deficit = false;
      
      if (netSavings > 0) {
        // Positive savings: Max out tax-advantaged first, overflow to taxable
        taxAdvContribution = Math.min(netSavings, maxTaxAdvContribution);
        taxableContribution = Math.max(0, netSavings - maxTaxAdvContribution);
      } else if (netSavings < 0) {
        // Negative savings: Withdraw from taxable first
        const withdrawalNeeded = Math.abs(netSavings);
        if (taxablePortfolio >= withdrawalNeeded) {
          taxableWithdrawal = withdrawalNeeded;
        } else {
          // Would need to tap tax-advantaged accounts (flag as deficit)
          // We don't actually do early withdrawals (10% penalty), just flag the problem
          deficit = true;
          taxableWithdrawal = taxablePortfolio;
        }
      }
      
      // =====================================================================
      // APPLY INVESTMENT RETURNS
      // =====================================================================
      
      const taxAdvGrowth = taxAdvPortfolio * (taxAdvReturnRate / 100);
      const taxableGrowth = taxablePortfolio * (taxableReturnRate / 100);
      
      taxAdvPortfolio = taxAdvPortfolio + taxAdvGrowth + taxAdvContribution;
      taxablePortfolio = taxablePortfolio + taxableGrowth + taxableContribution - taxableWithdrawal;
      
      // Floor at zero (no negative balances)
      if (taxablePortfolio < 0) {
        taxablePortfolio = 0;
      }
      
      const totalPortfolio = taxAdvPortfolio + taxablePortfolio;
      const portfolioGrowth = taxAdvGrowth + taxableGrowth;
      
      // =====================================================================
      // CALCULATE FIRE TARGET
      // =====================================================================
      
      // Component 1: Base retirement expenses
      // Forward-looking calculation: What will 529 balances cover? What's the gap?
      let collegeReserveNeeded = 0;
      
      if (daughterAge1 < 22) {
        let future529Balance = daughter1_529;
        let futureCollegeCosts = 0;
        
        // Project all remaining college years for D1
        for (let age = daughterAge1; age < 22; age++) {
          if (age >= 18) {
            const yearOfCollege = daughter1Birth + age;
            const yearsFromBase = yearOfCollege - 2025;
            const costThisYear = collegeCostPerYear * Math.pow(1 + collegeInflation / 100, yearsFromBase);
            futureCollegeCosts += costThisYear;
          }
          
          // Project 529 growth with future contributions
          if (age < 22) {
            const futureYear = daughter1Birth + age;
            const contribution = (futureYear <= 2027) ? 0 : (annual529Contribution);
            future529Balance = future529Balance * (1 + taxAdvReturnRate / 100) + contribution;
          }
        }
        
        collegeReserveNeeded += Math.max(0, futureCollegeCosts - future529Balance);
      }
      
      // Same calculation for D2
      if (daughterAge2 < 22) {
        let future529Balance = daughter2_529;
        let futureCollegeCosts = 0;
        
        for (let age = daughterAge2; age < 22; age++) {
          if (age >= 18) {
            const yearOfCollege = daughter2Birth + age;
            const yearsFromBase = yearOfCollege - 2025;
            const costThisYear = collegeCostPerYear * Math.pow(1 + collegeInflation / 100, yearsFromBase);
            futureCollegeCosts += costThisYear;
          }
          
          if (age < 22) {
            const futureYear = daughter2Birth + age;
            const contribution = (futureYear <= 2027) ? 0 : (annual529Contribution);
            future529Balance = future529Balance * (1 + taxAdvReturnRate / 100) + contribution;
          }
        }
        
        collegeReserveNeeded += Math.max(0, futureCollegeCosts - future529Balance);
      }
      
      // Component 2: Healthcare buffer (optional)
      // Covers pre-Medicare healthcare costs from FIRE year until age 65
      const fireTargetExpenses = fireExpenseTarget * inflationFactor;
      const sustainableWithdrawal = totalPortfolio * (withdrawalRate / 100);
      
      let healthcareBuffer = 0;
      if (includeHealthcareBuffer) {
        const myAge = year - (2025 - 38);
        const yearsUntilMedicare = Math.max(0, 65 - myAge);
        const healthcareCostInflated = annualHealthcareCost * inflationFactor;
        healthcareBuffer = (healthcareCostInflated * yearsUntilMedicare);
      }
      
      // FIRE target formula: (Annual expenses / withdrawal rate) + college reserve + healthcare
      const fireTarget = fireTargetExpenses / (withdrawalRate / 100) + collegeReserveNeeded + healthcareBuffer;
      
      // Check if FIRE achieved this year
      if (!fireAchieved && totalPortfolio >= fireTarget) {
        fireAchieved = true;
        fireYear = year;
      }
      
      // Store year's results
      years.push({
        year,
        myIncome: Math.round(myIncome),
        spouseIncome: Math.round(spouseIncome),
        socialSecurityIncome: Math.round(socialSecurityIncome),
        totalIncome: Math.round(totalIncome),
        federalTax: taxes.federalTax,
        stateTax: taxes.caTax,
        ficaTax: Math.round(taxes.socialSecurityTax + taxes.medicareTax + taxes.additionalMedicare),
        totalTax: taxes.totalTax,
        effectiveRate: taxes.effectiveRate,
        netIncome: Math.round(netIncome),
        tuition: Math.round(tuition),
        expenses: Math.round(annualExpenses),
        contribution529: Math.round(actual529Contribution),
        daughter1CollegeCost: Math.round(daughter1CollegeCost),
        daughter2CollegeCost: Math.round(daughter2CollegeCost),
        college529Shortfall: Math.round(college529Shortfall),
        totalExpenses: Math.round(totalExpenses),
        rentalNetCashFlow: Math.round(rentalNetCashFlow),
        mortgageInterest: Math.round(mortgageInterest),
        rentalInsurance: Math.round(adjustedRentalInsurance),
        adjustedRentalIncome: Math.round(adjustedRentalIncome),
        netSavings: Math.round(netSavings),
        taxAdvContribution: Math.round(taxAdvContribution),
        taxableContribution: Math.round(taxableContribution),
        taxableWithdrawal: Math.round(taxableWithdrawal),
        portfolioGrowth: Math.round(portfolioGrowth),
        portfolio: Math.round(totalPortfolio),
        taxAdvPortfolio: Math.round(taxAdvPortfolio),
        taxablePortfolio: Math.round(taxablePortfolio),
        daughter1_529: Math.round(daughter1_529),
        daughter2_529: Math.round(daughter2_529),
        total529: Math.round(daughter1_529 + daughter2_529),
        sustainableWithdrawal: Math.round(sustainableWithdrawal),
        fireTarget: Math.round(fireTarget),
        collegeReserveNeeded: Math.round(collegeReserveNeeded),
        healthcareBuffer: Math.round(healthcareBuffer),
        isFIRE: totalPortfolio >= fireTarget,
        deficit
      });
    }
    
    // Check for 529 overfunding (warn if any money left over)
    const lastYear = years[years.length - 1];
    if (lastYear.total529 > 0) {
      overfundingWarning = `⚠️ 529 accounts may be overfunded. Final balance: $${lastYear.total529.toLocaleString()}. Consider reducing contributions.`;
    }
    
    // Find the actual year object (fireYear was stored as a number)
    const fireYearObject = fireYear ? years.find(y => y.year === fireYear) : null;
    
    return { years, fireYear: fireYearObject, overfundingWarning };
  }, [currentYear, initialSavings, initialTaxablePct, monthlyExpenses, propertyTax, propertyTaxGrowth,
      rentalIncome, rentalMortgagePandI, mortgageEndYear, rentalPropertyTax, rentalPropertyTaxGrowth,
      rentalInsurance, rentalMaintenanceCapex, rentalVacancyRate, inflationRate, fireExpenseTarget,
      withdrawalRate, includeHealthcareBuffer, annualHealthcareCost, taxAdvReturnRate, taxableReturnRate,
      spouseIncome2025, spouseIncomeGrowth, myIncome2025, bigLawStartYear, clerkingStartYear, clerkingEndYear,
      clerkingSalary, returnToFirmYear, publicInterestYear, publicInterestSalary, publicInterestGrowth,
      tuitionPerSemester, daughter1Birth, daughter2Birth, initial529Balance, annual529Contribution,
      collegeCostPerYear, collegeInflation, standardDeduction, itemizedDeductions, rentalMortgagePrincipal,
      rentalMortgageRate, mySocialSecurityAmount, mySocialSecurityStartYear, spouseSocialSecurityAmount,
      spouseSocialSecurityStartYear]);
  
  // ============================================================================
  // MONTE CARLO SIMULATION WITH WITHDRAWAL PHASE
  // ============================================================================
  /**
   * Runs Monte Carlo simulation modeling market volatility through accumulation AND withdrawal phases
   * 
   * TWO-PHASE APPROACH:
   * 
   * PHASE 1 - ACCUMULATION (Working):
   * - Use deterministic cash flows from base projection (income, expenses, contributions)
   * - Apply random returns to portfolio (mean ± volatility)
   * - Continue until portfolio reaches FIRE target
   * 
   * PHASE 2 - WITHDRAWAL (Retired):
   * - Stop earning wage income (but continue Social Security + rental income)
   * - Withdraw from portfolio to cover expenses
   * - Apply random returns each year
   * - Continue until end of projection (2065)
   * 
   * KEY METRICS:
   * - FIRE Success Rate: % of simulations that achieve FIRE target
   * - Portfolio Survival Rate: % that never deplete after retirement
   * 
   * WITHDRAWAL STRATEGY:
   * - Draw from taxable accounts first (more tax-efficient)
   * - Only tap tax-advantaged if taxable exhausted
   * - Depletion = portfolio falls below $1,000 after retirement
   * 
   * RATIONALE:
   * This approach mirrors real retirement planning:
   * 1. Save during working years (with market ups/downs)
   * 2. Retire when target reached
   * 3. Live off portfolio (with continued market volatility)
   * 4. Portfolio must last through retirement
   */
  const runMonteCarloSimulation = () => {
    setMcRunning(true);
    
    setTimeout(() => {
      const simResults = [];
      const yearlyResults = {};
      
      for (let sim = 0; sim < mcIterations; sim++) {
        let taxAdvPortfolio = initialSavings * (100 - initialTaxablePct) / 100;
        let taxablePortfolio = initialSavings * initialTaxablePct / 100;
        let hasRetired = false;
        let retirementYear = null;
        let portfolioDepleted = false;
        let depletionYear = null;
        
        const simYears = [];
        
        for (let yearIdx = 0; yearIdx < projections.years.length; yearIdx++) {
          const baseYear = projections.years[yearIdx];
          const year = baseYear.year;
          const portfolio = taxAdvPortfolio + taxablePortfolio;
          
          // Check if we should retire this year (reached FIRE target)
          if (!hasRetired && portfolio >= baseYear.fireTarget) {
            hasRetired = true;
            retirementYear = year;
          }
          
          // Generate random returns for this year
          const taxAdvReturn = generateNormalRandom(taxAdvReturnRate, mcVolatility) / 100;
          const taxReturn = generateNormalRandom(taxableReturnRate, mcVolatility) / 100;
          
          let netCashFlow;
          
          if (!hasRetired) {
            // ===== ACCUMULATION PHASE =====
            // Still working: Use deterministic cash flows from base projection
            netCashFlow = baseYear.netSavings;
            const taxAdvContribution = baseYear.taxAdvContribution;
            const taxableContribution = baseYear.taxableContribution;
            const taxableWithdrawal = baseYear.taxableWithdrawal;
            
            taxAdvPortfolio = taxAdvPortfolio * (1 + taxAdvReturn) + taxAdvContribution;
            taxablePortfolio = taxablePortfolio * (1 + taxReturn) + taxableContribution - taxableWithdrawal;
          } else {
            // ===== WITHDRAWAL PHASE =====
            // Retired: Draw from portfolio to cover expenses
            // NOTE: Rental income continues throughout retirement, including after mortgage payoff
            // Social Security income also included in baseYear calculations
            const totalExpenses = baseYear.totalExpenses;
            const rentalIncome = baseYear.rentalNetCashFlow;
            const socialSecurityIncome = baseYear.socialSecurityIncome || 0;
            
            // Calculate withdrawal needed: Expenses minus passive income sources
            const withdrawalNeeded = Math.max(0, totalExpenses - rentalIncome - socialSecurityIncome);
            
            // Apply returns first
            taxAdvPortfolio = taxAdvPortfolio * (1 + taxAdvReturn);
            taxablePortfolio = taxablePortfolio * (1 + taxReturn);
            
            // Withdraw from taxable first (more tax-efficient), then tax-advantaged if needed
            if (withdrawalNeeded > 0) {
              if (taxablePortfolio >= withdrawalNeeded) {
                taxablePortfolio -= withdrawalNeeded;
              } else {
                const remainingNeeded = withdrawalNeeded - taxablePortfolio;
                taxablePortfolio = 0;
                taxAdvPortfolio = Math.max(0, taxAdvPortfolio - remainingNeeded);
              }
            }
            
            netCashFlow = -withdrawalNeeded;
          }
          
          // Floor portfolios at zero
          if (taxablePortfolio < 0) taxablePortfolio = 0;
          if (taxAdvPortfolio < 0) taxAdvPortfolio = 0;
          
          const currentPortfolio = taxAdvPortfolio + taxablePortfolio;
          
          // Check for portfolio depletion (falls below $1k after retirement)
          if (!portfolioDepleted && currentPortfolio < 1000 && hasRetired) {
            portfolioDepleted = true;
            depletionYear = year;
          }
          
          // Track portfolio value for percentile calculations
          if (!yearlyResults[year]) yearlyResults[year] = [];
          yearlyResults[year].push(currentPortfolio);
          
          simYears.push({
            year,
            portfolio: currentPortfolio,
            fireAchieved: currentPortfolio >= baseYear.fireTarget,
            retired: hasRetired
          });
        }
        
        const fireYear = simYears.find(y => y.fireAchieved);
        const finalPortfolio = simYears[simYears.length - 1].portfolio;
        
        simResults.push({
          fireYear: fireYear ? fireYear.year : null,
          fireAge: fireYear ? (fireYear.year - 1987) : null,
          finalPortfolio,
          retirementYear,
          portfolioDepleted,
          depletionYear,
          timeline: simYears
        });
      }
      
      // ===== CALCULATE STATISTICS =====
      
      const achievedFire = simResults.filter(r => r.fireYear !== null);
      const fireYears = achievedFire.map(r => r.fireYear);
      const fireAges = achievedFire.map(r => r.fireAge);
      const finalPortfolios = simResults.map(r => r.finalPortfolio).sort((a, b) => a - b);
      
      // Success Rate: % that achieve FIRE
      const successRate = (achievedFire.length / mcIterations) * 100;
      
      // Survival Rate: % that never deplete after retirement
      const retiredSims = simResults.filter(r => r.retirementYear !== null);
      const survivedSims = retiredSims.filter(r => !r.portfolioDepleted);
      const survivalRate = retiredSims.length > 0 ? (survivedSims.length / retiredSims.length * 100) : 100;
      
      // Calculate percentiles for charting
      const yearlyPercentiles = {};
      for (const [year, portfolios] of Object.entries(yearlyResults)) {
        const sorted = [...portfolios].sort((a, b) => a - b);
        yearlyPercentiles[year] = {
          p10: calculatePercentile(sorted, 10),
          p25: calculatePercentile(sorted, 25),
          p50: calculatePercentile(sorted, 50),
          p75: calculatePercentile(sorted, 75),
          p90: calculatePercentile(sorted, 90)
        };
      }
      
      setMcResults({
        successRate,
        survivalRate,
        medianFireYear: fireYears.length > 0 ? Math.round(calculatePercentile(fireYears.sort((a,b) => a-b), 50)) : null,
        medianFireAge: fireAges.length > 0 ? Math.round(calculatePercentile(fireAges.sort((a,b) => a-b), 50)) : null,
        fireYearP10: fireYears.length > 0 ? Math.round(calculatePercentile(fireYears.sort((a,b) => a-b), 10)) : null,
        fireYearP90: fireYears.length > 0 ? Math.round(calculatePercentile(fireYears.sort((a,b) => a-b), 90)) : null,
        finalPortfolioP10: calculatePercentile(finalPortfolios, 10),
        finalPortfolioP50: calculatePercentile(finalPortfolios, 50),
        finalPortfolioP90: calculatePercentile(finalPortfolios, 90),
        yearlyPercentiles,
        allSimulations: simResults
      });
      
      setMcRunning(false);
    }, 100);
  };
  
  // Prepare chart data
  const chartData = projections.years.map(y => ({
    year: y.year,
    'Retirement Portfolio': y.portfolio,
    'FIRE Target': y.fireTarget,
    '529 Accounts': y.total529
  }));
  
  const mcChartData = mcResults ? projections.years.map(y => {
    const percentiles = mcResults.yearlyPercentiles[y.year];
    return {
      year: y.year,
      'Base Case': y.portfolio,
      'P10': percentiles?.p10 || 0,
      'P25': percentiles?.p25 || 0,
      'P50': percentiles?.p50 || 0,
      'P75': percentiles?.p75 || 0,
      'P90': percentiles?.p90 || 0
    };
  }) : [];

  // ============================================================================
  // USER INTERFACE
  // ============================================================================
  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">FIRE Retirement Calculator</h1>
      
      {projections.fireYear && (
        <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-6">
          <p className="text-lg font-semibold text-green-800">
            🎉 FIRE Achieved in {projections.fireYear.year}! 
          </p>
          <p className="text-base text-green-700 mt-1">
            You'll be {projections.fireYear.year - 1987} and your spouse will be {projections.fireYear.year - 1989} ({projections.fireYear.year - currentYear} years from now)
          </p>
          <p className="text-sm text-green-600 mt-2">
            Your portfolio will sustainably cover ${fireExpenseTarget.toLocaleString()} in annual expenses (inflation-adjusted) at a {withdrawalRate}% withdrawal rate, with sufficient funds reserved for any remaining college costs not covered by 529 accounts.
          </p>
        </div>
      )}
      
      {projections.overfundingWarning && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-sm text-yellow-800">{projections.overfundingWarning}</p>
        </div>
      )}
      
      {mcResults && (
        <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-lg font-semibold text-blue-800">Monte Carlo Results ({mcIterations} simulations with withdrawal phase)</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
            <div>
              <div className="text-sm text-blue-700">FIRE Success Rate</div>
              <div className="text-xl font-bold">{mcResults.successRate.toFixed(1)}%</div>
              <div className="text-xs text-blue-600">Achieve FIRE</div>
            </div>
            <div>
              <div className="text-sm text-blue-700">Portfolio Survival</div>
              <div className="text-xl font-bold">{mcResults.survivalRate.toFixed(1)}%</div>
              <div className="text-xs text-blue-600">Never runs out</div>
            </div>
            <div>
              <div className="text-sm text-blue-700">Median FIRE Year</div>
              <div className="text-xl font-bold">{mcResults.medianFireYear || 'N/A'}</div>
              <div className="text-xs text-blue-600">50th percentile</div>
            </div>
            <div>
              <div className="text-sm text-blue-700">FIRE Age Range</div>
              <div className="text-lg font-bold">
                {mcResults.fireYearP10 ? `${mcResults.fireYearP10 - 1987}-${mcResults.fireYearP90 - 1987}` : 'N/A'}
              </div>
              <div className="text-xs text-blue-600">10th-90th %ile</div>
            </div>
            <div>
              <div className="text-sm text-blue-700">Final (Median)</div>
              <div className="text-lg font-bold">${(mcResults.finalPortfolioP50 / 1000000).toFixed(2)}M</div>
              <div className="text-xs text-blue-600">At age 78</div>
            </div>
          </div>
          <div className="text-xs text-blue-600 mt-3">
            Simulation includes both accumulation (working) and withdrawal (retired) phases. Success = achieve FIRE target. Survival = portfolio lasts through 2065 after retirement. Rental income continues throughout retirement.
          </div>
        </div>
      )}
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Monte Carlo Simulation</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={mcEnabled}
              onChange={(e) => setMcEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Enable Monte Carlo</span>
          </label>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Iterations</label>
            <select
              value={mcIterations}
              onChange={(e) => setMcIterations(Number(e.target.value))}
              disabled={!mcEnabled}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value={500}>500</option>
              <option value={1000}>1,000</option>
              <option value={2000}>2,000</option>
              <option value={5000}>5,000</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Volatility (%)</label>
            <input
              type="number"
              value={mcVolatility}
              onChange={(e) => setMcVolatility(Number(e.target.value))}
              disabled={!mcEnabled}
              className="w-full px-2 py-1 border rounded text-sm"
              min="5"
              max="30"
            />
          </div>
          <button
            onClick={runMonteCarloSimulation}
            disabled={!mcEnabled || mcRunning}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm"
          >
            {mcRunning ? 'Running...' : 'Run Simulation'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Current Status</h2>
          <div className="space-y-2">
            <div>
              <label className="block text-sm text-gray-600">Initial Savings (2025 $)</label>
              <input
                type="number"
                value={initialSavings}
                onChange={(e) => setInitialSavings(Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Initial % in Taxable</label>
              <input
                type="number"
                value={initialTaxablePct}
                onChange={(e) => setInitialTaxablePct(Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Monthly Expenses (inflates)</label>
              <input
                type="number"
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Property Tax (Prop 13: {propertyTaxGrowth}%/yr)</label>
              <input
                type="number"
                value={propertyTax}
                onChange={(e) => setPropertyTax(Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">General Inflation Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={inflationRate}
                onChange={(e) => setInflationRate(Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">FIRE Target</h2>
          <div className="space-y-2">
            <div>
              <label className="block text-sm text-gray-600">Target Annual Spending (inflates)</label>
              <input
                type="number"
                value={fireExpenseTarget}
                onChange={(e) => setFireExpenseTarget(Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Safe Withdrawal Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={withdrawalRate}
                onChange={(e) => setWithdrawalRate(Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <label className="flex items-center space-x-2 mt-3">
              <input
                type="checkbox"
                checked={includeHealthcareBuffer}
                onChange={(e) => setIncludeHealthcareBuffer(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Include Healthcare Buffer</span>
            </label>
            {includeHealthcareBuffer && (
              <div>
                <label className="block text-sm text-gray-600">Annual Healthcare Cost (until Medicare at 65)</label>
                <input
                  type="number"
                  value={annualHealthcareCost}
                  onChange={(e) => setAnnualHealthcareCost(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Investment Returns</h2>
          <div className="space-y-2">
            <div>
              <label className="block text-sm text-gray-600">Tax-Advantaged Return (%)</label>
              <input
                type="number"
                step="0.1"
                value={taxAdvReturnRate}
                onChange={(e) => setTaxAdvReturnRate(Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Taxable Return (%)</label>
              <input
                type="number"
                step="0.1"
                value={taxableReturnRate}
                onChange={(e) => setTaxableReturnRate(Number(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>
          </div>
        </div>
      </div>
      
      <details className="mb-6">
        <summary className="cursor-pointer font-semibold text-lg mb-2 text-gray-700">Income & Career Timeline</summary>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Spouse Income</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm text-gray-600">2025 Salary</label>
                <input
                  type="number"
                  value={spouseIncome2025}
                  onChange={(e) => setSpouseIncome2025(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Annual Growth (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={spouseIncomeGrowth}
                  onChange={(e) => setSpouseIncomeGrowth(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">My Career Timeline</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm text-gray-600">2025 Income (law school)</label>
                <input
                  type="number"
                  value={myIncome2025}
                  onChange={(e) => setMyIncome2025(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">BigLaw Start Year</label>
                <input
                  type="number"
                  value={bigLawStartYear}
                  onChange={(e) => setBigLawStartYear(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Clerking Start Year</label>
                <input
                  type="number"
                  value={clerkingStartYear}
                  onChange={(e) => setClerkingStartYear(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Clerking End Year</label>
                <input
                  type="number"
                  value={clerkingEndYear}
                  onChange={(e) => setClerkingEndYear(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Clerking Salary</label>
                <input
                  type="number"
                  value={clerkingSalary}
                  onChange={(e) => setClerkingSalary(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Return as Associate Year</label>
                <select
                  value={returnToFirmYear}
                  onChange={(e) => setReturnToFirmYear(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                >
                  <option value={2}>2nd year (${getCravathSalary(2).toLocaleString()})</option>
                  <option value={3}>3rd year (${getCravathSalary(3).toLocaleString()})</option>
                  <option value={4}>4th year (${getCravathSalary(4).toLocaleString()})</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600">Public Interest Start Year</label>
                <input
                  type="number"
                  value={publicInterestYear}
                  onChange={(e) => setPublicInterestYear(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Public Interest Salary</label>
                <input
                  type="number"
                  value={publicInterestSalary}
                  onChange={(e) => setPublicInterestSalary(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Public Interest Annual Growth (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={publicInterestGrowth}
                  onChange={(e) => setPublicInterestGrowth(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Social Security - Me</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm text-gray-600">Annual Amount (inflates)</label>
                <input
                  type="number"
                  value={mySocialSecurityAmount}
                  onChange={(e) => setMySocialSecurityAmount(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Start Year</label>
                <input
                  type="number"
                  value={mySocialSecurityStartYear}
                  onChange={(e) => setMySocialSecurityStartYear(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Social Security - Spouse</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm text-gray-600">Annual Amount (inflates)</label>
                <input
                  type="number"
                  value={spouseSocialSecurityAmount}
                  onChange={(e) => setSpouseSocialSecurityAmount(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Start Year</label>
                <input
                  type="number"
                  value={spouseSocialSecurityStartYear}
                  onChange={(e) => setSpouseSocialSecurityStartYear(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-2 p-2 bg-white rounded border">
          💼 <strong>Cravath Scale 2025:</strong> 1st: $225k, 2nd: $235k, 3rd: $260k, 4th: $305k, 5th: $340k, 6th: $365k, 7th: $410k, 8th: $420k
        </div>
      </details>
      
      <details className="mb-6">
        <summary className="cursor-pointer font-semibold text-lg mb-2 text-gray-700">Education (Tuition & 529)</summary>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
          <div className="bg-pink-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Law School Tuition</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm text-gray-600">Tuition per Semester</label>
                <input
                  type="number"
                  value={tuitionPerSemester}
                  onChange={(e) => setTuitionPerSemester(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div className="text-xs text-gray-500">2026: 2 semesters, 2027: 1 semester</div>
            </div>
          </div>
          
          <div className="bg-pink-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">College Savings (529)</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm text-gray-600">Daughter 1 Birth Year</label>
                <input
                  type="number"
                  value={daughter1Birth}
                  onChange={(e) => setDaughter1Birth(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Daughter 2 Birth Year</label>
                <input
                  type="number"
                  value={daughter2Birth}
                  onChange={(e) => setDaughter2Birth(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Current 529 Balance</label>
                <input
                  type="number"
                  value={initial529Balance}
                  onChange={(e) => setInitial529Balance(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Annual 529 Contribution (per daughter)</label>
                <input
                  type="number"
                  value={annual529Contribution}
                  onChange={(e) => setAnnual529Contribution(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">College Cost per Year</label>
                <input
                  type="number"
                  value={collegeCostPerYear}
                  onChange={(e) => setCollegeCostPerYear(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">College Inflation (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={collegeInflation}
                  onChange={(e) => setCollegeInflation(Number(e.target.value))}
                  className="w-full px-3 py-1 border rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </details>
      
      <details className="mb-6">
        <summary className="cursor-pointer font-semibold text-lg mb-2 text-gray-700">Rental Property</summary>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 bg-orange-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm text-gray-600">Monthly Rental Income (inflates)</label>
            <input
              type="number"
              value={rentalIncome}
              onChange={(e) => setRentalIncome(Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Monthly P&I Payment</label>
            <input
              type="number"
              value={rentalMortgagePandI}
              onChange={(e) => setRentalMortgagePandI(Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Mortgage Payoff Year</label>
            <input
              type="number"
              value={mortgageEndYear}
              onChange={(e) => setMortgageEndYear(Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Property Tax (Prop 13)</label>
            <input
              type="number"
              value={rentalPropertyTax}
              onChange={(e) => setRentalPropertyTax(Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Insurance (inflates)</label>
            <input
              type="number"
              value={rentalInsurance}
              onChange={(e) => setRentalInsurance(Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Maintenance/CapEx (inflates)</label>
            <input
              type="number"
              value={rentalMaintenanceCapex}
              onChange={(e) => setRentalMaintenanceCapex(Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Vacancy Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={rentalVacancyRate}
              onChange={(e) => setRentalVacancyRate(Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2 p-2 bg-white rounded border">
          Note: Rental income continues throughout retirement. After mortgage payoff in {mortgageEndYear}, cash flow increases significantly.
        </div>
      </details>
      
      <details className="mb-6">
        <summary className="cursor-pointer font-semibold text-lg mb-2 text-gray-700">Tax Settings</summary>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-red-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm text-gray-600">Standard Deduction (MFJ, inflates)</label>
            <input
              type="number"
              value={standardDeduction}
              onChange={(e) => setStandardDeduction(Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Itemized Deductions (if any, inflates)</label>
            <input
              type="number"
              value={itemizedDeductions}
              onChange={(e) => setItemizedDeductions(Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div className="col-span-2 text-xs text-gray-500">
            Calculator uses greater of standard vs itemized. HSA and Dependent Care FSA applied above-the-line. Rental mortgage interest included automatically.
          </div>
        </div>
      </details>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">Portfolio Growth vs FIRE Target</h2>
        <ResponsiveContainer width="100%" height={400}>
          {mcResults ? (
            <AreaChart data={mcChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value) => `$${(value / 1000000).toFixed(2)}M`} />
              <Legend />
              <Area type="monotone" dataKey="P90" stackId="1" stroke="#93c5fd" fill="#dbeafe" name="90th %ile" />
              <Area type="monotone" dataKey="P75" stackId="2" stroke="#60a5fa" fill="#bfdbfe" name="75th %ile" />
              <Area type="monotone" dataKey="P50" stackId="3" stroke="#3b82f6" fill="#93c5fd" name="Median" />
              <Line type="monotone" dataKey="Base Case" stroke="#ef4444" strokeWidth={2} dot={false} />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value) => `$${(value / 1000000).toFixed(2)}M`} />
              <Legend />
              <Line type="monotone" dataKey="Retirement Portfolio" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="FIRE Target" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="529 Accounts" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      
      <div className="overflow-x-auto">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">Year-by-Year Breakdown</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Year</th>
              <th className="border p-2 text-right">My Income</th>
              <th className="border p-2 text-right">Spouse</th>
              <th className="border p-2 text-right">Total Tax</th>
              <th className="border p-2 text-right">Net Income</th>
              <th className="border p-2 text-right">Expenses</th>
              <th className="border p-2 text-right">Net Savings</th>
              <th className="border p-2 text-right">Portfolio</th>
              <th className="border p-2 text-center">FIRE?</th>
            </tr>
          </thead>
          <tbody>
            {projections.years.map((year) => (
              <tr key={year.year} className={year.isFIRE ? 'bg-green-50' : year.deficit ? 'bg-red-50' : ''}>
                <td className="border p-2">{year.year}</td>
                <td className="border p-2 text-right">${year.myIncome.toLocaleString()}</td>
                <td className="border p-2 text-right">${year.spouseIncome.toLocaleString()}</td>
                <td className="border p-2 text-right text-red-700">${year.totalTax.toLocaleString()}</td>
                <td className="border p-2 text-right font-semibold">${year.netIncome.toLocaleString()}</td>
                <td className="border p-2 text-right">${year.totalExpenses.toLocaleString()}</td>
                <td className="border p-2 text-right">${year.netSavings.toLocaleString()}</td>
                <td className="border p-2 text-right font-semibold">${year.portfolio.toLocaleString()}</td>
                <td className="border p-2 text-center">{year.isFIRE ? '✓' : year.deficit ? '⚠' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}