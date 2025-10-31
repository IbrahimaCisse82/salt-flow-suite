import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Brain, AlertCircle } from "lucide-react";
import { usePredictiveAnalysis } from "@/hooks/usePredictiveAnalysis";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const PredictiveAnalysisCard = () => {
  const { productionPredictions, isLoading } = usePredictiveAnalysis();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (productionPredictions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Prédictions de production
          </CardTitle>
          <CardDescription>
            Basées sur l'analyse de vos données historiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Pas assez de données pour générer des prédictions</p>
            <p className="text-sm mt-1">Ajoutez au moins 3 mois d'historique</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-500/10 text-green-700 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30';
      default:
        return 'bg-red-500/10 text-red-700 border-red-500/30';
    }
  };

  const getConfidenceLabel = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'Haute confiance';
      case 'medium':
        return 'Confiance moyenne';
      default:
        return 'Faible confiance';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Prédictions de production
        </CardTitle>
        <CardDescription>
          Basées sur l'analyse de vos données historiques
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {productionPredictions.map((prediction, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{prediction.month}</span>
                  {getTrendIcon(prediction.trend)}
                </div>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getConfidenceColor(prediction.confidence))}
                >
                  {getConfidenceLabel(prediction.confidence)}
                </Badge>
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {prediction.predicted} t
                </span>
                <span className="text-sm text-muted-foreground">
                  production estimée
                </span>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                {prediction.trend === 'up' && 'Tendance à la hausse'}
                {prediction.trend === 'down' && 'Tendance à la baisse'}
                {prediction.trend === 'stable' && 'Production stable'}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Ces prédictions sont calculées à partir de vos données historiques et peuvent varier selon les conditions météo et opérationnelles.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
