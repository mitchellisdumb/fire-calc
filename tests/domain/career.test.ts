import { describe, it, expect } from 'vitest';
import { getCravathSalary } from '../../src/domain/career';

describe('career', () => {
  describe('getCravathSalary', () => {
    it('returns correct salary for each associate year', () => {
      // Test each year on the Cravath scale (base + bonus)
      expect(getCravathSalary(1)).toBe(225000 + 20000); // First year
      expect(getCravathSalary(2)).toBe(235000 + 25000); // Second year
      expect(getCravathSalary(3)).toBe(260000 + 35000); // Third year
      expect(getCravathSalary(4)).toBe(305000 + 55000); // Fourth year
      expect(getCravathSalary(5)).toBe(340000 + 75000); // Fifth year
      expect(getCravathSalary(6)).toBe(365000 + 90000); // Sixth year
      expect(getCravathSalary(7)).toBe(410000 + 115000); // Seventh year
      expect(getCravathSalary(8)).toBe(420000 + 115000); // Eighth year
    });

    it('returns first-year salary for zero or negative years', () => {
      const firstYearSalary = 225000 + 20000;
      expect(getCravathSalary(0)).toBe(firstYearSalary);
      expect(getCravathSalary(-1)).toBe(firstYearSalary);
      expect(getCravathSalary(-10)).toBe(firstYearSalary);
    });

    it('caps at eighth-year salary for years beyond 8', () => {
      const eighthYearSalary = 420000 + 115000;
      expect(getCravathSalary(9)).toBe(eighthYearSalary);
      expect(getCravathSalary(10)).toBe(eighthYearSalary);
      expect(getCravathSalary(15)).toBe(eighthYearSalary);
      expect(getCravathSalary(100)).toBe(eighthYearSalary);
    });

    it('shows proper salary progression (each year is higher)', () => {
      for (let year = 1; year < 8; year++) {
        const currentSalary = getCravathSalary(year);
        const nextSalary = getCravathSalary(year + 1);
        expect(nextSalary).toBeGreaterThan(currentSalary);
      }
    });

    it('returns numeric values for all inputs', () => {
      for (let year = -5; year <= 15; year++) {
        const salary = getCravathSalary(year);
        expect(typeof salary).toBe('number');
        expect(Number.isFinite(salary)).toBe(true);
        expect(salary).toBeGreaterThan(0);
      }
    });

    it('matches expected total compensation amounts', () => {
      // Verify the full amounts (base + bonus)
      expect(getCravathSalary(1)).toBe(245000);
      expect(getCravathSalary(2)).toBe(260000);
      expect(getCravathSalary(3)).toBe(295000);
      expect(getCravathSalary(4)).toBe(360000);
      expect(getCravathSalary(5)).toBe(415000);
      expect(getCravathSalary(6)).toBe(455000);
      expect(getCravathSalary(7)).toBe(525000);
      expect(getCravathSalary(8)).toBe(535000);
    });

    it('has significant increases at senior years (4-5 year jump)', () => {
      const year3 = getCravathSalary(3);
      const year4 = getCravathSalary(4);
      const jump = year4 - year3;

      // Fourth year has largest jump in compensation
      expect(jump).toBeGreaterThan(60000);
      expect(jump).toBe(65000);
    });
  });
});
