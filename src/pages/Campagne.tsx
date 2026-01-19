import { useState } from "react";
import { useCampagnes } from "@/hooks/useCampagnes";
import { useCampagneBudgets } from "@/hooks/useCampagneBudgets";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { BudgetPhaseTab, BudgetExpense } from "@/components/Campaign/BudgetPhaseTab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar, 
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";
import { StatsSkeleton } from "@/components/LoadingSkeletons/StatsSkeleton";
import { CardGridSkeleton } from "@/components/LoadingSkeletons/CardGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

const Campagne = () => {
  const { toast } = useToast();
  const { isOpen } = useSidebar();
  const [showNewCampagneDialog, setShowNewCampagneDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  
  // Use custom hooks for data management
  const { activeCampagne, createCampagne, isCreating } = useCampagnes();
  const { phaseBudgets, upsertPhaseBudget, isUpdating } = useCampagneBudgets(activeCampagne?.id);
  
  const [phaseExpenses, setPhaseExpenses] = useState<Record<string, BudgetExpense[]>>({
    'preparation-bassins': [],
    'mise-en-eau': [],
    'evaporation': [],
    'recolte-principale': [],
    'traitement-stockage': []
  });
  
  const [completedPhases, setCompletedPhases] = useState<Set<string>>(new Set([
    "Préparation des bassins",
    "Mise en eau"
  ]));
  
  const [activePhaseIndex, setActivePhaseIndex] = useState(2);

  // Récupérer les statistiques de la campagne
  const { data: campagneStats, isLoading: statsLoading } = useQuery({
    queryKey: ['campagne-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile) throw new Error('Profile not found');

      // Récupérer la campagne active
      const { data: campagne } = await supabase
        .from('campagnes')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('year', 2025)
        .single();

      // Récupérer la production totale
      const { data: production } = await supabase
        .from('production_records')
        .select('quantity, salt_type')
        .eq('tenant_id', profile.tenant_id);

      // Calculer la production par type
      const prodByType = production?.reduce((acc, record) => {
        const type = record.salt_type;
        acc[type] = (acc[type] || 0) + parseFloat(record.quantity.toString());
        return acc;
      }, {} as Record<string, number>) || {};

      const totalProduction = production?.reduce((sum, p) => sum + parseFloat(p.quantity.toString()), 0) || 0;

      // Récupérer les revenus
      const { data: sales } = await supabase
        .from('sales')
        .select('total_amount, salt_type')
        .eq('tenant_id', profile.tenant_id);

      const totalRevenue = sales?.reduce((sum, s) => sum + parseFloat(s.total_amount.toString()), 0) || 0;
      const localSales = sales?.filter(s => s.salt_type === 'gros' || s.salt_type === 'fin' || s.salt_type === 'iode').reduce((sum, s) => sum + parseFloat(s.total_amount.toString()), 0) || 0;
      const exportSales = sales?.filter(s => s.salt_type === 'export').reduce((sum, s) => sum + parseFloat(s.total_amount.toString()), 0) || 0;

      // Récupérer les dépenses
      const { data: expenses } = await supabase
        .from('transactions')
        .select('amount, campagne_phase')
        .eq('tenant_id', profile.tenant_id)
        .eq('transaction_type', 'depense');

      const expensesByType = expenses?.reduce((acc, exp) => {
        const phase = exp.campagne_phase || 'other';
        acc[phase] = (acc[phase] || 0) + parseFloat(exp.amount.toString());
        return acc;
      }, {} as Record<string, number>) || {};

      const totalExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;

      return {
        campagne,
        totalProduction,
        productionByType: prodByType,
        totalRevenue,
        localSales,
        exportSales,
        totalExpenses,
        expensesByType
      };
    }
  });

  const handleCreateCampagne = () => {
    setShowNewCampagneDialog(false);
    setShowBudgetDialog(true);
  };

  const handleAddExpense = (phase: string) => {
    const newExpense: BudgetExpense = {
      id: `${phase}-${Date.now()}`,
      description: '',
      amount: 0
    };
    setPhaseExpenses(prev => ({
      ...prev,
      [phase]: [...(prev[phase] || []), newExpense]
    }));
  };

  const handleUpdateExpense = (phase: string, expenseId: string, field: 'description' | 'amount', value: string) => {
    setPhaseExpenses(prev => ({
      ...prev,
      [phase]: prev[phase].map(expense => 
        expense.id === expenseId 
          ? { ...expense, [field]: field === 'amount' ? (parseFloat(value) || 0) : value }
          : expense
      )
    }));
  };

  const handleDeleteExpense = (phase: string, expenseId: string) => {
    setPhaseExpenses(prev => ({
      ...prev,
      [phase]: prev[phase].filter(expense => expense.id !== expenseId)
    }));
  };

  const calculateTotalBudget = () => {
    return Object.values(phaseExpenses).reduce((total, expenses) => {
      return total + expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    }, 0);
  };

  const handleSaveBudget = async () => {
    try {
      // Get tenant_id from profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.tenant_id) throw new Error('Profile not found');

      // Calculer le budget total
      const totalBudget = calculateTotalBudget();

      // Créer la campagne
      const { data: campagne, error: campagneError } = await supabase
        .from('campagnes')
        .insert({
          tenant_id: profile.tenant_id,
          name: 'Campagne 2025',
          year: 2025,
          start_date: '2025-01-01',
          end_date: '2025-11-30',
          status: 'planification',
          budget_total: totalBudget
        })
        .select()
        .single();

      if (campagneError) {
        console.error('Campagne creation error:', campagneError);
        throw campagneError;
      }

      // Regrouper les dépenses par phase et calculer le total par phase
      const phaseTotals: Record<string, number> = {};
      Object.entries(phaseExpenses).forEach(([phase, expenses]) => {
        const phaseTotal = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
        if (phaseTotal > 0) {
          phaseTotals[phase] = phaseTotal;
        }
      });

      // Sauvegarder les budgets par phase (structure correcte de la table)
      const budgetEntries = Object.entries(phaseTotals).map(([phase, amount]) => ({
        campagne_id: campagne.id,
        phase: phase,
        budgeted_amount: amount
      }));

      if (budgetEntries.length > 0) {
        const { error: budgetError } = await supabase
          .from('campagne_phase_budgets')
          .insert(budgetEntries);

        if (budgetError) {
          console.error('Budget insert error:', budgetError);
          throw budgetError;
        }
      }

      toast({
        title: "Budget enregistré",
        description: `Le budget prévisionnel de ${totalBudget.toLocaleString()} FCFA a été enregistré avec succès`,
      });
      
      setShowBudgetDialog(false);
      // Réinitialiser les dépenses
      setPhaseExpenses({
        'preparation-bassins': [],
        'mise-en-eau': [],
        'evaporation': [],
        'recolte-principale': [],
        'traitement-stockage': []
      });

      // Rafraîchir les données
      window.location.reload();
    } catch (error) {
      logger.error('Error saving budget:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'enregistrer le budget",
        variant: "destructive"
      });
    }
  };

  const getPhaseStatus = (index: number) => {
    if (index < activePhaseIndex) return "completed";
    if (index === activePhaseIndex) return "active";
    return "upcoming";
  };

  const togglePhaseCompletion = (index: number) => {
    const status = getPhaseStatus(index);
    
    if (status === "active") {
      // Passer à la phase suivante
      if (index < 4) {
        setActivePhaseIndex(index + 1);
        toast({
          title: "Phase clôturée",
          description: `La phase a été complétée. Passage à la phase suivante.`,
        });
      } else {
        toast({
          title: "Dernière phase",
          description: `C'est la dernière phase de la campagne.`,
        });
      }
    } else if (status === "upcoming" && index === activePhaseIndex + 1) {
      // Aller à la phase suivante manuellement
      setActivePhaseIndex(index);
      toast({
        title: "Passage à la phase suivante",
        description: `Phase active mise à jour.`,
      });
    } else if (status === "completed" && index === activePhaseIndex - 1) {
      // Revenir à la phase précédente
      setActivePhaseIndex(index);
      toast({
        title: "Retour à la phase précédente",
        description: `Phase active mise à jour.`,
      });
    }
  };
  const phases = [
    { 
      name: "Préparation des bassins", 
      startDate: "2025-01-01",
      endDate: "2025-01-31"
    },
    { 
      name: "Mise en eau", 
      startDate: "2025-02-01",
      endDate: "2025-02-15"
    },
    { 
      name: "Évaporation", 
      startDate: "2025-02-16",
      endDate: "2025-06-30"
    },
    { 
      name: "Récolte principale", 
      startDate: "2025-07-01",
      endDate: "2025-09-30"
    },
    { 
      name: "Traitement et stockage", 
      startDate: "2025-10-01",
      endDate: "2025-11-30"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className={cn(
          "flex-1 p-4 md:p-6 space-y-4 md:space-y-6 transition-all duration-300",
          isOpen ? "md:ml-64" : "md:ml-16"
        )}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">Plan de Campagne 2025</h1>
              <p className="text-sm sm:text-base text-muted-foreground break-words">
                Planification et suivi de la campagne saline en cours
              </p>
            </div>
            <Button 
              className="gap-2 bg-gradient-to-r from-primary to-accent flex-shrink-0"
              onClick={() => setShowNewCampagneDialog(true)}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle campagne</span>
              <span className="sm:hidden">Nouvelle</span>
            </Button>
          </div>

          {/* Vue d'ensemble */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4 sm:p-6">
              {statsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">Période</p>
                  <p className="text-sm sm:text-lg font-semibold break-words">
                    {campagneStats?.campagne?.start_date ? 
                      `${new Date(campagneStats.campagne.start_date).toLocaleDateString('fr-FR', { month: 'short' })} - ${new Date(campagneStats.campagne.end_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}` 
                      : 'Jan - Nov 2025'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {campagneStats?.campagne?.status === 'en_cours' ? 'En cours' : 
                     campagneStats?.campagne?.status === 'terminee' ? 'Terminée' : 
                     'Planification'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Progression globale</p>
                  <p className="text-lg font-semibold">
                    {campagneStats?.campagne?.target_production ? 
                      Math.round((campagneStats.totalProduction / parseFloat(campagneStats.campagne.target_production.toString())) * 100) 
                      : 42}%
                  </p>
                  <Progress 
                    value={campagneStats?.campagne?.target_production ? 
                      Math.round((campagneStats.totalProduction / parseFloat(campagneStats.campagne.target_production.toString())) * 100) 
                      : 42
                    } 
                    className="mt-2" 
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Objectif production</p>
                  <p className="text-lg font-semibold">
                    {campagneStats?.campagne?.target_production ? 
                      parseFloat(campagneStats.campagne.target_production.toString()).toLocaleString() 
                      : '1,200'} tonnes
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {campagneStats?.totalProduction?.toLocaleString() || 0} t réalisées (
                    {campagneStats?.campagne?.target_production ? 
                      Math.round((campagneStats.totalProduction / parseFloat(campagneStats.campagne.target_production.toString())) * 100) 
                      : 0}%)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Budget prévisionnel</p>
                  <p className="text-lg font-semibold">
                    {(campagneStats?.campagne?.budget_total ? 
                      parseFloat(campagneStats.campagne.budget_total.toString()) 
                      : calculateTotalBudget()).toLocaleString()} FCFA
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {campagneStats?.totalExpenses ? 
                      `${campagneStats.totalExpenses.toLocaleString()} FCFA dépensés` 
                      : 'Budget total des phases'}
                  </p>
                </div>
              </div>
              )}
            </CardContent>
          </Card>

          {/* Objectifs principaux */}
          {statsLoading ? (
            <CardGridSkeleton cards={3} columns={3} />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Production réalisée
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sel gros</span>
                  <span className="font-semibold">
                    {campagneStats?.productionByType?.sel_gros?.toLocaleString() || 0} t
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sel fin</span>
                  <span className="font-semibold">
                    {campagneStats?.productionByType?.sel_fin?.toLocaleString() || 0} t
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sel iodé</span>
                  <span className="font-semibold">
                    {campagneStats?.productionByType?.sel_iode?.toLocaleString() || 0} t
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-bold text-lg">
                    {campagneStats?.totalProduction?.toLocaleString() || 0} t
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  Revenus réalisés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ventes locales</span>
                  <span className="font-semibold">
                    {campagneStats?.localSales?.toLocaleString() || 0} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Export</span>
                  <span className="font-semibold">
                    {campagneStats?.exportSales?.toLocaleString() || 0} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-bold text-lg text-green-600">
                    {campagneStats?.totalRevenue?.toLocaleString() || 0} FCFA
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Dépenses réalisées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Préparation bassins</span>
                  <span className="font-semibold">
                    {campagneStats?.expensesByType?.['preparation-bassins']?.toLocaleString() || 0} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Récolte</span>
                  <span className="font-semibold">
                    {campagneStats?.expensesByType?.['recolte-principale']?.toLocaleString() || 0} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Traitement</span>
                  <span className="font-semibold">
                    {campagneStats?.expensesByType?.['traitement-stockage']?.toLocaleString() || 0} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-bold text-lg text-destructive">
                    {campagneStats?.totalExpenses?.toLocaleString() || 0} FCFA
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Timeline des phases */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Timeline de la campagne
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {phases.map((phase, index) => {
                const status = getPhaseStatus(index);
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => togglePhaseCompletion(index)}
                          className="flex items-center justify-center h-6 w-6 rounded-full transition-all hover:scale-110"
                        >
                          {status === "completed" && (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          )}
                          {status === "active" && (
                            <div className="h-6 w-6 rounded-full bg-primary animate-pulse" />
                          )}
                          {status === "upcoming" && (
                            <AlertCircle className="h-6 w-6 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className={`font-semibold ${
                            status === "completed" ? 'text-green-600' : 
                            status === "active" ? 'text-primary' : 
                            'text-muted-foreground'
                          }`}>
                            {phase.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {phase.startDate} → {phase.endDate}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={
                          status === "completed"
                            ? "border-green-600 text-green-700"
                            : status === "active"
                            ? "border-primary text-primary"
                            : "border-muted-foreground text-muted-foreground"
                        }
                      >
                        {status === "completed" && "Complété"}
                        {status === "active" && "En cours"}
                        {status === "upcoming" && "À venir"}
                      </Badge>
                    </div>
                    <Progress 
                      value={status === "completed" ? 100 : status === "active" ? 65 : 0} 
                      className={
                        status === "completed"
                          ? "[&>div]:bg-green-600"
                          : status === "active"
                          ? "[&>div]:bg-primary"
                          : ""
                      }
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Risques et alertes */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="h-5 w-5" />
                Risques identifiés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="font-medium text-sm text-yellow-900 mb-1">
                  Risque météorologique
                </p>
                <p className="text-sm text-yellow-700">
                  Prévisions de pluie la semaine prochaine. Prévoir récolte anticipée des bassins Nord.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="font-medium text-sm text-blue-900 mb-1">
                  Délai fournisseur
                </p>
                <p className="text-sm text-blue-700">
                  Livraison d'iode retardée de 2 semaines. Impact potentiel sur production sel iodé.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dialog Nouvelle Campagne */}
          <Dialog open={showNewCampagneDialog} onOpenChange={setShowNewCampagneDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle campagne</DialogTitle>
                <DialogDescription>
                  Définissez les paramètres de la nouvelle campagne de production
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="campagne-name">Nom de la campagne</Label>
                    <Input id="campagne-name" placeholder="Ex: Campagne 2026" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campagne-year">Année</Label>
                    <Input id="campagne-year" type="number" placeholder="2026" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Date de début</Label>
                    <Input id="start-date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Date de fin</Label>
                    <Input id="end-date" type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-production">Objectif production (tonnes)</Label>
                  <Input id="target-production" type="number" placeholder="1200" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="revenue-forecast">Revenus prévisionnels (FCFA)</Label>
                  <Input id="revenue-forecast" type="number" placeholder="630000" />
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowNewCampagneDialog(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-primary to-accent"
                    onClick={handleCreateCampagne}
                  >
                    Créer la campagne
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog Budget Prévisionnel */}
          <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Budget prévisionnel de la campagne</DialogTitle>
                <DialogDescription>
                  Définissez le budget pour chaque phase de la campagne
                </DialogDescription>
              </DialogHeader>
              
               <div className="mb-6 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Budget total prévisionnel</span>
                  <span className="text-2xl font-bold text-primary">{calculateTotalBudget().toLocaleString()} FCFA</span>
                </div>
              </div>

              <Tabs defaultValue="preparation-bassins" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="preparation-bassins">Préparation des bassins</TabsTrigger>
                  <TabsTrigger value="mise-en-eau">Mise en eau</TabsTrigger>
                  <TabsTrigger value="evaporation">Évaporation</TabsTrigger>
                  <TabsTrigger value="recolte-principale">Récolte principale</TabsTrigger>
                  <TabsTrigger value="traitement-stockage">Traitement et stockage</TabsTrigger>
                </TabsList>


                <TabsContent value="preparation-bassins" className="space-y-4">
                  <BudgetPhaseTab 
                    phase="preparation-bassins" 
                    expenses={phaseExpenses['preparation-bassins'] || []}
                    onAddExpense={handleAddExpense}
                    onUpdateExpense={handleUpdateExpense}
                    onDeleteExpense={handleDeleteExpense}
                  />
                </TabsContent>

                <TabsContent value="mise-en-eau" className="space-y-4">
                  <BudgetPhaseTab 
                    phase="mise-en-eau" 
                    expenses={phaseExpenses['mise-en-eau'] || []}
                    onAddExpense={handleAddExpense}
                    onUpdateExpense={handleUpdateExpense}
                    onDeleteExpense={handleDeleteExpense}
                  />
                </TabsContent>

                <TabsContent value="evaporation" className="space-y-4">
                  <BudgetPhaseTab 
                    phase="evaporation" 
                    expenses={phaseExpenses['evaporation'] || []}
                    onAddExpense={handleAddExpense}
                    onUpdateExpense={handleUpdateExpense}
                    onDeleteExpense={handleDeleteExpense}
                  />
                </TabsContent>

                <TabsContent value="recolte-principale" className="space-y-4">
                  <BudgetPhaseTab 
                    phase="recolte-principale" 
                    expenses={phaseExpenses['recolte-principale'] || []}
                    onAddExpense={handleAddExpense}
                    onUpdateExpense={handleUpdateExpense}
                    onDeleteExpense={handleDeleteExpense}
                  />
                </TabsContent>

                <TabsContent value="traitement-stockage" className="space-y-4">
                  <BudgetPhaseTab 
                    phase="traitement-stockage" 
                    expenses={phaseExpenses['traitement-stockage'] || []}
                    onAddExpense={handleAddExpense}
                    onUpdateExpense={handleUpdateExpense}
                    onDeleteExpense={handleDeleteExpense}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowBudgetDialog(false)}
                >
                  Annuler
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-primary to-accent"
                  onClick={handleSaveBudget}
                >
                  Enregistrer le budget
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default Campagne;
