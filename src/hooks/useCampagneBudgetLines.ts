import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BudgetLine {
  id: string;
  campagne_id: string;
  phase: string;
  expense_category: string;
  budgeted_amount: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetLineWithSpent extends BudgetLine {
  spent_amount: number;
  remaining_amount: number;
}

export const useCampagneBudgetLines = (campagneId?: string) => {
  const { profile } = useAuth();

  const { data: budgetLines = [], isLoading } = useQuery({
    queryKey: ['campagne-budget-lines', campagneId],
    enabled: !!campagneId && !!profile?.tenant_id,
    queryFn: async () => {
      if (!campagneId) return [];

      const { data, error } = await supabase
        .from('campagne_budget_lines')
        .select('*')
        .eq('campagne_id', campagneId)
        .order('phase')
        .order('expense_category');

      if (error) {
        console.error('Error loading budget lines:', error);
        return [];
      }
      return data as BudgetLine[];
    },
    retry: 1
  });

  // Récupérer les montants déjà engagés par commande d'achat (non annulées)
  const { data: spentByCategory = [] } = useQuery({
    queryKey: ['budget-spent', campagneId],
    enabled: !!campagneId && !!profile?.tenant_id,
    queryFn: async () => {
      if (!campagneId) return [];

      const { data, error } = await supabase
        .from('purchase_orders')
        .select('campagne_phase, expense_category, total_amount, status')
        .eq('campagne_id', campagneId)
        .not('status', 'in', '("cancelled","rejected")')
        .is('deleted_at', null);

      if (error) {
        console.error('Error loading spent amounts:', error);
        return [];
      }
      return data || [];
    },
    retry: 1
  });

  // Calculer les lignes avec montants dépensés
  const budgetLinesWithSpent: BudgetLineWithSpent[] = budgetLines.map(line => {
    const spent = spentByCategory
      .filter(po => po.campagne_phase === line.phase && po.expense_category === line.expense_category)
      .reduce((sum, po) => sum + Number(po.total_amount || 0), 0);

    return {
      ...line,
      budgeted_amount: Number(line.budgeted_amount),
      spent_amount: spent,
      remaining_amount: Number(line.budgeted_amount) - spent,
    };
  });

  // Obtenir les catégories budgétisées pour une phase donnée
  const getCategoriesForPhase = (phase: string): BudgetLineWithSpent[] => {
    return budgetLinesWithSpent.filter(line => line.phase === phase);
  };

  // Vérifier si un montant est dans le budget
  const checkBudget = (phase: string, category: string, amount: number): { 
    allowed: boolean; 
    budgeted: number; 
    spent: number; 
    remaining: number 
  } => {
    const line = budgetLinesWithSpent.find(
      l => l.phase === phase && l.expense_category === category
    );

    if (!line) {
      return { allowed: false, budgeted: 0, spent: 0, remaining: 0 };
    }

    return {
      allowed: amount <= line.remaining_amount,
      budgeted: line.budgeted_amount,
      spent: line.spent_amount,
      remaining: line.remaining_amount,
    };
  };

  // Obtenir les phases qui ont des lignes budgétaires
  const phasesWithBudget = [...new Set(budgetLines.map(l => l.phase))];

  return {
    budgetLines: budgetLinesWithSpent,
    isLoading,
    getCategoriesForPhase,
    checkBudget,
    phasesWithBudget,
  };
};
