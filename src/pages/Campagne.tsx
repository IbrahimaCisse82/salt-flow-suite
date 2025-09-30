import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
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
        </main>
      </div>
    </div>
  );
};

export default Campagne;
