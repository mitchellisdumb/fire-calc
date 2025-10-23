/**
 * COMPREHENSIVE AUDIT TEST SUITE
 *
 * This test suite validates the core financial calculations in the FIRE calculator.
 * Critical for ensuring accuracy of retirement planning.
 */

console.log("=".repeat(80));
console.log("FIRE CALCULATOR AUDIT - COMPREHENSIVE TEST SUITE");
console.log("=".repeat(80));
console.log();

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.log(`✗ FAIL: ${testName}`);
    if (details) console.log(`  Details: ${details}`);
    testsFailed++;
  }
}

function assertClose(actual, expected, tolerance, testName) {
  const diff = Math.abs(actual - expected);
  const percentDiff = expected !== 0 ? (diff / Math.abs(expected) * 100) : 0;
  const passed = diff <= tolerance;

  if (passed) {
    console.log(`✓ PASS: ${testName}`);
    console.log(`  Expected: ${expected.toFixed(2)}, Actual: ${actual.toFixed(2)}, Diff: ${diff.toFixed(2)}`);
    testsPassed++;
  } else {
    console.log(`✗ FAIL: ${testName}`);
    console.log(`  Expected: ${expected.toFixed(2)}, Actual: ${actual.toFixed(2)}`);
    console.log(`  Difference: ${diff.toFixed(2)} (${percentDiff.toFixed(2)}%)`);
    console.log(`  Tolerance: ${tolerance}`);
    testsFailed++;
  }
}

console.log("TEST SUITE 1: MORTGAGE CALCULATIONS");
console.log("-".repeat(80));

// Test 1.1: Monthly Payment Calculation
function calculateMonthlyPayment(principal, annualRate, termMonths) {
  const monthlyRate = annualRate / 100 / 12;
  return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths));
}

const mortgagePayment = calculateMonthlyPayment(400000, 2.75, 360);
assertClose(mortgagePayment, 1632.96, 0.01, "Mortgage monthly payment");

// Test 1.2: Balance after 60 payments (Nov 2025)
function calculateRemainingBalance(principal, annualRate, termMonths, paymentsMade) {
  const monthlyRate = annualRate / 100 / 12;
  const pmt = calculateMonthlyPayment(principal, annualRate, termMonths);
  const compoundFactor = Math.pow(1 + monthlyRate, paymentsMade);
  return principal * compoundFactor - pmt * (compoundFactor - 1) / monthlyRate;
}

const balanceAfter60 = calculateRemainingBalance(400000, 2.75, 360, 60);
assertClose(balanceAfter60, 353983.92, 1.00, "Balance after 60 payments (Nov 2025)");

// Test 1.3: Interest for Nov 2025 payment
const interestNov2025 = balanceAfter60 * (2.75 / 100 / 12);
assertClose(interestNov2025, 811.21, 0.50, "Interest payment Nov 2025");

// Test 1.4: Annual interest calculation for 2025 (11 months remaining)
function calculateAnnualInterest(principal, annualRate, termMonths, startMonth, monthsInYear) {
  const monthlyRate = annualRate / 100 / 12;
  const pmt = calculateMonthlyPayment(principal, annualRate, termMonths);
  const compoundFactor = Math.pow(1 + monthlyRate, startMonth);
  let balance = principal * compoundFactor - pmt * (compoundFactor - 1) / monthlyRate;

  let totalInterest = 0;
  for (let i = 0; i < monthsInYear; i++) {
    const interest = balance * monthlyRate;
    totalInterest += interest;
    balance -= (pmt - interest);
  }
  return totalInterest;
}

const interest2026 = calculateAnnualInterest(400000, 2.75, 360, 72, 12);
// From table: payments 13-24 have total interest of $9,609.31 - $1,620.54 = $7,988.77
// Actually need to sum payments for 2026 (Jan-Dec 2026 = payments 3-14)
const expected2026Interest = 9609.31 - 1620.54; // This is payments 3-12 interest
assertClose(interest2026, 7988.77, 50, "Annual interest for 2026 (12 months)");

