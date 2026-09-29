/**
 * Mapping SYSCOHADA révisé (système normal) : balance générale -> rubriques
 * de la liasse (Bilan actif/passif, Compte de résultat) avec les codes de
 * référence officiels (AD…BZ, CA…DZ, TA…XI), identiques à la plaquette Sage.
 * Module pur (aucune dépendance) : testable et réutilisable côté serveur.
 */
import Decimal from "decimal.js";

export interface TrialBalanceRow {
  account_number: string;
  account_name: string;
  opening_balance: number;
  period_debit: number;
  period_credit: number;
  closing_balance: number; // débit - crédit
}

type Side = "any" | "debit" | "credit";
interface Rule { ref: string; prefixes: string[]; side?: Side }

export interface LiasseLine {
  ref: string;
  label: string;
  total?: boolean;
  brut: number;
  amort: number;
  net: number;
  accounts: string[];
}

// ---------- BILAN ACTIF ----------
const ACTIF_LABELS: [string, string, boolean?][] = [
  ["AD", "IMMOBILISATIONS INCORPORELLES", true],
  ["AE", "Frais de développement et de prospection"],
  ["AF", "Brevets, licences, logiciels et droits similaires"],
  ["AG", "Fonds commercial et droit au bail"],
  ["AH", "Autres immobilisations incorporelles"],
  ["AI", "IMMOBILISATIONS CORPORELLES", true],
  ["AJ", "Terrains"],
  ["AK", "Bâtiments"],
  ["AL", "Aménagements, agencements et installations"],
  ["AM", "Matériel, mobilier et actifs biologiques"],
  ["AN", "Matériel de transport"],
  ["AP", "Avances et acomptes versés sur immobilisations"],
  ["AQ", "IMMOBILISATIONS FINANCIÈRES", true],
  ["AR", "Titres de participation"],
  ["AS", "Autres immobilisations financières"],
  ["AZ", "TOTAL ACTIF IMMOBILISÉ", true],
  ["BA", "ACTIF CIRCULANT HAO"],
  ["BB", "STOCKS ET ENCOURS"],
  ["BG", "CRÉANCES ET EMPLOIS ASSIMILÉS", true],
  ["BH", "Fournisseurs, avances versées"],
  ["BI", "Clients"],
  ["BJ", "Autres créances"],
  ["BK", "TOTAL ACTIF CIRCULANT", true],
  ["BQ", "Titres de placement"],
  ["BR", "Valeurs à encaisser"],
  ["BS", "Banques, chèques postaux, caisse et assimilés"],
  ["BT", "TOTAL TRÉSORERIE-ACTIF", true],
  ["BU", "Écart de conversion-Actif"],
  ["BZ", "TOTAL GÉNÉRAL", true],
];

const ACTIF_BRUT: Rule[] = [
  { ref: "AE", prefixes: ["211", "2181", "2191"] },
  { ref: "AF", prefixes: ["212", "213", "214", "2193"] },
  { ref: "AG", prefixes: ["215", "216"] },
  { ref: "AH", prefixes: ["217", "218", "219"] },
  { ref: "AJ", prefixes: ["22"] },
  { ref: "AK", prefixes: ["231", "232", "233", "237", "2391"] },
  { ref: "AL", prefixes: ["234", "235", "238", "2392", "2393", "239"] },
  { ref: "AM", prefixes: ["24"] },
  { ref: "AN", prefixes: ["245", "2495"] },
  { ref: "AP", prefixes: ["25"] },
  { ref: "AR", prefixes: ["26"] },
  { ref: "AS", prefixes: ["27"] },
  { ref: "BA", prefixes: ["485", "488"] },
  { ref: "BB", prefixes: ["31", "32", "33", "34", "35", "36", "37", "38"] },
  { ref: "BH", prefixes: ["409"], side: "debit" },
  { ref: "BI", prefixes: ["41"], side: "debit" },
  { ref: "BJ", prefixes: ["185", "42", "43", "44", "45", "46", "47", "40"], side: "debit" },
  { ref: "BQ", prefixes: ["50"] },
  { ref: "BR", prefixes: ["51"] },
  { ref: "BS", prefixes: ["52", "53", "54", "55", "57", "58"], side: "debit" },
  { ref: "BU", prefixes: ["478"] },
];

