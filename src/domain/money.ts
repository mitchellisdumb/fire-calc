import Decimal from 'decimal.js'

// Configure Decimal.js globally so every calculation in the projection/MC engine
// uses the same precision and rounding semantics. We choose 40 digits of precision
// because the timelines can span decades with compounding, and ROUND_HALF_UP to
// emulate “normal” financial rounding while still preserving extra guard digits.
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP })

// Helper that normalises raw number/string/Decimal inputs into a Decimal instance.
// The domain layer often receives plain numbers from the UI; this ensures the rest
// of the math pipeline never has to care about the incoming type.
export const dec = (value: number | string | Decimal): Decimal =>
  value instanceof Decimal ? value : new Decimal(value)

// Convert back to a primitive number for UI consumers. Decimal#toNumber already
// guards against precision loss by clamping to JS safe ranges; we only coerce to
// Number once we’re ready to display a value.
export const toNumber = (value: Decimal): number => Number(value.toNumber())

// Lifted arithmetic helpers keep the rest of the codebase expressive while still
// enforcing Decimal maths everywhere.
export const add = (a: Decimal | number, b: Decimal | number): Decimal =>
  dec(a).add(b)

export const sub = (a: Decimal | number, b: Decimal | number): Decimal =>
  dec(a).sub(b)

export const mul = (a: Decimal | number, b: Decimal | number): Decimal =>
  dec(a).mul(b)

export const div = (a: Decimal | number, b: Decimal | number): Decimal =>
  dec(a).div(b)

// Clamp a value to a minimum. We explicitly re-wrap the input with dec() so callers
// can pass either Decimal or raw numbers without worrying about conversions.
export const clampMin = (value: Decimal | number, min: number): Decimal => {
  const decimalValue = dec(value)
  return decimalValue.lessThan(min) ? dec(min) : decimalValue
}

// Compute `value * (rate / 100)` using Decimal math. Used for readability whenever
// percentage-based calculations show up (e.g., contributions based on rates).
export const percentage = (value: Decimal | number, rate: Decimal | number): Decimal =>
  mul(value, div(rate, 100))

// Apply an annualised return directly: value * (1 + rate). We choose to keep this
// in a helper so Monte Carlo / projection code reads closer to the underlying formula.
export const applyReturn = (value: Decimal, rate: number): Decimal =>
  value.mul(dec(1).add(dec(rate)))

// Generic compound helper used in places like mortgage math. Accepts the principal,
// a decimal rate (already expressed as e.g. 0.05 for 5%), and the number of periods.
export const compound = (
  principal: Decimal | number,
  rate: Decimal | number,
  periods: number,
): Decimal => dec(principal).mul(dec(1).add(rate).pow(periods))
