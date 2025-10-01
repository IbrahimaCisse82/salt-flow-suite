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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    movementType: "",
    date: "",
    saltType: "",
    warehouse: "",
    quantity: "",
    notes: ""
  });

  const totalValue = stockCategories.reduce(
    (sum, cat) => sum + parseFloat(cat.value.replace(/[FCFA,\s]/g, '')), 
    0
  );

  const handleNewMovement = () => {
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Stock movement submitted:", formData);
    toast({
      title: "Mouvement enregistré",
      description: `${formData.movementType} de ${formData.quantity} tonnes de ${formData.saltType}`,
    });
    setIsDialogOpen(false);
    setFormData({
      movementType: "",
      date: "",
      saltType: "",
      warehouse: "",
      quantity: "",
      notes: ""
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nouveau mouvement de stock</DialogTitle>
                <DialogDescription>
                  Enregistrer une entrée ou sortie de stock
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="movementType">Type de mouvement</Label>
                  <Select 
                    value={formData.movementType} 
                    onValueChange={(value) => setFormData({...formData, movementType: value})}
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
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saltType">Type de sel</Label>
                  <Select 
                    value={formData.saltType} 
                    onValueChange={(value) => setFormData({...formData, saltType: value})}
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
                    value={formData.warehouse} 
                    onValueChange={(value) => setFormData({...formData, warehouse: value})}
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
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    placeholder="Ex: 25.5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Informations complémentaires..."
                    rows={3}
                  />
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
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Stocks par catégorie
              </CardTitle>
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
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-primary" />
                État des entrepôts
              </CardTitle>
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
