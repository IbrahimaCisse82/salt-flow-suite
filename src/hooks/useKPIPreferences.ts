import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type KPIType = 
  | 'production_totale'
  | 'bassins_actifs'
  | 'employes_actifs'
  | 'stock_disponible'
  | 'ventes_mois'
  | 'rendement_moyen'
  | 'temperature'
  | 'campagne_progress';

export interface KPIConfig {
  id: KPIType;
  enabled: boolean;
  order: number;
  label: string;
  description: string;
}

const DEFAULT_KPIS: KPIConfig[] = [
  {
    id: 'production_totale',
    enabled: true,
    order: 1,
    label: 'Production totale',
    description: 'Production totale de sel pour la campagne en cours'
  },
  {
    id: 'bassins_actifs',
    enabled: true,
    order: 2,
    label: 'Bassins actifs',
    description: 'Nombre de bassins en production'
  },
  {
    id: 'employes_actifs',
    enabled: true,
    order: 3,
    label: 'Employés actifs',
    description: 'Personnel permanent et journaliers'
  },
  {
    id: 'stock_disponible',
    enabled: true,
    order: 4,
    label: 'Stock disponible',
    description: 'Stock de sel disponible à la vente'
  },
  {
    id: 'ventes_mois',
    enabled: false,
    order: 5,
    label: 'Ventes du mois',
    description: 'Chiffre d\'affaires du mois en cours'
  },
  {
    id: 'rendement_moyen',
    enabled: false,
    order: 6,
    label: 'Rendement moyen',
    description: 'Rendement moyen par hectare'
  },
  {
    id: 'temperature',
    enabled: false,
    order: 7,
    label: 'Température',
    description: 'Température actuelle'
  },
  {
    id: 'campagne_progress',
    enabled: false,
    order: 8,
    label: 'Progression campagne',
    description: 'Pourcentage d\'objectif atteint'
  }
];

export const useKPIPreferences = () => {
  const { profile } = useAuth();

  const [kpiConfigs, setKpiConfigs] = useState<KPIConfig[]>(DEFAULT_KPIS);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les préférences chaque fois que le profil change
  useEffect(() => {
    if (!profile?.id) {
      setKpiConfigs(DEFAULT_KPIS);
      setIsLoading(false);
      return;
    }

    const storageKey = `kpi_preferences_${profile.id}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as KPIConfig[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setKpiConfigs(parsed);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error loading KPI preferences:', error);
      }
    }

    setKpiConfigs(DEFAULT_KPIS);
    setIsLoading(false);
  }, [profile?.id]);

  // Sauvegarder les préférences
  const savePreferences = (configs: KPIConfig[]) => {
    if (!profile?.id) return;

    const storageKey = `kpi_preferences_${profile.id}`;
    localStorage.setItem(storageKey, JSON.stringify(configs));
    setKpiConfigs(configs);
  };

  // Activer/désactiver un KPI
  const toggleKPI = (id: KPIType) => {
    const updated = kpiConfigs.map(kpi =>
      kpi.id === id ? { ...kpi, enabled: !kpi.enabled } : kpi
    );
    savePreferences(updated);
  };

  // Réorganiser les KPIs
  const reorderKPIs = (fromIndex: number, toIndex: number) => {
    const updated = [...kpiConfigs];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    
    // Mettre à jour les ordres
    const reordered = updated.map((kpi, index) => ({
      ...kpi,
      order: index + 1
    }));
    
    savePreferences(reordered);
  };

  // Réinitialiser aux valeurs par défaut
  const resetToDefaults = () => {
    savePreferences(DEFAULT_KPIS);
  };

  // Obtenir les KPIs activés et triés
  const enabledKPIs = kpiConfigs
    .filter(kpi => kpi.enabled)
    .sort((a, b) => a.order - b.order);

  return {
    kpiConfigs,
    enabledKPIs,
    isLoading,
    toggleKPI,
    reorderKPIs,
    resetToDefaults,
    savePreferences
  };
};
