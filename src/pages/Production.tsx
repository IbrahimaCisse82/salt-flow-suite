import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
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
import { useState } from "react";
import { 
  Database,
  Plus,
  Calendar,
  TrendingUp,
  Droplets,
  CheckCircle,
  Clock
} from "lucide-react";
import { YieldAnalysis } from "@/components/Production/YieldAnalysis";
import { QualityTestForm } from "@/components/Production/QualityTestForm";
import { QualityCertificateForm } from "@/components/Production/QualityCertificateForm";
import { TraceabilityView } from "@/components/Production/TraceabilityView";
import { ProductionBottomCards } from "@/components/Production/ProductionBottomCards";
import { useQualityTests } from "@/hooks/useQualityTests";
import { useQualityCertificates } from "@/hooks/useQualityCertificates";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlaskConical, Award, Search as SearchIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { useProductionRecords, useCreateProductionRecord } from "@/hooks/useProductionRecords";
import { useBassins } from "@/hooks/useBassins";
import { useTeams } from "@/hooks/useTeams";
import { useInventoryItems } from "@/hooks/useInventoryItems";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Production = () => {
  const { toast } = useToast();
  const { isOpen } = useSidebar();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQualityTestDialogOpen, setIsQualityTestDialogOpen] = useState(false);
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    bassin: "",
    quantity: "",
    type: "",
    quality: "",
    team: "",
    status: "completed",
    warehouse: ""
  });

  // Fetch data from database
  const { data: productionRecords = [], isLoading: productionLoading } = useProductionRecords();
  const { bassins, isLoading: bassinsLoading } = useBassins();
  const { teams } = useTeams();
  const { items: inventoryItems } = useInventoryItems();
  const warehouses = inventoryItems.filter(item => item.item_category === 'warehouse');
  const { qualityTests, isLoading: qualityLoading } = useQualityTests();
  const { certificates, isLoading: certificatesLoading } = useQualityCertificates();

  // Get recent harvests (last 10 production records)
  const recentHarvests = productionRecords.slice(0, 10).map(record => ({
    id: record.id,
    date: record.production_date,
    bassin: bassins?.find(b => b.id === record.bassin_id)?.name || 'N/A',
    quantity: Number(record.quantity),
    type: record.salt_type,
    quality: record.quality_grade || 'N/A',
    status: record.status || "completed"
  }));

  // Calculate production statistics
  const totalProduction = productionRecords.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  const currentMonth = new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  const thisMonthRecords = productionRecords.filter(r => {
    const recordDate = new Date(r.production_date);
    const now = new Date();
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
  });
  const qualityAPlus = productionRecords.filter(r => r.quality_grade === 'A+').length;
  const qualityPercentage = productionRecords.length > 0 ? Math.round((qualityAPlus / productionRecords.length) * 100) : 0;

  // Group production by bassin and salt type for chart
  const { data: productionByBassin = [] } = useQuery({
    queryKey: ['production-by-bassin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('production_records')
        .select(`
          *,
          bassin:bassins(name)
        `)
        .order('production_date', { ascending: false });
      
      if (error) throw error;

      // Group by bassin
      const grouped = (data || []).reduce((acc: any, record) => {
        const bassinName = record.bassin?.name || 'Inconnu';
        if (!acc[bassinName]) {
          acc[bassinName] = { bassin: bassinName, selGros: 0, selFin: 0, selIode: 0 };
        }
        
        const quantity = Number(record.quantity || 0);
        const type = (record.salt_type || '').toLowerCase();
        if (type.includes('gros')) acc[bassinName].selGros += quantity;
        else if (type.includes('fin')) acc[bassinName].selFin += quantity;
        else if (type.includes('iod')) acc[bassinName].selIode += quantity;
        
        return acc;
      }, {});

      return Object.values(grouped).slice(0, 6); // Limit to 6 bassins for chart readability
    }
  });

  const isLoading = productionLoading || bassinsLoading;

  const handleNewHarvest = () => {
    setIsDialogOpen(true);
  };

  const { mutateAsync: createHarvest, isPending: isCreatingHarvest } = useCreateProductionRecord();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createHarvest({
        production_date: formData.date,
        bassin_id: formData.bassin,
        quantity: formData.quantity,
        salt_type: formData.type,
        quality_grade: formData.quality,
        team_id: formData.team || null,
        status: formData.status || 'completed',
        warehouse_id: formData.warehouse || null,
      });

      setIsDialogOpen(false);
      setFormData({
        date: "",
        bassin: "",
        quantity: "",
        type: "",
        quality: "",
        team: "",
        status: "completed",
        warehouse: "",
      });
    } catch (error: any) {
      // onError in the mutation already shows a toast, so we don't duplicate
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouvelle récolte</DialogTitle>
                <DialogDescription>
                  Enregistrer une nouvelle récolte de sel
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date de récolte</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bassin">Bassin</Label>
                  <Select 
                    value={formData.bassin} 
                    onValueChange={(value) => setFormData({...formData, bassin: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un bassin" />
                    </SelectTrigger>
                     <SelectContent>
                      {bassins?.filter(b => b.is_active && b.status === 'active' && b.bassin_type === 'Table Salante').map((bassin) => (
                        <SelectItem key={bassin.id} value={bassin.id}>
                          {bassin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warehouse">Entrepôt de destination *</Label>
                  <Select 
                    value={formData.warehouse} 
                    onValueChange={(value) => setFormData({...formData, warehouse: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'entrepôt" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.item_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité (tonnes)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    placeholder="Ex: 15.5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type de sel</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({...formData, type: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sel gros">Sel gros</SelectItem>
                      <SelectItem value="Sel fin">Sel fin</SelectItem>
                      <SelectItem value="Sel iodé">Sel iodé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality">Qualité</Label>
                  <Select 
                    value={formData.quality} 
                    onValueChange={(value) => setFormData({...formData, quality: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner la qualité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Équipe</Label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground">
                    {(() => {
                      const recolteTeam = teams?.find(t => t.name?.toLowerCase().includes('récolte'));
                      if (recolteTeam && formData.team !== recolteTeam.id) {
                        setFormData(prev => ({ ...prev, team: recolteTeam.id }));
                      }
                      return recolteTeam?.name || 'Équipe Récolte (non trouvée)';
                    })()}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({...formData, status: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Complété</SelectItem>
                      <SelectItem value="processing">En traitement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent">
                    Enregistrer
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">Suivi de Production</h1>
              <p className="text-sm sm:text-base text-muted-foreground break-words">
                Gestion et traçabilité de la production saline
              </p>
            </div>
            <Button onClick={handleNewHarvest} className="gap-2 bg-gradient-to-r from-primary to-accent">
              <Plus className="h-4 w-4" />
              Nouvelle récolte
            </Button>
          </div>

          {/* Tabs for Production, Quality, and Traceability */}
          <Tabs defaultValue="production" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="quality">Qualité</TabsTrigger>
              <TabsTrigger value="traceability">Traçabilité</TabsTrigger>
            </TabsList>

            <TabsContent value="production" className="space-y-6">
          {/* KPIs Production */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <Database className="h-8 w-8 text-primary" />
                  {totalProduction > 0 && <TrendingUp className="h-5 w-5 text-green-600" />}
                </div>
                <p className="text-sm text-muted-foreground">Production totale</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-20 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{Math.round(totalProduction)} t</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{productionRecords.length} récoltes</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Droplets className="h-8 w-8 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground">Bassins actifs</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{bassins?.filter(b => b.is_active).length || 0}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">En production</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Récoltes ce mois</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-12 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{thisMonthRecords.length}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{currentMonth}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">Qualité A+</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{qualityPercentage}%</p>
                )}
                <p className="text-xs text-green-600 mt-1">Conforme export</p>
              </CardContent>
            </Card>
          </div>

          {/* Graphique production par bassin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Production par bassin et type de sel (tonnes)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : productionByBassin.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune donnée de production disponible</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productionByBassin}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="bassin"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="selGros" fill="hsl(var(--primary))" name="Sel gros" />
                    <Bar dataKey="selFin" fill="hsl(var(--accent))" name="Sel fin" />
                    <Bar dataKey="selIode" fill="hsl(var(--primary-glow))" name="Sel iodé" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Récoltes récentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Récoltes récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : recentHarvests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune récolte récente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentHarvests.map((harvest) => (
                    <div 
                      key={harvest.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center bg-green-500/10">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{harvest.bassin}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(harvest.date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-semibold">{harvest.quantity} tonnes</p>
                          <p className="text-sm text-muted-foreground">{harvest.type}</p>
                        </div>
                        <Badge 
                          variant="outline"
                          className="border-primary text-primary"
                        >
                          Qualité {harvest.quality}
                        </Badge>
                        <Badge 
                          className={harvest.status === 'processing' 
                            ? "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20" 
                            : "bg-green-500/10 text-green-700 hover:bg-green-500/20"}
                        >
                          {harvest.status === 'processing' ? 'En traitement' : 'Complété'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contrôle qualité */}
          <YieldAnalysis />
          
          <ProductionBottomCards 
            productionRecords={productionRecords}
            qualityTests={qualityTests}
            isLoading={isLoading || qualityLoading}
          />
            </TabsContent>

            <TabsContent value="quality" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Gestion de la qualité</h2>
                <div className="flex gap-2">
                  <Button onClick={() => setIsQualityTestDialogOpen(true)} variant="outline" className="gap-2">
                    <FlaskConical className="h-4 w-4" />
                    Nouveau test
                  </Button>
                  <Button onClick={() => setIsCertificateDialogOpen(true)} className="gap-2">
                    <Award className="h-4 w-4" />
                    Nouveau certificat
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tests qualité */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FlaskConical className="h-5 w-5" />
                      Tests qualité récents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {qualityLoading ? (
                      <Skeleton className="h-40" />
                    ) : qualityTests && qualityTests.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {qualityTests.slice(0, 5).map((test: any) => (
                            <TableRow key={test.id}>
                              <TableCell>{new Date(test.test_date).toLocaleDateString()}</TableCell>
                              <TableCell>{test.quality_score || '-'}/100</TableCell>
                              <TableCell>
                                <Badge variant={test.quality_status === 'passed' ? 'default' : 'secondary'}>
                                  {test.quality_status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Aucun test qualité enregistré</p>
                    )}
                  </CardContent>
                </Card>

                {/* Certificats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Certificats qualité
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {certificatesLoading ? (
                      <Skeleton className="h-40" />
                    ) : certificates && certificates.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>N° Certificat</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {certificates.slice(0, 5).map((cert: any) => (
                            <TableRow key={cert.id}>
                              <TableCell className="font-medium">{cert.certificate_number}</TableCell>
                              <TableCell>{cert.certificate_type}</TableCell>
                              <TableCell>
                                <Badge variant={cert.status === 'valid' ? 'default' : 'destructive'}>
                                  {cert.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Aucun certificat enregistré</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="traceability" className="space-y-6">
              <TraceabilityView />
            </TabsContent>
          </Tabs>

          {/* Quality Dialogs */}
          <QualityTestForm 
            open={isQualityTestDialogOpen} 
            onOpenChange={setIsQualityTestDialogOpen} 
          />
          <QualityCertificateForm 
            open={isCertificateDialogOpen} 
            onOpenChange={setIsCertificateDialogOpen} 
          />
        </main>
      </div>
    </div>
  );
};

export default Production;
