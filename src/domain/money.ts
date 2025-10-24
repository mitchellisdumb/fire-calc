import Decimal from 'decimal.js'

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP })

export const dec = (value: number | string | Decimal): Decimal =>
  value instanceof Decimal ? value : new Decimal(value)

export const toNumber = (value: Decimal): number => Number(value.toNumber())

export const add = (a: Decimal | number, b: Decimal | number): Decimal =>
  dec(a).add(b)

export const sub = (a: Decimal | number, b: Decimal | number): Decimal =>
  dec(a).sub(b)

export const mul = (a: Decimal | number, b: Decimal | number): Decimal =>
  dec(a).mul(b)

export const div = (a: Decimal | number, b: Decimal | number): Decimal =>
  dec(a).div(b)

export const clampMin = (value: Decimal | number, min: number): Decimal => {
  const decimalValue = dec(value)
  return decimalValue.lessThan(min) ? dec(min) : decimalValue
}

export const percentage = (value: Decimal | number, rate: Decimal | number): Decimal =>
  mul(value, div(rate, 100))

export const applyReturn = (value: Decimal, rate: number): Decimal =>
  value.mul(dec(1).add(dec(rate)))

export const compound = (
  principal: Decimal | number,
  rate: Decimal | number,
  periods: number,
): Decimal => dec(principal).mul(dec(1).add(rate).pow(periods))
