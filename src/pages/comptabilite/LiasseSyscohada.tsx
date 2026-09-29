import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Breadcrumbs } from "@/components/Layout/Breadcrumbs";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Download, CheckCircle, AlertTriangle } from "lucide-react";
import { buildLiasse, buildTft, type Liasse, type TftLine, type LiasseLine, type TrialBalanceRow } from "@/lib/domain/syscohadaLiasse";

const fmt = (n: number) => (n ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) : "-");

function LinesTable({ lines, prev, withAmort, onPick }: { lines: LiasseLine[]; prev?: LiasseLine[]; withAmort?: boolean; onPick?: (l: LiasseLine) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left p-2 w-12">Réf</th>
            <th className="text-left p-2">Libellé</th>
            {withAmort && <th className="text-right p-2">Brut</th>}
            {withAmort && <th className="text-right p-2">Amort./Dépr.</th>}
            <th className="text-right p-2">{withAmort ? "Net N" : "Exercice N"}</th>
            <th className="text-right p-2">{withAmort ? "Net N-1" : "Exercice N-1"}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(l => (
            <tr key={l.ref} className={cn("border-b", l.total && "bg-muted font-semibold", !l.total && l.detail?.length && "cursor-pointer hover:bg-accent")} title={l.accounts.join(", ")} onClick={() => !l.total && l.detail?.length && onPick?.(l)}>
              <td className="p-2 font-mono">{l.ref}</td>
              <td className="p-2">{l.label}</td>
              {withAmort && <td className="p-2 text-right tabular-nums">{fmt(l.brut)}</td>}
              {withAmort && <td className="p-2 text-right tabular-nums">{fmt(l.amort)}</td>}
              <td className="p-2 text-right tabular-nums">{fmt(l.net)}</td>
              <td className="p-2 text-right tabular-nums text-muted-foreground">{fmt(prev?.find(p => p.ref === l.ref)?.net ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const shift = (d: string) => `${Number(d.slice(0, 4)) - 1}${d.slice(4)}`;
const fetchRows = async (s: string, e: string): Promise<TrialBalanceRow[]> => {
  const { data, error } = await supabase.rpc("generate_trial_balance", { p_start_date: s, p_end_date: e });
  if (error) throw error;
  return (data ?? []) as TrialBalanceRow[];
};
const fetchLiasse = async (s: string, e: string) => buildLiasse(await fetchRows(s, e));

/** Rubrique(s) de la liasse alimentées par chaque compte de la balance. */
function refsByAccount(l: Liasse) {
  const m = new Map<string, string[]>();
  for (const line of [...l.actif, ...l.passif, ...l.compteResultat]) {
    if (line.total) continue;
    for (const d of line.detail ?? []) m.set(d.account, [...new Set([...(m.get(d.account) ?? []), line.ref])]);
  }
  return m;
}

function BalanceTable({ rows, liasse, onRef }: { rows: TrialBalanceRow[]; liasse: Liasse; onRef: (ref: string) => void }) {
  const refs = refsByAccount(liasse);
  const tot = rows.reduce((a, r) => ({ d: a.d + Number(r.period_debit), c: a.c + Number(r.period_credit) }), { d: 0, c: 0 });
  return (
    <table className="w-full text-sm">
      <thead><tr className="border-b text-muted-foreground">
        <th className="text-left p-2">Compte</th><th className="text-left p-2">Libellé</th>
        <th className="text-right p-2">Solde ouverture</th><th className="text-right p-2">Débit</th><th className="text-right p-2">Crédit</th><th className="text-right p-2">Solde</th><th className="text-left p-2">Rubrique</th>
      </tr></thead>
      <tbody>{rows.map(r => (
        <tr key={r.account_number} className="border-b">
          <td className="p-2 font-mono">{r.account_number}</td><td className="p-2">{r.account_name}</td>
          <td className="p-2 text-right tabular-nums">{fmt(Number(r.opening_balance))}</td>
          <td className="p-2 text-right tabular-nums">{fmt(Number(r.period_debit))}</td>
          <td className="p-2 text-right tabular-nums">{fmt(Number(r.period_credit))}</td>
          <td className="p-2 text-right tabular-nums">{fmt(Number(r.closing_balance))}</td>
          <td className="p-2">{(refs.get(String(r.account_number).trim()) ?? []).map(ref => (
            <Button key={ref} size="sm" variant="outline" className="h-6 px-2 mr-1 font-mono" onClick={() => onRef(ref)}>{ref}</Button>
          ))}{!refs.has(String(r.account_number).trim()) && <Badge variant="destructive">non rattaché</Badge>}</td>
        </tr>))}
        <tr className="bg-muted font-semibold"><td className="p-2" colSpan={3}>Total</td><td className="p-2 text-right tabular-nums">{fmt(tot.d)}</td><td className="p-2 text-right tabular-nums">{fmt(tot.c)}</td><td colSpan={2} /></tr>
      </tbody>
    </table>
  );
}

function TftTable({ lines, prev }: { lines: TftLine[]; prev: TftLine[] }) {
  return (
    <table className="w-full text-sm">
      <thead><tr className="border-b text-muted-foreground"><th className="text-left p-2 w-12">Réf</th><th className="text-left p-2">Libellé</th><th className="text-right p-2">Exercice N</th><th className="text-right p-2">Exercice N-1</th></tr></thead>
      <tbody>{lines.map(l => (
        <tr key={l.ref} className={cn("border-b", l.total && "bg-muted font-semibold")}>
          <td className="p-2 font-mono">{l.ref}</td><td className="p-2">{l.label}</td>
          <td className="p-2 text-right tabular-nums">{fmt(l.amount)}</td>
          <td className="p-2 text-right tabular-nums text-muted-foreground">{fmt(prev.find(p => p.ref === l.ref)?.amount ?? 0)}</td>
        </tr>))}</tbody>
    </table>
  );
}

function Notes({ n, n1 }: { n: Liasse; n1: Liasse }) {
  const groups: [string, LiasseLine[], LiasseLine[]][] = [
    ["Bilan actif", n.actif, n1.actif], ["Bilan passif", n.passif, n1.passif], ["Compte de résultat", n.compteResultat, n1.compteResultat],
  ];
  return (
    <div className="space-y-6">
      {groups.map(([title, cur, prev]) => {
        const lines = cur.filter(l => !l.total && ((l.detail?.length ?? 0) > 0 || (prev.find(p => p.ref === l.ref)?.detail?.length ?? 0) > 0));
        if (!lines.length) return null;
        return (
          <div key={title}>
            <h3 className="font-semibold mb-2">{title}</h3>
            {lines.map(l => {
              const p = prev.find(x => x.ref === l.ref);
              const accts = [...new Set([...(l.detail ?? []), ...(p?.detail ?? [])].map(d => d.account))].sort();
              const sum = (arr: LiasseLine["detail"], a: string) => (arr ?? []).filter(d => d.account === a).reduce((s, d) => s + d.amount, 0);
              return (
                <div key={l.ref} className="mb-3 border rounded-md">
                  <div className="p-2 bg-muted font-medium text-sm">{l.ref} – {l.label}</div>
                  <table className="w-full text-sm"><tbody>{accts.map(a => (
                    <tr key={a} className="border-t">
                      <td className="p-2 font-mono w-28">{a}</td>
                      <td className="p-2">{(l.detail ?? p?.detail ?? []).find(d => d.account === a)?.name ?? (p?.detail ?? []).find(d => d.account === a)?.name}</td>
                      <td className="p-2 text-right tabular-nums">{fmt(sum(l.detail, a))}</td>
                      <td className="p-2 text-right tabular-nums text-muted-foreground">{fmt(sum(p?.detail, a))}</td>
                    </tr>))}</tbody></table>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const LiasseSyscohada = () => {
  const { isOpen } = useSidebar();
  const year = new Date().getFullYear();
  const [start, setStart] = useState(`${year}-01-01`);
  const [end, setEnd] = useState(`${year}-12-31`);

  const { data, isLoading, error } = useQuery({
    queryKey: ["liasse", start, end],
    queryFn: async () => {
      const [rows, n1, n2] = await Promise.all([
        fetchRows(start, end),
        fetchLiasse(shift(start), shift(end)),
        fetchLiasse(shift(shift(start)), shift(shift(end))),
      ]);
      const n = buildLiasse(rows);
      return { ...n, rows, n1, tft: buildTft(n, n1), tft1: buildTft(n1, n2) };
    },
  });

  const qc = useQueryClient();
  const [tab, setTab] = useState("actif");
  const [picked, setPicked] = useState<LiasseLine | null>(null);
  // Propagation : toute nouvelle écriture recalcule la balance et tous les états
  useEffect(() => {
    const ch = supabase.channel("liasse-je")
      .on("postgres_changes", { event: "*", schema: "public", table: "journal_entries" }, () => qc.invalidateQueries({ queryKey: ["liasse"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
  const goRef = (ref: string) => {
    if (!data) return;
    const all = [["actif", data.actif], ["passif", data.passif], ["cr", data.compteResultat]] as const;
    for (const [t, ls] of all) { const l = ls.find(x => x.ref === ref); if (l) { setTab(t); setPicked(l); return; } }
  };

  const exportCsv = () => {
    if (!data) return;
    const out = ["Etat;Ref;Libelle;Brut;Amort;Net"];
    const push = (etat: string, ls: LiasseLine[]) => ls.forEach(l => out.push([etat, l.ref, `"${l.label}"`, l.brut, l.amort, l.net].join(";")));
    push("Bilan actif", data.actif); push("Bilan passif", data.passif); push("Compte de resultat", data.compteResultat);
    data.tft.lines.forEach(l => out.push(["TFT", l.ref, `"${l.label}"`, "", "", l.amount].join(";")));
    const url = URL.createObjectURL(new Blob(["\ufeff" + out.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `liasse_syscohada_${end}.csv`; a.click();
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      <div className={cn("flex-1 flex flex-col transition-all duration-300", isOpen ? "md:ml-64" : "md:ml-16")}>
        <Header />
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          <Breadcrumbs />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" /> Liasse SYSCOHADA révisé
              </h2>
              <p className="text-sm text-muted-foreground">Bilan et Compte de résultat générés depuis la balance générale.</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div><Label>Du</Label><Input type="date" value={start} onChange={e => setStart(e.target.value)} /></div>
              <div><Label>Au</Label><Input type="date" value={end} onChange={e => setEnd(e.target.value)} /></div>
              <Button variant="outline" onClick={exportCsv} disabled={!data}><Download className="h-4 w-4 mr-1" /> Export</Button>
            </div>
          </div>

          {error && <Alert variant="destructive"><AlertDescription>{(error as Error).message}</AlertDescription></Alert>}
          {isLoading && <p className="text-muted-foreground">Calcul en cours…</p>}

          {data && (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant={data.equilibre ? "default" : "destructive"} className="gap-1">
                  {data.equilibre ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  Actif {fmt(data.totalActif)} / Passif {fmt(data.totalPassif)}
                </Badge>
                <Badge variant="secondary">Résultat net : {fmt(data.resultatNet)} FCFA</Badge>
              </div>
              {data.nonMappes.length > 0 && (
                <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>
                  Comptes non rattachés à une rubrique : {data.nonMappes.map(n => `${n.account_number} (${fmt(n.solde)})`).join(", ")}
                </AlertDescription></Alert>
              )}
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="balance">Balance</TabsTrigger>
                  <TabsTrigger value="actif">Bilan actif</TabsTrigger>
                  <TabsTrigger value="passif">Bilan passif</TabsTrigger>
                  <TabsTrigger value="cr">Compte de résultat</TabsTrigger>
                  <TabsTrigger value="tft">Flux de trésorerie</TabsTrigger>
                  <TabsTrigger value="notes">Notes (détail)</TabsTrigger>
                </TabsList>
                <TabsContent value="balance"><Card><CardHeader><CardTitle>Balance générale</CardTitle><CardDescription>Chaque compte alimente la rubrique indiquée ; cliquez une rubrique pour la voir dans l'état.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><BalanceTable rows={data.rows} liasse={data} onRef={goRef} /></CardContent></Card></TabsContent>
                <TabsContent value="actif"><Card><CardHeader><CardTitle>Bilan – Actif</CardTitle><CardDescription>Au {end}</CardDescription></CardHeader><CardContent><LinesTable lines={data.actif} prev={data.n1.actif} withAmort onPick={setPicked} /></CardContent></Card></TabsContent>
                <TabsContent value="passif"><Card><CardHeader><CardTitle>Bilan – Passif</CardTitle><CardDescription>Au {end}</CardDescription></CardHeader><CardContent><LinesTable lines={data.passif} prev={data.n1.passif} onPick={setPicked} /></CardContent></Card></TabsContent>
                <TabsContent value="cr"><Card><CardHeader><CardTitle>Compte de résultat</CardTitle><CardDescription>Du {start} au {end}</CardDescription></CardHeader><CardContent><LinesTable lines={data.compteResultat} prev={data.n1.compteResultat} onPick={setPicked} /></CardContent></Card></TabsContent>
                <TabsContent value="tft"><Card><CardHeader><CardTitle>Tableau des flux de trésorerie</CardTitle><CardDescription>Méthode indirecte, du {start} au {end}</CardDescription></CardHeader><CardContent className="space-y-3">
                  {Math.abs(data.tft.ecart) >= 1 && <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>Écart de {fmt(data.tft.ecart)} FCFA avec la trésorerie du bilan (cessions ou reprises à analyser).</AlertDescription></Alert>}
                  <div className="overflow-x-auto"><TftTable lines={data.tft.lines} prev={data.tft1.lines} /></div>
                </CardContent></Card></TabsContent>
                <TabsContent value="notes"><Card><CardHeader><CardTitle>Notes annexes – détail des rubriques</CardTitle><CardDescription>Comptes composant chaque rubrique, exercice N et N-1</CardDescription></CardHeader><CardContent><Notes n={data} n1={data.n1} /></CardContent></Card></TabsContent>
              </Tabs>
              <Dialog open={!!picked} onOpenChange={o => !o && setPicked(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{picked?.ref} – {picked?.label}</DialogTitle>
                    <DialogDescription>Comptes de la balance qui composent cette rubrique</DialogDescription>
                  </DialogHeader>
                  <table className="w-full text-sm"><tbody>
                    {(picked?.detail ?? []).map(d => (
                      <tr key={d.account} className="border-b">
                        <td className="p-2 font-mono">{d.account}</td><td className="p-2">{d.name}</td>
                        <td className="p-2 text-right tabular-nums">{fmt(d.amount)}</td>
                        <td className="p-2 text-right"><Link className="text-primary underline" to={`/comptabilite/grand-livre?compte=${d.account}`}>Grand Livre</Link></td>
                      </tr>))}
                    <tr className="font-semibold"><td className="p-2" colSpan={2}>Total rubrique</td><td className="p-2 text-right tabular-nums">{fmt(picked?.net ?? 0)}</td><td /></tr>
                  </tbody></table>
                </DialogContent>
              </Dialog>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default LiasseSyscohada;
