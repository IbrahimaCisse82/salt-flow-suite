import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccountingShadow, type PostingMode } from "@/hooks/useAccountingShadow";
import { ChevronDown, ChevronRight } from "lucide-react";

const formatFCFA = (v: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v) + " FCFA";

const EVENT_LABELS: Record<string, string> = {
  sale_invoiced_local: "Vente locale",
  sale_invoiced_export: "Vente export",
  sale_cogs: "Coût des ventes",
  client_payment: "Encaissement client",
  client_advance: "Avance client",
  purchase_received_stock: "Achat stocké",
  purchase_received_service: "Achat de service",
  supplier_payment: "Règlement fournisseur",
  supplier_advance: "Avance fournisseur",
  payroll_accrual: "Charge de personnel",
  payroll_payment: "Paiement salaire",
  production_stored: "Production stockée",
  stock_loss: "Perte sur stock",
  stock_gain: "Gain sur stock",
  asset_acquisition: "Acquisition immobilisation",
  asset_disposal: "Cession immobilisation",
  depreciation: "Dotation amortissement",
  internal_transfer: "Virement interne",
  misc_expense: "Dépense diverse",
  misc_income: "Recette diverse",
};

export const ShadowEntriesPanel = () => {
  const { mode, entries, isLoading, setMode } = useAccountingShadow();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Comptabilisation automatique</CardTitle>
          <CardDescription>
            {mode === "shadow"
              ? "Mode simulation : les écritures sont calculées sans impacter le grand livre."
              : mode === "live"
                ? "Mode réel : les écritures sont enregistrées dans le grand livre."
                : "Moteur désactivé : aucune écriture automatique."}
          </CardDescription>
        </div>
        <Select value={mode} onValueChange={(v) => setMode.mutate(v as PostingMode)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="off">Désactivé</SelectItem>
            <SelectItem value="shadow">Simulation</SelectItem>
            <SelectItem value="live">Réel</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {mode !== "shadow" ? (
          <p className="text-sm text-muted-foreground">
            Les écritures simulées ne sont générées qu'en mode simulation.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune écriture simulée pour l'instant. Enregistre une vente, un achat ou une paie pour voir le
            moteur en action.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Date</TableHead>
                <TableHead>Événement</TableHead>
                <TableHead>Journal</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <>
                  <TableRow
                    key={e.id}
                    className="cursor-pointer"
                    onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                  >
                    <TableCell>
                      {expanded === e.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell>{new Date(e.entry_date).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{EVENT_LABELS[e.event_type] ?? e.event_type}</Badge>
                    </TableCell>
                    <TableCell>{e.journal_code}</TableCell>
                    <TableCell className="text-right font-medium">{formatFCFA(e.total_amount)}</TableCell>
                  </TableRow>
                  {expanded === e.id && (
                    <TableRow key={`${e.id}-lines`}>
                      <TableCell colSpan={5} className="bg-muted/40">
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">{e.description}</p>
                          {e.lines.map((l, i) => (
                            <div key={i} className="grid grid-cols-4 gap-2">
                              <span className="font-mono">{l.account}</span>
                              <span className="text-muted-foreground">{l.label}</span>
                              <span className="text-right">{l.debit ? formatFCFA(l.debit) : ""}</span>
                              <span className="text-right">{l.credit ? formatFCFA(l.credit) : ""}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};