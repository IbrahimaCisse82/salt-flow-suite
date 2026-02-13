import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import MapPicker from "@/components/Map/MapPicker";
import { 
  Package,
  Plus,
  AlertTriangle,
  TrendingUp,
  Warehouse,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  MapPin
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInventoryItems, useStockMovements } from "@/hooks/useInventoryItems";
import { useStockMovementsHistory } from "@/hooks/useStockMovements";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  optimal: { label: "Stock optimal", color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/30" },
  moyen: { label: "Stock moyen", color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  faible: { label: "Stock faible", color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/30" },
};

function getStockStatus(quantity: number, reorderLevel: number | null) {
  const threshold = reorderLevel ?? 50;
  if (quantity <= threshold) return 'faible';
  if (quantity <= threshold * 2) return 'moyen';
  return 'optimal';
}

const Stocks = () => {
  const { isOpen } = useSidebar();
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  
  const { items: inventoryItems, createItem, isLoading: inventoryLoading } = useInventoryItems();
  const { recordMovement } = useStockMovements();
  const { movements, isLoading: movementsLoading } = useStockMovementsHistory();
  
  // Separate items by category
  const productionItems = inventoryItems.filter(item => item.item_category === 'production');
  const warehouses = inventoryItems.filter(item => item.item_category === 'warehouse');
  
  // Build stock by type from inventory_items (single source of truth)
  const stockByType = productionItems.reduce((acc, item) => {
    const type = item.item_name || 'Autre';
    const existing = acc.find(s => s.type === type);
    if (existing) {
      existing.quantity += Number(item.quantity_on_hand || 0);
    } else {
      acc.push({
        type,
        quantity: Number(item.quantity_on_hand || 0),
        unit: item.unit_of_measure || 'tonnes',
        status: getStockStatus(Number(item.quantity_on_hand || 0), item.reorder_level),
        reorderLevel: item.reorder_level,
        lastUpdate: item.updated_at || item.created_at || new Date().toISOString(),
      });
    }
    return acc;
  }, [] as Array<{ type: string; quantity: number; unit: string; status: string; reorderLevel: number | null; lastUpdate: string }>);

  const totalStock = stockByType.reduce((sum, item) => sum + item.quantity, 0);
  const alertCount = stockByType.filter(s => s.status === 'faible').length;
  
  // Chart data
  const chartData = stockByType.map(s => ({
    name: s.type,
    stock: Math.round(s.quantity),
    seuil: s.reorderLevel ?? 50,
  }));

  const [movementFormData, setMovementFormData] = useState({
    movementType: "", date: "", saltType: "", warehouse: "", quantity: "", notes: ""
  });
  const [stockFormData, setStockFormData] = useState({
    saltType: "", quantity: "", warehouse: "", harvestDate: "", qualityGrade: "", unitCost: "", lotNumber: "", notes: ""
  });
  const [warehouseFormData, setWarehouseFormData] = useState({
    name: "", code: "", capacity: "", location: "", latitude: 14.7167, longitude: -17.4677, notes: ""
  });

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await recordMovement.mutateAsync({
        item_name: movementFormData.saltType,
        movement_type: movementFormData.movementType === 'Entrée' ? 'entry' : 'exit',
        quantity: parseFloat(movementFormData.quantity) || 0,
        date: movementFormData.date,
        warehouse: movementFormData.warehouse,
        notes: movementFormData.notes
      });
      setIsMovementDialogOpen(false);
      setMovementFormData({ movementType: "", date: "", saltType: "", warehouse: "", quantity: "", notes: "" });
    } catch (error) {
      console.error("Movement error:", error);
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createItem.mutateAsync({
        item_name: stockFormData.saltType,
        item_category: 'production',
        quantity_on_hand: stockFormData.quantity,
        storage_location: stockFormData.warehouse,
        unit_of_measure: 'tonnes',
        unit_cost: stockFormData.unitCost,
        last_purchase_date: stockFormData.harvestDate,
        notes: stockFormData.notes ? `Lot: ${stockFormData.lotNumber} - Grade: ${stockFormData.qualityGrade} - ${stockFormData.notes}` : `Lot: ${stockFormData.lotNumber} - Grade: ${stockFormData.qualityGrade}`
      });
      setIsStockDialogOpen(false);
      setStockFormData({ saltType: "", quantity: "", warehouse: "", harvestDate: "", qualityGrade: "", unitCost: "", lotNumber: "", notes: "" });
    } catch (error) {
      console.error("Stock creation error:", error);
    }
  };

  const handleWarehouseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createItem.mutateAsync({
        item_name: warehouseFormData.name,
        item_code: warehouseFormData.code,
        item_category: 'warehouse',
        storage_location: warehouseFormData.location,
        quantity_on_hand: warehouseFormData.capacity,
        unit_of_measure: 'tonnes',
        notes: `Lat: ${warehouseFormData.latitude.toFixed(6)}, Long: ${warehouseFormData.longitude.toFixed(6)} - ${warehouseFormData.notes}`
      });
      setIsWarehouseDialogOpen(false);
      setWarehouseFormData({ name: "", code: "", capacity: "", location: "", latitude: 14.7167, longitude: -17.4677, notes: "" });
    } catch (error) {
      console.error("Warehouse creation error:", error);
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
          {/* Dialogs */}
          {/* Movement Dialog */}
          <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
            <DialogContent className="sm:max-w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouveau mouvement de stock</DialogTitle>
                <DialogDescription>Enregistrer une entrée ou sortie de stock</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleMovementSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Type de mouvement</Label>
                  <Select value={movementFormData.movementType} onValueChange={(v) => setMovementFormData({...movementFormData, movementType: v})} required>
                    <SelectTrigger><SelectValue placeholder="Sélectionner le type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entrée"><div className="flex items-center gap-2"><ArrowUpCircle className="h-4 w-4 text-green-600" /><span>Entrée</span></div></SelectItem>
                      <SelectItem value="Sortie"><div className="flex items-center gap-2"><ArrowDownCircle className="h-4 w-4 text-red-600" /><span>Sortie</span></div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={movementFormData.date} onChange={(e) => setMovementFormData({...movementFormData, date: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Type de sel</Label>
                  <Select value={movementFormData.saltType} onValueChange={(v) => setMovementFormData({...movementFormData, saltType: v})} required>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sel gros">Sel gros</SelectItem>
                      <SelectItem value="Sel fin">Sel fin</SelectItem>
                      <SelectItem value="Sel iodé">Sel iodé</SelectItem>
                      <SelectItem value="Sel industriel">Sel industriel</SelectItem>
                      <SelectItem value="Sel export">Sel export</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Entrepôt</Label>
                  <Select value={movementFormData.warehouse} onValueChange={(v) => setMovementFormData({...movementFormData, warehouse: v})} required>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {warehouses.length > 0 ? warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.item_name}>{w.item_name}</SelectItem>
                      )) : (
                        <SelectItem value="Entrepôt principal">Entrepôt principal</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantité (tonnes)</Label>
                  <Input type="number" step="0.1" value={movementFormData.quantity} onChange={(e) => setMovementFormData({...movementFormData, quantity: e.target.value})} placeholder="Ex: 25.5" required />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optionnel)</Label>
                  <Textarea value={movementFormData.notes} onChange={(e) => setMovementFormData({...movementFormData, notes: e.target.value})} rows={2} />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsMovementDialogOpen(false)} className="flex-1">Annuler</Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent">Enregistrer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Stock Dialog */}
          <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Ajouter un stock</DialogTitle>
                <DialogDescription>Enregistrer un nouveau stock par catégorie</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleStockSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Type de sel</Label>
                  <Select value={stockFormData.saltType} onValueChange={(v) => setStockFormData({...stockFormData, saltType: v})} required>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sel gros">Sel gros</SelectItem>
                      <SelectItem value="Sel fin">Sel fin</SelectItem>
                      <SelectItem value="Sel iodé">Sel iodé</SelectItem>
                      <SelectItem value="Sel industriel">Sel industriel</SelectItem>
                      <SelectItem value="Sel export">Sel export</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantité (tonnes)</Label>
                  <Input type="number" step="0.1" value={stockFormData.quantity} onChange={(e) => setStockFormData({...stockFormData, quantity: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Entrepôt</Label>
                  <Select value={stockFormData.warehouse} onValueChange={(v) => setStockFormData({...stockFormData, warehouse: v})} required>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {warehouses.length > 0 ? warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.item_name}>{w.item_name}</SelectItem>
                      )) : (
                        <SelectItem value="Entrepôt principal">Entrepôt principal</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date de récolte</Label>
                  <Input type="date" value={stockFormData.harvestDate} onChange={(e) => setStockFormData({...stockFormData, harvestDate: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Qualité</Label>
                  <Select value={stockFormData.qualityGrade} onValueChange={(v) => setStockFormData({...stockFormData, qualityGrade: v})} required>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">Grade A+</SelectItem>
                      <SelectItem value="A">Grade A</SelectItem>
                      <SelectItem value="B">Grade B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Coût unitaire (FCFA/tonne)</Label>
                  <Input type="number" step="0.01" value={stockFormData.unitCost} onChange={(e) => setStockFormData({...stockFormData, unitCost: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Numéro de lot</Label>
                  <Input value={stockFormData.lotNumber} onChange={(e) => setStockFormData({...stockFormData, lotNumber: e.target.value})} placeholder="LOT-2026-001" />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={stockFormData.notes} onChange={(e) => setStockFormData({...stockFormData, notes: e.target.value})} rows={2} />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsStockDialogOpen(false)} className="flex-1">Annuler</Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent">Ajouter</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Warehouse Dialog */}
          <Dialog open={isWarehouseDialogOpen} onOpenChange={setIsWarehouseDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un entrepôt</DialogTitle>
                <DialogDescription>Ajouter un nouveau lieu de stockage</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleWarehouseSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input value={warehouseFormData.name} onChange={(e) => setWarehouseFormData({...warehouseFormData, name: e.target.value})} placeholder="Entrepôt D" required />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input value={warehouseFormData.code} onChange={(e) => setWarehouseFormData({...warehouseFormData, code: e.target.value})} placeholder="ENT-D" required />
                </div>
                <div className="space-y-2">
                  <Label>Capacité (tonnes)</Label>
                  <Input type="number" value={warehouseFormData.capacity} onChange={(e) => setWarehouseFormData({...warehouseFormData, capacity: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Localisation</Label>
                  <Input value={warehouseFormData.location} onChange={(e) => setWarehouseFormData({...warehouseFormData, location: e.target.value})} placeholder="Zone Nord" />
                </div>
                <div className="space-y-2">
                  <Label>Position GPS</Label>
                  <MapPicker
                    initialLat={warehouseFormData.latitude}
                    initialLng={warehouseFormData.longitude}
                    onLocationChange={(lat, lng) => setWarehouseFormData({...warehouseFormData, latitude: lat, longitude: lng})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={warehouseFormData.notes} onChange={(e) => setWarehouseFormData({...warehouseFormData, notes: e.target.value})} rows={2} />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsWarehouseDialogOpen(false)} className="flex-1">Annuler</Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent">Créer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Gestion des Stocks</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Suivi en temps réel de vos stocks de sel</p>
            </div>
            <Button onClick={() => setIsMovementDialogOpen(true)} className="gap-2 bg-gradient-to-r from-primary to-accent">
              <Plus className="h-4 w-4" />
              Mouvement stock
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-4 md:p-6">
                <Package className="h-8 w-8 text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Stock total</p>
                {inventoryLoading ? <Skeleton className="h-9 w-20 mt-1" /> : (
                  <p className="text-3xl font-bold">{Math.round(totalStock)} t</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stockByType.length} catégories</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <Warehouse className="h-8 w-8 text-accent mb-3" />
                <p className="text-sm text-muted-foreground">Entrepôts</p>
                <p className="text-3xl font-bold">{warehouses.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Lieux de stockage</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <TrendingUp className="h-8 w-8 text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Mouvements récents</p>
                {movementsLoading ? <Skeleton className="h-9 w-12 mt-1" /> : (
                  <p className="text-3xl font-bold">{movements.length}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Derniers 50</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <AlertTriangle className={cn("h-8 w-8 mb-3", alertCount > 0 ? "text-red-600" : "text-green-600")} />
                <p className="text-sm text-muted-foreground">Alertes stock</p>
                <p className="text-3xl font-bold">{alertCount}</p>
                <p className={cn("text-xs mt-1", alertCount > 0 ? "text-red-600" : "text-green-600")}>
                  {alertCount > 0 ? "Stock faible" : "Tout est OK"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Dynamic Alerts */}
          {stockByType.filter(s => s.status === 'faible').map(s => (
            <Card key={s.type} className="border-l-4 border-l-red-500">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1">Stock critique : {s.type}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock actuel : {Math.round(s.quantity)} {s.unit} — Seuil d'alerte : {s.reorderLevel ?? 50} {s.unit}. Planifier un réapprovisionnement.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-red-700 border-red-600 text-xs flex-shrink-0">Urgent</Badge>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Tabs */}
          <Tabs defaultValue="stocks" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="stocks">Stocks</TabsTrigger>
              <TabsTrigger value="chart">Graphique</TabsTrigger>
              <TabsTrigger value="movements">Mouvements</TabsTrigger>
              <TabsTrigger value="warehouses">Entrepôts</TabsTrigger>
            </TabsList>

            {/* Stocks Tab */}
            <TabsContent value="stocks" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Stocks par catégorie</CardTitle>
                    <Button onClick={() => setIsStockDialogOpen(true)} size="sm" className="gap-2"><Plus className="h-4 w-4" />Nouveau stock</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {inventoryLoading ? (
                    <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
                  ) : stockByType.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun stock disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stockByType.map((stock) => {
                        const config = statusConfig[stock.status] || statusConfig.optimal;
                        const maxQty = Math.max(...stockByType.map(s => s.quantity), 1);
                        return (
                          <div key={stock.type} className="p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{stock.type}</h3>
                                <Badge variant="outline" className={`${config.color} ${config.border} text-xs`}>{config.label}</Badge>
                              </div>
                              <p className="text-xl font-bold">{Math.round(stock.quantity)} {stock.unit}</p>
                            </div>
                            <Progress value={(stock.quantity / maxQty) * 100} className="h-2" />
                            <div className="flex justify-between mt-1">
                              <p className="text-xs text-muted-foreground">Seuil: {stock.reorderLevel ?? 50} {stock.unit}</p>
                              <p className="text-xs text-muted-foreground">MAJ: {new Date(stock.lastUpdate).toLocaleDateString('fr-FR')}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chart Tab */}
            <TabsContent value="chart">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Niveaux de stock vs seuils d'alerte</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucune donnée disponible</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="stock" name="Stock actuel (t)" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                        <Bar dataKey="seuil" name="Seuil d'alerte (t)" fill="hsl(var(--destructive))" radius={[4,4,0,0]} opacity={0.4} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Movements Tab */}
            <TabsContent value="movements">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" />Historique des mouvements</CardTitle>
                </CardHeader>
                <CardContent>
                  {movementsLoading ? (
                    <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                  ) : movements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun mouvement enregistré</p>
                      <p className="text-xs mt-1">Les mouvements seront tracés automatiquement</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Article</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Quantité</TableHead>
                            <TableHead className="text-right">Avant</TableHead>
                            <TableHead className="text-right">Après</TableHead>
                            <TableHead>Source</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {movements.map((m) => (
                            <TableRow key={m.id}>
                              <TableCell className="text-sm">{new Date(m.created_at).toLocaleDateString('fr-FR')}</TableCell>
                              <TableCell className="font-medium">{m.item_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={m.movement_type === 'entry' ? 'text-green-600 border-green-500/30' : 'text-red-600 border-red-500/30'}>
                                  {m.movement_type === 'entry' ? '↑ Entrée' : '↓ Sortie'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">{Math.round(m.quantity)} {m.unit_of_measure}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{Math.round(m.previous_quantity)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{Math.round(m.new_quantity)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{m.reference_type || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Warehouses Tab */}
            <TabsContent value="warehouses">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Warehouse className="h-5 w-5 text-primary" />Entrepôts</CardTitle>
                    <Button onClick={() => setIsWarehouseDialogOpen(true)} size="sm" className="gap-2"><Plus className="h-4 w-4" />Nouvel entrepôt</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {warehouses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Warehouse className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun entrepôt configuré</p>
                      <Button onClick={() => setIsWarehouseDialogOpen(true)} variant="outline" className="mt-4 gap-2">
                        <Plus className="h-4 w-4" />Créer le premier entrepôt
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {warehouses.map((w) => {
                        // Extract GPS from notes if available
                        const gpsMatch = w.notes?.match(/Lat:\s*([\d.-]+),\s*Long:\s*([\d.-]+)/);
                        return (
                          <Card key={w.id} className="border">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="font-semibold text-lg">{w.item_name}</h3>
                                  {w.item_code && <p className="text-xs text-muted-foreground">Code: {w.item_code}</p>}
                                </div>
                                <Warehouse className="h-6 w-6 text-accent" />
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Capacité</span>
                                  <span className="font-medium">{w.quantity_on_hand ?? 0} tonnes</span>
                                </div>
                                {w.storage_location && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span>{w.storage_location}</span>
                                  </div>
                                )}
                                {gpsMatch && (
                                  <p className="text-xs text-muted-foreground">GPS: {parseFloat(gpsMatch[1]).toFixed(4)}, {parseFloat(gpsMatch[2]).toFixed(4)}</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Stocks;
