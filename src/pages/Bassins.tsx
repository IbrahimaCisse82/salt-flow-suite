import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { 
  Droplets, 
  Plus, 
  MapPin, 
  ThermometerSun,
  Eye,
  Settings
} from "lucide-react";
import { useState, lazy, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
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
import { useBassins } from "@/hooks/useBassins";
import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/LoadingSkeletons/CardGridSkeleton";
import { StatsSkeleton } from "@/components/LoadingSkeletons/StatsSkeleton";

// Lazy load MapPicker pour améliorer les performances
const MapPicker = lazy(() => import("@/components/Map/MapPicker"));

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
  const { isOpen } = useSidebar();
  const { bassins, isLoading } = useBassins();
  const [selectedBassin, setSelectedBassin] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [newBassinLocation, setNewBassinLocation] = useState({ lat: 14.7167, lng: -17.4677 });
  const [manageBassinLocation, setManageBassinLocation] = useState({ lat: 14.7167, lng: -17.4677 });

  // Calculer les stats dynamiquement
  const stats = {
    actifs: bassins.filter(b => b.is_active).length,
    repos: bassins.filter(b => !b.is_active).length,
    maintenance: 0, // À implémenter avec un champ status
    surfaceTotale: bassins.reduce((sum, b) => sum + (b.area || 0), 0).toFixed(1)
  };

  const handleViewDetails = (bassin) => {
    setSelectedBassin(bassin);
    setShowDetailsDialog(true);
  };

  const handleManage = (bassin) => {
    setSelectedBassin(bassin);
    // Initialize location if bassin has coordinates, otherwise use default
    setManageBassinLocation({ 
      lat: bassin.latitude || 14.7167, 
      lng: bassin.longitude || -17.4677 
    });
    setShowManageDialog(true);
  };

  const handleSaveManage = () => {
    toast({
      title: "Modifications enregistrées",
      description: `Les modifications du bassin ${selectedBassin?.name} ont été enregistrées à (${manageBassinLocation.lat.toFixed(6)}, ${manageBassinLocation.lng.toFixed(6)})`,
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

  const handleManageLocationChange = (lat: number, lng: number) => {
    setManageBassinLocation({ lat, lng });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className={cn(
          "flex-1 p-4 md:p-6 space-y-4 md:space-y-6 transition-all duration-300",
          isOpen ? "md:ml-64" : "md:ml-16"
        )}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">Gestion des Bassins Salants</h1>
              <p className="text-sm sm:text-base text-muted-foreground break-words">
                {isLoading ? "Chargement..." : `Vue d'ensemble et suivi de vos ${bassins.length} bassins de production`}
              </p>
            </div>
            <Button 
              onClick={handleAddBassin}
              className="gap-2 bg-gradient-to-r from-primary to-accent flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau bassin</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </div>

          {/* Stats rapides */}
          {isLoading ? (
            <StatsSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Actifs</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.actifs}</p>
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Droplets className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">En repos</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.repos}</p>
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
                      <p className="text-2xl font-bold text-red-600">{stats.maintenance}</p>
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
                      <p className="text-2xl font-bold">{`${stats.surfaceTotale} ha`}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Liste des bassins */}
          {isLoading ? (
            <CardGridSkeleton cards={6} columns={2} />
          ) : bassins.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <Droplets className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Aucun bassin</h3>
                <p className="text-muted-foreground mb-4">Commencez par créer votre premier bassin de production</p>
                <Button onClick={handleAddBassin} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Créer un bassin
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bassins.map((bassin) => (
                <Card key={bassin.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg md:text-xl break-words">{bassin.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {bassin.location || "Non spécifié"}
                          </p>
                          {bassin.code && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-sm font-medium text-primary">
                                {bassin.code}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge className={bassin.is_active ? statusConfig.active.className : statusConfig.repos.className}>
                        {bassin.is_active ? statusConfig.active.label : statusConfig.repos.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 md:p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Surface</p>
                        <p className="text-lg font-semibold">{bassin.area ? `${bassin.area} ha` : "Non spécifié"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Statut</p>
                        <p className="text-lg font-semibold">{bassin.is_active ? "Actif" : "Inactif"}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Créé le</p>
                      <p className="text-sm font-medium">
                        {new Date(bassin.created_at).toLocaleDateString('fr-FR')}
                      </p>
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
          )}

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
                      <Label>Code</Label>
                      <p className="text-lg font-semibold">{selectedBassin.code || "Non défini"}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Surface</Label>
                      <p className="text-lg font-semibold">{selectedBassin.area ? `${selectedBassin.area} ha` : "Non spécifié"}</p>
                    </div>
                    <div>
                      <Label>Localisation</Label>
                      <p className="text-sm">{selectedBassin.location || "Non spécifiée"}</p>
                    </div>
                  </div>

                  <div>
                    <Label>Statut</Label>
                    <Badge className={selectedBassin.is_active ? statusConfig.active.className : statusConfig.repos.className}>
                      {selectedBassin.is_active ? statusConfig.active.label : statusConfig.repos.label}
                    </Badge>
                  </div>

                  <div className="pt-4 border-t">
                    <Label>Date de création</Label>
                    <p className="text-sm">{new Date(selectedBassin.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>

                  <div>
                    <Label>Dernière modification</Label>
                    <p className="text-sm">{new Date(selectedBassin.updated_at).toLocaleDateString('fr-FR')}</p>
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
                      <Input id="manage-code" defaultValue={selectedBassin.code} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manage-surface">Surface (ha)</Label>
                      <Input 
                        id="manage-surface" 
                        type="number" 
                        defaultValue={selectedBassin.area} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manage-location">Localisation</Label>
                      <Input id="manage-location" defaultValue={selectedBassin.location} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manage-status">Statut</Label>
                    <Select defaultValue={selectedBassin.is_active ? "active" : "repos"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="repos">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Localisation GPS</Label>
                    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
                      <MapPicker 
                        onLocationChange={handleManageLocationChange}
                        initialLat={manageBassinLocation.lat}
                        initialLng={manageBassinLocation.lng}
                      />
                    </Suspense>
                  </div>

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
                    <Label htmlFor="area">Surface (ha)</Label>
                    <Input id="area" type="number" step="0.1" placeholder="2.5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Localisation</Label>
                    <Input id="location" placeholder="Ex: Secteur Nord" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut initial</Label>
                  <Select defaultValue="false">
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Actif</SelectItem>
                      <SelectItem value="false">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Localisation sur la carte</Label>
                  <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
                    <MapPicker 
                      onLocationChange={handleLocationChange}
                      initialLat={14.7167}
                      initialLng={-17.4677}
                    />
                  </Suspense>
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
