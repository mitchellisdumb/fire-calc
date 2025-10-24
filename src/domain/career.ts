// Returns total compensation (salary + standard market bonus) for a Cravath-scale
// associate given their class year. We hard-code the 2025 scale because BigLaw pay
// is lockstep and, for the purposes of this planner, we intentionally keep the
// schedule constant in nominal dollars after it is set.
export function getCravathSalary(associateYear: number): number {
  // The scale numbers include base salary plus the typical year-end bonus. We add
  // them inline so anyone auditing the code sees exactly what went into the totals.
  const scale: Record<number, number> = {
    1: 225000 + 20000,
    2: 235000 + 25000,
    3: 260000 + 35000,
    4: 305000 + 55000,
    5: 340000 + 75000,
    6: 365000 + 90000,
    7: 410000 + 115000,
    8: 420000 + 115000,
  };

  // Associates who have not yet started (or negative “years” due to seed values)
  // are treated as first-years to avoid surprises in projection edge cases.
  if (associateYear <= 0) {
    return scale[1];
  }

  // Past eighth year we cap at the top of the scale because the model does not
  // simulate partner promotion or counsel tracks.
  if (associateYear >= 8) {
    return scale[8];
  }

  return scale[associateYear] ?? scale[8];
}
