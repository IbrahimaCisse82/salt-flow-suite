import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { BudgetPhaseTab, BudgetExpense } from "@/components/Campaign/BudgetPhaseTab";
import { 
  Calendar, 
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";

const Campagne = () => {
  const { toast } = useToast();
  const [showNewCampagneDialog, setShowNewCampagneDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
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
  
  const [activePhaseIndex, setActivePhaseIndex] = useState(2); // Index de la phase en cours (Évaporation)

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

  const handleSaveBudget = () => {
    toast({
      title: "Budget enregistré",
      description: `Le budget prévisionnel de ${calculateTotalBudget().toLocaleString()} FCFA a été enregistré avec succès`,
    });
    setShowBudgetDialog(false);
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
        
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Plan de Campagne 2025</h1>
              <p className="text-muted-foreground">
                Planification et suivi de la campagne saline en cours
              </p>
            </div>
            <Button 
              className="gap-2 bg-gradient-to-r from-primary to-accent"
              onClick={() => setShowNewCampagneDialog(true)}
            >
              <Calendar className="h-4 w-4" />
              Nouvelle campagne
            </Button>
          </div>

          {/* Vue d'ensemble */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Période</p>
                  <p className="text-lg font-semibold">Jan - Nov 2025</p>
                  <p className="text-xs text-muted-foreground mt-1">11 mois</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Progression globale</p>
                  <p className="text-lg font-semibold">42%</p>
                  <Progress value={42} className="mt-2" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Objectif production</p>
                  <p className="text-lg font-semibold">1,200 tonnes</p>
                  <p className="text-xs text-green-600 mt-1">438 t réalisées (36%)</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Budget prévisionnel</p>
                  <p className="text-lg font-semibold">{calculateTotalBudget().toLocaleString()} FCFA</p>
                  <p className="text-xs text-muted-foreground mt-1">Budget total des 4 phases</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objectifs principaux */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Objectifs de production
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sel gros</span>
                  <span className="font-semibold">600 t</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sel fin</span>
                  <span className="font-semibold">400 t</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sel iodé</span>
                  <span className="font-semibold">200 t</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  Revenus prévisionnels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ventes locales</span>
                  <span className="font-semibold">280,000 FCFA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Export</span>
                  <span className="font-semibold">350,000 FCFA</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-bold text-lg">630,000 FCFA</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Coûts prévisionnels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Main d'œuvre</span>
                  <span className="font-semibold">180,000 FCFA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Intrants</span>
                  <span className="font-semibold">120,000 FCFA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Infrastructure</span>
                  <span className="font-semibold">150,000 FCFA</span>
                </div>
              </CardContent>
            </Card>
          </div>

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
