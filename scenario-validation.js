/**
 * REAL-WORLD SCENARIO VALIDATION
 *
 * Simulates your actual projected financial trajectory to verify
 * the calculator produces reasonable, conservative results.
 */

console.log("=".repeat(80));
console.log("REAL-WORLD SCENARIO VALIDATION");
console.log("=".repeat(80));
console.log();

// Key Years to Validate
const scenarios = {
  "2025 (Law School)": {
    myIncome: 40000,
    spouseIncome: 200000,
    expenses: 120000 + 20000, // Monthly + property tax
    rentalNet: 30000, // Approximate net cash flow
    tuition: 60000,
    expectedSavings: "LOW (law school + tuition)",
    taxRate: "~15-20%"
  },

  "2028 (First Year BigLaw)": {
    myIncome: 225000,
    spouseIncome: 218545, // 200k * 1.03^3
    expenses: 140400 + 21218, // Inflated 9%
    rentalNet: 35000,
    tuition: 0,
    expectedSavings: "HIGH (~$200k+)",
    taxRate: "~30-35%"
  },

  "2030 (Clerking)": {
    myIncome: 100000,
    spouseIncome: 231855,
    expenses: 148878 + 21848,
    rentalNet: 37000,
    tuition: 0,
    expectedSavings: "MEDIUM (~$80k)",
    taxRate: "~25-30%"
  },

  "2033 (5th Year BigLaw)": {
    myIncome: 340000,
    spouseIncome: 253339,
    expenses: 171997 + 23770,
    rentalNet: 42000,
    tuition: 0,
    expectedSavings: "VERY HIGH ($300k+)",
    taxRate: "~35-40%"
  },

  "2036 (First Year Public Interest)": {
    myIncome: 80000,
    spouseIncome: 278696,
    expenses: 187845 + 25228,
    rentalNet: 45000,
    tuition: 0,
    expectedSavings: "MEDIUM (~$100k)",
    taxRate: "~25-30%"
  },

  "2050 (Mortgage Payoff)": {
    myIncome: 132793, // Public interest inflated
    spouseIncome: 424869,
    expenses: 339734 + 34297,
    rentalNet: 95000, // JUMP after mortgage payoff!
    tuition: 0,
    socialSecurity: 0,
    expectedSavings: "MEDIUM (~$150k)",
    taxRate: "~30%",
    notes: "Rental income increases ~$20k when mortgage ends"
  },

  "2055 (Social Security Starts)": {
    myIncome: 158490, // Public interest
    spouseIncome: 507370,
    expenses: 405498 + 37887,
    rentalNet: 113000,
    socialSecurity: 35000, // Me only
    expectedSavings: "MEDIUM-HIGH (~$200k)",
    taxRate: "~30%",
    notes: "First year of SS benefits"
  },

  "2057 (Both SS)": {
    myIncome: 168268,
    spouseIncome: 538571,
    expenses: 430103 + 39452,
    rentalNet: 119800,
    socialSecurity: 77182, // Me + spouse
    expectedSavings: "HIGH (~$250k)",
    taxRate: "~28%",
    notes: "Spouse SS starts, but SS taxed at ~50-85%"
  }
};

function simulateYear(data) {
  const { myIncome, spouseIncome, expenses, rentalNet, tuition = 0, socialSecurity = 0 } = data;

  const wageIncome = myIncome + spouseIncome;

  // Rough tax estimate (simplified)
  let federalTax = 0;
  const taxableIncome = Math.max(0, wageIncome + rentalNet - 29200);
  if (taxableIncome > 0) {
    if (taxableIncome <= 94300) {
      federalTax = 23200 * 0.10 + (taxableIncome - 23200) * 0.12;
    } else if (taxableIncome <= 201050) {
      federalTax = 23200 * 0.10 + 71100 * 0.12 + (taxableIncome - 94300) * 0.22;
    } else if (taxableIncome <= 383900) {
      federalTax = 23200 * 0.10 + 71100 * 0.12 + 106750 * 0.22 + (taxableIncome - 201050) * 0.24;
    } else {
      federalTax = 23200 * 0.10 + 71100 * 0.12 + 106750 * 0.22 + 182850 * 0.24 + (taxableIncome - 383900) * 0.32;
    }
  }

  const stateTax = taxableIncome * 0.09; // Rough CA estimate
  const ficaTax = wageIncome * 0.0765; // Simplified (actual has caps)
  const totalTax = federalTax + stateTax + ficaTax;

  const netSavings = wageIncome + rentalNet + socialSecurity - totalTax - expenses - tuition;
  const effectiveRate = (totalTax / (wageIncome + rentalNet + socialSecurity) * 100).toFixed(1);

  return {
    grossIncome: wageIncome + rentalNet + socialSecurity,
    totalTax,
    effectiveRate,
    netSavings,
    savings401k: Math.min(Math.max(0, netSavings), 50000), // Rough estimate
    savingsTaxable: Math.max(0, netSavings - 50000)
  };
}

