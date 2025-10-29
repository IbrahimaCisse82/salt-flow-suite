import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Building2, CheckCircle, AlertCircle, Upload, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reconciled: boolean;
}

export const BankReconciliation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [bankBalance, setBankBalance] = useState("");
  const [reconciliationDate, setReconciliationDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Récupérer les transactions bancaires non rapprochées
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['bank-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .in('transaction_type', ['virement_interne', 'vente_locale', 'vente_export'])
        .order('transaction_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Simuler des transactions avec statut de rapprochement
      return (data || []).map((tx, index) => ({
        id: tx.id,
        date: tx.transaction_date || new Date().toISOString().split('T')[0],
        description: tx.description || 'Transaction',
        amount: Number(tx.amount || 0),
        type: (Number(tx.amount || 0) > 0 ? 'credit' : 'debit') as 'debit' | 'credit',
        reconciled: index % 3 === 0 // Simuler quelques transactions déjà rapprochées
      }));
    }
  });

  // Mutation pour rapprocher des transactions
  const reconcileMutation = useMutation({
    mutationFn: async (transactionIds: string[]) => {
      // Simuler le rapprochement (à remplacer par une vraie logique)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Marquer les transactions comme rapprochées
      const { error } = await supabase
        .from('transactions')
        .update({ notes: `Rapproché le ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}` })
        .in('id', transactionIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      setSelectedTransactions([]);
      toast({
        title: "Rapprochement effectué",
        description: `${selectedTransactions.length} transaction(s) rapprochée(s)`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le rapprochement",
        variant: "destructive"
      });
    }
  });

  const handleToggleTransaction = (txId: string) => {
    setSelectedTransactions(prev =>
      prev.includes(txId)
        ? prev.filter(id => id !== txId)
        : [...prev, txId]
    );
  };

  const handleReconcile = () => {
    if (selectedTransactions.length === 0) {
      toast({
        title: "Aucune sélection",
        description: "Veuillez sélectionner au moins une transaction",
        variant: "destructive"
      });
      return;
    }

    if (!bankBalance) {
      toast({
        title: "Solde manquant",
        description: "Veuillez saisir le solde bancaire",
        variant: "destructive"
      });
      return;
    }

    reconcileMutation.mutate(selectedTransactions);
  };

  const unreconciledTransactions = transactions.filter(tx => !tx.reconciled);
  const reconciledTransactions = transactions.filter(tx => tx.reconciled);

  const totalUnreconciledDebits = unreconciledTransactions
    .filter(tx => tx.type === 'debit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalUnreconciledCredits = unreconciledTransactions
    .filter(tx => tx.type === 'credit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const bookBalance = totalUnreconciledCredits - totalUnreconciledDebits;
  const difference = bankBalance ? parseFloat(bankBalance) - bookBalance : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Rapprochement Bancaire
        </CardTitle>
        <CardDescription>
          Comparez et rapprochez vos écritures comptables avec vos relevés bancaires
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulaire de rapprochement */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
          <div className="space-y-2">
            <Label htmlFor="reconciliationDate">Date de rapprochement</Label>
            <Input
              id="reconciliationDate"
              type="date"
              value={reconciliationDate}
              onChange={(e) => setReconciliationDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bankBalance">Solde bancaire (relevé)</Label>
            <Input
              id="bankBalance"
              type="number"
              step="0.01"
              value={bankBalance}
              onChange={(e) => setBankBalance(e.target.value)}
              placeholder="0.00 FCFA"
            />
          </div>

          <div className="space-y-2">
            <Label>Solde comptable</Label>
            <div className="h-10 px-3 rounded-md border bg-muted flex items-center">
              <span className="font-semibold">
                {bookBalance.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </div>

        {/* Écart */}
        {bankBalance && (
          <div className={`p-4 rounded-lg ${
            Math.abs(difference) < 0.01
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-orange-500/10 border border-orange-500/20'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Math.abs(difference) < 0.01 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
                <span className="font-medium">
                  {Math.abs(difference) < 0.01 ? 'Rapprochement équilibré' : 'Écart détecté'}
                </span>
              </div>
              <span className={`text-xl font-bold ${
                Math.abs(difference) < 0.01 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {difference.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Non rapprochées</p>
            <p className="text-lg font-bold">{unreconciledTransactions.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Rapprochées</p>
            <p className="text-lg font-bold text-green-600">{reconciledTransactions.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Débits</p>
            <p className="text-lg font-bold text-destructive">
              {totalUnreconciledDebits.toLocaleString()} FCFA
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Crédits</p>
            <p className="text-lg font-bold text-green-600">
              {totalUnreconciledCredits.toLocaleString()} FCFA
            </p>
          </div>
        </div>

        {/* Liste des transactions non rapprochées */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Transactions à rapprocher</h4>
            <Button
              onClick={handleReconcile}
              disabled={selectedTransactions.length === 0 || reconcileMutation.isPending}
              size="sm"
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Rapprocher ({selectedTransactions.length})
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : unreconciledTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Toutes les transactions sont rapprochées
            </div>
          ) : (
            <div className="space-y-2">
              {unreconciledTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedTransactions.includes(tx.id)}
                      onCheckedChange={() => handleToggleTransaction(tx.id)}
                    />
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(tx.date), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={tx.type === 'credit' ? 'default' : 'secondary'}>
                      {tx.type === 'credit' ? 'Crédit' : 'Débit'}
                    </Badge>
                    <span className={`font-bold ${
                      tx.type === 'credit' ? 'text-green-600' : 'text-destructive'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
