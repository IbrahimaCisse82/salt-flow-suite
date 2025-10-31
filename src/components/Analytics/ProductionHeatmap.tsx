import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface BassinPerformance {
  bassin_id: string;
  bassin_name: string;
  bassin_code: string;
  total_production: number;
  avg_quality: number;
  records_count: number;
}

export const ProductionHeatmap = () => {
  const { profile } = useAuth();

  const { data: performance, isLoading } = useQuery({
    queryKey: ['bassin-performance', profile?.tenant_id],
    queryFn: async (): Promise<BassinPerformance[]> => {
      if (!profile?.tenant_id) return [];

      // Récupérer les données de production par bassin
      const { data: records, error } = await supabase
        .from('production_records')
        .select(`
          bassin_id,
          quantity,
          quality_grade,
          bassins (
            name,
            code
          )
        `)
        .gte('production_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Grouper par bassin
      const bassinMap = new Map<string, BassinPerformance>();
      
      records?.forEach((record: any) => {
        if (!record.bassin_id) return;
        
        const key = record.bassin_id;
        const existing = bassinMap.get(key);
        
        if (existing) {
          existing.total_production += Number(record.quantity || 0);
          existing.avg_quality = (existing.avg_quality * existing.records_count + Number(record.quality_grade || 0)) / (existing.records_count + 1);
          existing.records_count += 1;
        } else {
          bassinMap.set(key, {
            bassin_id: record.bassin_id,
            bassin_name: record.bassins?.name || 'Bassin inconnu',
            bassin_code: record.bassins?.code || 'N/A',
            total_production: Number(record.quantity || 0),
            avg_quality: Number(record.quality_grade || 0),
            records_count: 1
          });
        }
      });

      return Array.from(bassinMap.values()).sort((a, b) => b.total_production - a.total_production);
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });

  // Fonction pour obtenir la couleur selon la performance
  const getPerformanceColor = (production: number, maxProduction: number) => {
    const ratio = production / maxProduction;
    if (ratio >= 0.8) return 'bg-green-500/80 hover:bg-green-500';
    if (ratio >= 0.6) return 'bg-lime-500/80 hover:bg-lime-500';
    if (ratio >= 0.4) return 'bg-yellow-500/80 hover:bg-yellow-500';
    if (ratio >= 0.2) return 'bg-orange-500/80 hover:bg-orange-500';
    return 'bg-red-500/80 hover:bg-red-500';
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 8) return 'text-green-600';
    if (quality >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!performance || performance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Heatmap de production
          </CardTitle>
          <CardDescription>
            Performance par bassin sur les 90 derniers jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune donnée de production</p>
            <p className="text-sm mt-1">Ajoutez des enregistrements de production pour voir la heatmap</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxProduction = Math.max(...performance.map(p => p.total_production));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Heatmap de production
        </CardTitle>
        <CardDescription>
          Performance par bassin sur les 90 derniers jours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {performance.map((bassin) => (
            <div
              key={bassin.bassin_id}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all cursor-pointer group",
                getPerformanceColor(bassin.total_production, maxProduction)
              )}
            >
              {/* Badge avec code bassin */}
              <div className="absolute top-2 right-2">
                <span className="text-xs font-bold px-2 py-1 bg-white/90 rounded text-gray-800">
                  {bassin.bassin_code}
                </span>
              </div>

              {/* Contenu */}
              <div className="mt-4 space-y-2">
                <h3 className="font-semibold text-sm text-white truncate" title={bassin.bassin_name}>
                  {bassin.bassin_name}
                </h3>
                
                <div className="text-white">
                  <p className="text-2xl font-bold">{Math.round(bassin.total_production)} t</p>
                  <p className="text-xs opacity-90">{bassin.records_count} récoltes</p>
                </div>

                {/* Qualité moyenne */}
                <div className="pt-2 border-t border-white/20">
                  <p className="text-xs text-white/80">Qualité moyenne</p>
                  <p className={cn("text-lg font-semibold", "text-white")}>
                    {bassin.avg_quality.toFixed(1)}/10
                  </p>
                </div>
              </div>

              {/* Tooltip au survol */}
              <div className="absolute inset-0 bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                <div className="text-white text-center text-sm space-y-1">
                  <p className="font-semibold">{bassin.bassin_name}</p>
                  <p className="text-xs">Production: {bassin.total_production.toFixed(2)} t</p>
                  <p className="text-xs">Qualité: {bassin.avg_quality.toFixed(1)}/10</p>
                  <p className="text-xs">Récoltes: {bassin.records_count}</p>
                  <p className="text-xs mt-2 text-white/70">
                    {((bassin.total_production / maxProduction) * 100).toFixed(0)}% du meilleur bassin
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Légende */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm font-medium mb-3">Légende de performance</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>Excellente (≥80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-lime-500"></div>
              <span>Bonne (60-79%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span>Moyenne (40-59%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500"></div>
              <span>Faible (20-39%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>Très faible (&lt;20%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
