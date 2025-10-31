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
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import MapPicker from "@/components/Map/MapPicker";
import { 
  Package,
  Plus,
  AlertTriangle,
  TrendingUp,
  Warehouse,
  ThermometerSun,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig = {
  optimal: { 
    label: "Stock optimal", 
    color: "text-green-600",
    bg: "bg-green-500/10",
    border: "border-green-500/30"
  },
  moyen: { 
    label: "Stock moyen", 
    color: "text-yellow-600",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30"
  },
  faible: { 
    label: "Stock faible", 
    color: "text-red-600",
    bg: "bg-red-500/10",
    border: "border-red-500/30"
  },
  attention: { 
    label: "Attention", 
    color: "text-orange-600",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30"
  },
};

const Stocks = () => {
  const { toast } = useToast();
  const { isOpen } = useSidebar();
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  
  const [movementFormData, setMovementFormData] = useState({
    movementType: "",
    date: "",
    saltType: "",
    warehouse: "",
    quantity: "",
    notes: ""
  });

  const [stockFormData, setStockFormData] = useState({
    saltType: "",
    quantity: "",
    warehouse: "",
    harvestDate: "",
    qualityGrade: "",
    unitCost: "",
    lotNumber: "",
    notes: ""
  });

  const [warehouseFormData, setWarehouseFormData] = useState({
    name: "",
    code: "",
    capacity: "",
    location: "",
    latitude: 14.7167,
    longitude: -17.4677,
    notes: ""
  });

  // Fetch stock data by salt type
  const { data: stockByType = [], isLoading: stockLoading } = useQuery({
    queryKey: ['stock-by-type'],
    queryFn: async () => {
      // Calculate stock = production - sales grouped by salt type
      const [productionResult, salesResult] = await Promise.all([
        supabase
          .from('production_records')
          .select('salt_type, quantity'),
        supabase
          .from('sales')
          .select('salt_type, quantity')
      ]);

      if (productionResult.error) throw productionResult.error;
      if (salesResult.error) throw salesResult.error;

      // Group by salt type
      const stockBySaltType: Record<string, number> = {};
      
      productionResult.data?.forEach(record => {
        const type = record.salt_type;
        stockBySaltType[type] = (stockBySaltType[type] || 0) + Number(record.quantity || 0);
      });

      salesResult.data?.forEach(sale => {
        const type = sale.salt_type;
        stockBySaltType[type] = (stockBySaltType[type] || 0) - Number(sale.quantity || 0);
      });

      // Convert to array and add status
      return Object.entries(stockBySaltType).map(([type, quantity]) => {
        let status = 'optimal';
        if (quantity < 50) status = 'faible';
        else if (quantity < 100) status = 'moyen';

        return {
          type,
          quantity: Math.max(0, quantity),
          unit: 'tonnes',
          status,
          lastUpdate: new Date().toISOString().split('T')[0]
        };
      });
    }
  });

  const totalStock = stockByType.reduce((sum, item) => sum + item.quantity, 0);

  const handleNewMovement = () => {
    setIsMovementDialogOpen(true);
  };

  const handleNewStock = () => {
    setIsStockDialogOpen(true);
  };

  const handleNewWarehouse = () => {
    setIsWarehouseDialogOpen(true);
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Mouvement enregistré",
      description: `${movementFormData.movementType} de ${movementFormData.quantity} tonnes de ${movementFormData.saltType}`,
    });
    setIsMovementDialogOpen(false);
    setMovementFormData({
      movementType: "",
      date: "",
      saltType: "",
      warehouse: "",
      quantity: "",
      notes: ""
    });
  };

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Stock ajouté",
      description: `${stockFormData.quantity} tonnes de ${stockFormData.saltType} ajoutées`,
    });
    setIsStockDialogOpen(false);
    setStockFormData({
      saltType: "",
      quantity: "",
      warehouse: "",
      harvestDate: "",
      qualityGrade: "",
      unitCost: "",
      lotNumber: "",
      notes: ""
    });
  };

  const handleWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Entrepôt créé",
      description: `L'entrepôt ${warehouseFormData.name} a été créé avec succès à la position (${warehouseFormData.latitude.toFixed(6)}, ${warehouseFormData.longitude.toFixed(6)})`,
    });
    setIsWarehouseDialogOpen(false);
    setWarehouseFormData({
      name: "",
      code: "",
      capacity: "",
      location: "",
      latitude: 14.7167,
      longitude: -17.4677,
      notes: ""
    });
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
          {/* Dialog Mouvement de stock */}
          <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
            <DialogContent className="sm:max-w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouveau mouvement de stock</DialogTitle>
                <DialogDescription>
                  Enregistrer une entrée ou sortie de stock
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleMovementSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="movementType">Type de mouvement</Label>
                  <Select 
                    value={movementFormData.movementType} 
                    onValueChange={(value) => setMovementFormData({...movementFormData, movementType: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entrée">
                        <div className="flex items-center gap-2">
                          <ArrowUpCircle className="h-4 w-4 text-green-600" />
                          <span>Entrée (Production/Achat)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Sortie">
                        <div className="flex items-center gap-2">
                          <ArrowDownCircle className="h-4 w-4 text-red-600" />
                          <span>Sortie (Vente/Utilisation)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date du mouvement</Label>
                  <Input
                    id="date"
                    type="date"
                    value={movementFormData.date}
                    onChange={(e) => setMovementFormData({...movementFormData, date: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saltType">Type de sel</Label>
                  <Select 
                    value={movementFormData.saltType} 
                    onValueChange={(value) => setMovementFormData({...movementFormData, saltType: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type de sel" />
                    </SelectTrigger>
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
                  <Label htmlFor="warehouse">Entrepôt</Label>
                  <Select 
                    value={movementFormData.warehouse} 
                    onValueChange={(value) => setMovementFormData({...movementFormData, warehouse: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'entrepôt" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entrepôt A">Entrepôt A</SelectItem>
                      <SelectItem value="Entrepôt B">Entrepôt B</SelectItem>
                      <SelectItem value="Entrepôt C">Entrepôt C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité (tonnes)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    value={movementFormData.quantity}
                    onChange={(e) => setMovementFormData({...movementFormData, quantity: e.target.value})}
                    placeholder="Ex: 25.5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={movementFormData.notes}
                    onChange={(e) => setMovementFormData({...movementFormData, notes: e.target.value})}
                    placeholder="Informations complémentaires..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsMovementDialogOpen(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent">
                    Enregistrer
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog Nouveau Stock */}
          <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Ajouter un stock</DialogTitle>
                <DialogDescription>
                  Enregistrer un nouveau stock par catégorie
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleStockSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stockSaltType">Type de sel</Label>
                  <Select 
                    value={stockFormData.saltType} 
                    onValueChange={(value) => setStockFormData({...stockFormData, saltType: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type de sel" />
                    </SelectTrigger>
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
                  <Label htmlFor="stockQuantity">Quantité (tonnes)</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    step="0.1"
                    value={stockFormData.quantity}
                    onChange={(e) => setStockFormData({...stockFormData, quantity: e.target.value})}
                    placeholder="Ex: 50.5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockWarehouse">Entrepôt</Label>
                  <Select 
                    value={stockFormData.warehouse} 
                    onValueChange={(value) => setStockFormData({...stockFormData, warehouse: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'entrepôt" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entrepôt A">Entrepôt A</SelectItem>
                      <SelectItem value="Entrepôt B">Entrepôt B</SelectItem>
                      <SelectItem value="Entrepôt C">Entrepôt C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harvestDate">Date de récolte</Label>
                  <Input
                    id="harvestDate"
                    type="date"
                    value={stockFormData.harvestDate}
                    onChange={(e) => setStockFormData({...stockFormData, harvestDate: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualityGrade">Qualité</Label>
                  <Select 
                    value={stockFormData.qualityGrade} 
                    onValueChange={(value) => setStockFormData({...stockFormData, qualityGrade: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner la qualité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Grade 1 (A+)</SelectItem>
                      <SelectItem value="2">Grade 2 (A)</SelectItem>
                      <SelectItem value="3">Grade 3 (B)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitCost">Coût unitaire (FCFA/tonne)</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    value={stockFormData.unitCost}
                    onChange={(e) => setStockFormData({...stockFormData, unitCost: e.target.value})}
                    placeholder="Ex: 150"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lotNumber">Numéro de lot</Label>
                  <Input
                    id="lotNumber"
                    type="text"
                    value={stockFormData.lotNumber}
                    onChange={(e) => setStockFormData({...stockFormData, lotNumber: e.target.value})}
                    placeholder="Ex: LOT-2025-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockNotes">Notes (optionnel)</Label>
                  <Textarea
                    id="stockNotes"
                    value={stockFormData.notes}
                    onChange={(e) => setStockFormData({...stockFormData, notes: e.target.value})}
                    placeholder="Informations complémentaires..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsStockDialogOpen(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent">
                    Ajouter le stock
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog Nouvel Entrepôt */}
          <Dialog open={isWarehouseDialogOpen} onOpenChange={setIsWarehouseDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un entrepôt</DialogTitle>
                <DialogDescription>
                  Ajouter un nouveau lieu de stockage avec sa localisation
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleWarehouseSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="warehouseName">Nom de l'entrepôt</Label>
                  <Input
                    id="warehouseName"
                    type="text"
                    value={warehouseFormData.name}
                    onChange={(e) => setWarehouseFormData({...warehouseFormData, name: e.target.value})}
                    placeholder="Ex: Entrepôt D"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warehouseCode">Code</Label>
                  <Input
                    id="warehouseCode"
                    type="text"
                    value={warehouseFormData.code}
                    onChange={(e) => setWarehouseFormData({...warehouseFormData, code: e.target.value})}
                    placeholder="Ex: ENT-D"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacité (tonnes)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    step="1"
                    value={warehouseFormData.capacity}
                    onChange={(e) => setWarehouseFormData({...warehouseFormData, capacity: e.target.value})}
                    placeholder="Ex: 500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Localisation</Label>
                  <Input
                    id="location"
                    type="text"
                    value={warehouseFormData.location}
                    onChange={(e) => setWarehouseFormData({...warehouseFormData, location: e.target.value})}
                    placeholder="Ex: Zone Nord"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Position GPS</Label>
                  <MapPicker
                    initialLat={warehouseFormData.latitude}
                    initialLng={warehouseFormData.longitude}
                    onLocationChange={(lat, lng) => {
                      setWarehouseFormData({
                        ...warehouseFormData,
                        latitude: lat,
                        longitude: lng
                      });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warehouseNotes">Notes (optionnel)</Label>
                  <Textarea
                    id="warehouseNotes"
                    value={warehouseFormData.notes}
                    onChange={(e) => setWarehouseFormData({...warehouseFormData, notes: e.target.value})}
                    placeholder="Informations complémentaires..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsWarehouseDialogOpen(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent">
                    Créer l'entrepôt
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">Gestion des Stocks</h1>
              <p className="text-sm sm:text-base text-muted-foreground break-words">
                Suivi en temps réel de vos stocks de sel par catégorie
              </p>
            </div>
            <Button onClick={handleNewMovement} className="gap-2 bg-gradient-to-r from-primary to-accent flex-shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Mouvement stock</span>
              <span className="sm:hidden">Mouvement</span>
            </Button>
          </div>

          {/* Vue d'ensemble */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Stock total</p>
                <p className="text-3xl font-bold">506 t</p>
                <p className="text-xs text-muted-foreground mt-1">5 catégories</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <Warehouse className="h-6 w-6 md:h-8 md:w-8 text-accent" />
                </div>
                <p className="text-xs md:text-sm text-muted-foreground truncate">Capacité utilisée</p>
                <p className="text-2xl md:text-3xl font-bold">65%</p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1 truncate">786 / 1200 tonnes</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <p className="text-xs md:text-sm text-muted-foreground truncate">Types de sel</p>
                {stockLoading ? (
                  <Skeleton className="h-9 w-12 mt-1" />
                ) : (
                  <p className="text-2xl md:text-3xl font-bold">{stockByType.length}</p>
                )}
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1 truncate">Catégories en stock</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-yellow-600" />
                </div>
                <p className="text-xs md:text-sm text-muted-foreground truncate">Alertes stock</p>
                {stockLoading ? (
                  <Skeleton className="h-9 w-12 mt-1" />
                ) : (
                  <p className="text-2xl md:text-3xl font-bold">{stockByType.filter(s => s.status === 'faible').length}</p>
                )}
                <p className="text-[10px] md:text-xs text-yellow-600 mt-1 truncate">Stock faible</p>
              </CardContent>
            </Card>
          </div>

          {/* Alerte stock */}
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm mb-1 break-words">Stock critique</p>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    Le stock de Sel export est sous le seuil critique (35%). Planifier réapprovisionnement urgent.
                  </p>
                </div>
                <Badge variant="outline" className="text-red-700 border-red-600 text-xs flex-shrink-0">
                  Urgent
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Stocks par catégorie */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Package className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                  <span className="truncate">Stocks par catégorie</span>
                </CardTitle>
                <Button onClick={handleNewStock} size="sm" className="gap-2 flex-shrink-0">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nouveau stock</span>
                  <span className="sm:hidden">Nouveau</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {stockLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : stockByType.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun stock disponible</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {stockByType.map((stock) => (
                    <div 
                      key={stock.type}
                      className="p-3 md:p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="font-semibold text-base md:text-lg break-words">{stock.type}</h3>
                            <Badge 
                              variant="outline"
                              className={`${statusConfig[stock.status].color} ${statusConfig[stock.status].border} text-xs flex-shrink-0 self-start sm:self-auto`}
                            >
                              {statusConfig[stock.status].label}
                            </Badge>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground break-words">
                            Dernière MAJ: {new Date(stock.lastUpdate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xl md:text-2xl font-bold">{Math.round(stock.quantity)} {stock.unit}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Entrepôts - Section masquée car pas de table dans la DB */}
          {/* Pour gérer les entrepôts, créer une table warehouses dans la base de données */}
        </main>
      </div>
    </div>
  );
};

export default Stocks;
