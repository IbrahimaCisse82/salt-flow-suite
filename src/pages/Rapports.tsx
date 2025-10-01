import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetTrackingTab } from "@/components/Campaign/BudgetTrackingTab";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  FileSpreadsheet
} from "lucide-react";

const reportTypes = [
  {
    title: "Rapport de campagne",
    description: "Bilan complet de la campagne saline",
    icon: FileText,
    color: "text-primary",
    bg: "bg-primary/10",
    available: true
  },
  {
    title: "États financiers",
    description: "Bilan, compte de résultat SYSCOHADA",
    icon: FileSpreadsheet,
    color: "text-green-600",
    bg: "bg-green-500/10",
    available: true
  },
  {
    title: "Analyse production",
    description: "Rendements, qualité, coûts par bassin",
    icon: BarChart3,
    color: "text-accent",
    bg: "bg-accent/10",
    available: true
  },
  {
    title: "Performance RH",
    description: "Productivité équipes, présence, salaires",
    icon: TrendingUp,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    available: true
  },
  {
    title: "Analyse commerciale",
    description: "Ventes, clients, marges par produit",
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    available: true
  },
  {
    title: "Conformité réglementaire",
    description: "Certifications, analyses qualité, export",
    icon: FileText,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
    available: false
  },
];

const recentReports = [
  {
    name: "Rapport mensuel Mars 2025",
    type: "Campagne",
    date: "2025-03-15",
    size: "2.4 MB",
    format: "PDF"
  },
  {
    name: "Bilan financier Q1 2025",
    type: "Financier",
    date: "2025-03-10",
    size: "1.8 MB",
    format: "Excel"
  },
  {
    name: "Analyse production Février",
    type: "Production",
    date: "2025-03-01",
    size: "3.1 MB",
    format: "PDF"
  },
  {
    name: "Performance équipes Février",
    type: "RH",
    date: "2025-03-01",
    size: "980 KB",
    format: "PDF"
  },
];

const Rapports = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Rapports & Analyses</h1>
              <p className="text-muted-foreground">
                Générez et consultez vos rapports d'activité
              </p>
            </div>
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
              <Calendar className="h-4 w-4" />
              Planifier rapport
            </Button>
          </div>

          <Tabs defaultValue="rapports" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="rapports">Rapports</TabsTrigger>
              <TabsTrigger value="suivi-budget">Suivi budgétaire</TabsTrigger>
            </TabsList>

            <TabsContent value="rapports" className="space-y-6">
              {/* Types de rapports */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTypes.map((report, index) => (
                  <Card 
                    key={index}
                    className={`hover:shadow-lg transition-all ${
                      !report.available && "opacity-60"
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className={`h-12 w-12 rounded-xl ${report.bg} flex items-center justify-center mb-4`}>
                        <report.icon className={`h-6 w-6 ${report.color}`} />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {report.description}
                      </p>
                      {report.available ? (
                        <Button variant="outline" className="w-full gap-2">
                          <Download className="h-4 w-4" />
                          Générer
                        </Button>
                      ) : (
                        <Badge variant="outline" className="w-full justify-center">
                          Bientôt disponible
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Rapports récents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Rapports récents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentReports.map((report, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{report.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {report.type} • {report.date} • {report.size}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{report.format}</Badge>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Télécharger
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Indicateurs clés */}
              <Card>
                <CardHeader>
                  <CardTitle>Indicateurs de performance - Mars 2025</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground">Production</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Production totale</span>
                          <span className="font-semibold">438 tonnes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Rendement moyen</span>
                          <span className="font-semibold">4.2 t/ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Qualité A+</span>
                          <span className="font-semibold text-green-600">87%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground">Commercial</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Chiffre d'affaires</span>
                          <span className="font-semibold">128,000 FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Commandes</span>
                          <span className="font-semibold">48</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Croissance</span>
                          <span className="font-semibold text-green-600">+18%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground">Ressources</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Employés actifs</span>
                          <span className="font-semibold">42</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Productivité</span>
                          <span className="font-semibold">92%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Bassins actifs</span>
                          <span className="font-semibold">4/8</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suivi-budget">
              <BudgetTrackingTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Rapports;
