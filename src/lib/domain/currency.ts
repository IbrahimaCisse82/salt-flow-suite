/**
 * Currency & financial calculation utilities using decimal.js
 * Eliminates JS floating-point issues (0.1 + 0.2 !== 0.3)
 * All monetary values pass through Decimal for precision.
 */
import Decimal from 'decimal.js';

// Configure for financial precision (NUMERIC(15,2) equivalent)
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/** Safe conversion to Decimal — handles null/undefined/NaN gracefully */
export const toDecimal = (value: number | string | null | undefined): Decimal => {
  if (value === null || value === undefined || value === '') return new Decimal(0);
  try {
    return new Decimal(value);
  } catch {
    return new Decimal(0);
  }
};

/** Round to 2 decimal places and return number */
export const toMoney = (value: number | string | Decimal | null | undefined): number => {
  if (value instanceof Decimal) return value.toDecimalPlaces(2).toNumber();
  return toDecimal(value).toDecimalPlaces(2).toNumber();
};

/** Format a number as FCFA currency string */
export const formatCurrency = (
  value: number | string | null | undefined,
  locale = 'fr-FR',
  currency = 'XOF'
): string => {
  const num = toMoney(value);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

/** Add two monetary values precisely */
export const addMoney = (a: number | string, b: number | string): number =>
  toDecimal(a).plus(toDecimal(b)).toDecimalPlaces(2).toNumber();

/** Subtract two monetary values precisely */
export const subtractMoney = (a: number | string, b: number | string): number =>
  toDecimal(a).minus(toDecimal(b)).toDecimalPlaces(2).toNumber();

/** Multiply (e.g. quantity × price) */
export const multiplyMoney = (a: number | string, b: number | string): number =>
  toDecimal(a).times(toDecimal(b)).toDecimalPlaces(2).toNumber();

/** Divide with safe zero handling */
export const divideMoney = (a: number | string, b: number | string): number => {
  const divisor = toDecimal(b);
  if (divisor.isZero()) return 0;
  return toDecimal(a).dividedBy(divisor).toDecimalPlaces(2).toNumber();
};

/** Calculate percentage: (value × rate / 100) */
export const percentOf = (value: number | string, rate: number | string): number =>
  toDecimal(value).times(toDecimal(rate)).dividedBy(100).toDecimalPlaces(2).toNumber();

/** Calculate TVA amount from HT */
export const calculateTVA = (montantHT: number | string, tauxTVA: number | string = 18): number =>
  percentOf(montantHT, tauxTVA);

/** Calculate TTC from HT */
export const calculateTTC = (montantHT: number | string, tauxTVA: number | string = 18): number => {
  const ht = toDecimal(montantHT);
  const tva = ht.times(toDecimal(tauxTVA)).dividedBy(100);
  return ht.plus(tva).toDecimalPlaces(2).toNumber();
};

/** Calculate HT from TTC */
export const calculateHT = (montantTTC: number | string, tauxTVA: number | string = 18): number => {
  const ttc = toDecimal(montantTTC);
  const divisor = toDecimal(1).plus(toDecimal(tauxTVA).dividedBy(100));
  return ttc.dividedBy(divisor).toDecimalPlaces(2).toNumber();
};

/** Sum an array of monetary values */
export const sumMoney = (values: (number | string | null | undefined)[]): number =>
  values
    .reduce((acc, v) => acc.plus(toDecimal(v)), new Decimal(0))
    .toDecimalPlaces(2)
    .toNumber();

/** Calculate weighted average cost (CMP) */
export const calculateCMP = (
  currentQty: number | string,
  currentCMP: number | string,
  newQty: number | string,
  newUnitCost: number | string
): number => {
  const cQty = toDecimal(currentQty);
  const cCMP = toDecimal(currentCMP);
  const nQty = toDecimal(newQty);
  const nCost = toDecimal(newUnitCost);

  const totalQty = cQty.plus(nQty);
  if (totalQty.isZero()) return 0;

  const totalValue = cQty.times(cCMP).plus(nQty.times(nCost));
  return totalValue.dividedBy(totalQty).toDecimalPlaces(2).toNumber();
};

/** Calculate linear depreciation for a period */
export const calculateLinearDepreciation = (
  acquisitionCost: number | string,
  residualValue: number | string,
  usefulLifeYears: number | string
): number => {
  const cost = toDecimal(acquisitionCost);
  const residual = toDecimal(residualValue);
  const years = toDecimal(usefulLifeYears);
  if (years.isZero()) return 0;
  return cost.minus(residual).dividedBy(years).toDecimalPlaces(2).toNumber();
};

/** Calculate cost per ton */
export const calculateCostPerTon = (
  totalCost: number | string,
  productionTons: number | string
): number => {
  return divideMoney(totalCost, productionTons);
};

/** Calculate profit margin percentage */
export const calculateMargin = (
  revenue: number | string,
  cost: number | string
): number => {
  const rev = toDecimal(revenue);
  if (rev.isZero()) return 0;
  return rev.minus(toDecimal(cost)).dividedBy(rev).times(100).toDecimalPlaces(2).toNumber();
};
