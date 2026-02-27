import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { BarChart3, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ProfitabilityChart = () => {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["profitability-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("transaction_type, amount, transaction_date")
        .order("transaction_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: campagnes = [] } = useQuery({
    queryKey: ["profitability-campagnes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campagnes")
        .select("id, name, year, start_date, end_date")
        .order("year", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const chartData = useMemo(() => {
    if (campagnes.length === 0) {
      // Fallback: group by month
      const months = new Map<string, { produits: number; charges: number }>();

      transactions.forEach((t) => {
        const d = new Date(t.transaction_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const existing = months.get(key) || { produits: 0, charges: 0 };
        const amount = Number(t.amount || 0);

        if (["vente_locale", "vente_export", "recette"].includes(t.transaction_type)) {
          existing.produits += amount;
        } else if (["depense", "achat", "salaire"].includes(t.transaction_type)) {
          existing.charges += amount;
        }
        months.set(key, existing);
      });

      return Array.from(months.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, v]) => ({
          name: new Date(month + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
          Produits: v.produits,
          Charges: v.charges,
          "Résultat net": v.produits - v.charges,
        }));
    }

    return campagnes.map((c) => {
      const start = c.start_date ? new Date(c.start_date) : null;
      const end = c.end_date ? new Date(c.end_date) : null;

      let produits = 0;
      let charges = 0;

      transactions.forEach((t) => {
        const d = new Date(t.transaction_date);
        if (start && d < start) return;
        if (end && d > end) return;

        const amount = Number(t.amount || 0);
        if (["vente_locale", "vente_export", "recette"].includes(t.transaction_type)) {
          produits += amount;
        } else if (["depense", "achat", "salaire"].includes(t.transaction_type)) {
          charges += amount;
        }
      });

      return {
        name: c.name || `Campagne ${c.year}`,
        Produits: produits,
        Charges: charges,
        "Résultat net": produits - charges,
      };
    });
  }, [transactions, campagnes]);

  const totalProduits = chartData.reduce((s, d) => s + d.Produits, 0);
  const totalCharges = chartData.reduce((s, d) => s + d.Charges, 0);
  const totalNet = totalProduits - totalCharges;
  const margin = totalProduits > 0 ? Math.round((totalNet / totalProduits) * 100) : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Rentabilité {campagnes.length > 0 ? "par campagne" : "mensuelle"}
            </CardTitle>
            <CardDescription>Produits vs charges avec résultat net</CardDescription>
          </div>
          <Badge variant={totalNet >= 0 ? "default" : "destructive"}>
            Marge: {margin}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} className="text-xs" />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString()} FCFA`}
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
              />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Bar dataKey="Produits" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Charges" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Résultat net" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Aucune donnée financière disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
};
