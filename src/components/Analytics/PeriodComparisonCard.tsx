import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";
import { usePeriodComparison, PeriodType } from "@/hooks/usePeriodComparison";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Année' },
  { value: 'campagne', label: 'Campagne' }
];

export const PeriodComparisonCard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
  const { comparison, isLoading } = usePeriodComparison(selectedPeriod);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(num));
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getChangeBadge = (change: number) => {
    if (change > 0) {
      return (
        <Badge className="bg-green-500/10 text-green-700 border-green-500/30">
          <ArrowUpCircle className="h-3 w-3 mr-1" />
          {formatChange(change)}
        </Badge>
      );
    }
    if (change < 0) {
      return (
        <Badge className="bg-red-500/10 text-red-700 border-red-500/30">
          <ArrowDownCircle className="h-3 w-3 mr-1" />
          {formatChange(change)}
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        {formatChange(change)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Comparaison des périodes
        </CardTitle>
        <CardDescription>
          Comparez vos performances entre différentes périodes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Sélecteur de période */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PERIOD_OPTIONS.map(option => (
            <Button
              key={option.value}
              variant={selectedPeriod === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {!comparison ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune donnée disponible pour cette période</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* En-têtes des périodes */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <p className="font-medium mb-1">Période actuelle</p>
                <p className="text-xs text-muted-foreground">
                  {comparison.current.period}
                </p>
              </div>
              <div className="text-center">
                <p className="font-medium mb-1">Période précédente</p>
                <p className="text-xs text-muted-foreground">
                  {comparison.previous.period}
                </p>
              </div>
            </div>

            {/* Métriques */}
            <div className="space-y-4">
              {/* Production */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Production totale</span>
                  {getChangeBadge(comparison.change.production)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {formatNumber(comparison.current.production)} t
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-muted-foreground">
                      {formatNumber(comparison.previous.production)} t
                    </p>
                  </div>
                </div>
              </div>

              {/* Ventes */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Quantité vendue</span>
                  {getChangeBadge(comparison.change.sales)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {formatNumber(comparison.current.sales)} t
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-muted-foreground">
                      {formatNumber(comparison.previous.sales)} t
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenu */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Chiffre d'affaires</span>
                  {getChangeBadge(comparison.change.revenue)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {formatNumber(comparison.current.revenue)} FCFA
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-muted-foreground">
                      {formatNumber(comparison.previous.revenue)} FCFA
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Résumé */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm">
                {comparison.change.production > 0 ? (
                  <span className="text-green-600 font-medium">
                    📈 Performance en hausse de {formatChange(comparison.change.production)} par rapport à la période précédente
                  </span>
                ) : comparison.change.production < 0 ? (
                  <span className="text-red-600 font-medium">
                    📉 Performance en baisse de {formatChange(Math.abs(comparison.change.production))} par rapport à la période précédente
                  </span>
                ) : (
                  <span className="text-muted-foreground font-medium">
                    ➖ Performance stable par rapport à la période précédente
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
