import { describe, it, expect } from 'vitest';
import { computePayroll, progressiveTax, RATES_2026, computeGross } from '../senegalPayroll';

describe('Paie Sénégal', () => {
  it('barème IR progressif : seuils cumulés', () => {
    expect(progressiveTax(630000, RATES_2026.irBrackets)).toBe(0);
    expect(progressiveTax(1500000, RATES_2026.irBrackets)).toBe(174000);
    expect(progressiveTax(4000000, RATES_2026.irBrackets)).toBe(924000);
    expect(progressiveTax(8000000, RATES_2026.irBrackets)).toBe(2324000);
  });

  it('salaire mensuel 500 000 FCFA, 1 part, non cadre', () => {
    const r = computePayroll({ mode: 'mensuel', baseAmount: 500000 });
    expect(r.gross).toBe(500000);
    expect(r.ipresEmployee).toBe(24192); // 5,6 % x plafond 432 000
    expect(r.ipresEmployer).toBe(36288); // 8,4 % x 432 000
    expect(r.cssFamilyEmployer).toBe(4410); // 7 % x 63 000
    expect(r.cssWorkAccidentEmployer).toBe(630); // 1 % x 63 000
    // base annuelle 5 709 696 - abattement plafonné 900 000 = 4 809 696 ; IR = 924 000 + 35 % x 809 696
    expect(r.irMonthly).toBe(100616);
    expect(r.trimfMonthly).toBe(1000); // brut annuel 6 000 000 -> 12 000 / 12
    expect(r.net).toBe(500000 - 24192 - 100616 - 1000);
    expect(r.employerCost).toBe(500000 + 36288 + 4410 + 630);
  });

  it('cadre : retraite complémentaire 2,4 % salarié / 3,6 % employeur', () => {
    const r = computePayroll({ mode: 'mensuel', baseAmount: 1000000, isCadre: true });
    expect(r.ipresCadreEmployee).toBe(24000);
    expect(r.ipresEmployer).toBe(Math.round(432000 * 0.084) + 36000);
  });

  it('quotient familial réduit l impôt et reste plafonné à 5 parts', () => {
    const one = computePayroll({ mode: 'mensuel', baseAmount: 800000, parts: 1 });
    const three = computePayroll({ mode: 'mensuel', baseAmount: 800000, parts: 3 });
    const nine = computePayroll({ mode: 'mensuel', baseAmount: 800000, parts: 9 });
    const five = computePayroll({ mode: 'mensuel', baseAmount: 800000, parts: 5 });
    expect(three.irMonthly).toBeLessThan(one.irMonthly);
    expect(nine.irMonthly).toBe(five.irMonthly);
  });

  it('journalier et à la tâche (tonne), heures supplémentaires', () => {
    expect(computeGross({ mode: 'journalier', baseAmount: 5000, daysWorked: 22 }).gross).toBe(110000);
    expect(computeGross({ mode: 'tache', baseAmount: 1500, tonnes: 40 }).gross).toBe(60000);
    const ot = computeGross({ mode: 'mensuel', baseAmount: 173330, overtimeHours: 10 });
    expect(ot.overtimePay).toBe(Math.round(10 * 1000 * 1.15));
  });

  it('salaire nul : aucune retenue', () => {
    const r = computePayroll({ mode: 'mensuel', baseAmount: 0 });
    expect(r.net).toBe(0);
    expect(r.trimfMonthly).toBe(0);
  });
});
