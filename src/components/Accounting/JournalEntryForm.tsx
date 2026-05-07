import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, AlertCircle, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Comptes SYSCOHADA protégés - ne peuvent pas être mouvementés via les écritures diverses
const RESTRICTED_ACCOUNT_PREFIXES = [
  { prefix: "101", label: "Capital social", reason: "Seules les opérations d'augmentation/réduction de capital sont autorisées" },
  { prefix: "102", label: "Capital par dotation", reason: "Réservé aux entités publiques, mouvementé uniquement par dotation" },
  { prefix: "103", label: "Capital personnel", reason: "Mouvementé automatiquement lors de la clôture (virement 104→103)" },
  { prefix: "11", label: "Réserves", reason: "Mouvementé uniquement par affectation du résultat" },
  { prefix: "13", label: "Résultat de l'exercice", reason: "Alimenté automatiquement par la clôture d'exercice (classes 6 et 7)" },
];

const isAccountRestricted = (accountNumber: string): string | null => {
  for (const restricted of RESTRICTED_ACCOUNT_PREFIXES) {
    if (accountNumber.startsWith(restricted.prefix)) {
      return `${restricted.label} (${accountNumber}) : ${restricted.reason}`;
    }
  }
  return null;
};

interface JournalLine {
  id: string;
  accountId: string;
  accountNumber: string;
  accountName: string;
  debit: string;
  credit: string;
  description: string;
}

interface JournalEntryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const JournalEntryForm = ({ onSuccess, onCancel }: JournalEntryFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([
    {
      id: "1",
      accountId: "",
      accountNumber: "",
      accountName: "",
      debit: "",
      credit: "",
      description: ""
    }
  ]);

  // Récupérer le plan comptable (exclure les comptes protégés)
  const { data: chartOfAccounts = [] } = useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_number');
      
      if (error) throw error;
      return (data || []).filter(acc => !isAccountRestricted(acc.account_number));
    }
  });

  const addLine = () => {
    setLines([...lines, {
      id: Date.now().toString(),
      accountId: "",
      accountNumber: "",
      accountName: "",
      debit: "",
      credit: "",
      description: ""
    }]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(line => line.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof JournalLine, value: string) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value };
        
        // Si on change le compte, mettre à jour les infos du compte
        if (field === 'accountId') {
          const account = chartOfAccounts.find(acc => acc.id === value);
          if (account) {
            updated.accountNumber = account.account_number;
            updated.accountName = account.account_name;
          }
        }
        
        // Si on entre un débit, vider le crédit et vice versa
        if (field === 'debit' && value) {
          updated.credit = "";
        } else if (field === 'credit' && value) {
          updated.debit = "";
        }
        
        return updated;
      }
      return line;
    }));
  };

  const calculateTotals = () => {
    const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    return { totalDebit, totalCredit, difference: totalDebit - totalCredit };
  };

  const saveJournalEntry = useMutation({
    mutationFn: async () => {
      const { totalDebit, totalCredit, difference } = calculateTotals();
      
      if (Math.abs(difference) > 0.01) {
        throw new Error('Les débits et crédits doivent être équilibrés');
      }

      if (!date) {
        throw new Error('La date est obligatoire');
      }

      // Get tenant_id from profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile) throw new Error('Profile not found');

      // Créer la transaction principale
      // Pour les écritures diverses, on utilise le premier compte comme référence
      const firstAccount = lines.find(line => line.accountId);
      if (!firstAccount) {
        throw new Error('Au moins un compte doit être spécifié');
      }

      // Générer le numéro de document avec code journal OD
      const journalCode = 'OD';
      const dateFormatted = date.replace(/-/g, '');
      
      // Compter les transactions du même type pour la même date
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: false })
        .eq('tenant_id', profile.tenant_id)
        .eq('journal_code', journalCode)
        .eq('transaction_date', date);
      
      const sequenceNumber = String((existingTx?.length || 0) + 1).padStart(3, '0');
      const documentNumber = `${journalCode}${dateFormatted}${sequenceNumber}`;

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          tenant_id: profile.tenant_id,
          transaction_type: 'od',
          journal_code: journalCode,
          transaction_date: date,
          amount: totalDebit,
          description: notes || 'Écriture diverse',
          reference: documentNumber,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Créer les lignes d'écriture
      const journalEntries = lines
        .filter(line => line.accountId && (parseFloat(line.debit) > 0 || parseFloat(line.credit) > 0))
        .map(line => ({
          tenant_id: profile.tenant_id,
          transaction_id: transaction.id,
          account_id: line.accountId,
          account_number: line.accountNumber || null,
          account_name: line.accountName || null,
          debit: parseFloat(line.debit) || 0,
          credit: parseFloat(line.credit) || 0,
          description: line.description || notes
        }));

      if (journalEntries.length === 0) {
        throw new Error('Au moins une ligne d\'écriture est requise');
      }

      const { error: entriesError } = await supabase
        .from('journal_entries')
        .insert(journalEntries);

      if (entriesError) throw entriesError;

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      toast({
        title: "Écriture enregistrée",
        description: "L'écriture diverse a été enregistrée avec succès",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const { totalDebit, totalCredit, difference } = calculateTotals();
  const isBalanced = Math.abs(difference) < 0.01;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="entry-date">Date *</Label>
          <Input
            id="entry-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="entry-reference">Référence (générée automatiquement)</Label>
          <Input
            id="entry-reference"
            placeholder="Auto: OD{DATE}{NUM}"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            disabled
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="entry-notes">Notes / Libellé</Label>
        <Textarea
          id="entry-notes"
          placeholder="Description de l'écriture diverse"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Comptes protégés SYSCOHADA :</strong> Les comptes de capital (101-103), réserves (11) et résultat (13) ne sont pas accessibles ici. Ils sont mouvementés automatiquement par les procédures de clôture et d'affectation du résultat.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Lignes d'écriture</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLine}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter une ligne
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((line, index) => (
            <div key={line.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Ligne {index + 1}
                </span>
                {lines.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLine(line.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>Compte comptable *</Label>
                  <Select
                    value={line.accountId}
                    onValueChange={(value) => updateLine(line.id, 'accountId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un compte" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {chartOfAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {account.account_number} - {account.account_name}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {account.account_type}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Débit (FCFA)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={line.debit}
                    onChange={(e) => updateLine(line.id, 'debit', e.target.value)}
                    disabled={!!line.credit}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Crédit (FCFA)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={line.credit}
                    onChange={(e) => updateLine(line.id, 'credit', e.target.value)}
                    disabled={!!line.debit}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Description de la ligne</Label>
                  <Input
                    placeholder="Description optionnelle"
                    value={line.description}
                    onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Total Débit</span>
              <span className="font-bold">{totalDebit.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Total Crédit</span>
              <span className="font-bold">{totalCredit.toLocaleString()} FCFA</span>
            </div>
            <div className={`flex justify-between items-center text-sm font-bold ${
              isBalanced ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>Différence</span>
              <span>{difference.toLocaleString()} FCFA</span>
            </div>
          </div>

          {!isBalanced && totalDebit > 0 && totalCredit > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Les débits et crédits doivent être équilibrés pour enregistrer l'écriture
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Annuler
        </Button>
        <Button
          type="button"
          className="flex-1 bg-gradient-to-r from-primary to-accent"
          onClick={() => saveJournalEntry.mutate()}
          disabled={!isBalanced || !date || lines.every(l => !l.accountId)}
        >
          Enregistrer l'écriture
        </Button>
      </div>
    </div>
  );
};
