import { describe, it, expect } from "vitest";
import { computeInvoiceTotals } from "./currency";

const cases: [number, number, number, number, number][] = [
  // qty, prix, taux, HT attendu, TVA attendue
  [40, 33333, 18, 1333320, 239998],
  [1, 1, 18, 1, 0],
  [3, 3, 18, 9, 2],
  [0.5, 33333, 18, 16667, 3000],
  [2.25, 12345, 18, 27776, 5000],
  [7, 14286, 18, 100002, 18000],
  [100, 20000, 18, 2000000, 360000],
  [40, 35000, 18, 1400000, 252000],
  [1.333, 999, 18, 1332, 240],
  [12.5, 15999, 0, 199988, 0],
  [0.1, 5, 18, 1, 0],
];

describe("computeInvoiceTotals — FCFA entiers, TVA par ligne", () => {
  it.each(cases)("%s × %s à %s%%", (q, p, r, ht, tva) => {
    const t = computeInvoiceTotals([{ quantity: q, unit_price: p }], r);
    expect(t.totalHT).toBe(ht);
    expect(t.totalTVA).toBe(tva);
    expect(t.totalTTC).toBe(ht + tva);
    expect(Number.isInteger(t.totalTTC)).toBe(true);
  });
  it("total = somme des lignes (arrondi par ligne)", () => {
    const t = computeInvoiceTotals([{ quantity: 1, unit_price: 3 }, { quantity: 1, unit_price: 3 }, { quantity: 1, unit_price: 3 }], 18);
    expect(t.totalTVA).toBe(3); // 3 × round(0,54)=1 ; sur le total on aurait round(1,62)=2
    expect(t.totalTTC).toBe(t.lines.reduce((s, l) => s + l.ttc, 0));
  });
});
