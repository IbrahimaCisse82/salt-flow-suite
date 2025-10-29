import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Droplets, Layers, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";

interface BassinYield {
  bassin_name: string;
  total_production: number;
  area: number;
  yield_per_ha: number;
  quality_score: number;
}

export const YieldAnalysis = () => {
  // Récupérer les données de production par bassin avec analyse
  const { data: yieldData = [], isLoading } = useQuery<BassinYield[]>({
    queryKey: ['yield-analysis'],
    queryFn: async () => {
      const { data: productionData, error: prodError } = await supabase
        .from('production_records')
        .select(`
          quantity,
          quality_grade,
          bassin:bassins(id, name, area)
        `)
        .order('production_date', { ascending: false });

      if (prodError) throw prodError;

      // Agréger les données par bassin
      const bassinMap = new Map<string, { total: number; area: number; qualities: string[] }>();
      
      (productionData || []).forEach(record => {
        const bassinName = record.bassin?.name || 'Inconnu';
        const bassinArea = Number(record.bassin?.area || 0);
        const quantity = Number(record.quantity || 0);
        
        if (!bassinMap.has(bassinName)) {
          bassinMap.set(bassinName, { total: 0, area: bassinArea, qualities: [] });
        }
        
        const current = bassinMap.get(bassinName)!;
        current.total += quantity;
        if (record.quality_grade) {
          current.qualities.push(record.quality_grade);
        }
      });

      // Calculer les rendements et scores de qualité
      return Array.from(bassinMap.entries()).map(([name, data]) => {
        const yieldPerHa = data.area > 0 ? data.total / data.area : 0;
        
        // Calculer un score de qualité (A+ = 3, A = 2, B = 1)
        const qualityScore = data.qualities.length > 0
          ? data.qualities.reduce((sum, q) => {
              if (q === 'A+') return sum + 3;
              if (q === 'A') return sum + 2;
              return sum + 1;
            }, 0) / data.qualities.length
          : 0;

        return {
          bassin_name: name,
          total_production: data.total,
          area: data.area,
          yield_per_ha: yieldPerHa,
          quality_score: qualityScore
        };
      }).sort((a, b) => b.yield_per_ha - a.yield_per_ha);
    }
  });

  // Calculer les statistiques globales
  const avgYield = yieldData.length > 0
    ? yieldData.reduce((sum, b) => sum + b.yield_per_ha, 0) / yieldData.length
    : 0;

  const bestPerformer = yieldData[0];
  const worstPerformer = yieldData[yieldData.length - 1];

  const avgQualityScore = yieldData.length > 0
    ? yieldData.reduce((sum, b) => sum + b.quality_score, 0) / yieldData.length
    : 0;

  const getQualityLabel = (score: number) => {
    if (score >= 2.5) return { label: "Excellent", color: "text-green-600" };
    if (score >= 2) return { label: "Bon", color: "text-primary" };
    return { label: "Moyen", color: "text-orange-600" };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Analyse de Rendement Production
          </CardTitle>
          <CardDescription>
            Analyse comparative des performances par bassin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : yieldData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune donnée de production disponible
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Rendement moyen</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {avgYield.toFixed(2)} t/ha
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Meilleur bassin</span>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {bestPerformer?.bassin_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bestPerformer?.yield_per_ha.toFixed(2)} t/ha
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-5 w-5 text-accent" />
                    <span className="text-sm font-medium">Qualité moyenne</span>
                  </div>
                  <p className={`text-2xl font-bold ${getQualityLabel(avgQualityScore).color}`}>
                    {getQualityLabel(avgQualityScore).label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Score: {avgQualityScore.toFixed(1)}/3
                  </p>
                </div>
              </div>

              {/* Graphique de rendement */}
              <div className="mb-6">
                <h4 className="font-semibold mb-4">Rendement par bassin (tonnes/hectare)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={yieldData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="bassin_name"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      label={{ value: 't/ha', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)} t/ha`, 'Rendement']}
                    />
                    <Bar dataKey="yield_per_ha" fill="hsl(var(--primary))" name="Rendement" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tableau détaillé */}
              <div>
                <h4 className="font-semibold mb-4">Détail par bassin</h4>
                <div className="space-y-2">
                  {yieldData.map((bassin, index) => {
                    const isTop = index === 0;
                    const isBottom = index === yieldData.length - 1;
                    const quality = getQualityLabel(bassin.quality_score);
                    
                    return (
                      <div
                        key={bassin.bassin_name}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            isTop ? 'bg-green-500/10' : isBottom ? 'bg-orange-500/10' : 'bg-muted'
                          }`}>
                            {isTop ? (
                              <TrendingUp className="h-5 w-5 text-green-600" />
                            ) : isBottom ? (
                              <TrendingDown className="h-5 w-5 text-orange-600" />
                            ) : (
                              <Droplets className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{bassin.bassin_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Surface: {bassin.area} ha • Production: {bassin.total_production.toFixed(1)} t
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-primary">
                              {bassin.yield_per_ha.toFixed(2)} t/ha
                            </p>
                            <p className={`text-sm font-medium ${quality.color}`}>
                              {quality.label}
                            </p>
                          </div>
                          {isTop && (
                            <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">
                              Top
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
