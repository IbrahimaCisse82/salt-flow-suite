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
  MapPin,
  DollarSign,
  Camera
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInventoryItems, useStockMovements } from "@/hooks/useInventoryItems";
import { useStockMovementsHistory } from "@/hooks/useStockMovements";
import { useInventoryValuation } from "@/hooks/useInventoryValuation";
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
  const { layers, snapshots, createSnapshot, isLoading: valuationLoading } = useInventoryValuation();
  // Separate items by category
  const productionItems = inventoryItems.filter(item => item.item_category === 'production');
  const warehouses = inventoryItems.filter(item => item.item_category === 'warehouse');
  
  // Build stock by type from inventory_items (single source of truth)
  const stockByType = productionItems.reduce((acc, item) => {
    const type = item.item_name || 'Autre';
    const warehouse = item.storage_location || 'Non assigné';
    const qty = Number(item.quantity_on_hand || 0);
    const reserved = Number(item.reserved_quantity || 0);
    const key = `${type}__${warehouse}`;
    const existing = acc.find(s => s.key === key);
    if (existing) {
      existing.quantity += qty;
      existing.reserved += reserved;
    } else {
      acc.push({
        key,
        type,
        warehouse,
        quantity: qty,
        reserved,
        available: qty - reserved,
        unit: item.unit_of_measure || 'tonnes',
        status: getStockStatus(qty - reserved, item.reorder_level),
        reorderLevel: item.reorder_level,
        lastUpdate: item.updated_at || item.created_at || new Date().toISOString(),
      });
    }
    return acc;
  }, [] as Array<{ key: string; type: string; warehouse: string; quantity: number; reserved: number; available: number; unit: string; status: string; reorderLevel: number | null; lastUpdate: string }>);
  
  // Recalculate available for aggregated items
  stockByType.forEach(s => { s.available = s.quantity - s.reserved; s.status = getStockStatus(s.available, s.reorderLevel); });

  // Helper: get current total stock in a warehouse
  const getWarehouseCurrentStock = (warehouseName: string) => {
    return productionItems
      .filter(item => item.storage_location === warehouseName)
      .reduce((sum, item) => sum + Number(item.quantity_on_hand || 0), 0);
  };

  // Helper: get warehouse capacity
  const getWarehouseCapacity = (warehouseName: string) => {
    const wh = warehouses.find(w => w.item_name === warehouseName);
    return wh ? Number(wh.quantity_on_hand || 0) : null;
  };

  // Helper: check if adding qty to warehouse would exceed capacity
  const checkWarehouseCapacity = (warehouseName: string, additionalQty: number): { ok: boolean; capacity: number; currentStock: number; remaining: number } | null => {
    const capacity = getWarehouseCapacity(warehouseName);
    if (capacity === null || capacity === 0) return null; // no capacity defined
    const currentStock = getWarehouseCurrentStock(warehouseName);
    const remaining = capacity - currentStock;
    return { ok: additionalQty <= remaining, capacity, currentStock, remaining };
  };

  // Aggregate totals by type (for global stats)
  const stockTotals = productionItems.reduce((acc, item) => {
    const type = item.item_name || 'Autre';
    acc[type] = (acc[type] || 0) + Number(item.quantity_on_hand || 0);
    return acc;
  }, {} as Record<string, number>);

  const totalStock = stockByType.reduce((sum, item) => sum + item.available, 0);
  const totalReserved = stockByType.reduce((sum, item) => sum + item.reserved, 0);
  const alertCount = stockByType.filter(s => s.status === 'faible').length;

  // Total stock value (CMP × quantity)
  const totalStockValue = productionItems.reduce((sum, item) => 
    sum + (Number(item.total_stock_value) || (Number(item.quantity_on_hand || 0) * Number(item.cmp || item.unit_cost || 0))), 0
  );
  const avgCMP = totalStock > 0 ? totalStockValue / totalStock : 0;
  // Chart data (aggregate by type for chart)
  const chartData = Object.entries(stockTotals).map(([type, qty]) => ({
    name: type,
    stock: Math.round(qty),
    seuil: 50,
  }));

  const [movementFormData, setMovementFormData] = useState({
    movementType: "", date: "", saltType: "", sourceWarehouse: "", destinationWarehouse: "", quantity: "", notes: ""
  });
  const [stockFormData, setStockFormData] = useState({
    saltType: "", quantity: "", warehouse: "", harvestDate: "", qualityGrade: "", unitCost: "", lotNumber: "", notes: ""
  });
  const [warehouseFormData, setWarehouseFormData] = useState({
    name: "", code: "", capacity: "", location: "", latitude: 14.7167, longitude: -17.4677, address: "", notes: ""
  });

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(movementFormData.quantity) || 0;
    // Check destination warehouse capacity
    const capacityCheck = checkWarehouseCapacity(movementFormData.destinationWarehouse, qty);
    if (capacityCheck && !capacityCheck.ok) {
      toast.error(`Capacité insuffisante dans ${movementFormData.destinationWarehouse}: ${capacityCheck.remaining} tonnes disponibles sur ${capacityCheck.capacity} tonnes`);
      return;
    }
    try {
      await recordMovement.mutateAsync({
        item_name: movementFormData.saltType,
        movement_type: 'transfer',
        quantity: qty,
        date: movementFormData.date,
        source_warehouse: movementFormData.sourceWarehouse,
        destination_warehouse: movementFormData.destinationWarehouse,
        notes: `Transfert de ${movementFormData.sourceWarehouse} vers ${movementFormData.destinationWarehouse}${movementFormData.notes ? ' - ' + movementFormData.notes : ''}`
      });
      setIsMovementDialogOpen(false);
      setMovementFormData({ movementType: "", date: "", saltType: "", sourceWarehouse: "", destinationWarehouse: "", quantity: "", notes: "" });
    } catch (error) {
      console.error("Movement error:", error);
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(stockFormData.quantity) || 0;
    // Check warehouse capacity
    const capacityCheck = checkWarehouseCapacity(stockFormData.warehouse, qty);
    if (capacityCheck && !capacityCheck.ok) {
      toast.error(`Capacité insuffisante dans ${stockFormData.warehouse}: ${capacityCheck.remaining} tonnes disponibles sur ${capacityCheck.capacity} tonnes`);
      return;
    }
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
      const gpsInfo = `Lat: ${warehouseFormData.latitude.toFixed(6)}, Long: ${warehouseFormData.longitude.toFixed(6)}`;
      const addrInfo = warehouseFormData.address ? ` | Adresse: ${warehouseFormData.address}` : '';
      const notesInfo = warehouseFormData.notes ? ` - ${warehouseFormData.notes}` : '';
      await createItem.mutateAsync({
        item_name: warehouseFormData.name,
        item_code: warehouseFormData.code,
        item_category: 'warehouse',
        storage_location: warehouseFormData.location,
        quantity_on_hand: warehouseFormData.capacity,
        unit_of_measure: 'tonnes',
        notes: `${gpsInfo}${addrInfo}${notesInfo}`
      });
      setIsWarehouseDialogOpen(false);
      setWarehouseFormData({ name: "", code: "", capacity: "", location: "", latitude: 14.7167, longitude: -17.4677, address: "", notes: "" });
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
                <DialogDescription>Transférer du stock entre entrepôts</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleMovementSubmit} className="space-y-4">
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
                  <Label>Entrepôt source</Label>
                  <Select value={movementFormData.sourceWarehouse} onValueChange={(v) => setMovementFormData({...movementFormData, sourceWarehouse: v})} required>
                    <SelectTrigger><SelectValue placeholder="Sélectionner l'entrepôt source" /></SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.item_name}>{w.item_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Entrepôt de destination</Label>
                  <Select value={movementFormData.destinationWarehouse} onValueChange={(v) => setMovementFormData({...movementFormData, destinationWarehouse: v})} required>
                    <SelectTrigger><SelectValue placeholder="Sélectionner l'entrepôt destination" /></SelectTrigger>
                    <SelectContent>
                      {warehouses.filter(w => w.item_name !== movementFormData.sourceWarehouse).map((w) => (
                        <SelectItem key={w.id} value={w.item_name}>{w.item_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Le stock global ne change pas, seule la répartition entre entrepôts est modifiée</p>
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
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent">Transférer</Button>
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
                    onLocationChange={(lat, lng, addr) => setWarehouseFormData({...warehouseFormData, latitude: lat, longitude: lng, address: addr || ''})}
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
              Transfert stock
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-4 md:p-6">
                <Package className="h-8 w-8 text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Stock total</p>
                {inventoryLoading ? <Skeleton className="h-9 w-20 mt-1" /> : (
                  <p className="text-3xl font-bold">{Math.round(totalStock)} t</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {stockByType.length} catégories{totalReserved > 0 ? ` | ${Math.round(totalReserved)}t réservées` : ''}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <DollarSign className="h-8 w-8 text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Valeur stock</p>
                {inventoryLoading ? <Skeleton className="h-9 w-24 mt-1" /> : (
                  <p className="text-2xl font-bold">{Math.round(totalStockValue).toLocaleString('fr-FR')} F</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  CMP moyen: {Math.round(avgCMP).toLocaleString('fr-FR')} F/t
                </p>
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="stocks">Stocks</TabsTrigger>
              <TabsTrigger value="valorisation">Valorisation</TabsTrigger>
              <TabsTrigger value="chart">Graphique</TabsTrigger>
              <TabsTrigger value="movements">Mouvements</TabsTrigger>
              <TabsTrigger value="warehouses">Entrepôts</TabsTrigger>
            </TabsList>

            {/* Stocks Tab */}
            <TabsContent value="stocks" className="space-y-4">
              <Card>
                <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Stocks par catégorie & entrepôt</CardTitle>
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
                          <div key={stock.key} className="p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{stock.type}</h3>
                                <Badge variant="secondary" className="text-xs">{stock.warehouse}</Badge>
                                <Badge variant="outline" className={`${config.color} ${config.border} text-xs`}>{config.label}</Badge>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold">{Math.round(stock.available)} {stock.unit}</p>
                                <p className="text-xs text-muted-foreground">Total: {Math.round(stock.quantity)} {stock.unit}</p>
                                {(() => {
                                  const matchingItem = productionItems.find(i => i.item_name === stock.type && i.storage_location === stock.warehouse);
                                  const cmp = matchingItem ? Number(matchingItem.cmp || matchingItem.unit_cost || 0) : 0;
                                  return cmp > 0 ? <p className="text-xs text-muted-foreground">CMP: {Math.round(cmp).toLocaleString('fr-FR')} F/t</p> : null;
                                })()}
                                {stock.reserved > 0 && (
                                  <p className="text-xs font-medium text-amber-600">🔒 {Math.round(stock.reserved)} {stock.unit} sous commande</p>
                                )}
                              </div>
                            </div>
                            <Progress value={(stock.available / maxQty) * 100} className="h-2" />
                            {stock.reserved > 0 && (
                              <div className="mt-1 flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div 
                                    className="h-full bg-amber-500 rounded-full" 
                                    style={{ width: `${Math.min((stock.reserved / stock.quantity) * 100, 100)}%` }} 
                                  />
                                </div>
                                <span className="text-xs text-amber-600 whitespace-nowrap">{Math.round((stock.reserved / stock.quantity) * 100)}% réservé</span>
                              </div>
                            )}
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

            {/* Valorisation Tab */}
            <TabsContent value="valorisation" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Valorisation CMP par article</CardTitle>
                    <Button onClick={() => createSnapshot.mutate(undefined)} size="sm" className="gap-2" disabled={createSnapshot.isPending}>
                      <Camera className="h-4 w-4" />{createSnapshot.isPending ? 'En cours...' : 'Snapshot mensuel'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {inventoryLoading ? (
                    <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                  ) : productionItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun article de production à valoriser</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Article</TableHead>
                            <TableHead>Entrepôt</TableHead>
                            <TableHead className="text-right">Quantité (t)</TableHead>
                            <TableHead className="text-right">CMP (F/t)</TableHead>
                            <TableHead className="text-right">Valeur totale (F)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productionItems.map((item) => {
                            const cmp = Number(item.cmp || item.unit_cost || 0);
                            const qty = Number(item.quantity_on_hand || 0);
                            const value = Number(item.total_stock_value) || (qty * cmp);
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.item_name}</TableCell>
                                <TableCell><Badge variant="secondary" className="text-xs">{item.storage_location || '—'}</Badge></TableCell>
                                <TableCell className="text-right">{qty.toFixed(1)}</TableCell>
                                <TableCell className="text-right">{Math.round(cmp).toLocaleString('fr-FR')}</TableCell>
                                <TableCell className="text-right font-semibold">{Math.round(value).toLocaleString('fr-FR')}</TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow className="border-t-2 font-bold">
                            <TableCell colSpan={2}>Total</TableCell>
                            <TableCell className="text-right">{totalStock.toFixed(1)}</TableCell>
                            <TableCell className="text-right">{Math.round(avgCMP).toLocaleString('fr-FR')}</TableCell>
                            <TableCell className="text-right">{Math.round(totalStockValue).toLocaleString('fr-FR')}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Snapshots history */}
              {snapshots.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" />Historique des snapshots</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Quantité (t)</TableHead>
                            <TableHead className="text-right">CMP (F/t)</TableHead>
                            <TableHead className="text-right">Valeur (F)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {snapshots.slice(0, 20).map((snap) => (
                            <TableRow key={snap.id}>
                              <TableCell>{new Date(snap.snapshot_date).toLocaleDateString('fr-FR')}</TableCell>
                              <TableCell className="text-right">{Number(snap.quantity_on_hand).toFixed(1)}</TableCell>
                              <TableCell className="text-right">{Math.round(Number(snap.cmp)).toLocaleString('fr-FR')}</TableCell>
                              <TableCell className="text-right font-medium">{Math.round(Number(snap.total_value)).toLocaleString('fr-FR')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                                <Badge variant="outline" className={
                                  m.movement_type === 'entry' ? 'text-green-600 border-green-500/30' 
                                  : m.movement_type === 'transfer' ? 'text-blue-600 border-blue-500/30'
                                  : 'text-red-600 border-red-500/30'
                                }>
                                  {m.movement_type === 'entry' ? '↑ Entrée' : m.movement_type === 'transfer' ? '⇄ Transfert' : '↓ Sortie'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">{Math.round(m.quantity)} {m.unit_of_measure}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{Math.round(m.previous_quantity)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{Math.round(m.new_quantity)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {m.reference_type === 'sale' ? 'Vente' : m.reference_type === 'transfer' ? 'Transfert' : m.reference_type || '-'}
                                {m.warehouse && <span className="block text-muted-foreground/70">{m.warehouse}</span>}
                              </TableCell>
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
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {warehouses.map((w) => {
                          const gpsMatch = w.notes?.match(/Lat:\s*([\d.-]+),\s*Long:\s*([\d.-]+)/);
                          const warehouseStock = stockByType.filter(s => s.warehouse === w.item_name);
                          const warehouseTotalStock = warehouseStock.reduce((sum, s) => sum + s.quantity, 0);
                          const warehouseTotalReserved = warehouseStock.reduce((sum, s) => sum + s.reserved, 0);
                          const warehouseCapacity = Number(w.quantity_on_hand || 0);
                          const isOverCapacity = warehouseCapacity > 0 && warehouseTotalStock > warehouseCapacity;
                          return (
                            <Card key={w.id} className={`border ${isOverCapacity ? 'border-destructive' : ''}`}>
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
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Stock actuel</span>
                                    <span className={`font-medium ${isOverCapacity ? 'text-destructive' : ''}`}>{Math.round(warehouseTotalStock)} tonnes</span>
                                  </div>
                                  {isOverCapacity && (
                                    <div className="flex items-center gap-1 text-destructive text-xs">
                                      <AlertTriangle className="h-3 w-3" />
                                      <span>Capacité dépassée de {Math.round(warehouseTotalStock - warehouseCapacity)} tonnes</span>
                                    </div>
                                  )}
                                  {warehouseTotalReserved > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-amber-600">🔒 Sous commande</span>
                                      <span className="font-medium text-amber-600">{Math.round(warehouseTotalReserved)} tonnes</span>
                                    </div>
                                  )}
                                  {warehouseStock.length > 0 && (
                                    <div className="pt-2 border-t space-y-1">
                                      {warehouseStock.map(s => (
                                        <div key={s.key} className="flex justify-between text-xs">
                                          <span>{s.type}</span>
                                          <span>
                                            {Math.round(s.available)} dispo
                                            {s.reserved > 0 && <span className="text-amber-600 ml-1">/ {Math.round(s.reserved)} réservé</span>}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
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
                      {/* Show orphaned storage locations not matching any warehouse */}
                      {(() => {
                        const warehouseNames = warehouses.map(w => w.item_name);
                        const orphanedLocations = stockByType.filter(s => !warehouseNames.includes(s.warehouse));
                        if (orphanedLocations.length === 0) return null;
                        const grouped = orphanedLocations.reduce((acc, s) => {
                          if (!acc[s.warehouse]) acc[s.warehouse] = [];
                          acc[s.warehouse].push(s);
                          return acc;
                        }, {} as Record<string, typeof orphanedLocations>);
                        return (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Emplacements non rattachés à un entrepôt</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {Object.entries(grouped).map(([location, items]) => {
                                const locTotal = items.reduce((sum, s) => sum + s.quantity, 0);
                                const locReserved = items.reduce((sum, s) => sum + s.reserved, 0);
                                return (
                                  <Card key={location} className="border border-dashed">
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-semibold">{location}</h3>
                                        <MapPin className="h-5 w-5 text-muted-foreground" />
                                      </div>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Stock actuel</span>
                                          <span className="font-medium">{Math.round(locTotal)} tonnes</span>
                                        </div>
                                        {locReserved > 0 && (
                                          <div className="flex justify-between">
                                            <span className="text-amber-600">🔒 Sous commande</span>
                                            <span className="font-medium text-amber-600">{Math.round(locReserved)} tonnes</span>
                                          </div>
                                        )}
                                        <div className="pt-2 border-t space-y-1">
                                          {items.map(s => (
                                            <div key={s.key} className="flex justify-between text-xs">
                                              <span>{s.type}</span>
                                              <span>
                                                {Math.round(s.available)} dispo
                                                {s.reserved > 0 && <span className="text-amber-600 ml-1">/ {Math.round(s.reserved)} réservé</span>}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
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
