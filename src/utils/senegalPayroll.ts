/**
 * Moteur de paie Sénégal / UEMOA (taux paramétrables).
 * Sources 2026 : CLEISS (IPRES, CSS : taux et plafonds au 01/01/2026),
 * CGI art. 173 (barème IR progressif), TRIMF : barème indicatif à confirmer
 * auprès de la DGID avant usage en production.
 */
export interface PayrollRates {
  ipresGeneral: { employee: number; employer: number; ceiling: number };
  ipresCadre: { employee: number; employer: number; ceiling: number };
  cssFamily: { employer: number; ceiling: number };
  cssWorkAccident: { employer: number; ceiling: number };
  professionalExpenseRate: number;
  professionalExpenseCapYear: number;
  irBrackets: { upTo: number; rate: number }[];
  trimfBrackets: { upTo: number; amountYear: number }[];
  maxParts: number;
}

export const RATES_2026: PayrollRates = {
  ipresGeneral: { employee: 0.056, employer: 0.084, ceiling: 432000 },
  ipresCadre: { employee: 0.024, employer: 0.036, ceiling: 1296000 },
  cssFamily: { employer: 0.07, ceiling: 63000 },
  cssWorkAccident: { employer: 0.01, ceiling: 63000 },
  professionalExpenseRate: 0.3,
  professionalExpenseCapYear: 900000,
  irBrackets: [
    { upTo: 630000, rate: 0 },
    { upTo: 1500000, rate: 0.2 },
    { upTo: 4000000, rate: 0.3 },
    { upTo: 8000000, rate: 0.35 },
    { upTo: 13500000, rate: 0.37 },
    { upTo: 50000000, rate: 0.4 },
    { upTo: Infinity, rate: 0.43 },
  ],
  trimfBrackets: [
    { upTo: 600000, amountYear: 900 },
    { upTo: 1000000, amountYear: 3600 },
    { upTo: 2000000, amountYear: 4800 },
    { upTo: 7000000, amountYear: 12000 },
    { upTo: 12000000, amountYear: 18000 },
    { upTo: Infinity, amountYear: 36000 },
  ],
  maxParts: 5,
};

export type PayMode = 'mensuel' | 'journalier' | 'tache';

export interface PayrollInput {
  mode: PayMode;
  /** Salaire mensuel (mensuel), taux journalier (journalier) ou prix par tonne (tache) */
  baseAmount: number;
  daysWorked?: number;
  tonnes?: number;
  overtimeHours?: number;
  /** Taux horaire de référence pour les heures sup. (défaut : base / 173,33) */
  hourlyRate?: number;
  overtimeMultiplier?: number;
  isCadre?: boolean;
  parts?: number;
  workAccidentRate?: 0.01 | 0.03 | 0.05;
  rates?: PayrollRates;
}

export interface PayrollResult {
  gross: number;
  overtimePay: number;
  ipresEmployee: number;
  ipresCadreEmployee: number;
  ipresEmployer: number;
  cssFamilyEmployer: number;
  cssWorkAccidentEmployer: number;
  irMonthly: number;
  trimfMonthly: number;
  totalEmployeeDeductions: number;
  net: number;
  employerCost: number;
}

const round = (n: number) => Math.round(n);

export function progressiveTax(annualBase: number, brackets: PayrollRates['irBrackets']): number {
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (annualBase <= prev) break;
    tax += (Math.min(annualBase, b.upTo) - prev) * b.rate;
    prev = b.upTo;
  }
  return tax;
}

export function computeGross(input: PayrollInput): { gross: number; overtimePay: number } {
  const { mode, baseAmount } = input;
  let basePay = 0;
  if (mode === 'mensuel') basePay = baseAmount;
  else if (mode === 'journalier') basePay = baseAmount * (input.daysWorked ?? 0);
  else basePay = baseAmount * (input.tonnes ?? 0);
  const hourly =
    input.hourlyRate ?? (mode === 'mensuel' ? baseAmount / 173.33 : mode === 'journalier' ? baseAmount / 8 : 0);
  const overtimePay = (input.overtimeHours ?? 0) * hourly * (input.overtimeMultiplier ?? 1.15);
  return { gross: round(basePay + overtimePay), overtimePay: round(overtimePay) };
}

export function computePayroll(input: PayrollInput): PayrollResult {
  const r = input.rates ?? RATES_2026;
  const { gross, overtimePay } = computeGross(input);
  const ipresEmployee = round(Math.min(gross, r.ipresGeneral.ceiling) * r.ipresGeneral.employee);
  const ipresEmployer = round(Math.min(gross, r.ipresGeneral.ceiling) * r.ipresGeneral.employer);
  const cadreBase = input.isCadre ? Math.min(gross, r.ipresCadre.ceiling) : 0;
  const ipresCadreEmployee = round(cadreBase * r.ipresCadre.employee);
  const ipresCadreEmployer = round(cadreBase * r.ipresCadre.employer);
  const cssFamilyEmployer = round(Math.min(gross, r.cssFamily.ceiling) * r.cssFamily.employer);
  const cssWorkAccidentEmployer = round(
    Math.min(gross, r.cssWorkAccident.ceiling) * (input.workAccidentRate ?? r.cssWorkAccident.employer),
  );

  const annualNet = (gross - ipresEmployee - ipresCadreEmployee) * 12;
  const deduction = Math.min(annualNet * r.professionalExpenseRate, r.professionalExpenseCapYear);
  const annualBase = Math.max(0, annualNet - deduction);
  const parts = Math.min(Math.max(input.parts ?? 1, 1), r.maxParts);
  const irYear = progressiveTax(annualBase / parts, r.irBrackets) * parts;
  const irMonthly = round(irYear / 12);

  const grossYear = gross * 12;
  const trimfYear = (r.trimfBrackets.find((b) => grossYear <= b.upTo) ?? r.trimfBrackets[r.trimfBrackets.length - 1])
    .amountYear;
  const trimfMonthly = gross > 0 ? round(trimfYear / 12) : 0;

  const totalEmployeeDeductions = ipresEmployee + ipresCadreEmployee + irMonthly + trimfMonthly;
  return {
    gross,
    overtimePay,
    ipresEmployee,
    ipresCadreEmployee,
    ipresEmployer: ipresEmployer + ipresCadreEmployer,
    cssFamilyEmployer,
    cssWorkAccidentEmployer,
    irMonthly,
    trimfMonthly,
    totalEmployeeDeductions,
    net: gross - totalEmployeeDeductions,
    employerCost: gross + ipresEmployer + ipresCadreEmployer + cssFamilyEmployer + cssWorkAccidentEmployer,
  };
}
