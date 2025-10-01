import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";

const phaseLabels: Record<string, string> = {
  'preparation-bassins': 'Préparation des bassins',
  'mise-en-eau': 'Mise en eau',
  'evaporation': 'Évaporation',
  'recolte-principale': 'Récolte principale',
  'traitement-stockage': 'Traitement et stockage'
};

export const BudgetTrackingTab = () => {
  const [selectedCampagneId, setSelectedCampagneId] = useState<string>("");

  // Récupérer les campagnes
  const { data: campagnes = [] } = useQuery({
    queryKey: ['campagnes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campagnes')
        .select('*')
        .order('year', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Récupérer les budgets prévisionnels
  const { data: budgets = [] } = useQuery({
    queryKey: ['phase-budgets', selectedCampagneId],
    queryFn: async () => {
      if (!selectedCampagneId) return [];
      
      const { data, error } = await supabase
        .from('campagne_phase_budgets')
        .select('*')
        .eq('campagne_id', selectedCampagneId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCampagneId
  });

  // Récupérer les dépenses réelles
  const { data: actualExpenses = [] } = useQuery({
    queryKey: ['phase-expenses', selectedCampagneId],
    queryFn: async () => {
      if (!selectedCampagneId) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('campagne_id', selectedCampagneId)
        .eq('transaction_type', 'depense');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCampagneId
  });

  // Grouper les données par phase
  const phaseData = Object.keys(phaseLabels).map(phase => {
    const phaseBudgets = budgets.filter(b => b.phase === phase);
    const phaseExpenses = actualExpenses.filter(e => e.campagne_phase === phase);
    
    const totalBudget = phaseBudgets.reduce((sum, b) => sum + Number(b.budgeted_amount || 0), 0);
    const totalActual = phaseExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const difference = totalBudget - totalActual;
    const percentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
    
    return {
      phase,
      label: phaseLabels[phase],
      totalBudget,
      totalActual,
      difference,
      percentage,
      budgets: phaseBudgets,
      expenses: phaseExpenses
    };
  });

  const overallBudget = phaseData.reduce((sum, p) => sum + p.totalBudget, 0);
  const overallActual = phaseData.reduce((sum, p) => sum + p.totalActual, 0);
  const overallDifference = overallBudget - overallActual;
  const overallPercentage = overallBudget > 0 ? (overallActual / overallBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="campagne-select">Sélectionner une campagne</Label>
        <Select value={selectedCampagneId} onValueChange={setSelectedCampagneId}>
          <SelectTrigger id="campagne-select" className="w-full md:w-[300px]">
            <SelectValue placeholder="Sélectionnez une campagne" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {campagnes.map((campagne) => (
              <SelectItem key={campagne.id} value={campagne.id}>
                {campagne.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCampagneId && (
        <>
          {/* Vue d'ensemble globale */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle>Vue d'ensemble du budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Budget prévisionnel</p>
                  <p className="text-2xl font-bold">{overallBudget.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dépenses réelles</p>
                  <p className="text-2xl font-bold text-red-600">{overallActual.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Écart</p>
                  <p className={`text-2xl font-bold ${overallDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {overallDifference >= 0 ? '+' : ''}{overallDifference.toLocaleString()} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Taux d'utilisation</p>
                  <p className="text-2xl font-bold">{overallPercentage.toFixed(1)}%</p>
                  <Progress value={Math.min(overallPercentage, 100)} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Détail par phase */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Suivi par phase</h3>
            {phaseData.map((phase) => (
              <Card key={phase.phase} className={phase.percentage > 100 ? 'border-l-4 border-l-red-500' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{phase.label}</CardTitle>
                    {phase.percentage > 100 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Dépassement
                      </Badge>
                    )}
                    {phase.percentage > 80 && phase.percentage <= 100 && (
                      <Badge variant="outline" className="gap-1 border-yellow-600 text-yellow-700">
                        <AlertTriangle className="h-3 w-3" />
                        Attention
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Budget prévisionnel</p>
                      </div>
                      <p className="text-xl font-semibold">{phase.totalBudget.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <p className="text-sm text-muted-foreground">Dépenses réelles</p>
                      </div>
                      <p className="text-xl font-semibold text-red-600">{phase.totalActual.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Écart</p>
                      <p className={`text-xl font-semibold ${phase.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {phase.difference >= 0 ? '+' : ''}{phase.difference.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taux d'utilisation</span>
                      <span className="font-medium">{phase.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(phase.percentage, 100)} 
                      className={phase.percentage > 100 ? "[&>div]:bg-red-600" : phase.percentage > 80 ? "[&>div]:bg-yellow-600" : ""}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {!selectedCampagneId && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Sélectionnez une campagne pour voir le suivi budgétaire
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
