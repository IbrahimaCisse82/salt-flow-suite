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
import { TrendingDown, TrendingUp, AlertTriangle, FileCheck, Receipt, CreditCard } from "lucide-react";
import { useCampagnes } from "@/hooks/useCampagnes";
import { useCampagneBudgetLines } from "@/hooks/useCampagneBudgetLines";

const phaseLabels: Record<string, string> = {
  'preparation-bassins': 'Préparation des bassins',
  'mise-en-eau': 'Mise en eau',
  'evaporation': 'Évaporation',
  'recolte-principale': 'Récolte principale',
  'traitement-stockage': 'Traitement et stockage'
};

const formatCurrency = (amount: number) => `${amount.toLocaleString()} FCFA`;

export const BudgetTrackingTab = () => {
  const [selectedCampagneId, setSelectedCampagneId] = useState<string>("");
  const { campagnes } = useCampagnes();
  const { budgetLines, phasesWithBudget } = useCampagneBudgetLines(selectedCampagneId || undefined);

  // Grouper les données par phase
  const phaseData = Object.keys(phaseLabels).map(phase => {
    const phaseLines = budgetLines.filter(l => l.phase === phase);
    
    const totalBudget = phaseLines.reduce((sum, l) => sum + l.budgeted_amount, 0);
    const totalCommitted = phaseLines.reduce((sum, l) => sum + l.committed_amount, 0);
    const totalRealized = phaseLines.reduce((sum, l) => sum + l.realized_amount, 0);
    const totalPaid = phaseLines.reduce((sum, l) => sum + l.paid_amount, 0);
    const totalEngaged = totalCommitted + totalRealized;
    const remaining = totalBudget - totalEngaged;
    const percentage = totalBudget > 0 ? (totalEngaged / totalBudget) * 100 : 0;
    
    return {
      phase,
      label: phaseLabels[phase],
      totalBudget,
      totalCommitted,
      totalRealized,
      totalPaid,
      totalEngaged,
      remaining,
      percentage,
      categories: phaseLines,
    };
  }).filter(p => p.totalBudget > 0 || p.totalEngaged > 0);

  const overallBudget = phaseData.reduce((sum, p) => sum + p.totalBudget, 0);
  const overallCommitted = phaseData.reduce((sum, p) => sum + p.totalCommitted, 0);
  const overallRealized = phaseData.reduce((sum, p) => sum + p.totalRealized, 0);
  const overallPaid = phaseData.reduce((sum, p) => sum + p.totalPaid, 0);
  const overallEngaged = overallCommitted + overallRealized;
  const overallRemaining = overallBudget - overallEngaged;
  const overallPercentage = overallBudget > 0 ? (overallEngaged / overallBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="campagne-select">Sélectionner une campagne</Label>
        <Select value={selectedCampagneId} onValueChange={setSelectedCampagneId}>
          <SelectTrigger id="campagne-select" className="w-full md:w-[300px]">
            <SelectValue placeholder="Sélectionnez une campagne" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {(campagnes || []).map((campagne) => (
              <SelectItem key={campagne.id} value={campagne.id}>
                {campagne.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCampagneId && (
        <>
          {/* Vue d'ensemble globale — 3 tiers */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle>Vue consolidée du budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Budget prévisionnel</p>
                  <p className="text-xl font-bold">{formatCurrency(overallBudget)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <FileCheck className="h-3.5 w-3.5 text-amber-600" />
                    <p className="text-sm text-muted-foreground">Engagé (BC)</p>
                  </div>
                  <p className="text-xl font-bold text-amber-600">{formatCurrency(overallCommitted)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Receipt className="h-3.5 w-3.5 text-destructive" />
                    <p className="text-sm text-muted-foreground">Réalisé (reçu)</p>
                  </div>
                  <p className="text-xl font-bold text-destructive">{formatCurrency(overallRealized)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <CreditCard className="h-3.5 w-3.5 text-green-600" />
                    <p className="text-sm text-muted-foreground">Payé</p>
                  </div>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(overallPaid)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reste à engager</p>
                  <p className={`text-xl font-bold ${overallRemaining >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {overallRemaining >= 0 ? '+' : ''}{formatCurrency(overallRemaining)}
                  </p>
                </div>
              </div>

              {/* Barre de progression globale */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taux d'engagement global</span>
                  <span className="font-medium">{overallPercentage.toFixed(1)}%</span>
                </div>
                <div className="relative">
                  <Progress value={Math.min(overallPercentage, 100)} className="h-3" />
                  {/* Indicateur engagé vs réalisé */}
                  {overallBudget > 0 && overallRealized > 0 && (
                    <div 
                      className="absolute top-0 h-3 bg-destructive/60 rounded-l-full"
                      style={{ width: `${Math.min((overallRealized / overallBudget) * 100, 100)}%` }}
                    />
                  )}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-2 bg-destructive/60 rounded" /> Réalisé
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-2 bg-primary rounded" /> Engagé (BC)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Détail par phase */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Suivi par phase</h3>
            {phaseData.length === 0 && (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    Aucune ligne budgétaire définie pour cette campagne. 
                    Allez dans l'onglet "Budget" pour créer des lignes budgétaires par phase et catégorie.
                  </p>
                </CardContent>
              </Card>
            )}
            {phaseData.map((phase) => (
              <Card key={phase.phase} className={phase.percentage > 100 ? 'border-l-4 border-l-destructive' : phase.percentage > 80 ? 'border-l-4 border-l-yellow-500' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{phase.label}</CardTitle>
                    <div className="flex gap-2">
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
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Budget</p>
                      </div>
                      <p className="text-lg font-semibold">{formatCurrency(phase.totalBudget)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <FileCheck className="h-3.5 w-3.5 text-amber-600" />
                        <p className="text-xs text-muted-foreground">Engagé</p>
                      </div>
                      <p className="text-lg font-semibold text-amber-600">{formatCurrency(phase.totalCommitted)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Receipt className="h-3.5 w-3.5 text-destructive" />
                        <p className="text-xs text-muted-foreground">Réalisé</p>
                      </div>
                      <p className="text-lg font-semibold text-destructive">{formatCurrency(phase.totalRealized)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <CreditCard className="h-3.5 w-3.5 text-green-600" />
                        <p className="text-xs text-muted-foreground">Payé</p>
                      </div>
                      <p className="text-lg font-semibold text-green-600">{formatCurrency(phase.totalPaid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reste à engager</p>
                      <p className={`text-lg font-semibold ${phase.remaining >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {phase.remaining >= 0 ? '+' : ''}{formatCurrency(phase.remaining)}
                      </p>
                    </div>
                  </div>

                  {/* Détail par catégorie */}
                  {phase.categories.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-sm font-medium text-muted-foreground">Détail par catégorie</p>
                      {phase.categories.map((cat) => {
                        const catPercentage = cat.budgeted_amount > 0 ? (cat.total_engaged / cat.budgeted_amount) * 100 : 0;
                        return (
                          <div key={cat.id} className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm min-w-[140px]">{cat.expense_category}</span>
                              <Progress 
                                value={Math.min(catPercentage, 100)} 
                                className={`flex-1 ${catPercentage > 100 ? "[&>div]:bg-destructive" : catPercentage > 80 ? "[&>div]:bg-yellow-600" : ""}`}
                              />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {catPercentage.toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground ml-[152px]">
                              <span>Budget: {formatCurrency(cat.budgeted_amount)}</span>
                              <span className="text-amber-600">Engagé: {formatCurrency(cat.committed_amount)}</span>
                              <span className="text-destructive">Réalisé: {formatCurrency(cat.realized_amount)}</span>
                              <span className={cat.remaining_to_commit >= 0 ? 'text-green-600' : 'text-destructive'}>
                                Reste: {formatCurrency(cat.remaining_to_commit)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taux d'engagement</span>
                      <span className="font-medium">{phase.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(phase.percentage, 100)} 
                      className={phase.percentage > 100 ? "[&>div]:bg-destructive" : phase.percentage > 80 ? "[&>div]:bg-yellow-600" : ""}
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
