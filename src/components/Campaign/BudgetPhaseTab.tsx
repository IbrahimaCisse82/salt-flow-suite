import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export interface BudgetExpense {
  id: string;
  description: string;
  amount: number;
}

interface BudgetPhaseTabProps {
  phase: string;
  expenses: BudgetExpense[];
  onAddExpense: (phase: string) => void;
  onUpdateExpense: (phase: string, expenseId: string, field: 'description' | 'amount', value: string) => void;
  onDeleteExpense: (phase: string, expenseId: string) => void;
}

export const BudgetPhaseTab = ({ 
  phase, 
  expenses, 
  onAddExpense, 
  onUpdateExpense, 
  onDeleteExpense 
}: BudgetPhaseTabProps) => {
  const phaseTotal = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Dépenses prévisionnelles</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddExpense(phase)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter une dépense
        </Button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Aucune dépense ajoutée pour cette phase</p>
          <p className="text-sm mt-1">Cliquez sur "Ajouter une dépense" pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense.id} className="grid grid-cols-[1fr,auto,auto] gap-3 items-end">
              <div className="space-y-2">
                <Label htmlFor={`${phase}-${expense.id}-description`}>Description de la dépense</Label>
                <Input
                  id={`${phase}-${expense.id}-description`}
                  type="text"
                  placeholder="Ex: Frais journaliers, Carburant, Motopompes..."
                  value={expense.description}
                  onChange={(e) => onUpdateExpense(phase, expense.id, 'description', e.target.value)}
                />
              </div>
              <div className="space-y-2 w-48">
                <Label htmlFor={`${phase}-${expense.id}-amount`}>Montant (FCFA)</Label>
                <Input
                  id={`${phase}-${expense.id}-amount`}
                  type="number"
                  placeholder="0"
                  value={expense.amount || ''}
                  onChange={(e) => onUpdateExpense(phase, expense.id, 'amount', e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDeleteExpense(phase, expense.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="pt-4 border-t mt-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total de la phase</span>
          <span className="text-2xl font-bold text-primary">{phaseTotal.toLocaleString()} FCFA</span>
        </div>
      </div>
    </div>
  );
};