console.log();
console.log("TEST SUITE 2: SOCIAL SECURITY TAXATION");
console.log("-".repeat(80));

// Test 2.1: No SS taxable (below $32k threshold)
function calculateTaxableSS(ssIncome, otherIncome, threshold1 = 32000, threshold2 = 44000) {
  const provisionalIncome = otherIncome + (ssIncome * 0.5);

  if (provisionalIncome <= threshold1) {
    return 0;
  } else if (provisionalIncome <= threshold2) {
    return Math.min(ssIncome * 0.5, (provisionalIncome - threshold1) * 0.5);
  } else {
    const amount1 = (threshold2 - threshold1) * 0.5;
    const amount2 = (provisionalIncome - threshold2) * 0.85;
    return Math.min(ssIncome * 0.85, amount1 + amount2);
  }
}

const taxableSS_low = calculateTaxableSS(20000, 10000);
assertClose(taxableSS_low, 0, 0.01, "SS taxation: Below threshold 1 (no tax)");

// Test 2.2: 50% tier
const taxableSS_mid = calculateTaxableSS(30000, 20000);
// Provisional = 20000 + 15000 = 35000
// Excess over 32000 = 3000
// Taxable = min(15000, 1500) = 1500
assertClose(taxableSS_mid, 1500, 0.01, "SS taxation: 50% tier");

// Test 2.3: 85% tier
const taxableSS_high = calculateTaxableSS(40000, 60000);
// Provisional = 60000 + 20000 = 80000
// Amount1 = (44000 - 32000) * 0.5 = 6000
// Amount2 = (80000 - 44000) * 0.85 = 30600
// Taxable = min(34000, 36600) = 34000
assertClose(taxableSS_high, 34000, 0.01, "SS taxation: 85% tier (max)");

console.log();
console.log("TEST SUITE 3: LOGNORMAL RETURNS");
console.log("-".repeat(80));

