import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFixedAssets } from "@/hooks/useFixedAssets";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingDown, Loader2 } from "lucide-react";

export const AssetDepreciationChart = () => {
  const { assets, isLoading, totalAcquisition, totalVNC, totalAmort } = useFixedAssets();

  const chartData = useMemo(() => {
    const activeAssets = assets.filter(a => a.status === "active");
    if (activeAssets.length === 0) return [];

    // Build yearly projection based on acquisition dates and useful life
    const years = new Map<number, { acquisition: number; vnc: number; amortissement: number }>();

    activeAssets.forEach(asset => {
      const startYear = new Date(asset.acquisition_date).getFullYear();
      const lifeYears = asset.useful_life_years || 5;
      const cost = asset.acquisition_cost;
      const residual = asset.residual_value || 0;
      const annualDepr = (cost - residual) / lifeYears;

      for (let y = 0; y <= lifeYears; y++) {
        const year = startYear + y;
        const existing = years.get(year) || { acquisition: 0, vnc: 0, amortissement: 0 };
        const cumulDepr = Math.min(annualDepr * y, cost - residual);
        existing.acquisition += cost;
        existing.vnc += cost - cumulDepr;
        existing.amortissement += cumulDepr;
        years.set(year, existing);
      }
    });

    return Array.from(years.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, values]) => ({
        year: year.toString(),
        "Valeur brute": Math.round(values.acquisition),
        VNC: Math.round(values.vnc),
        "Amortissements cumulés": Math.round(values.amortissement),
      }));
  }, [assets]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const depreciationRate = totalAcquisition > 0 ? Math.round((totalAmort / totalAcquisition) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Évolution VNC des immobilisations
        </CardTitle>
        <CardDescription>
          Projection de la valeur nette comptable sur la durée de vie des actifs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Valeur brute</p>
            <p className="text-lg font-bold">{totalAcquisition.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">FCFA</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">VNC actuelle</p>
            <p className="text-lg font-bold text-primary">{totalVNC.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">FCFA</p>
          </div>
          <div className="rounded-lg bg-destructive/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">Taux d'amortissement</p>
            <p className="text-lg font-bold text-destructive">{depreciationRate}%</p>
            <p className="text-xs text-muted-foreground">cumulé</p>
          </div>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="year" className="text-xs" />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} className="text-xs" />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString()} FCFA`}
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Valeur brute"
                stackId="1"
                stroke="hsl(var(--muted-foreground))"
                fill="hsl(var(--muted))"
                fillOpacity={0.4}
              />
              <Area
                type="monotone"
                dataKey="VNC"
                stackId="2"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="Amortissements cumulés"
                stackId="3"
                stroke="hsl(var(--destructive))"
                fill="hsl(var(--destructive))"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Aucune immobilisation active trouvée
          </div>
        )}
      </CardContent>
    </Card>
  );
};