const ACTIF_AMORT: Rule[] = [
  { ref: "AE", prefixes: ["2811", "2911", "2818", "2918"] },
  { ref: "AF", prefixes: ["2812", "2813", "2814", "2912", "2913", "2914"] },
  { ref: "AG", prefixes: ["2815", "2816", "2915", "2916"] },
  { ref: "AH", prefixes: ["2817", "2917", "2919"] },
  { ref: "AJ", prefixes: ["282", "292"] },
  { ref: "AK", prefixes: ["2831", "2832", "2833", "2837", "2931", "2932", "2933", "2937"] },
  { ref: "AL", prefixes: ["2834", "2835", "2838", "2934", "2935", "2938", "283", "293"] },
  { ref: "AM", prefixes: ["284", "294"] },
  { ref: "AN", prefixes: ["2845", "2945"] },
  { ref: "AP", prefixes: ["295"] },
  { ref: "AR", prefixes: ["296"] },
  { ref: "AS", prefixes: ["297"] },
  { ref: "BA", prefixes: ["498"] },
  { ref: "BB", prefixes: ["39"] },
  { ref: "BH", prefixes: ["490"] },
  { ref: "BI", prefixes: ["491"] },
  { ref: "BJ", prefixes: ["492", "493", "494", "495", "496", "497"] },
  { ref: "BQ", prefixes: ["590"] },
  { ref: "BR", prefixes: ["591"] },
  { ref: "BS", prefixes: ["592", "593", "594"] },
];

// ---------- BILAN PASSIF ----------
const PASSIF_LABELS: [string, string, boolean?][] = [
  ["CA", "Capital"],
  ["CB", "Apporteurs capital non appelé (-)"],
  ["CD", "Primes liées au capital social"],
  ["CE", "Écarts de réévaluation"],
  ["CF", "Réserves indisponibles"],
  ["CG", "Réserves libres"],
  ["CH", "Report à nouveau (+ ou -)"],
  ["CJ", "Résultat net de l'exercice (bénéfice + ou perte -)"],
  ["CL", "Subventions d'investissement"],
  ["CM", "Provisions réglementées"],
  ["CP", "TOTAL CAPITAUX PROPRES ET RESSOURCES ASSIMILÉES", true],
  ["DA", "Emprunts et dettes financières diverses"],
  ["DB", "Dettes de location-acquisition"],
  ["DC", "Provisions pour risques et charges"],
  ["DD", "TOTAL DETTES FINANCIÈRES ET RESSOURCES ASSIMILÉES", true],
  ["DF", "TOTAL RESSOURCES STABLES", true],
  ["DH", "Dettes circulantes HAO"],
  ["DI", "Clients, avances reçues"],
  ["DJ", "Fournisseurs d'exploitation"],
  ["DK", "Dettes fiscales et sociales"],
  ["DM", "Autres dettes"],
  ["DN", "Provisions pour risques à court terme"],
  ["DP", "TOTAL PASSIF CIRCULANT", true],
  ["DQ", "Banques, crédits d'escompte"],
  ["DR", "Banques, établissements financiers et crédits de trésorerie"],
  ["DT", "TOTAL TRÉSORERIE-PASSIF", true],
  ["DV", "Écart de conversion-Passif"],
  ["DZ", "TOTAL GÉNÉRAL", true],
];

const PASSIF: Rule[] = [
  { ref: "CA", prefixes: ["101", "102", "103", "104"] },
  { ref: "CB", prefixes: ["109"] },
  { ref: "CD", prefixes: ["105"] },
  { ref: "CE", prefixes: ["106"] },
  { ref: "CF", prefixes: ["111", "112", "113"] },
  { ref: "CG", prefixes: ["118"] },
  { ref: "CH", prefixes: ["12"] },
  { ref: "CJ", prefixes: ["13"] },
  { ref: "CL", prefixes: ["14"] },
  { ref: "CM", prefixes: ["15"] },
  { ref: "DA", prefixes: ["16", "181", "182", "183", "184"] },
  { ref: "DB", prefixes: ["17"] },
  { ref: "DC", prefixes: ["19"] },
  { ref: "DH", prefixes: ["481", "482", "484", "4998"] },
  { ref: "DI", prefixes: ["419"], side: "credit" },
  { ref: "DJ", prefixes: ["40"], side: "credit" },
  { ref: "DK", prefixes: ["42", "43", "44"], side: "credit" },
  { ref: "DM", prefixes: ["185", "41", "45", "46", "47"], side: "credit" },
  { ref: "DN", prefixes: ["499", "599"] },
  { ref: "DQ", prefixes: ["564", "565"] },
  { ref: "DR", prefixes: ["52", "53", "561", "566", "55", "57", "58"], side: "credit" },
  { ref: "DV", prefixes: ["479"] },
];

