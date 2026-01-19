import { StatsCard } from "./StatsCard";
import { 
  Droplets, 
  TrendingUp, 
  Users, 
  Package,
  DollarSign,
  Percent,
  ThermometerSun,
  Target
} from "lucide-react";
import { useKPIPreferences, KPIType } from "@/hooks/useKPIPreferences";
import { Skeleton } from "@/components/ui/skeleton";

interface DynamicKPIGridProps {
  // Données pour chaque KPI
  productionTotale?: number;
  productionObjectif?: number;
  bassinsActifs?: number;
  bassinsTotal?: number;
  employesActifs?: number;
  employesJournaliers?: number;
  stockDisponible?: number;
  stockEntrees?: number;
  ventesMois?: number;
  ventesVariation?: number;
  rendementMoyen?: number;
  temperature?: number;
  campagneProgress?: number;
  isLoading?: boolean;
}

export const DynamicKPIGrid = ({
  productionTotale = 0,
  productionObjectif,
  bassinsActifs = 0,
  bassinsTotal = 0,
  employesActifs = 0,
  employesJournaliers = 0,
  stockDisponible = 0,
  stockEntrees,
  ventesMois = 0,
  ventesVariation,
  rendementMoyen = 0,
  temperature,
  campagneProgress = 0,
  isLoading = false
}: DynamicKPIGridProps) => {
  const { enabledKPIs, isLoading: kpiLoading } = useKPIPreferences();

  if (kpiLoading || isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const getKPIComponent = (type: KPIType) => {
    switch (type) {
      case 'production_totale':
        return (
          <StatsCard
            key={type}
            title="Production totale"
            value={productionTotale > 0 ? `${Math.round(productionTotale)} t` : "0 t"}
            change={productionObjectif ? `Objectif: ${productionObjectif} t` : "Aucun objectif"}
            icon={TrendingUp}
            trend={productionObjectif && productionTotale > 0 ? "up" : undefined}
            gradient={productionTotale > 0}
          />
        );
      
      case 'bassins_actifs':
        return (
          <StatsCard
            key={type}
            title="Bassins actifs"
            value={bassinsTotal > 0 ? `${bassinsActifs}/${bassinsTotal}` : "0"}
            change={bassinsTotal > 0 ? `${Math.round((bassinsActifs/bassinsTotal)*100)}% capacité` : "Aucun bassin"}
            icon={Droplets}
          />
        );
      
      case 'employes_actifs':
        return (
          <StatsCard
            key={type}
            title="Employés actifs"
            value={employesActifs.toString()}
            change={employesJournaliers > 0 ? `${employesJournaliers} journaliers` : "Aucun journalier"}
            icon={Users}
          />
        );
      
      case 'stock_disponible':
        return (
          <StatsCard
            key={type}
            title="Stock disponible"
            value={stockDisponible > 0 ? `${Math.round(stockDisponible)} t` : "0 t"}
            change={stockEntrees ? `${stockEntrees} entrées` : "Aucune entrée"}
            icon={Package}
          />
        );
      
      case 'ventes_mois':
        return (
          <StatsCard
            key={type}
            title="Ventes du mois"
            value={ventesMois > 0 ? `${Math.round(ventesMois).toLocaleString()} FCFA` : "0 FCFA"}
            change={ventesVariation ? `${ventesVariation > 0 ? '+' : ''}${ventesVariation}% vs mois dernier` : undefined}
            icon={DollarSign}
            trend={ventesVariation && ventesVariation > 0 ? "up" : ventesVariation && ventesVariation < 0 ? "down" : undefined}
            gradient={ventesMois > 0}
          />
        );
      
      case 'rendement_moyen':
        return (
          <StatsCard
            key={type}
            title="Rendement moyen"
            value={rendementMoyen > 0 ? `${rendementMoyen.toFixed(2)} t/ha` : "0 t/ha"}
            change="Par hectare de bassin"
            icon={Percent}
            gradient={rendementMoyen > 0}
          />
        );
      
      case 'temperature':
        return (
          <StatsCard
            key={type}
            title="Température"
            value={temperature ? `${Math.round(temperature)}°C` : "N/A"}
            change="Conditions actuelles"
            icon={ThermometerSun}
          />
        );
      
      case 'campagne_progress':
        return (
          <StatsCard
            key={type}
            title="Progression campagne"
            value={`${Math.round(campagneProgress)}%`}
            change={productionObjectif ? `${Math.round(productionTotale)}/${productionObjectif} t` : "Aucun objectif"}
            icon={Target}
            trend={campagneProgress >= 75 ? "up" : undefined}
            gradient={campagneProgress >= 50}
          />
        );
      
      default:
        return null;
    }
  };

  const kpiComponents = enabledKPIs.map(kpi => getKPIComponent(kpi.id)).filter(Boolean);

  // Si aucun KPI n'est activé, afficher un message
  if (kpiComponents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
        <p className="text-muted-foreground">
          Aucun indicateur sélectionné. Cliquez sur "Personnaliser" pour ajouter des KPIs.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {kpiComponents}
    </div>
  );
};
