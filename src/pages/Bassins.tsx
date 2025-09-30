import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Droplets, 
  Plus, 
  MapPin, 
  ThermometerSun,
  Eye,
  Settings
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import MapPicker from "@/components/Map/MapPicker";
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

const bassins = [
  {
    id: "B1",
    name: "Bassin Nord A",
    type: "surface_preparatoire",
    surface: 2.5,
    status: "active",
    salinity: 28,
    waterLevel: 85,
    location: "Secteur Nord",
    lastHarvest: "2025-02-15",
    production: "12.5 tonnes",
  },
  {
    id: "B2",
    name: "Bassin Nord B",
    type: "table_salante",
    surface: 3.0,
    status: "active",
    salinity: 32,
    waterLevel: 78,
    location: "Secteur Nord",
    lastHarvest: "2025-02-10",
    production: "15.2 tonnes",
  },
  {
    id: "B3",
    name: "Bassin Sud A",
    type: "surface_preparatoire",
    surface: 2.8,
    status: "repos",
    salinity: 15,
    waterLevel: 45,
    location: "Secteur Sud",
    lastHarvest: "2025-01-28",
    production: "11.8 tonnes",
  },
  {
    id: "B4",
    name: "Bassin Sud B",
    type: "table_salante",
    surface: 3.2,
    status: "maintenance",
    salinity: 0,
    waterLevel: 0,
    location: "Secteur Sud",
    lastHarvest: "2025-01-20",
    production: "0 tonnes",
  },
  {
    id: "B5",
    name: "Bassin Est A",
    type: "surface_preparatoire",
    surface: 2.2,
    status: "active",
    salinity: 30,
    waterLevel: 82,
    location: "Secteur Est",
    lastHarvest: "2025-02-18",
    production: "10.5 tonnes",
  },
  {
    id: "B6",
    name: "Bassin Est B",
    type: "table_salante",
    surface: 2.7,
    status: "active",
    salinity: 29,
    waterLevel: 88,
    location: "Secteur Est",
    lastHarvest: "2025-02-12",
    production: "13.1 tonnes",
  },
  {
    id: "B7",
    name: "Bassin Ouest A",
    type: "surface_preparatoire",
    surface: 3.5,
    status: "repos",
    salinity: 18,
    waterLevel: 50,
    location: "Secteur Ouest",
    lastHarvest: "2025-02-01",
    production: "16.8 tonnes",
  },
  {
    id: "B8",
    name: "Bassin Ouest B",
    type: "table_salante",
    surface: 3.1,
    status: "repos",
    salinity: 12,
    waterLevel: 40,
    location: "Secteur Ouest",
    lastHarvest: "2025-01-25",
    production: "14.2 tonnes",
  },
];

const bassinTypeLabels = {
  surface_preparatoire: "Surface préparatoire",
  table_salante: "Table salante",
};

const statusConfig = {
  active: { 
    label: "En production", 
    className: "bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/30" 
  },
  repos: { 
    label: "Repos", 
    className: "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 border-yellow-500/30" 
  },
  maintenance: { 
    label: "Maintenance", 
    className: "bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-500/30" 
  },
};

