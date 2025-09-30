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

  const handleCreateCampagne = () => {
    setShowNewCampagneDialog(false);
    setShowBudgetDialog(true);
  };

  const handleSaveBudget = () => {
    toast({
      title: "Budget enregistré",
      description: "Le budget prévisionnel de la campagne a été enregistré avec succès",
    });
    setShowBudgetDialog(false);
  };
  const phases = [
    { 
      name: "Préparation des bassins", 
      status: "completed", 
      progress: 100, 
      startDate: "2025-01-01",
      endDate: "2025-01-31"
    },
    { 
      name: "Mise en eau", 
      status: "completed", 
      progress: 100, 
      startDate: "2025-02-01",
      endDate: "2025-02-15"
    },
    { 
      name: "Évaporation", 
      status: "active", 
      progress: 65, 
      startDate: "2025-02-16",
      endDate: "2025-06-30"
    },
    { 
      name: "Récolte principale", 
      status: "upcoming", 
      progress: 0, 
      startDate: "2025-07-01",
      endDate: "2025-09-30"
    },
    { 
      name: "Traitement et stockage", 
      status: "upcoming", 
      progress: 0, 
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
                  <p className="text-sm text-muted-foreground mb-1">Budget alloué</p>
                  <p className="text-lg font-semibold">450,000 FCFA</p>
                  <p className="text-xs text-muted-foreground mt-1">187,500 FCFA dépensés</p>
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
              {phases.map((phase, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {phase.status === "completed" && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {phase.status === "active" && (
                        <div className="h-5 w-5 rounded-full bg-primary animate-pulse" />
                      )}
                      {phase.status === "upcoming" && (
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-semibold">{phase.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {phase.startDate} → {phase.endDate}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline"
                      className={
                        phase.status === "completed" 
                          ? "border-green-600 text-green-700"
                          : phase.status === "active"
                          ? "border-primary text-primary"
                          : "border-muted-foreground text-muted-foreground"
                      }
                    >
                      {phase.status === "completed" && "Complété"}
                      {phase.status === "active" && "En cours"}
                      {phase.status === "upcoming" && "À venir"}
                    </Badge>
                  </div>
                  <Progress 
                    value={phase.progress} 
                    className={
                      phase.status === "completed" 
                        ? "[&>div]:bg-green-600"
                        : phase.status === "active"
                        ? "[&>div]:bg-primary"
                        : ""
                    }
                  />
                </div>
              ))}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target-production">Objectif production (tonnes)</Label>
                    <Input id="target-production" type="number" placeholder="1200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget total (FCFA)</Label>
                    <Input id="budget" type="number" placeholder="450000" />
                  </div>
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
              
              <Tabs defaultValue="amenagement" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="amenagement">Aménagement</TabsTrigger>
                  <TabsTrigger value="mise-en-eau">Mise en eau</TabsTrigger>
                  <TabsTrigger value="cristallisation">Cristallisation</TabsTrigger>
                  <TabsTrigger value="recolte">Récolte</TabsTrigger>
                </TabsList>

                <TabsContent value="amenagement" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amenagement-main-oeuvre">Main d'œuvre (FCFA)</Label>
                        <Input id="amenagement-main-oeuvre" type="number" placeholder="50000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amenagement-equipements">Équipements (FCFA)</Label>
                        <Input id="amenagement-equipements" type="number" placeholder="30000" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amenagement-materiaux">Matériaux (FCFA)</Label>
                        <Input id="amenagement-materiaux" type="number" placeholder="40000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amenagement-autres">Autres dépenses (FCFA)</Label>
                        <Input id="amenagement-autres" type="number" placeholder="10000" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="mise-en-eau" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mise-en-eau-main-oeuvre">Main d'œuvre (FCFA)</Label>
                        <Input id="mise-en-eau-main-oeuvre" type="number" placeholder="25000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mise-en-eau-energie">Énergie (FCFA)</Label>
                        <Input id="mise-en-eau-energie" type="number" placeholder="20000" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mise-en-eau-entretien">Entretien (FCFA)</Label>
                        <Input id="mise-en-eau-entretien" type="number" placeholder="15000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mise-en-eau-autres">Autres dépenses (FCFA)</Label>
                        <Input id="mise-en-eau-autres" type="number" placeholder="10000" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="cristallisation" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cristallisation-main-oeuvre">Main d'œuvre (FCFA)</Label>
                        <Input id="cristallisation-main-oeuvre" type="number" placeholder="60000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cristallisation-surveillance">Surveillance (FCFA)</Label>
                        <Input id="cristallisation-surveillance" type="number" placeholder="30000" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cristallisation-entretien">Entretien (FCFA)</Label>
                        <Input id="cristallisation-entretien" type="number" placeholder="20000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cristallisation-autres">Autres dépenses (FCFA)</Label>
                        <Input id="cristallisation-autres" type="number" placeholder="15000" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="recolte" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recolte-main-oeuvre">Main d'œuvre (FCFA)</Label>
                        <Input id="recolte-main-oeuvre" type="number" placeholder="80000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recolte-equipements">Équipements (FCFA)</Label>
                        <Input id="recolte-equipements" type="number" placeholder="40000" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recolte-transport">Transport (FCFA)</Label>
                        <Input id="recolte-transport" type="number" placeholder="35000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recolte-stockage">Stockage (FCFA)</Label>
                        <Input id="recolte-stockage" type="number" placeholder="25000" />
                      </div>
                    </div>
                  </div>
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
