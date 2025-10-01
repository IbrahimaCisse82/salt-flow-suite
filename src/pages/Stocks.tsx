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

const stockCategories = [
  {
    type: "Sel gros",
    quantity: 185,
    unit: "tonnes",
    capacity: 300,
    status: "optimal",
    warehouse: "Entrepôt A",
    lastUpdate: "2025-03-15",
    value: "27,750 FCFA"
  },
  {
    type: "Sel fin",
    quantity: 92,
    unit: "tonnes",
    capacity: 150,
    status: "optimal",
    warehouse: "Entrepôt B",
    lastUpdate: "2025-03-15",
    value: "18,400 FCFA"
  },
  {
    type: "Sel iodé",
    quantity: 45,
    unit: "tonnes",
    capacity: 100,
    status: "moyen",
    warehouse: "Entrepôt B",
    lastUpdate: "2025-03-14",
    value: "11,250 FCFA"
  },
  {
    type: "Sel industriel",
    quantity: 156,
    unit: "tonnes",
    capacity: 200,
    status: "optimal",
    warehouse: "Entrepôt C",
    lastUpdate: "2025-03-15",
    value: "18,720 FCFA"
  },
  {
    type: "Sel export",
    quantity: 28,
    unit: "tonnes",
    capacity: 80,
    status: "faible",
    warehouse: "Entrepôt A",
    lastUpdate: "2025-03-13",
    value: "8,400 FCFA"
  },
];

const warehouses = [
  {
    name: "Entrepôt A",
    capacity: 500,
    occupied: 380,
    temperature: "22°C",
    humidity: "45%",
    status: "optimal"
  },
  {
    name: "Entrepôt B",
    capacity: 300,
    occupied: 250,
    temperature: "21°C",
    humidity: "42%",
    status: "optimal"
  },
  {
    name: "Entrepôt C",
    capacity: 400,
    occupied: 156,
    temperature: "23°C",
    humidity: "48%",
    status: "attention"
  },
];

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

  const totalValue = stockCategories.reduce(
    (sum, cat) => sum + parseFloat(cat.value.replace(/[FCFA,\s]/g, '')), 
    0
  );

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
    console.log("Stock movement submitted:", movementFormData);
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
    console.log("New stock submitted:", stockFormData);
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
    console.log("New warehouse submitted:", warehouseFormData);
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
        
        <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 md:ml-64">
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gestion des Stocks</h1>
              <p className="text-muted-foreground">
                Suivi en temps réel de vos stocks de sel par catégorie
              </p>
            </div>
            <Button onClick={handleNewMovement} className="gap-2 bg-gradient-to-r from-primary to-accent">
              <Plus className="h-4 w-4" />
              Mouvement stock
            </Button>
          </div>

          {/* Vue d'ensemble */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Stock total</p>
                <p className="text-3xl font-bold">506 t</p>
                <p className="text-xs text-muted-foreground mt-1">5 catégories</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Warehouse className="h-8 w-8 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground">Capacité utilisée</p>
                <p className="text-3xl font-bold">65%</p>
                <p className="text-xs text-muted-foreground mt-1">786 / 1200 tonnes</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Valeur totale</p>
                <p className="text-3xl font-bold">{(totalValue / 1000).toFixed(0)}k FCFA</p>
                <p className="text-xs text-green-600 mt-1">+8% ce mois</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
                <p className="text-sm text-muted-foreground">Alertes</p>
                <p className="text-3xl font-bold">2</p>
                <p className="text-xs text-yellow-600 mt-1">Stock faible</p>
              </CardContent>
            </Card>
          </div>

          {/* Alerte stock */}
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">Stock critique</p>
                  <p className="text-sm text-muted-foreground">
                    Le stock de Sel export est sous le seuil critique (35%). Planifier réapprovisionnement urgent.
                  </p>
                </div>
                <Badge variant="outline" className="text-red-700 border-red-600">
                  Urgent
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Stocks par catégorie */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Stocks par catégorie
                </CardTitle>
                <Button onClick={handleNewStock} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau stock
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockCategories.map((stock, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{stock.type}</h3>
                          <Badge 
                            variant="outline"
                            className={`${statusConfig[stock.status].color} ${statusConfig[stock.status].border}`}
                          >
                            {statusConfig[stock.status].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {stock.warehouse} • Dernière mise à jour: {stock.lastUpdate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{stock.quantity} {stock.unit}</p>
                        <p className="text-sm text-muted-foreground">{stock.value}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Capacité</span>
                        <span className="font-medium">
                          {stock.quantity} / {stock.capacity} tonnes 
                          ({Math.round((stock.quantity / stock.capacity) * 100)}%)
                        </span>
                      </div>
                      <Progress 
                        value={(stock.quantity / stock.capacity) * 100}
                        className={
                          stock.status === "optimal" 
                            ? "[&>div]:bg-green-600"
                            : stock.status === "moyen"
                            ? "[&>div]:bg-yellow-600"
                            : "[&>div]:bg-red-600"
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Entrepôts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-primary" />
                  État des entrepôts
                </CardTitle>
                <Button onClick={handleNewWarehouse} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nouvel entrepôt
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {warehouses.map((warehouse, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{warehouse.name}</h3>
                          <Badge 
                            variant="outline"
                            className={`mt-1 ${statusConfig[warehouse.status].color} ${statusConfig[warehouse.status].border}`}
                          >
                            {statusConfig[warehouse.status].label}
                          </Badge>
                        </div>
                        <Warehouse className="h-8 w-8 text-primary" />
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Occupation</span>
                            <span className="font-medium">
                              {Math.round((warehouse.occupied / warehouse.capacity) * 100)}%
                            </span>
                          </div>
                          <Progress 
                            value={(warehouse.occupied / warehouse.capacity) * 100}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {warehouse.occupied} / {warehouse.capacity} tonnes
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <ThermometerSun className="h-4 w-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Température</p>
                              <p className="text-sm font-medium">{warehouse.temperature}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Humidité</p>
                              <p className="text-sm font-medium">{warehouse.humidity}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Stocks;
