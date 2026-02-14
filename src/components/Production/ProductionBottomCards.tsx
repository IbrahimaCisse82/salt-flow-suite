import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

interface ProductionRecord {
  id: string;
  production_date: string | null;
  quantity: number | null;
  quality_grade: string | null;
  salt_type: string;
}

interface QualityTest {
  humidity_level: number | null;
  salt_purity: number | null;
  grain_size: string | null;
  [key: string]: any;
}

interface Props {
  productionRecords: ProductionRecord[];
  qualityTests: QualityTest[] | undefined;
  isLoading: boolean;
}

export const ProductionBottomCards = ({ productionRecords, qualityTests, isLoading }: Props) => {
  const qualityParams = useMemo(() => {
    if (!qualityTests || qualityTests.length === 0) {
      return { salinity: null, humidity: null, granulometry: null, purity: null };
    }

    const withPurity = qualityTests.filter(t => t.salt_purity != null);
    const withHumidity = qualityTests.filter(t => t.humidity_level != null);
    const withGrain = qualityTests.filter(t => t.grain_size != null);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    const conformeCount = withGrain.filter(t => t.grain_size === 'fin' || t.grain_size === 'moyen' || t.grain_size === 'conforme').length;

    return {
      salinity: null as number | null, // No salinity column in quality_tests
      humidity: avg(withHumidity.map(t => t.humidity_level!)),
      purity: avg(withPurity.map(t => t.salt_purity!)),
      granulometry: withGrain.length > 0 
        ? (conformeCount / withGrain.length >= 0.5 ? 'Conforme' : 'Non conforme')
        : null,
    };
  }, [qualityTests]);

  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weekRecords = productionRecords.filter(r => {
      if (!r.production_date) return false;
      const d = new Date(r.production_date);
      return d >= weekAgo && d <= now;
    });

    const weekProduction = weekRecords.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
    const weekHarvestCount = weekRecords.length;
    const conformeCount = weekRecords.filter(r => r.quality_grade === 'A+' || r.quality_grade === 'A').length;
    const conformityRate = weekRecords.length > 0 ? Math.round((conformeCount / weekRecords.length) * 100) : 0;

    return { weekProduction, weekHarvestCount, conformityRate };
  }, [productionRecords]);

  const formatValue = (val: number | null, suffix: string) => {
    if (val === null) return '—';
    return `${val.toFixed(1)}${suffix}`;
  };

  const StatRow = ({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) => (
    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
      <span className="text-sm font-medium">{label}</span>
      <span className={`font-bold ${colorClass || ''}`}>{value}</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paramètres de qualité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatRow label="Salinité moyenne" value={formatValue(qualityParams.salinity, '%')} colorClass="text-primary" />
          <StatRow label="Taux d'humidité" value={formatValue(qualityParams.humidity, '%')} colorClass="text-accent" />
          <StatRow 
            label="Granulométrie" 
            value={qualityParams.granulometry || '—'} 
            colorClass={qualityParams.granulometry === 'Conforme' ? 'text-primary' : 'text-destructive'} 
          />
          <StatRow label="Pureté" value={formatValue(qualityParams.purity, '%')} colorClass="text-primary" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statistiques hebdomadaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatRow label="Production semaine" value={`${Math.round(weeklyStats.weekProduction)} tonnes`} />
          <StatRow label="Nombre de récoltes" value={`${weeklyStats.weekHarvestCount} récoltes`} />
          <StatRow label="Taux de conformité" value={`${weeklyStats.conformityRate}%`} colorClass="text-primary" />
        </CardContent>
      </Card>
    </div>
  );
};