console.log("SCENARIO ANALYSIS:");
console.log("=".repeat(80));

let totalSavings = 500000; // Starting portfolio

for (const [scenario, data] of Object.entries(scenarios)) {
  console.log();
  console.log(`📊 ${scenario}`);
  console.log("-".repeat(80));

  const result = simulateYear(data);

  console.log(`Income:`);
  console.log(`  My Income:      $${data.myIncome.toLocaleString()}`);
  console.log(`  Spouse Income:  $${data.spouseIncome.toLocaleString()}`);
  console.log(`  Rental Net:     $${data.rentalNet.toLocaleString()}`);
  if (data.socialSecurity > 0) {
    console.log(`  Social Security: $${data.socialSecurity.toLocaleString()}`);
  }
  console.log(`  Total Gross:    $${result.grossIncome.toLocaleString()}`);

  console.log();
  console.log(`Expenses & Taxes:`);
  console.log(`  Living Expenses: $${data.expenses.toLocaleString()}`);
  if (data.tuition > 0) {
    console.log(`  Tuition:        $${data.tuition.toLocaleString()}`);
  }
  console.log(`  Total Tax:      $${Math.round(result.totalTax).toLocaleString()} (${result.effectiveRate}%)`);

  console.log();
  console.log(`Savings:`);
  console.log(`  Net Savings:    $${Math.round(result.netSavings).toLocaleString()}`);
  console.log(`  Expected Range: ${data.expectedSavings}`);

  // Update running total (with 7% growth estimate)
  totalSavings = totalSavings * 1.07 + Math.max(0, result.netSavings);
  console.log(`  Portfolio Est:  $${Math.round(totalSavings).toLocaleString()}`);

  if (data.notes) {
    console.log();
    console.log(`  📝 Note: ${data.notes}`);
  }

  // Validation checks
  const checks = [];
  if (result.effectiveRate >= 10 && result.effectiveRate <= 45) {
    checks.push("✓ Tax rate reasonable");
  } else {
    checks.push("⚠ Tax rate outside expected range");
  }

  if (result.netSavings >= -50000) {
    checks.push("✓ Savings feasible");
  } else {
    checks.push("⚠ Large deficit detected");
  }

  console.log();
  console.log(`  Validation: ${checks.join(", ")}`);
}

console.log();
console.log("=".repeat(80));
console.log("TRAJECTORY SUMMARY");
console.log("=".repeat(80));
console.log();
console.log("The calculator should show:");
console.log("  • Law school years (2025-2027): Low/negative savings (tuition burden)");
console.log("  • BigLaw years (2028, 2031-2035): High savings ($200-350k/year)");
console.log("  • Clerking years (2029-2030): Medium savings ($80-100k/year)");
console.log("  • Public interest years (2036+): Medium savings ($80-150k/year)");
console.log("  • Mortgage payoff (2050): ~$20k cash flow boost from rental");
console.log("  • Social Security (2055+): Additional $35-75k income, partially taxed");
console.log();
console.log("Portfolio trajectory:");
console.log("  • 2025: $500,000 (starting)");
console.log("  • 2035: ~$2-3M (after BigLaw peak)");
console.log("  • 2045: ~$4-6M (continued growth + public interest)");
console.log("  • 2055: ~$6-10M (approaching retirement)");
console.log();
console.log("FIRE year expected: 2045-2050 (age 58-63)");
console.log("  Target portfolio: ~$3.9M (inflated from $3.86M in 2025 dollars)");
console.log("  Plus college reserves for remaining daughter expenses");
console.log();
console.log("✅ If your calculator shows FIRE year in this range, it's working correctly!");
console.log();
