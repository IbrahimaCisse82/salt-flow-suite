import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { CardGridSkeleton } from "@/components/LoadingSkeletons/CardGridSkeleton";
import { StatsSkeleton } from "@/components/LoadingSkeletons/StatsSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BudgetTrackingTab } from "@/components/Campaign/BudgetTrackingTab";
import { PredictiveAnalysisCard } from "@/components/Analytics/PredictiveAnalysisCard";
import { PeriodComparisonCard } from "@/components/Analytics/PeriodComparisonCard";
import { ProductionHeatmap } from "@/components/Analytics/ProductionHeatmap";
import { ScheduledReportsManager } from "@/components/Analytics/ScheduledReportsManager";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useScheduledReports, ReportType, ReportFrequency } from "@/hooks/useScheduledReports";
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


const Rapports = () => {
  const { toast } = useToast();
  const { isOpen } = useSidebar();
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  
  // Hook for scheduled reports with real persistence
  const { createReport } = useScheduledReports();
  
  // Form state for scheduling
  const [scheduleFormData, setScheduleFormData] = useState({
    reportType: "" as ReportType | "",
    frequency: "" as ReportFrequency | "",
    startDate: "",
    scheduleTime: "09:00",
    recipientEmail: ""
  });

  // Récupérer les données pour les rapports
  const { data: campagnes = [], isLoading: campagnesLoading } = useQuery({
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

  const { data: productionRecords = [], isLoading: productionLoading } = useQuery({
    queryKey: ['production-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_records')
        .select(`
          *,
          bassin:bassins(name, code),
          campagne:campagnes(name)
        `)
        .order('production_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          account:accounts(account_name)
        `)
        .order('transaction_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: sales = [], isLoading: salesLoading } = useQuery({
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

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
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
            t.transaction_date || 'N/A',
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
            p.production_date || 'N/A',
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
          head: [['Nom', 'Poste', 'Type', 'Salaire']],
          body: employees.map(e => [
            e.full_name || 'N/A',
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

  // Fetch recent financial reports from DB
  const { data: recentFinancialReports = [] } = useQuery({
    queryKey: ['recent-financial-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_reports')
        .select('id, report_type, period_start, period_end, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    }
  });

  const handleScheduleReport = () => {
    setIsScheduleDialogOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scheduleFormData.reportType || !scheduleFormData.frequency || !scheduleFormData.startDate) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await createReport.mutateAsync({
        report_type: scheduleFormData.reportType as ReportType,
        frequency: scheduleFormData.frequency as ReportFrequency,
        schedule_time: scheduleFormData.scheduleTime,
        start_date: scheduleFormData.startDate,
        recipient_emails: scheduleFormData.recipientEmail ? [scheduleFormData.recipientEmail] : []
      });
      
      setIsScheduleDialogOpen(false);
      setScheduleFormData({
        reportType: "",
        frequency: "",
        startDate: "",
        scheduleTime: "09:00",
        recipientEmail: ""
      });
    } catch (error) {
      console.error("Schedule report error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className={cn(
          "flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 transition-all duration-300",
          isOpen ? "md:ml-64" : "md:ml-16"
        )}>
          {/* Dialog Planifier rapport */}
          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Planifier un rapport automatique</DialogTitle>
                <DialogDescription>
                  Configurez la génération automatique de vos rapports
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Type de rapport</Label>
                  <Select 
                    value={scheduleFormData.reportType} 
                    onValueChange={(value) => setScheduleFormData({...scheduleFormData, reportType: value as ReportType})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campagne">Rapport de campagne</SelectItem>
                      <SelectItem value="financier">États financiers</SelectItem>
                      <SelectItem value="production">Analyse production</SelectItem>
                      <SelectItem value="rh">Performance RH</SelectItem>
                      <SelectItem value="commercial">Analyse commerciale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Fréquence</Label>
                  <Select 
                    value={scheduleFormData.frequency} 
                    onValueChange={(value) => setScheduleFormData({...scheduleFormData, frequency: value as ReportFrequency})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner la fréquence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="quarterly">Trimestriel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Date de début</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={scheduleFormData.startDate}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, startDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Heure</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduleFormData.scheduleTime}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, scheduleTime: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email de notification</Label>
                  <Input
                    id="email"
                    type="email"
                    value={scheduleFormData.recipientEmail}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, recipientEmail: e.target.value})}
                    placeholder="exemple@email.com"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent">
                    Planifier
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Rapports & Analyses</h1>
              <p className="text-muted-foreground">
                Générez et consultez vos rapports d'activité
              </p>
            </div>
            <Button onClick={handleScheduleReport} className="gap-2 bg-gradient-to-r from-primary to-accent">
              <Calendar className="h-4 w-4" />
              Planifier rapport
            </Button>
          </div>

          <Tabs defaultValue="rapports" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 max-w-3xl">
              <TabsTrigger value="rapports">Rapports</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="suivi-budget">Suivi budgétaire</TabsTrigger>
              <TabsTrigger value="flux-tresorerie">Flux de trésorerie</TabsTrigger>
            </TabsList>

            <TabsContent value="rapports" className="space-y-6">
              {/* Types de rapports */}
              {(campagnesLoading || productionLoading || transactionsLoading || salesLoading || employeesLoading) ? (
                <CardGridSkeleton cards={6} columns={3} />
              ) : (
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
                          disabled={generatingReport !== null}
                        >
                          {generatingReport !== null ? (
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
              )}

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
                    {recentFinancialReports.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        Aucun rapport généré. Utilisez les boutons ci-dessus pour créer un rapport.
                      </p>
                    ) : (
                      recentFinancialReports.map((report) => {
                        const typeLabel = report.report_type === 'bilan' ? 'Bilan' : report.report_type === 'compte_resultat' ? 'Compte de résultat' : report.report_type;
                        return (
                          <div 
                            key={report.id}
                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{typeLabel}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(report.period_start).toLocaleDateString('fr-FR')} - {new Date(report.period_end).toLocaleDateString('fr-FR')} • {new Date(report.created_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge variant={report.status === 'validated' ? 'default' : 'outline'}>
                                {report.status === 'validated' ? 'Validé' : 'Brouillon'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Indicateurs clés */}
              <Card>
                <CardHeader>
                  <CardTitle>Indicateurs de performance - Mars 2025</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground">Production</h3>
                      <div className="space-y-2">
                        {(() => {
                          const totalProd = productionRecords.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
                          const qualityAPlus = productionRecords.filter(p => p.quality_grade === 'A+').length;
                          const qualityPct = productionRecords.length > 0 ? Math.round((qualityAPlus / productionRecords.length) * 100) : 0;
                          return (
                            <>
                              <div className="flex justify-between">
                                <span className="text-sm">Production totale</span>
                                <span className="font-semibold">{Math.round(totalProd)} tonnes</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Enregistrements</span>
                                <span className="font-semibold">{productionRecords.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Qualité A+</span>
                                <span className="font-semibold text-green-600">{qualityPct}%</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground">Commercial</h3>
                      <div className="space-y-2">
                        {(() => {
                          const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
                          return (
                            <>
                              <div className="flex justify-between">
                                <span className="text-sm">Chiffre d'affaires</span>
                                <span className="font-semibold">{totalRevenue.toLocaleString()} FCFA</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Ventes</span>
                                <span className="font-semibold">{sales.length}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground">Ressources</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Employés actifs</span>
                          <span className="font-semibold">{employees.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Masse salariale</span>
                          <span className="font-semibold">{employees.reduce((sum, e) => sum + Number(e.salary || 0), 0).toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <ScheduledReportsManager />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PredictiveAnalysisCard />
                <PeriodComparisonCard />
              </div>

              <ProductionHeatmap />
            </TabsContent>

            <TabsContent value="suivi-budget">
              <BudgetTrackingTab />
            </TabsContent>

            <TabsContent value="flux-tresorerie">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Tableau de flux de trésorerie mensuels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Calculer les flux de trésorerie par mois
                    const cashFlowByMonth = transactions.reduce((acc: any, transaction) => {
                      const date = new Date(transaction.transaction_date);
                      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                      
                      if (!acc[monthKey]) {
                        acc[monthKey] = {
                          month: monthKey,
                          entrees: 0,
                          sorties: 0,
                          solde: 0
                        };
                      }
                      
                      const amount = Number(transaction.amount || 0);
                      
                      if (['vente_locale', 'vente_export'].includes(transaction.transaction_type)) {
                        acc[monthKey].entrees += amount;
                      } else if (transaction.transaction_type === 'depense') {
                        acc[monthKey].sorties += amount;
                      }
                      
                      return acc;
                    }, {});

                    // Convertir en tableau et calculer le solde cumulé
                    const cashFlowData = Object.values(cashFlowByMonth)
                      .sort((a: any, b: any) => a.month.localeCompare(b.month));
                    
                    let cumulativeSolde = 0;
                    cashFlowData.forEach((item: any) => {
                      item.solde = item.entrees - item.sorties;
                      cumulativeSolde += item.solde;
                      item.soldeCumule = cumulativeSolde;
                    });

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-4 font-semibold">Mois</th>
                              <th className="text-right p-4 font-semibold text-green-600">Entrées (FCFA)</th>
                              <th className="text-right p-4 font-semibold text-red-600">Sorties (FCFA)</th>
                              <th className="text-right p-4 font-semibold">Solde mensuel (FCFA)</th>
                              <th className="text-right p-4 font-semibold text-primary">Solde cumulé (FCFA)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cashFlowData.length > 0 ? (
                              cashFlowData.map((item: any, index: number) => {
                                const date = new Date(item.month + '-01');
                                const monthName = date.toLocaleDateString('fr-FR', { 
                                  month: 'long', 
                                  year: 'numeric' 
                                });
                                
                                return (
                                  <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                                    <td className="p-4 font-medium capitalize">{monthName}</td>
                                    <td className="p-4 text-right text-green-600 font-semibold">
                                      +{item.entrees.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right text-red-600 font-semibold">
                                      -{item.sorties.toLocaleString()}
                                    </td>
                                    <td className={`p-4 text-right font-semibold ${
                                      item.solde >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {item.solde >= 0 ? '+' : ''}{item.solde.toLocaleString()}
                                    </td>
                                    <td className={`p-4 text-right font-bold ${
                                      item.soldeCumule >= 0 ? 'text-primary' : 'text-red-600'
                                    }`}>
                                      {item.soldeCumule >= 0 ? '+' : ''}{item.soldeCumule.toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                  Aucune transaction trouvée
                                </td>
                              </tr>
                            )}
                          </tbody>
                          {cashFlowData.length > 0 && (
                            <tfoot className="bg-muted/30">
                              <tr className="border-t-2">
                                <td className="p-4 font-bold">TOTAL</td>
                                <td className="p-4 text-right text-green-600 font-bold">
                                  +{cashFlowData.reduce((sum: number, item: any) => sum + item.entrees, 0).toLocaleString()}
                                </td>
                                <td className="p-4 text-right text-red-600 font-bold">
                                  -{cashFlowData.reduce((sum: number, item: any) => sum + item.sorties, 0).toLocaleString()}
                                </td>
                                <td className="p-4 text-right font-bold">
                                  {cashFlowData.reduce((sum: number, item: any) => sum + item.solde, 0).toLocaleString()}
                                </td>
                                <td className="p-4 text-right text-primary font-bold">
                                  {(cashFlowData[cashFlowData.length - 1] as any)?.soldeCumule?.toLocaleString() || '0'}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Rapports;
