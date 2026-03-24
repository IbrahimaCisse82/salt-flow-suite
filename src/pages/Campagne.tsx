import { useState, useEffect } from "react";
import { useCampagnes } from "@/hooks/useCampagnes";
import { useCampagneBudgets } from "@/hooks/useCampagneBudgets";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  DollarSign,
  Pencil,
  XCircle
} from "lucide-react";
import { StatsSkeleton } from "@/components/LoadingSkeletons/StatsSkeleton";
import { CardGridSkeleton } from "@/components/LoadingSkeletons/CardGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";

// Schéma de validation pour la campagne
const campagneSchema = z.object({
  name: z.string().min(1, "Le nom de la campagne est requis").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  year: z.number().min(2020, "L'année doit être au moins 2020").max(2100, "L'année doit être au maximum 2100"),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string().min(1, "La date de fin est requise"),
  targetProduction: z.number().min(1, "L'objectif de production doit être supérieur à 0"),
  revenueForecast: z.number().min(0, "Les revenus prévisionnels doivent être positifs"),
});

type CampagneFormData = z.infer<typeof campagneSchema>;

const Campagne = () => {
  const { toast } = useToast();
  const { isOpen } = useSidebar();
  const queryClient = useQueryClient();
  const [showNewCampagneDialog, setShowNewCampagneDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  
  // État du formulaire de création de campagne
  const [formData, setFormData] = useState<CampagneFormData>({
    name: 'Plan de campagne',
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    targetProduction: 0,
    revenueForecast: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Use custom hooks for data management
  const { activeCampagne, campagnes, createCampagne, isCreating, isLoading: campagnesLoading } = useCampagnes();
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
  
  const [phaseEndOverrides, setPhaseEndOverrides] = useState<Record<number, string>>({});
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);

  // Synchroniser l'état local avec les données persistées de la campagne active
  useEffect(() => {
    if (activeCampagne) {
      setActivePhaseIndex(activeCampagne.active_phase_index ?? 0);
      const overrides = activeCampagne.phase_end_overrides;
      if (overrides && typeof overrides === 'object' && !Array.isArray(overrides)) {
        // Convertir les clés string en number
        const parsed: Record<number, string> = {};
        for (const [key, value] of Object.entries(overrides as Record<string, string>)) {
          parsed[Number(key)] = value;
        }
        setPhaseEndOverrides(parsed);
      } else {
        setPhaseEndOverrides({});
      }
    }
  }, [activeCampagne?.id, activeCampagne?.active_phase_index, activeCampagne?.phase_end_overrides]);

  // Récupérer les statistiques de la campagne (dépend de activeCampagne)
  const { data: campagneStats, isLoading: statsLoading } = useQuery({
    queryKey: ['campagne-stats', activeCampagne?.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile) throw new Error('Profile not found');

      // Utiliser la campagne active déjà chargée
      const campagne = activeCampagne;

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

  // Mise à jour d'un champ du formulaire
  const updateFormField = <K extends keyof CampagneFormData>(field: K, value: CampagneFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validation du formulaire avant de passer au budget
  const validateAndProceed = () => {
    try {
      // Valider les données
      campagneSchema.parse(formData);
      
      // Vérifier que la date de fin est après la date de début
      if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
        setFormErrors({ endDate: "La date de fin doit être postérieure à la date de début" });
        return;
      }
      
      // Tout est valide, passer au dialogue de budget
      setFormErrors({});
      setShowNewCampagneDialog(false);
      setShowBudgetDialog(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(errors);
        toast({
          title: "Formulaire incomplet",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive"
        });
      }
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      name: '',
      year: new Date().getFullYear(),
      startDate: '',
      endDate: '',
      targetProduction: 0,
      revenueForecast: 0,
    });
    setFormErrors({});
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
      // Calculer le budget total
      const totalBudget = calculateTotalBudget();

      // Créer la campagne via le hook (qui gère tenant_id et invalidation du cache)
      const campagne = await createCampagne({
        name: formData.name,
        year: formData.year,
        start_date: formData.startDate,
        end_date: formData.endDate,
        target_production: formData.targetProduction,
        budget_total: totalBudget
      });

      if (!campagne) throw new Error("Échec de la création de la campagne");

      // Regrouper les dépenses par phase et calculer le total par phase
      const phaseTotals: Record<string, number> = {};
      const allBudgetLines: { campagne_id: string; phase: string; expense_category: string; budgeted_amount: number }[] = [];
      
      Object.entries(phaseExpenses).forEach(([phase, expenses]) => {
        const phaseTotal = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
        if (phaseTotal > 0) {
          phaseTotals[phase] = phaseTotal;
        }
        // Sauvegarder chaque ligne de dépense individuellement
        expenses.forEach(expense => {
          if (expense.description && expense.amount > 0) {
            allBudgetLines.push({
              campagne_id: campagne.id,
              phase,
              expense_category: expense.description,
              budgeted_amount: expense.amount,
            });
          }
        });
      });

      // Sauvegarder les budgets par phase (totaux)
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

      // Sauvegarder les lignes budgétaires détaillées par catégorie
      if (allBudgetLines.length > 0) {
        const { error: linesError } = await supabase
          .from('campagne_budget_lines')
          .insert(allBudgetLines);

        if (linesError) {
          console.error('Budget lines insert error:', linesError);
          throw linesError;
        }
      }

      toast({
        title: "Campagne créée avec succès",
        description: `"${formData.name}" avec un budget de ${totalBudget.toLocaleString()} FCFA`,
      });
      
      setShowBudgetDialog(false);
      // Réinitialiser les dépenses et le formulaire
      setPhaseExpenses({
        'preparation-bassins': [],
        'mise-en-eau': [],
        'evaporation': [],
        'recolte-principale': [],
        'traitement-stockage': []
      });
      resetForm();

      // Invalider les queries pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['campagnes'] });
      queryClient.invalidateQueries({ queryKey: ['active-campagne'] });
      queryClient.invalidateQueries({ queryKey: ['campagne-stats'] });
    } catch (error) {
      logger.error('Error saving budget:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer la campagne",
        variant: "destructive"
      });
    }
  };

  const getPhaseStatus = (index: number) => {
    if (index < activePhaseIndex) return "completed";
    if (index === activePhaseIndex) return "active";
    return "upcoming";
  };

  const persistPhaseState = async (newIndex: number, newOverrides: Record<number, string>) => {
    if (!activeCampagne?.id) return;
    await supabase
      .from('campagnes')
      .update({
        active_phase_index: newIndex,
        phase_end_overrides: newOverrides,
      })
      .eq('id', activeCampagne.id);
    queryClient.invalidateQueries({ queryKey: ['active-campagne'] });
    queryClient.invalidateQueries({ queryKey: ['campagnes'] });
  };

  const togglePhaseCompletion = async (index: number) => {
    const status = getPhaseStatus(index);
    
    if (status === "active") {
      if (index < 4) {
        const today = new Date().toISOString().split('T')[0];
        const newOverrides = { ...phaseEndOverrides, [index]: today };
        const newIndex = index + 1;
        setPhaseEndOverrides(newOverrides);
        setActivePhaseIndex(newIndex);
        await persistPhaseState(newIndex, newOverrides);
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
      setActivePhaseIndex(index);
      await persistPhaseState(index, phaseEndOverrides);
      toast({
        title: "Passage à la phase suivante",
        description: `Phase active mise à jour.`,
      });
    } else if (status === "completed" && index === activePhaseIndex - 1) {
      const newOverrides = { ...phaseEndOverrides };
      delete newOverrides[index];
      setPhaseEndOverrides(newOverrides);
      setActivePhaseIndex(index);
      await persistPhaseState(index, newOverrides);
      toast({
        title: "Retour à la phase précédente",
        description: `Phase active mise à jour.`,
      });
    }
  };
  // Calculer les phases dynamiquement, en tenant compte des phases clôturées (overrides)
  const phases = (() => {
    const phaseNames = [
      "Préparation des bassins",
      "Mise en eau", 
      "Évaporation",
      "Récolte principale",
      "Traitement et stockage",
    ];

    if (!activeCampagne?.start_date || !activeCampagne?.end_date) {
      return phaseNames.map(name => ({ name, startDate: "", endDate: "" }));
    }

    const start = new Date(activeCampagne.start_date);
    const end = new Date(activeCampagne.end_date);
    const baseRatios = [0.10, 0.05, 0.45, 0.25, 0.15];
    
    const result: { name: string; startDate: string; endDate: string }[] = [];
    let currentDate = new Date(start);
    
    for (let i = 0; i < phaseNames.length; i++) {
      const phaseStart = new Date(currentDate);

      // Si cette phase a un override (clôturée manuellement), utiliser cette date de fin
      if (phaseEndOverrides[i]) {
        const overrideEnd = new Date(phaseEndOverrides[i]);
        result.push({
          name: phaseNames[i],
          startDate: phaseStart.toISOString().split('T')[0],
          endDate: overrideEnd.toISOString().split('T')[0],
        });
        currentDate = new Date(overrideEnd);
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Pour les phases restantes, redistribuer le temps restant proportionnellement
      const remainingDays = Math.max(1, Math.round((end.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));
      const remainingRatioSum = baseRatios.slice(i).reduce((a, b) => a + b, 0);
      const phaseDays = Math.round(remainingDays * (baseRatios[i] / remainingRatioSum));
      
      const phaseEnd = new Date(currentDate);
      phaseEnd.setDate(phaseEnd.getDate() + Math.max(1, phaseDays - 1));
      
      if (i === phaseNames.length - 1) {
        phaseEnd.setTime(end.getTime());
      }
      
      result.push({
        name: phaseNames[i],
        startDate: phaseStart.toISOString().split('T')[0],
        endDate: phaseEnd.toISOString().split('T')[0],
      });
      
      currentDate = new Date(phaseEnd);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
  })();

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
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">
                {activeCampagne ? `${activeCampagne.name}${activeCampagne.year ? ` ${activeCampagne.year}` : ''}` : "Plan de campagne"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground break-words">
                {activeCampagne 
                  ? "Planification et suivi de la campagne saline en cours" 
                  : "Aucune campagne active - Créez un nouveau plan de campagne"}
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
              ) : activeCampagne ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">Période</p>
                    <p className="text-sm sm:text-lg font-semibold break-words">
                      {activeCampagne.start_date && activeCampagne.end_date ? 
                        `${new Date(activeCampagne.start_date).toLocaleDateString('fr-FR', { month: 'short' })} - ${new Date(activeCampagne.end_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}` 
                        : `${activeCampagne.year}`
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {activeCampagne.status === 'en_cours' ? 'En cours' : 
                       activeCampagne.status === 'terminee' ? 'Terminée' : 
                       'Planification'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Progression globale</p>
                    <p className="text-lg font-semibold">
                      {activeCampagne.target_production && campagneStats?.totalProduction !== undefined ? 
                        Math.round((campagneStats.totalProduction / Number(activeCampagne.target_production)) * 100) 
                        : 0}%
                    </p>
                    <Progress 
                      value={activeCampagne.target_production && campagneStats?.totalProduction !== undefined ? 
                        Math.min(100, Math.round((campagneStats.totalProduction / Number(activeCampagne.target_production)) * 100))
                        : 0
                      } 
                      className="mt-2" 
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Objectif production</p>
                    <p className="text-lg font-semibold">
                      {activeCampagne.target_production ? 
                        Number(activeCampagne.target_production).toLocaleString() 
                        : '0'} tonnes
                    </p>
                    <p className="text-xs text-primary mt-1">
                      {campagneStats?.totalProduction?.toLocaleString() || 0} t réalisées (
                      {activeCampagne.target_production && campagneStats?.totalProduction !== undefined ? 
                        Math.round((campagneStats.totalProduction / Number(activeCampagne.target_production)) * 100) 
                        : 0}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Budget prévisionnel</p>
                    <p className="text-lg font-semibold">
                      {activeCampagne.budget_total ? 
                        Number(activeCampagne.budget_total).toLocaleString() 
                        : '0'} FCFA
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {campagneStats?.totalExpenses ? 
                        `${campagneStats.totalExpenses.toLocaleString()} FCFA dépensés` 
                        : 'Budget total des phases'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Aucune campagne active</p>
                  <p className="text-sm">Créez un nouveau plan de campagne pour commencer</p>
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
                    {(campagneStats?.localSales ?? 0).toLocaleString()} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Export</span>
                  <span className="font-semibold">
                    {(campagneStats?.exportSales ?? 0).toLocaleString()} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-bold text-lg text-green-600">
                    {(campagneStats?.totalRevenue ?? 0).toLocaleString()} FCFA
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
          <Dialog open={showNewCampagneDialog} onOpenChange={(open) => {
            setShowNewCampagneDialog(open);
            if (!open) resetForm();
          }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle campagne</DialogTitle>
                <DialogDescription>
                  Définissez les paramètres de la nouvelle campagne de production. Tous les champs sont obligatoires.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="campagne-name">
                      Nom de la campagne
                    </Label>
                    <Input 
                      id="campagne-name" 
                      value="Plan de campagne"
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campagne-year">
                      Année <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      id="campagne-year" 
                      type="number" 
                      placeholder="2026"
                      value={formData.year || ''}
                      onChange={(e) => updateFormField('year', parseInt(e.target.value) || 0)}
                      className={formErrors.year ? "border-destructive" : ""}
                    />
                    {formErrors.year && (
                      <p className="text-xs text-destructive">{formErrors.year}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">
                      Date de début <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      id="start-date" 
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => updateFormField('startDate', e.target.value)}
                      className={formErrors.startDate ? "border-destructive" : ""}
                    />
                    {formErrors.startDate && (
                      <p className="text-xs text-destructive">{formErrors.startDate}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">
                      Date de fin <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      id="end-date" 
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => updateFormField('endDate', e.target.value)}
                      className={formErrors.endDate ? "border-destructive" : ""}
                    />
                    {formErrors.endDate && (
                      <p className="text-xs text-destructive">{formErrors.endDate}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-production">
                    Objectif production (tonnes) <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="target-production" 
                    type="number" 
                    placeholder="1200"
                    value={formData.targetProduction || ''}
                    onChange={(e) => updateFormField('targetProduction', parseFloat(e.target.value) || 0)}
                    className={formErrors.targetProduction ? "border-destructive" : ""}
                  />
                  {formErrors.targetProduction && (
                    <p className="text-xs text-destructive">{formErrors.targetProduction}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="revenue-forecast">
                    Revenus prévisionnels (FCFA) <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="revenue-forecast" 
                    type="number" 
                    placeholder="630000"
                    value={formData.revenueForecast || ''}
                    onChange={(e) => updateFormField('revenueForecast', parseFloat(e.target.value) || 0)}
                    className={formErrors.revenueForecast ? "border-destructive" : ""}
                  />
                  {formErrors.revenueForecast && (
                    <p className="text-xs text-destructive">{formErrors.revenueForecast}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setShowNewCampagneDialog(false);
                      resetForm();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-primary to-accent"
                    onClick={validateAndProceed}
                  >
                    Continuer vers le budget
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