const Bassins = () => {
  const { toast } = useToast();
  const [selectedBassin, setSelectedBassin] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [newBassinLocation, setNewBassinLocation] = useState({ lat: 14.7167, lng: -17.4677 });

  const handleViewDetails = (bassin) => {
    setSelectedBassin(bassin);
    setShowDetailsDialog(true);
  };

  const handleManage = (bassin) => {
    setSelectedBassin(bassin);
    setShowManageDialog(true);
  };

  const handleSaveManage = () => {
    toast({
      title: "Modifications enregistrées",
      description: `Les modifications du bassin ${selectedBassin?.name} ont été enregistrées`,
    });
    setShowManageDialog(false);
  };

  const handleAddBassin = () => {
    setShowAddDialog(true);
  };

  const handleSaveNewBassin = () => {
    toast({
      title: "Bassin créé",
      description: `Bassin créé avec succès (${newBassinLocation.lat.toFixed(4)}, ${newBassinLocation.lng.toFixed(4)})`,
    });
    setShowAddDialog(false);
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setNewBassinLocation({ lat, lng });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gestion des Bassins Salants</h1>
              <p className="text-muted-foreground">
                Vue d'ensemble et suivi de vos {bassins.length} bassins de production
              </p>
            </div>
            <Button 
              onClick={handleAddBassin}
              className="gap-2 bg-gradient-to-r from-primary to-accent"
            >
              <Plus className="h-4 w-4" />
              Nouveau bassin
            </Button>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Actifs</p>
                    <p className="text-2xl font-bold text-green-600">4</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Droplets className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En repos</p>
                    <p className="text-2xl font-bold text-yellow-600">3</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Droplets className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Maintenance</p>
                    <p className="text-2xl font-bold text-red-600">1</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Surface totale</p>
                    <p className="text-2xl font-bold">23 ha</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des bassins */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {bassins.map((bassin) => (
              <Card key={bassin.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{bassin.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {bassin.location}
                        </p>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm font-medium text-primary">
                          {bassinTypeLabels[bassin.type]}
                        </span>
                      </div>
                    </div>
                    <Badge className={statusConfig[bassin.status].className}>
                      {statusConfig[bassin.status].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Surface</p>
                      <p className="text-lg font-semibold">{bassin.surface} ha</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Production</p>
                      <p className="text-lg font-semibold">{bassin.production}</p>
                    </div>
                  </div>

                  {bassin.status === "active" && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <ThermometerSun className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Salinité</span>
                        </div>
                        <p className="text-xl font-bold text-primary">{bassin.salinity}%</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Droplets className="h-4 w-4 text-accent" />
                          <span className="text-sm font-medium">Niveau</span>
                        </div>
                        <p className="text-xl font-bold text-accent">{bassin.waterLevel}%</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Dernière récolte</p>
                    <p className="text-sm font-medium">{bassin.lastHarvest}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={() => handleViewDetails(bassin)}
                    >
                      <Eye className="h-4 w-4" />
                      Détails
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={() => handleManage(bassin)}
                    >
                      <Settings className="h-4 w-4" />
                      Gérer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dialog Détails du bassin */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Détails du bassin</DialogTitle>
                <DialogDescription>
                  Informations complètes sur {selectedBassin?.name}
                </DialogDescription>
              </DialogHeader>
              {selectedBassin && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Identifiant</Label>
                      <p className="text-lg font-semibold">{selectedBassin.id}</p>
                    </div>
                    <div>
                      <Label>Surface</Label>
                      <p className="text-lg font-semibold">{selectedBassin.surface} ha</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Type de bassin</Label>
                      <p className="text-sm font-medium">{bassinTypeLabels[selectedBassin.type]}</p>
                    </div>
                    <div>
                      <Label>Localisation</Label>
                      <p className="text-sm">{selectedBassin.location}</p>
                    </div>
                  </div>

                  <div>
                    <Label>Statut</Label>
                    <Badge className={statusConfig[selectedBassin.status].className}>
                      {statusConfig[selectedBassin.status].label}
                    </Badge>
                  </div>

                  {selectedBassin.status === "active" && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <Label>Salinité</Label>
                        <p className="text-2xl font-bold text-primary">{selectedBassin.salinity}%</p>
                      </div>
                      <div>
                        <Label>Niveau d'eau</Label>
                        <p className="text-2xl font-bold text-accent">{selectedBassin.waterLevel}%</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Label>Dernière récolte</Label>
                    <p className="text-sm">{selectedBassin.lastHarvest}</p>
                  </div>

                  <div>
                    <Label>Production totale</Label>
                    <p className="text-lg font-semibold">{selectedBassin.production}</p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog Gérer un bassin */}
          <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gérer le bassin</DialogTitle>
                <DialogDescription>
                  Modifier les paramètres de {selectedBassin?.name}
                </DialogDescription>
              </DialogHeader>
              {selectedBassin && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manage-name">Nom du bassin</Label>
                      <Input id="manage-name" defaultValue={selectedBassin.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manage-code">Code</Label>
                      <Input id="manage-code" defaultValue={selectedBassin.id} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manage-surface">Surface (ha)</Label>
                      <Input 
                        id="manage-surface" 
                        type="number" 
                        defaultValue={selectedBassin.surface} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manage-location">Localisation</Label>
                      <Input id="manage-location" defaultValue={selectedBassin.location} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manage-type">Type de bassin</Label>
                      <Select defaultValue={selectedBassin.type}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="surface_preparatoire">Surface préparatoire</SelectItem>
                          <SelectItem value="table_salante">Table salante</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manage-status">Statut</Label>
                      <Select defaultValue={selectedBassin.status}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">En production</SelectItem>
                          <SelectItem value="repos">Repos</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedBassin.status === "active" && (
                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                      <div className="space-y-2">
                        <Label htmlFor="manage-salinity">Salinité (%)</Label>
                        <Input 
                          id="manage-salinity" 
                          type="number" 
                          defaultValue={selectedBassin.salinity} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manage-waterLevel">Niveau d'eau (%)</Label>
                        <Input 
                          id="manage-waterLevel" 
                          type="number" 
                          defaultValue={selectedBassin.waterLevel} 
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowManageDialog(false)}
                    >
                      Annuler
                    </Button>
                    <Button 
                      className="flex-1 bg-gradient-to-r from-primary to-accent"
                      onClick={handleSaveManage}
                    >
                      Enregistrer les modifications
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog Ajouter un bassin */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un nouveau bassin</DialogTitle>
                <DialogDescription>
                  Remplissez les informations du nouveau bassin
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du bassin</Label>
                    <Input id="name" placeholder="Ex: Bassin Nord C" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Code</Label>
                    <Input id="code" placeholder="Ex: B9" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="surface">Surface (ha)</Label>
                    <Input id="surface" type="number" placeholder="2.5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Localisation</Label>
                    <Input id="location" placeholder="Ex: Secteur Nord" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type de bassin</Label>
                    <Select defaultValue="surface_preparatoire">
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="surface_preparatoire">Surface préparatoire</SelectItem>
                        <SelectItem value="table_salante">Table salante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut initial</Label>
                    <Select defaultValue="repos">
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">En production</SelectItem>
                        <SelectItem value="repos">Repos</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Localisation sur la carte</Label>
                  <MapPicker 
                    onLocationChange={handleLocationChange}
                    initialLat={14.7167}
                    initialLng={-17.4677}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-primary to-accent"
                    onClick={handleSaveNewBassin}
                  >
                    Créer le bassin
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default Bassins;
