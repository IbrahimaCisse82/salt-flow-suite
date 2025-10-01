import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetTrackingTab } from "@/components/Campaign/BudgetTrackingTab";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Loader2
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
  const { toast } = useToast();
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  // Récupérer les données pour les rapports
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

  const { data: productionRecords = [] } = useQuery({
    queryKey: ['production-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_records')
        .select(`
          *,
          bassin:bassins(name, code),
          campagne:campagnes(name)
        `)
        .order('date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          account:accounts(name)
        `)
        .order('date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          client:clients(name, client_type)
        `)
        .order('sale_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    }
  });

  const generateCampaignReport = () => {
    setGeneratingReport("campagne");
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // En-tête
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Rapport de Campagne Saline", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 28, { align: "center" });
      
      let yPos = 40;
      
      // Statistiques générales
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Vue d'ensemble", 14, yPos);
      yPos += 10;
      
      const totalProduction = productionRecords.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
      const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
      
      doc.setFontSize(10);
      doc.text(`Nombre de campagnes: ${campagnes.length}`, 14, yPos);
      yPos += 6;
      doc.text(`Production totale: ${totalProduction.toFixed(2)} tonnes`, 14, yPos);
      yPos += 6;
      doc.text(`Chiffre d'affaires: ${totalRevenue.toLocaleString()} FCFA`, 14, yPos);
      yPos += 6;
      doc.text(`Nombre d'employés: ${employees.length}`, 14, yPos);
      yPos += 15;
      
      // Tableau des campagnes
      if (campagnes.length > 0) {
        doc.setFontSize(14);
        doc.text("Détail des campagnes", 14, yPos);
        yPos += 5;
        
        autoTable(doc, {
          startY: yPos,
          head: [['Nom', 'Année', 'Statut', 'Production cible', 'Production réelle']],
          body: campagnes.map(c => [
            c.name || 'N/A',
            c.year || 'N/A',
            c.status || 'N/A',
            `${Number(c.target_production || 0).toFixed(2)} t`,
            `${Number(c.actual_production || 0).toFixed(2)} t`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
        });
      }
      
      doc.save(`rapport-campagne-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Rapport généré",
        description: "Le rapport de campagne a été téléchargé",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const generateFinancialReport = () => {
    setGeneratingReport("financier");
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(20);
      doc.text("États Financiers SYSCOHADA", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 28, { align: "center" });
      
      let yPos = 40;
      
      // Statistiques financières
      const totalExpenses = transactions.filter(t => t.transaction_type === 'depense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const totalRevenue = transactions.filter(t => ['vente_locale', 'vente_export'].includes(t.transaction_type)).reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const netResult = totalRevenue - totalExpenses;
      
      doc.setFontSize(14);
      doc.text("Compte de résultat", 14, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.text(`Total des produits: ${totalRevenue.toLocaleString()} FCFA`, 14, yPos);
      yPos += 6;
      doc.text(`Total des charges: ${totalExpenses.toLocaleString()} FCFA`, 14, yPos);
      yPos += 6;
      doc.setFont(undefined, 'bold');
      doc.text(`Résultat net: ${netResult.toLocaleString()} FCFA`, 14, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 15;
      
      // Tableau des transactions récentes
      if (transactions.length > 0) {
        doc.setFontSize(14);
        doc.text("Transactions récentes", 14, yPos);
        yPos += 5;
        
        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Type', 'Description', 'Montant (FCFA)']],
          body: transactions.slice(0, 20).map(t => [
            t.date || 'N/A',
            t.transaction_type || 'N/A',
            t.description || 'N/A',
            Number(t.amount || 0).toLocaleString()
          ]),
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94] },
        });
      }
      
      doc.save(`etats-financiers-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Rapport généré",
        description: "Les états financiers ont été téléchargés",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const generateProductionReport = () => {
    setGeneratingReport("production");
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(20);
      doc.text("Analyse de Production", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 28, { align: "center" });
      
      let yPos = 40;
      
      const totalProduction = productionRecords.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
      const avgQuality = productionRecords.reduce((sum, p) => sum + Number(p.quality_grade || 0), 0) / (productionRecords.length || 1);
      
      doc.setFontSize(14);
      doc.text("Statistiques de production", 14, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.text(`Production totale: ${totalProduction.toFixed(2)} tonnes`, 14, yPos);
      yPos += 6;
      doc.text(`Qualité moyenne: ${avgQuality.toFixed(1)}/10`, 14, yPos);
      yPos += 6;
      doc.text(`Nombre d'enregistrements: ${productionRecords.length}`, 14, yPos);
      yPos += 15;
      
      if (productionRecords.length > 0) {
        doc.setFontSize(14);
        doc.text("Détail de la production", 14, yPos);
        yPos += 5;
        
        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Bassin', 'Type', 'Quantité (t)', 'Qualité']],
          body: productionRecords.slice(0, 25).map(p => [
            p.date || 'N/A',
            p.bassin?.name || 'N/A',
            p.salt_type || 'N/A',
            Number(p.quantity || 0).toFixed(2),
            p.quality_grade || 'N/A'
          ]),
          theme: 'striped',
          headStyles: { fillColor: [249, 115, 22] },
        });
      }
      
      doc.save(`analyse-production-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Rapport généré",
        description: "L'analyse de production a été téléchargée",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const generateHRReport = () => {
    setGeneratingReport("rh");
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(20);
      doc.text("Performance Ressources Humaines", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 28, { align: "center" });
      
      let yPos = 40;
      
      const totalSalary = employees.reduce((sum, e) => sum + Number(e.salary || 0), 0);
      
      doc.setFontSize(14);
      doc.text("Vue d'ensemble RH", 14, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.text(`Nombre d'employés actifs: ${employees.length}`, 14, yPos);
      yPos += 6;
      doc.text(`Masse salariale totale: ${totalSalary.toLocaleString()} FCFA`, 14, yPos);
      yPos += 15;
      
      if (employees.length > 0) {
        doc.setFontSize(14);
        doc.text("Liste des employés", 14, yPos);
        yPos += 5;
        
        autoTable(doc, {
          startY: yPos,
          head: [['Nom', 'Prénom', 'Poste', 'Type', 'Salaire']],
          body: employees.map(e => [
            e.last_name || 'N/A',
            e.first_name || 'N/A',
            e.position || 'N/A',
            e.employee_type || 'N/A',
            `${Number(e.salary || 0).toLocaleString()} FCFA`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [168, 85, 247] },
        });
      }
      
      doc.save(`performance-rh-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Rapport généré",
        description: "Le rapport RH a été téléchargé",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const generateCommercialReport = () => {
    setGeneratingReport("commercial");
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(20);
      doc.text("Analyse Commerciale", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 28, { align: "center" });
      
      let yPos = 40;
      
      const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
      const totalQuantity = sales.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
      
      doc.setFontSize(14);
      doc.text("Statistiques commerciales", 14, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.text(`Nombre de ventes: ${sales.length}`, 14, yPos);
      yPos += 6;
      doc.text(`Chiffre d'affaires: ${totalRevenue.toLocaleString()} FCFA`, 14, yPos);
      yPos += 6;
      doc.text(`Quantité totale vendue: ${totalQuantity.toFixed(2)} tonnes`, 14, yPos);
      yPos += 15;
      
      if (sales.length > 0) {
        doc.setFontSize(14);
        doc.text("Détail des ventes", 14, yPos);
        yPos += 5;
        
        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Client', 'Type sel', 'Quantité (t)', 'Montant']],
          body: sales.slice(0, 25).map(s => [
            s.sale_date || 'N/A',
            s.client?.name || 'N/A',
            s.salt_type || 'N/A',
            Number(s.quantity || 0).toFixed(2),
            `${Number(s.total_amount || 0).toLocaleString()} FCFA`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235] },
        });
      }
      
      doc.save(`analyse-commerciale-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Rapport généré",
        description: "L'analyse commerciale a été téléchargée",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleGenerateReport = (reportTitle: string) => {
    switch(reportTitle) {
      case "Rapport de campagne":
        generateCampaignReport();
        break;
      case "États financiers":
        generateFinancialReport();
        break;
      case "Analyse production":
        generateProductionReport();
        break;
      case "Performance RH":
        generateHRReport();
        break;
      case "Analyse commerciale":
        generateCommercialReport();
        break;
      default:
        toast({
          title: "Non disponible",
          description: "Ce rapport sera bientôt disponible",
        });
    }
  };

  const handleDownloadRecent = (report: any) => {
    toast({
      title: "Téléchargement simulé",
      description: `Téléchargement de ${report.name}`,
    });
  };

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
                        <Button 
                          variant="outline" 
                          className="w-full gap-2"
                          onClick={() => handleGenerateReport(report.title)}
                          disabled={generatingReport === report.title.toLowerCase().split(' ')[0]}
                        >
                          {generatingReport === report.title.toLowerCase().split(' ')[0] ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Génération...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Générer PDF
                            </>
                          )}
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => handleDownloadRecent(report)}
                          >
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