// ---------- COMPTE DE RÉSULTAT ----------
// sign: +1 produit (crédit), -1 charge (débit)
interface CrLine { ref: string; label: string; prefixes?: string[]; sign?: 1 | -1; formula?: string[] }
const CR_LINES: CrLine[] = [
  { ref: "TA", label: "Ventes de marchandises", prefixes: ["701"], sign: 1 },
  { ref: "RA", label: "Achats de marchandises", prefixes: ["601"], sign: -1 },
  { ref: "RB", label: "Variation de stocks de marchandises", prefixes: ["6031"], sign: -1 },
  { ref: "XA", label: "MARGE COMMERCIALE", formula: ["TA", "RA", "RB"] },
  { ref: "TB", label: "Ventes de produits fabriqués", prefixes: ["702", "703", "704"], sign: 1 },
  { ref: "TC", label: "Travaux, services vendus", prefixes: ["705", "706"], sign: 1 },
  { ref: "TD", label: "Produits accessoires", prefixes: ["707"], sign: 1 },
  { ref: "XB", label: "CHIFFRE D'AFFAIRES", formula: ["TA", "TB", "TC", "TD"] },
  { ref: "TE", label: "Production stockée (ou déstockage)", prefixes: ["73"], sign: 1 },
  { ref: "TF", label: "Production immobilisée", prefixes: ["72"], sign: 1 },
  { ref: "TG", label: "Subventions d'exploitation", prefixes: ["71"], sign: 1 },
  { ref: "TH", label: "Autres produits", prefixes: ["75"], sign: 1 },
  { ref: "TI", label: "Transferts de charges d'exploitation", prefixes: ["781"], sign: 1 },
  { ref: "RC", label: "Achats de matières premières et fournitures liées", prefixes: ["602"], sign: -1 },
  { ref: "RD", label: "Variation de stocks de matières premières", prefixes: ["6032"], sign: -1 },
  { ref: "RE", label: "Autres achats", prefixes: ["604", "605", "608"], sign: -1 },
  { ref: "RF", label: "Variation de stocks d'autres approvisionnements", prefixes: ["6033"], sign: -1 },
  { ref: "RG", label: "Transports", prefixes: ["61"], sign: -1 },
  { ref: "RH", label: "Services extérieurs", prefixes: ["62", "63"], sign: -1 },
  { ref: "RI", label: "Impôts et taxes", prefixes: ["64"], sign: -1 },
  { ref: "RJ", label: "Autres charges", prefixes: ["65"], sign: -1 },
  { ref: "XC", label: "VALEUR AJOUTÉE", formula: ["XB", "RA", "RB", "TE", "TF", "TG", "TH", "TI", "RC", "RD", "RE", "RF", "RG", "RH", "RI", "RJ"] },
  { ref: "RK", label: "Charges de personnel", prefixes: ["66"], sign: -1 },
  { ref: "XD", label: "EXCÉDENT BRUT D'EXPLOITATION", formula: ["XC", "RK"] },
  { ref: "TJ", label: "Reprises d'amortissements, provisions et dépréciations", prefixes: ["791", "798", "799"], sign: 1 },
  { ref: "RL", label: "Dotations aux amortissements, provisions et dépréciations", prefixes: ["681", "691"], sign: -1 },
  { ref: "XE", label: "RÉSULTAT D'EXPLOITATION", formula: ["XD", "TJ", "RL"] },
  { ref: "TK", label: "Revenus financiers et assimilés", prefixes: ["77"], sign: 1 },
  { ref: "TL", label: "Reprises de provisions et dépréciations financières", prefixes: ["797"], sign: 1 },
  { ref: "TM", label: "Transferts de charges financières", prefixes: ["787"], sign: 1 },
  { ref: "RM", label: "Frais financiers et charges assimilées", prefixes: ["67"], sign: -1 },
  { ref: "RN", label: "Dotations aux provisions et dépréciations financières", prefixes: ["697"], sign: -1 },
  { ref: "XF", label: "RÉSULTAT FINANCIER", formula: ["TK", "TL", "TM", "RM", "RN"] },
  { ref: "XG", label: "RÉSULTAT DES ACTIVITÉS ORDINAIRES", formula: ["XE", "XF"] },
  { ref: "TN", label: "Produits des cessions d'immobilisations", prefixes: ["82"], sign: 1 },
  { ref: "TO", label: "Autres produits HAO", prefixes: ["84", "86", "88"], sign: 1 },
  { ref: "RO", label: "Valeurs comptables des cessions d'immobilisations", prefixes: ["81"], sign: -1 },
  { ref: "RP", label: "Autres charges HAO", prefixes: ["83", "85"], sign: -1 },
  { ref: "XH", label: "RÉSULTAT HORS ACTIVITÉS ORDINAIRES", formula: ["TN", "TO", "RO", "RP"] },
  { ref: "RQ", label: "Participation des travailleurs", prefixes: ["87"], sign: -1 },
  { ref: "RS", label: "Impôts sur le résultat", prefixes: ["89"], sign: -1 },
  { ref: "XI", label: "RÉSULTAT NET", formula: ["XG", "XH", "RQ", "RS"] },
];

