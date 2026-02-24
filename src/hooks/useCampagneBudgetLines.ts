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

export interface BudgetLineWithCommitments extends BudgetLine {
  committed_amount: number;   // Engagé (PO approved/pending)
  realized_amount: number;    // Réalisé (PO received)
  paid_amount: number;        // Payé
  total_engaged: number;      // Engagé + Réalisé
  remaining_to_commit: number; // Reste à engager
  engagement_rate: number;    // Taux d'engagement %
  alert_level: number;        // 0=OK, 1=Attention, 2=Dépassement
  po_count: number;
  // Legacy alias
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

  // Récupérer les engagements par catégorie (toutes PO non annulées)
  const { data: commitmentsByCategory = [] } = useQuery({
    queryKey: ['budget-commitments', campagneId],
    enabled: !!campagneId && !!profile?.tenant_id,
    queryFn: async () => {
      if (!campagneId) return [];

      const { data, error } = await supabase
        .from('purchase_orders')
        .select('campagne_phase, expense_category, total_amount, total_paid, status')
        .eq('campagne_id', campagneId)
        .not('status', 'in', '("cancelled","rejected")')
        .is('deleted_at', null);

      if (error) {
        console.error('Error loading commitments:', error);
        return [];
      }
      return data || [];
    },
    retry: 1
  });

  // Calculer les lignes avec engagements détaillés
  const budgetLinesWithCommitments: BudgetLineWithCommitments[] = budgetLines.map(line => {
    const matchingPOs = commitmentsByCategory.filter(
      po => po.campagne_phase === line.phase && po.expense_category === line.expense_category
    );

    const committed = matchingPOs
      .filter(po => ['approved', 'pending'].includes(po.status))
      .reduce((sum, po) => sum + Number(po.total_amount || 0), 0);

    const realized = matchingPOs
      .filter(po => po.status === 'received')
      .reduce((sum, po) => sum + Number(po.total_amount || 0), 0);

    const paid = matchingPOs
      .reduce((sum, po) => sum + Number(po.total_paid || 0), 0);

    const totalEngaged = committed + realized;
    const budgeted = Number(line.budgeted_amount);
    const remaining = budgeted - totalEngaged;
    const rate = budgeted > 0 ? (totalEngaged / budgeted) * 100 : 0;
    const alertLevel = rate > 100 ? 2 : rate > 80 ? 1 : 0;

    return {
      ...line,
      budgeted_amount: budgeted,
      committed_amount: committed,
      realized_amount: realized,
      paid_amount: paid,
      total_engaged: totalEngaged,
      remaining_to_commit: remaining,
      engagement_rate: rate,
      alert_level: alertLevel,
      po_count: matchingPOs.length,
      // Legacy aliases
      spent_amount: totalEngaged,
      remaining_amount: remaining,
    };
  });

  // Obtenir les catégories budgétisées pour une phase donnée
  const getCategoriesForPhase = (phase: string): BudgetLineWithCommitments[] => {
    return budgetLinesWithCommitments.filter(line => line.phase === phase);
  };

  // Vérifier si un montant est dans le budget (engagé + réalisé + nouveau montant)
  const checkBudget = (phase: string, category: string, amount: number): { 
    allowed: boolean; 
    budgeted: number; 
    committed: number;
    realized: number;
    total_engaged: number;
    remaining: number;
    // Legacy
    spent: number;
  } => {
    const line = budgetLinesWithCommitments.find(
      l => l.phase === phase && l.expense_category === category
    );

    if (!line) {
      return { allowed: false, budgeted: 0, committed: 0, realized: 0, total_engaged: 0, remaining: 0, spent: 0 };
    }

    return {
      allowed: amount <= line.remaining_to_commit,
      budgeted: line.budgeted_amount,
      committed: line.committed_amount,
      realized: line.realized_amount,
      total_engaged: line.total_engaged,
      remaining: line.remaining_to_commit,
      spent: line.total_engaged,
    };
  };

  // Obtenir les phases qui ont des lignes budgétaires
  const phasesWithBudget = [...new Set(budgetLines.map(l => l.phase))];

  return {
    budgetLines: budgetLinesWithCommitments,
    isLoading,
    getCategoriesForPhase,
    checkBudget,
    phasesWithBudget,
  };
};
