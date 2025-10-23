export function getCravathSalary(associateYear: number): number {
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

  if (associateYear <= 0) {
    return scale[1];
  }

  if (associateYear >= 8) {
    return scale[8];
  }

  return scale[associateYear] ?? scale[8];
}
