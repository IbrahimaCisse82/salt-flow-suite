import { Fragment, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccountingShadow, type PostingMode } from "@/hooks/useAccountingShadow";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { profileRoles } from "@/utils/permissions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { mode, entries, isLoading, setMode, validate, reject } = useAccountingShadow();
  const { profile } = useAuth();
  const roles = profileRoles(profile);
  const canReview = roles.some((r) => ["gerant", "comptable", "admin"].includes(r));
  const canSwitch = roles.some((r) => ["gerant", "admin"].includes(r));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmLive, setConfirmLive] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <Card id="ecritures-en-attente">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Comptabilisation automatique</CardTitle>
          <CardDescription>
            {mode === "shadow"
              ? "Mode « en attente » : chaque opération prépare une écriture, qui n'entre au Grand Livre qu'après validation."
              : "Mode définitif : les écritures entrent directement au Grand Livre."}
          </CardDescription>
        </div>
        <Select value={mode} disabled={!canSwitch}
          onValueChange={(v) => (v === "live" ? setConfirmLive(true) : setMode.mutate(v as PostingMode))}>
          <SelectTrigger className="w-[180px]" aria-label="Mode comptable">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="shadow">En attente</SelectItem>
            <SelectItem value="live">Définitif</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {entries.length > 0 && canReview && (
          <div className="flex flex-wrap gap-2 mb-3">
            <Button size="sm" className="min-h-11" disabled={validate.isPending}
              onClick={() => validate.mutate(null, { onSuccess: () => setSelected([]) })}>
              Valider tout ({entries.length})
            </Button>
            <Button size="sm" variant="outline" className="min-h-11" disabled={!selected.length || validate.isPending}
              onClick={() => validate.mutate(selected, { onSuccess: () => setSelected([]) })}>
              Valider la sélection ({selected.length})
            </Button>
            <Button size="sm" variant="destructive" className="min-h-11" disabled={!selected.length}
              onClick={() => setRejectOpen(true)}>
              Rejeter ({selected.length})
            </Button>
          </div>
        )}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune écriture en attente.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead className="w-8" />
                <TableHead>Date</TableHead>
                <TableHead>Événement</TableHead>
                <TableHead>Journal</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <Fragment key={e.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                  >
                    <TableCell onClick={(ev) => ev.stopPropagation()}>
                      <Checkbox aria-label="Sélectionner" checked={selected.includes(e.id)} onCheckedChange={() => toggle(e.id)} />
                    </TableCell>
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
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/40">
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
                </Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <AlertDialog open={confirmLive} onOpenChange={setConfirmLive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Passer en mode définitif ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les prochaines opérations entreront directement au Grand Livre, sans validation. Une écriture définitive ne peut plus être modifiée, seulement corrigée par une écriture inverse. Les écritures déjà en attente restent à valider.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => setMode.mutate("live")}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter {selected.length} écriture(s)</AlertDialogTitle>
            <AlertDialogDescription>Indiquez le motif du rejet (obligatoire).</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif du rejet" />
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={!reason.trim()}
              onClick={() => reject.mutate({ ids: selected, reason }, { onSuccess: () => { setSelected([]); setReason(""); } })}>
              Rejeter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};