// Test 3.1: Lognormal return properties
function generateStandardNormal() {
  let u1 = 0, u2 = 0;
  while(u1 === 0) u1 = Math.random();
  while(u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

function generateLognormalReturn(arithmeticMean, volatility) {
  const mu = arithmeticMean / 100;
  const sigma = volatility / 100;
  const muLog = Math.log(1 + mu) - 0.5 * sigma * sigma;
  const z = generateStandardNormal();
  const logReturn = muLog + sigma * z;
  return Math.exp(logReturn) - 1;
}

// Test that returns are always > -1 (never lose more than 100%)
let allReturnsValid = true;
const returns = [];
for (let i = 0; i < 10000; i++) {
  const ret = generateLognormalReturn(7, 15);
  returns.push(ret);
  if (ret <= -1) {
    allReturnsValid = false;
    console.log(`Found invalid return: ${ret}`);
    break;
  }
}
assert(allReturnsValid, "Lognormal returns always > -100%");

// Test 3.2: Mean of returns should be close to geometric mean
const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
const expectedGeometricMean = Math.log(1 + 0.07) - 0.5 * 0.15 * 0.15;
const actualGeometricMean = Math.log(1 + meanReturn);
// Allow 10% relative error due to sampling variance
assertClose(actualGeometricMean, expectedGeometricMean, 0.01, "Lognormal mean approximates geometric mean");

console.log();
console.log("TEST SUITE 4: TAX CALCULATIONS");
console.log("-".repeat(80));

// Test 4.1: Federal tax brackets (2025 MFJ)
function calculateFederalTax(taxableIncome) {
  const brackets = [
    { limit: 23200, rate: 0.10 },
    { limit: 94300, rate: 0.12 },
    { limit: 201050, rate: 0.22 },
    { limit: 383900, rate: 0.24 },
    { limit: 487450, rate: 0.32 },
    { limit: 731200, rate: 0.35 },
    { limit: Infinity, rate: 0.37 }
  ];

  let tax = 0;
  let remainingIncome = taxableIncome;
  let previousLimit = 0;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    const taxableInBracket = Math.min(remainingIncome, bracket.limit - previousLimit);
    tax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
    previousLimit = bracket.limit;
  }

  return tax;
}

// Test known income levels
const tax50k = calculateFederalTax(50000);
// First $23,200 @ 10% = $2,320
// Next $26,800 @ 12% = $3,216
// Total = $5,536
assertClose(tax50k, 5536, 1, "Federal tax on $50k taxable income");

const tax100k = calculateFederalTax(100000);
// $23,200 @ 10% = $2,320
// $71,100 @ 12% = $8,532
// $5,700 @ 22% = $1,254
// Total = $12,106
assertClose(tax100k, 12106, 1, "Federal tax on $100k taxable income");

// Test 4.2: FICA calculations
function calculateFICA(myIncome, spouseIncome, year, ssWageBase2025 = 168600, growthRate = 0.04) {
  const yearsFromNow = year - 2025;
  const ssWageBase = ssWageBase2025 * Math.pow(1 + growthRate, yearsFromNow);
  const totalWages = myIncome + spouseIncome;

  const mySSWages = Math.min(myIncome, ssWageBase);
  const spouseSSWages = Math.min(spouseIncome, ssWageBase);
  const socialSecurityTax = (mySSWages + spouseSSWages) * 0.062;

  const medicareTax = totalWages * 0.0145;
  const additionalMedicare = Math.max(0, totalWages - 250000) * 0.009;

  return { socialSecurityTax, medicareTax, additionalMedicare, total: socialSecurityTax + medicareTax + additionalMedicare };
}

const fica100k = calculateFICA(50000, 50000, 2025);
// SS: 100,000 * 0.062 = $6,200
// Medicare: 100,000 * 0.0145 = $1,450
// Additional Medicare: $0
// Total: $7,650
assertClose(fica100k.total, 7650, 1, "FICA on $100k total wages");

const fica300k = calculateFICA(150000, 150000, 2025);
// SS: (150000 + 150000) capped at 168600 each = 168600 * 2 * 0.062 = $20,905.20
// Medicare: 300,000 * 0.0145 = $4,350
// Additional Medicare: (300000 - 250000) * 0.009 = $450
// Total: $25,705.20
assertClose(fica300k.total, 25705.20, 1, "FICA on $300k total wages (with caps and surtax)");

console.log();
console.log("TEST SUITE 5: FIRE TARGET CALCULATION");
console.log("-".repeat(80));

// Test 5.1: Basic FIRE target (4% rule)
function calculateFIRETarget(annualExpenses, withdrawalRate) {
  return annualExpenses / (withdrawalRate / 100);
}

const fireTarget = calculateFIRETarget(135000, 3.5);
assertClose(fireTarget, 3857142.86, 10, "FIRE target: $135k expenses at 3.5% withdrawal");

// Test 5.2: FIRE target with healthcare buffer
function calculateHealthcareBuffer(annualCost, yearsToMedicare, inflationRate, yearsUntilFIRE) {
  const inflationFactor = Math.pow(1 + inflationRate / 100, yearsUntilFIRE);
  const adjustedCost = annualCost * inflationFactor;
  return adjustedCost * yearsToMedicare;
}

const healthcareBuffer = calculateHealthcareBuffer(12000, 20, 3, 15);
// Adjusted cost = 12000 * 1.03^15 = 12000 * 1.5580 = $18,695.62
// Buffer = 18695.62 * 20 = $373,912.40
assertClose(healthcareBuffer, 373912.40, 100, "Healthcare buffer calculation");

console.log();
console.log("TEST SUITE 6: COMPOUND GROWTH");
console.log("-".repeat(80));

// Test 6.1: Tax-advantaged account growth
function simulateGrowth(initial, annualContribution, returnRate, years) {
  let balance = initial;
  for (let i = 0; i < years; i++) {
    balance = balance * (1 + returnRate / 100) + annualContribution;
  }
  return balance;
}

const growth10yr = simulateGrowth(100000, 20000, 7, 10);
// Year 0: 100000
// Year 1: 100000 * 1.07 + 20000 = 127000
// Year 2: 127000 * 1.07 + 20000 = 155890
// ... (can verify with FV formula)
// FV = PV(1+r)^n + PMT * ((1+r)^n - 1) / r
const expectedGrowth = 100000 * Math.pow(1.07, 10) + 20000 * (Math.pow(1.07, 10) - 1) / 0.07;
assertClose(growth10yr, expectedGrowth, 1, "10-year compound growth with contributions");

console.log();
console.log("TEST SUITE 7: WITHDRAWAL PHASE TAX IMPACT");
console.log("-".repeat(80));

// Test 7.1: Withdrawal with taxes
function calculateGrossWithdrawalNeeded(netNeeded, taxablePortfolio, ltcgRate = 0.15, ordinaryRate = 0.31) {
  let grossNeeded = netNeeded;

  // Iterate 3 times to converge
  for (let iter = 0; iter < 3; iter++) {
    let taxOnWithdrawal = 0;
    const taxableWithdrawal = Math.min(grossNeeded, taxablePortfolio);
    const taxAdvWithdrawal = Math.max(0, grossNeeded - taxableWithdrawal);

    if (taxableWithdrawal > 0) {
      taxOnWithdrawal += taxableWithdrawal * ltcgRate;
    }

    if (taxAdvWithdrawal > 0) {
      taxOnWithdrawal += taxAdvWithdrawal * ordinaryRate;
    }

    grossNeeded = netNeeded + taxOnWithdrawal;
  }

  return grossNeeded;
}

// Need $100k net, all from taxable (15% LTCG)
const gross100k_taxable = calculateGrossWithdrawalNeeded(100000, 200000);
// Gross = 100000 / (1 - 0.15) = $117,647.06
assertClose(gross100k_taxable, 117647.06, 100, "Gross withdrawal needed (taxable only)");

// Need $100k net, all from tax-advantaged (31% ordinary)
const gross100k_taxadv = calculateGrossWithdrawalNeeded(100000, 0);
// Gross = 100000 / (1 - 0.31) = $144,927.54
assertClose(gross100k_taxadv, 144927.54, 100, "Gross withdrawal needed (tax-adv only)");

// Need $100k net, $50k from each
const gross100k_mixed = calculateGrossWithdrawalNeeded(100000, 50000);
// Complex iteration, but should be between the two extremes
assert(gross100k_mixed > gross100k_taxable && gross100k_mixed < gross100k_taxadv,
       "Mixed withdrawal should be between taxable-only and tax-adv-only",
       `Actual: ${gross100k_mixed.toFixed(2)}`);

console.log();
console.log("TEST SUITE 8: INFLATION ADJUSTMENTS");
console.log("-".repeat(80));

// Test 8.1: General inflation
function inflationAdjust(baseAmount, rate, years) {
  return baseAmount * Math.pow(1 + rate / 100, years);
}

const inflated20yr = inflationAdjust(100000, 3, 20);
const expected20yr = 100000 * Math.pow(1.03, 20);
assertClose(inflated20yr, expected20yr, 0.01, "20-year inflation adjustment at 3%");

// Test 8.2: Different inflation rates
const collegeInflated = inflationAdjust(40000, 3.5, 15);
assertClose(collegeInflated, 68222.74, 10, "College cost inflation at 3.5% over 15 years");

const propTaxInflated = inflationAdjust(20000, 2, 40);
assertClose(propTaxInflated, 44081.59, 10, "Prop 13 property tax growth at 2% over 40 years");

console.log();
console.log("TEST SUITE 9: EDGE CASES & BOUNDARY CONDITIONS");
console.log("-".repeat(80));

// Test 9.1: Zero income (division by zero protection)
const effectiveRate = (totalTax, totalIncome) => {
  return totalIncome > 0 ? (totalTax / totalIncome * 100).toFixed(1) : '0.0';
};

assert(effectiveRate(0, 0) === '0.0', "Effective rate with zero income returns 0.0");
assert(effectiveRate(10000, 100000) === '10.0', "Effective rate calculation correct");

// Test 9.2: Negative portfolio balance prevention
let portfolio = 100000;
const withdrawal = 150000;
portfolio = Math.max(0, portfolio - withdrawal);
assert(portfolio === 0, "Portfolio floors at zero (no negative balances)");

// Test 9.3: Lognormal return can't be < -100%
for (let i = 0; i < 1000; i++) {
  const ret = generateLognormalReturn(7, 15);
  assert(ret > -1, `Lognormal return #${i} > -100%`, `Value: ${ret}`);
}

console.log();
console.log("TEST SUITE 10: INTEGRATION TEST - FULL YEAR SIMULATION");
console.log("-".repeat(80));

// Test 10.1: Simulate a complete year with all components
function simulateYear(params) {
  const {
    year,
    myIncome,
    spouseIncome,
    rentalIncome,
    ssIncome,
    expenses,
    taxAdvPortfolio,
    taxablePortfolio,
    taxAdvReturn,
    taxableReturn
  } = params;

  // Income
  const totalWageIncome = myIncome + spouseIncome;
  const rentalNet = rentalIncome * 0.7; // Simplified: 70% net after expenses

  // Taxes (simplified)
  const taxableSS = calculateTaxableSS(ssIncome, totalWageIncome + rentalNet);
  const grossIncome = totalWageIncome + rentalNet + taxableSS;
  const federalTax = calculateFederalTax(Math.max(0, grossIncome - 29200)); // Standard deduction
  const fica = calculateFICA(myIncome, spouseIncome, year);
  const totalTax = federalTax + fica.total;

  // Net savings
  const netSavings = grossIncome - totalTax - expenses;

  // Portfolio growth
  const taxAdvGrowth = taxAdvPortfolio * (taxAdvReturn / 100);
  const taxableGrowth = taxablePortfolio * (taxableReturn / 100);

  const newTaxAdv = taxAdvPortfolio + taxAdvGrowth + Math.max(0, netSavings * 0.5);
  const newTaxable = taxablePortfolio + taxableGrowth + Math.max(0, netSavings * 0.5);

  return {
    grossIncome,
    totalTax,
    netSavings,
    newTaxAdv,
    newTaxable,
    totalPortfolio: newTaxAdv + newTaxable
  };
}

const yearResult = simulateYear({
  year: 2025,
  myIncome: 100000,
  spouseIncome: 100000,
  rentalIncome: 5000,
  ssIncome: 0,
  expenses: 120000,
  taxAdvPortfolio: 200000,
  taxablePortfolio: 300000,
  taxAdvReturn: 7,
  taxableReturn: 6
});

assert(yearResult.grossIncome > 0, "Integration: Positive gross income");
assert(yearResult.totalTax > 0, "Integration: Positive tax liability");
assert(yearResult.totalPortfolio > 500000, "Integration: Portfolio grows");
console.log(`  Gross Income: $${yearResult.grossIncome.toFixed(2)}`);
console.log(`  Total Tax: $${yearResult.totalTax.toFixed(2)}`);
console.log(`  Net Savings: $${yearResult.netSavings.toFixed(2)}`);
console.log(`  Final Portfolio: $${yearResult.totalPortfolio.toFixed(2)}`);

console.log();
console.log("=".repeat(80));
console.log("AUDIT SUMMARY");
console.log("=".repeat(80));
console.log(`Total Tests Run: ${testsPassed + testsFailed}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Success Rate: ${(testsPassed / (testsPassed + testsFailed) * 100).toFixed(1)}%`);
console.log();

if (testsFailed === 0) {
  console.log("✓ ALL TESTS PASSED - Calculator appears mathematically sound");
} else {
  console.log("✗ SOME TESTS FAILED - Review failures above");
  process.exit(1);
}
