import { describe, it, expect } from "vitest";
import { buildLiasse, buildTft, type TrialBalanceRow } from "./syscohadaLiasse";

const row = (n: string, d: number, c: number): TrialBalanceRow => ({
  account_number: n, account_name: n, opening_balance: 0, period_debit: d, period_credit: c, closing_balance: d - c,
});

describe("buildLiasse", () => {
  const rows = [
    row("101000", 0, 11_000_000),     // capital
    row("245000", 6_000_000, 0),      // matériel de transport
    row("284500", 0, 1_000_000),      // amort transport
    row("521000", 5_000_000, 0),      // banque
    row("401000", 0, 2_360_000),      // fournisseur
    row("445200", 360_000, 0),        // TVA récupérable
    row("602000", 2_000_000, 0),      // achats
    row("702100", 0, 1_400_000),      // ventes sel Région
    row("681300", 1_000_000, 0),      // dotations
    row("411000", 1_652_000, 0),      // client
    row("443100", 0, 252_000),        // TVA collectée
  ];
  const l = buildLiasse(rows);
  const get = (arr: typeof l.actif, ref: string) => arr.find(x => x.ref === ref)!;

  it("classe les comptes dans les bonnes rubriques", () => {
    expect(get(l.actif, "AN").brut).toBe(6_000_000);
    expect(get(l.actif, "AN").amort).toBe(1_000_000);
    expect(get(l.actif, "AN").net).toBe(5_000_000);
    expect(get(l.actif, "BI").net).toBe(1_652_000);
    expect(get(l.actif, "BJ").net).toBe(360_000);
    expect(get(l.passif, "DJ").net).toBe(2_360_000);
    expect(get(l.passif, "DK").net).toBe(252_000);
    expect(get(l.compteResultat, "TB").net).toBe(1_400_000);
    expect(get(l.compteResultat, "RC").net).toBe(2_000_000);
  });

  it("calcule le résultat et équilibre le bilan", () => {
    expect(l.resultatNet).toBe(-1_600_000);
    expect(get(l.passif, "CJ").net).toBe(-1_600_000);
    expect(l.equilibre).toBe(true);
    expect(l.nonMappes).toHaveLength(0);
  });

  it("TFT : trésorerie finale = banque", () => {
    const tft = buildTft(l, buildLiasse([]));
    expect(tft.lines.find(x => x.ref === "ZH")!.amount).toBe(5_000_000);
    expect(tft.ecart).toBe(0);
  });
});
