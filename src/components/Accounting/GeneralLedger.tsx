import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAccountingLedger } from "@/hooks/useAccountingLedger";
import { useTransactions } from "@/hooks/useTransactions";
import { format, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { BookOpen, Scale, FileText, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Shield, Lock } from "lucide-react";
import { TableSkeleton } from "@/components/LoadingSkeletons";

const TRANSACTION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  recette: { label: "Recette (Vente)", color: "bg-emerald-500" },
  achat: { label: "Achat", color: "bg-blue-500" },
  salaire: { label: "Salaire", color: "bg-amber-500" },
  production: { label: "Production stockée", color: "bg-purple-500" },
  cout_vente: { label: "Coût des ventes", color: "bg-rose-500" },
  depense: { label: "Dépense", color: "bg-orange-500" },
  autre: { label: "Autre", color: "bg-muted" },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const GeneralLedger = () => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(format(subMonths(firstDayOfMonth, 1), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(today, "yyyy-MM-dd"));
  const [accountFilter, setAccountFilter] = useState("");
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [confirmValidate, setConfirmValidate] = useState(false);

  const { 
    journalEntries, 
    trialBalance, 
    isLoading, 
    totalDebit, 
    totalCredit, 
    isBalanced 
  } = useAccountingLedger(startDate, endDate);

  const { validateTransactionsBulk } = useTransactions();

  const filteredEntries = accountFilter
    ? journalEntries.filter(
        (e) =>
          e.account_number?.includes(accountFilter) ||
          e.account_name?.toLowerCase().includes(accountFilter.toLowerCase())
      )
    : journalEntries;

  const filteredBalance = accountFilter
    ? trialBalance.filter(
        (b) =>
          b.account_number?.includes(accountFilter) ||
          b.account_name?.toLowerCase().includes(accountFilter.toLowerCase())
      )
    : trialBalance;

  // Group entries by transaction to show validation status
  const txValidationMap = new Map<string, boolean>();
  journalEntries.forEach((e) => {
    // We'll check the is_validated field from the transaction data
    // For now we track unique transaction IDs
    if (e.transaction_id && !txValidationMap.has(e.transaction_id)) {
      txValidationMap.set(e.transaction_id, false);
    }
  });

  // Get unvalidated transaction IDs from entries
  const unvalidatedTxIds = [...new Set(
    filteredEntries
      .filter(e => e.transaction_id)
      .map(e => e.transaction_id)
  )];

  const toggleTxSelection = (txId: string) => {
    setSelectedTxIds(prev => {
      const next = new Set(prev);
      if (next.has(txId)) next.delete(txId);
      else next.add(txId);
      return next;
    });
  };

  const selectAllUnvalidated = () => {
    setSelectedTxIds(new Set(unvalidatedTxIds));
  };

  const handleBulkValidate = () => {
    if (selectedTxIds.size === 0) return;
    validateTransactionsBulk.mutate([...selectedTxIds], {
      onSuccess: () => {
        setSelectedTxIds(new Set());
        setConfirmValidate(false);
      },
      onSettled: () => setConfirmValidate(false),
    });
  };

  return (
    <div className="space-y-6">
      {/* Filtres et Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Débits</p>
                <p className="text-xl font-bold">{formatCurrency(totalDebit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-900">
                <TrendingDown className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Crédits</p>
                <p className="text-xl font-bold">{formatCurrency(totalCredit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isBalanced ? "bg-emerald-100 dark:bg-emerald-900" : "bg-amber-100 dark:bg-amber-900"}`}>
                {isBalanced ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Équilibre</p>
                <p className="text-xl font-bold">
                  {isBalanced ? "Équilibré" : formatCurrency(Math.abs(totalDebit - totalCredit))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Écritures</p>
                <p className="text-xl font-bold">{journalEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Date début</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Date fin</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Filtrer par compte</Label>
              <Input
                placeholder="Numéro ou nom de compte..."
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation toolbar */}
      {selectedTxIds.size > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">{selectedTxIds.size} transaction(s) sélectionnée(s)</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedTxIds(new Set())}>
                Désélectionner
              </Button>
              <Button size="sm" onClick={() => setConfirmValidate(true)}>
                <Lock className="h-4 w-4 mr-1" />
                Valider & Verrouiller
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets Journal / Balance */}
      <Card>
        <Tabs defaultValue="journal">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Grand Livre & Balance
              </CardTitle>
              <div className="flex items-center gap-2">
                {unvalidatedTxIds.length > 0 && (
                  <Button size="sm" variant="outline" onClick={selectAllUnvalidated}>
                    Tout sélectionner ({unvalidatedTxIds.length})
                  </Button>
                )}
                <TabsList>
                  <TabsTrigger value="journal" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Journal
                  </TabsTrigger>
                  <TabsTrigger value="balance" className="flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Balance
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Journal des écritures */}
            <TabsContent value="journal" className="mt-0">
              {isLoading ? (
                <TableSkeleton rows={8} columns={7} />
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune écriture comptable pour cette période</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Compte</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead className="text-right">Débit</TableHead>
                        <TableHead className="text-right">Crédit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => {
                        const typeInfo = TRANSACTION_TYPE_LABELS[entry.transaction_type] || TRANSACTION_TYPE_LABELS.autre;
                        const txId = entry.transaction_id;
                        const isSelected = txId ? selectedTxIds.has(txId) : false;
                        return (
                          <TableRow key={entry.id}>
                            <TableCell className="pr-0">
                              {txId && (
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleTxSelection(txId)}
                                />
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {entry.transaction_date
                                ? format(new Date(entry.transaction_date), "dd/MM/yyyy", { locale: fr })
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${typeInfo.color} text-white`}>
                                {typeInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="font-mono font-medium">{entry.account_number}</span>
                                {entry.account_name && (
                                  <p className="text-xs text-muted-foreground">{entry.account_name}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {entry.description || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {entry.reference || "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Balance des comptes */}
            <TabsContent value="balance" className="mt-0">
              {isLoading ? (
                <TableSkeleton rows={8} columns={6} />
              ) : filteredBalance.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun mouvement pour cette période</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Compte</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead className="text-right">Solde initial</TableHead>
                        <TableHead className="text-right">Débits période</TableHead>
                        <TableHead className="text-right">Crédits période</TableHead>
                        <TableHead className="text-right">Solde final</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBalance.map((row) => (
                        <TableRow key={row.account_number}>
                          <TableCell className="font-mono font-medium">
                            {row.account_number}
                          </TableCell>
                          <TableCell>{row.account_name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(row.opening_balance)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-emerald-600">
                            {row.period_debit > 0 ? formatCurrency(row.period_debit) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-rose-600">
                            {row.period_credit > 0 ? formatCurrency(row.period_credit) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {formatCurrency(row.closing_balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Confirmation dialog */}
      <Dialog open={confirmValidate} onOpenChange={setConfirmValidate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Valider & Verrouiller les transactions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Vous êtes sur le point de valider <strong>{selectedTxIds.size}</strong> transaction(s).
            </p>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="pt-3 text-sm space-y-1">
                <p className="font-medium text-destructive">⚠️ Action irréversible</p>
                <p>• Les transactions validées ne pourront plus être modifiées</p>
                <p>• Les écritures comptables associées seront verrouillées</p>
                <p>• Un enregistrement sera ajouté au journal d'audit</p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmValidate(false)}>Annuler</Button>
            <Button 
              onClick={handleBulkValidate}
              disabled={validateTransactionsBulk.isPending}
            >
              {validateTransactionsBulk.isPending ? "Validation..." : "Confirmer la validation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
