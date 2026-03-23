/**
 * Depreciation domain logic — pure functions for fixed asset calculations.
 * SYSCOHADA linear depreciation method.
 */
import { toDecimal, toMoney, calculateLinearDepreciation } from './currency';

export interface DepreciationScheduleEntry {
  periodStart: string;
  periodEnd: string;
  depreciationAmount: number;
  cumulativeDepreciation: number;
  netBookValue: number;
}

/** Generate full depreciation schedule for an asset */
export const generateDepreciationSchedule = (
  acquisitionCost: number,
  residualValue: number,
  usefulLifeYears: number,
  startDate: string
): DepreciationScheduleEntry[] => {
  const annualDepreciation = calculateLinearDepreciation(
    acquisitionCost, residualValue, usefulLifeYears
  );

  const schedule: DepreciationScheduleEntry[] = [];
  let cumulative = 0;
  const start = new Date(startDate);

  for (let year = 0; year < usefulLifeYears; year++) {
    const periodStart = new Date(start.getFullYear() + year, start.getMonth(), start.getDate());
    const periodEnd = new Date(start.getFullYear() + year + 1, start.getMonth(), start.getDate() - 1);

    cumulative = toMoney(toDecimal(cumulative).plus(toDecimal(annualDepreciation)));
    const nbv = toMoney(toDecimal(acquisitionCost).minus(toDecimal(cumulative)));

    schedule.push({
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      depreciationAmount: annualDepreciation,
      cumulativeDepreciation: cumulative,
      netBookValue: Math.max(nbv, toMoney(residualValue)),
    });
  }

  return schedule;
};

/** Calculate prorated depreciation for partial year */
export const prorateDepreciation = (
  annualAmount: number,
  startDate: string,
  endDate: string
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  return toMoney(toDecimal(annualAmount).times(days).dividedBy(365));
};