const PASSIF_TOTALS: Record<string, string[]> = {
  CP: ["CA", "CB", "CD", "CE", "CF", "CG", "CH", "CJ", "CL", "CM"],
  DD: ["DA", "DB", "DC"],
  DF: ["CP", "DD"],
  DP: ["DH", "DI", "DJ", "DK", "DM", "DN"],
  DT: ["DQ", "DR"],
  DZ: ["DF", "DP", "DT", "DV"],
};
const ACTIF_TOTALS: Record<string, string[]> = {
  AD: ["AE", "AF", "AG", "AH"],
  AI: ["AJ", "AK", "AL", "AM", "AN", "AP"],
  AQ: ["AR", "AS"],
  AZ: ["AD", "AI", "AQ"],
  BG: ["BH", "BI", "BJ"],
  BK: ["BA", "BB", "BG"],
  BT: ["BQ", "BR", "BS"],
  BZ: ["AZ", "BK", "BT", "BU"],
};

/** Règle correspondante : préfixe le plus long, en respectant le sens du solde. */
function match(rules: Rule[], acc: string, balance: Decimal): Rule | undefined {
  let best: Rule | undefined; let len = 0;
  for (const r of rules) {
    if (r.side === "debit" && balance.lt(0)) continue;
    if (r.side === "credit" && balance.gt(0)) continue;
    for (const p of r.prefixes) {
      if (acc.startsWith(p) && p.length > len) { best = r; len = p.length; }
    }
  }
  return best;
}

const isAmortAccount = (a: string) => /^(28|29|39|49|59)/.test(a);

export interface Liasse {
  actif: LiasseLine[];
  passif: LiasseLine[];
  compteResultat: LiasseLine[];
  totalActif: number;
  totalPassif: number;
  resultatNet: number;
  equilibre: boolean;
  nonMappes: { account_number: string; account_name: string; solde: number }[];
}

