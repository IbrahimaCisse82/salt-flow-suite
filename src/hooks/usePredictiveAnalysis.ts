import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProductionPrediction {
  month: string;
  predicted: number;
  confidence: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
}

interface SalesPrediction {
  period: string;
  predictedRevenue: number;
  predictedQuantity: number;
}

/**
 * Hook pour l'analyse prédictive basée sur les données historiques
 * Utilise des algorithmes simples de régression linéaire et moyennes mobiles
 */
export const usePredictiveAnalysis = () => {
  const { profile } = useAuth();

  // Prédiction de production basée sur l'historique
  const { data: productionPredictions, isLoading: isPredictingProduction } = useQuery({
    queryKey: ['production-predictions', profile?.tenant_id],
    queryFn: async (): Promise<ProductionPrediction[]> => {
      if (!profile?.tenant_id) return [];

      // Récupérer les données des 12 derniers mois
      const { data: records, error } = await supabase
        .from('production_records')
        .select('production_date, quantity')
        .gte('production_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('production_date');

      if (error || !records || records.length < 3) {
        return [];
      }

      // Grouper par mois
      const monthlyData: Record<string, number> = {};
      records.forEach(record => {
        const month = new Date(record.production_date).toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'short' 
        });
        monthlyData[month] = (monthlyData[month] || 0) + Number(record.quantity || 0);
      });

      const months = Object.keys(monthlyData);
      const values = Object.values(monthlyData);

      // Calculer la tendance (régression linéaire simple)
      const n = values.length;
      const sumX = values.reduce((sum, _, i) => sum + i, 0);
      const sumY = values.reduce((sum, val) => sum + val, 0);
      const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
      const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Prédire les 3 prochains mois
      const predictions: ProductionPrediction[] = [];
      const lastValue = values[values.length - 1];
      
      for (let i = 1; i <= 3; i++) {
        const nextIndex = n + i - 1;
        const predicted = Math.max(0, slope * nextIndex + intercept);
        
        // Calculer la confiance basée sur la variance
        const variance = values.reduce((sum, val) => sum + Math.pow(val - sumY/n, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        const confidence = stdDev < sumY/n * 0.2 ? 'high' : stdDev < sumY/n * 0.4 ? 'medium' : 'low';
        
        // Déterminer la tendance
        const trend = slope > 5 ? 'up' : slope < -5 ? 'down' : 'stable';

        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + i);
        
        predictions.push({
          month: futureDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }),
          predicted: Math.round(predicted),
          confidence,
          trend
        });
      }

      return predictions;
    },
    enabled: !!profile?.tenant_id,
    retry: 1,
    staleTime: 1000 * 60 * 30 // 30 minutes
  });

  // Prédiction des ventes
  const { data: salesPredictions, isLoading: isPredictingSales } = useQuery({
    queryKey: ['sales-predictions', profile?.tenant_id],
    queryFn: async (): Promise<SalesPrediction[]> => {
      if (!profile?.tenant_id) return [];

      const { data: sales, error } = await supabase
        .from('sales')
        .select('sale_date, quantity, unit_price')
        .gte('sale_date', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
        .order('sale_date');

      if (error || !sales || sales.length < 3) return [];

      // Calculer la moyenne mobile sur 30 jours
      const avgQuantity = sales.reduce((sum, s) => sum + Number(s.quantity || 0), 0) / sales.length;
      const avgPrice = sales.reduce((sum, s) => sum + Number(s.unit_price || 0), 0) / sales.length;

      // Prédire les 2 prochains mois
      return [
        {
          period: 'Mois prochain',
          predictedRevenue: Math.round(avgQuantity * avgPrice * 1.05), // +5% de croissance
          predictedQuantity: Math.round(avgQuantity * 1.05)
        },
        {
          period: 'Dans 2 mois',
          predictedRevenue: Math.round(avgQuantity * avgPrice * 1.1), // +10% de croissance
          predictedQuantity: Math.round(avgQuantity * 1.1)
        }
      ];
    },
    enabled: !!profile?.tenant_id,
    retry: 1,
    staleTime: 1000 * 60 * 30
  });

  return {
    productionPredictions: productionPredictions || [],
    salesPredictions: salesPredictions || [],
    isPredictingProduction,
    isPredictingSales,
    isLoading: isPredictingProduction || isPredictingSales
  };
};
