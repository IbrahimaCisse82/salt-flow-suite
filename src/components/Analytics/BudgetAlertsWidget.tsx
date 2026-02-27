import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface BudgetLine {
  phase: string;
  expense_category: string;
  budgeted_amount: number;
  campagne_id: string;
}

interface PurchaseOrder {
  expense_category: string | null;
  total_amount: number | null;
  status: string | null;
  campagne_id: string | null;
}

export const BudgetAlertsWidget = () => {
  const { data: budgetLines = [], isLoading: linesLoading } = useQuery({
    queryKey: ["budget-alerts-lines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campagne_budget_lines")
        .select("phase, expense_category, budgeted_amount, campagne_id");
      if (error) throw error;
      return (data as BudgetLine[]) || [];
    },
  });

  const { data: purchaseOrders = [], isLoading: poLoading } = useQuery({
    queryKey: ["budget-alerts-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("expense_category, total_amount, status, campagne_id")
        .neq("status", "cancelled");
      if (error) throw error;
      return (data as PurchaseOrder[]) || [];
    },
  });

  const alerts = useMemo(() => {
    // Aggregate budget by category
    const categoryBudgets = new Map<string, { budgeted: number; spent: number; campagne_id: string }>();

    budgetLines.forEach((line) => {
      const key = `${line.campagne_id}::${line.expense_category}`;
      const existing = categoryBudgets.get(key) || {
        budgeted: 0,
        spent: 0,
        campagne_id: line.campagne_id,
      };
      existing.budgeted += line.budgeted_amount;
      categoryBudgets.set(key, existing);
    });

    purchaseOrders.forEach((po) => {
      if (!po.expense_category || !po.campagne_id) return;
      const key = `${po.campagne_id}::${po.expense_category}`;
      const existing = categoryBudgets.get(key);
      if (existing) {
        existing.spent += Number(po.total_amount || 0);
      }
    });

    return Array.from(categoryBudgets.entries())
      .map(([key, val]) => {
        const category = key.split("::")[1] || "Autre";
        const rate = val.budgeted > 0 ? (val.spent / val.budgeted) * 100 : 0;
        const level: "safe" | "warning" | "danger" =
          rate >= 100 ? "danger" : rate >= 80 ? "warning" : "safe";

        return {
          category,
          budgeted: val.budgeted,
          spent: val.spent,
          rate: Math.round(rate),
          remaining: val.budgeted - val.spent,
          level,
        };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [budgetLines, purchaseOrders]);

  const isLoading = linesLoading || poLoading;
  const dangerCount = alerts.filter((a) => a.level === "danger").length;
  const warningCount = alerts.filter((a) => a.level === "warning").length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const levelConfig = {
    danger: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", progressColor: "bg-destructive" },
    warning: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", progressColor: "bg-orange-500" },
    safe: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-500/10", progressColor: "bg-primary" },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertes budgétaires
            </CardTitle>
            <CardDescription>Suivi des engagements par catégorie de dépenses</CardDescription>
          </div>
          <div className="flex gap-2">
            {dangerCount > 0 && (
              <Badge variant="destructive">{dangerCount} dépassement{dangerCount > 1 ? "s" : ""}</Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="border-orange-500 text-orange-500">
                {warningCount} alerte{warningCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {alerts.map((alert, i) => {
              const config = levelConfig[alert.level];
              const Icon = config.icon;

              return (
                <div key={i} className={`rounded-lg p-3 ${config.bg} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                      <span className="font-medium text-sm">{alert.category}</span>
                    </div>
                    <span className={`text-sm font-bold ${config.color}`}>{alert.rate}%</span>
                  </div>
                  <Progress value={Math.min(alert.rate, 100)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Dépensé: {alert.spent.toLocaleString()} FCFA</span>
                    <span>Budget: {alert.budgeted.toLocaleString()} FCFA</span>
                  </div>
                  {alert.remaining < 0 && (
                    <p className="text-xs font-medium text-destructive">
                      Dépassement de {Math.abs(alert.remaining).toLocaleString()} FCFA
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Aucune ligne budgétaire configurée
          </div>
        )}
      </CardContent>
    </Card>
  );
};