export function buildLiasse(rows: TrialBalanceRow[]): Liasse {
  const actifB = new Map<string, Decimal>(); const actifA = new Map<string, Decimal>();
  const passifM = new Map<string, Decimal>(); const crM = new Map<string, Decimal>();
  const accs = new Map<string, Set<string>>();
  const nonMappes: Liasse["nonMappes"] = [];
  const add = (m: Map<string, Decimal>, k: string, v: Decimal, acc: string) => {
    m.set(k, (m.get(k) ?? new Decimal(0)).plus(v));
    if (!accs.has(k)) accs.set(k, new Set());
    accs.get(k)!.add(acc);
  };
  let resultatCourant = new Decimal(0); // soldes classes 6-8 non encore clôturés

  const crRules: Rule[] = CR_LINES.filter(l => l.prefixes).map(l => ({ ref: l.ref, prefixes: l.prefixes! }));

  for (const r of rows) {
    const acc = String(r.account_number).trim();
    const closing = new Decimal(r.closing_balance || 0);
    const cls = acc[0];

    if (["6", "7", "8"].includes(cls)) {
      resultatCourant = resultatCourant.minus(closing);
      const mv = new Decimal(r.period_debit || 0).minus(r.period_credit || 0);
      if (mv.isZero()) continue;
      const rule = match(crRules, acc, mv);
      if (!rule) { nonMappes.push({ account_number: acc, account_name: r.account_name, solde: mv.toNumber() }); continue; }
      const line = CR_LINES.find(l => l.ref === rule.ref)!;
      add(crM, rule.ref, line.sign === 1 ? mv.neg() : mv, acc);
      continue;
    }
    if (closing.isZero()) continue;

    if (isAmortAccount(acc)) {
      const rule = match(ACTIF_AMORT, acc, closing);
      if (rule) { add(actifA, rule.ref, closing.neg(), acc); continue; }
      if (acc.startsWith("499") || acc.startsWith("599")) { add(passifM, "DN", closing.neg(), acc); continue; }
    }
    const aRule = match(ACTIF_BRUT, acc, closing);
    const pRule = match(PASSIF, acc, closing);
    // Classes 1 -> passif ; 2/3 -> actif ; 4/5 -> selon le sens
    if (cls === "1" && pRule) { add(passifM, pRule.ref, closing.neg(), acc); continue; }
    if ((cls === "2" || cls === "3") && aRule) { add(actifB, aRule.ref, closing, acc); continue; }
    if (closing.gt(0) && aRule) { add(actifB, aRule.ref, closing, acc); continue; }
    if (closing.lt(0) && pRule) { add(passifM, pRule.ref, closing.neg(), acc); continue; }
    nonMappes.push({ account_number: acc, account_name: r.account_name, solde: closing.toNumber() });
  }

  // Résultat de l'exercice non encore affecté -> CJ
  if (!resultatCourant.isZero()) passifM.set("CJ", (passifM.get("CJ") ?? new Decimal(0)).plus(resultatCourant));

  // Compte de résultat avec soldes intermédiaires
  const crVal = new Map<string, Decimal>();
  const crSigned = (ref: string): Decimal => {
    const l = CR_LINES.find(x => x.ref === ref)!;
    const v = crVal.get(ref) ?? new Decimal(0);
    return l.sign === -1 ? v.neg() : v;
  };
  const compteResultat: LiasseLine[] = CR_LINES.map(l => {
    let v: Decimal;
    if (l.formula) {
      // XC réutilise XB : ne pas recompter TA
      v = l.formula.reduce((s, f) => s.plus(crSigned(f)), new Decimal(0));
    } else v = crM.get(l.ref) ?? new Decimal(0);
    crVal.set(l.ref, v);
    const n = v.toNumber();
    return { ref: l.ref, label: l.label, total: !!l.formula, brut: n, amort: 0, net: n, accounts: [...(accs.get(l.ref) ?? [])] };
  });

  const buildSide = (labels: [string, string, boolean?][], totals: Record<string, string[]>, brut: Map<string, Decimal>, amort?: Map<string, Decimal>) => {
    const b = new Map<string, Decimal>(); const a = new Map<string, Decimal>();
    for (const [ref] of labels) {
      if (totals[ref]) continue;
      b.set(ref, brut.get(ref) ?? new Decimal(0));
      a.set(ref, amort?.get(ref) ?? new Decimal(0));
    }
    // Totaux ensuite, dans l'ordre de dépendance (clés de l'objet)
    for (const ref of Object.keys(totals)) {
      b.set(ref, totals[ref].reduce((s, k) => s.plus(b.get(k) ?? 0), new Decimal(0)));
      a.set(ref, totals[ref].reduce((s, k) => s.plus(a.get(k) ?? 0), new Decimal(0)));
    }
    return labels.map(([ref, label, total]) => {
      const br = b.get(ref)!; const am = a.get(ref)!;
      return { ref, label, total: !!total || !!totals[ref], brut: br.toNumber(), amort: am.toNumber(), net: br.minus(am).toNumber(), accounts: [...(accs.get(ref) ?? [])] };
    });
  };

  const actif = buildSide(ACTIF_LABELS, ACTIF_TOTALS, actifB, actifA);
  const passif = buildSide(PASSIF_LABELS, PASSIF_TOTALS, passifM);
  const totalActif = actif.find(l => l.ref === "BZ")!.net;
  const totalPassif = passif.find(l => l.ref === "DZ")!.net;
  return {
    actif, passif, compteResultat, totalActif, totalPassif,
    resultatNet: compteResultat.find(l => l.ref === "XI")!.net,
    equilibre: Math.abs(totalActif - totalPassif) < 1,
    nonMappes,
  };
}
