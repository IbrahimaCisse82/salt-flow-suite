import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Droplets, Plus, MapPin, Eye, Settings } from "lucide-react";
import { useState, lazy, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBassins } from "@/hooks/useBassins";
import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/LoadingSkeletons/CardGridSkeleton";
import { StatsSkeleton } from "@/components/LoadingSkeletons/StatsSkeleton";
import { Switch } from "@/components/ui/switch"; // Toggle stylé pour Maintenance

const MapPicker = lazy(() => import("@/components/Map/MapPicker"));

// Configuration des couleurs et labels pour les badges
const statusConfig = {
  active: { label: "En production", className: "bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/30" },
  repos: { label: "Repos", className: "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 border-yellow-500/30" },
  maintenance: { label: "Maintenance", className: "bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-500/30" },
};

// Fonction utilitaire pour déterminer le statut d’un bassin (frontend uniquement)
const getBassinStatus = (bassin, maintenanceStates) => {
  if (maintenanceStates[bassin.id]) return "maintenance"; // si togglé en maintenance
  return bassin.is_active ? "active" : "repos"; // sinon actif ou repos
};

const Bassins = () => {
  const { toast } = useToast();
  const { isOpen } = useSidebar();
  const { bassins, isLoading, createBassin, isCreating, updateBassin, isUpdating } = useBassins();

  // State pour le bassin sélectionné pour les dialogs
  const [selectedBassin, setSelectedBassin] = useState(null);

  // State pour afficher/cacher les différents dialogs
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);

  // Locations pour MapPicker
  const [newBassinLocation, setNewBassinLocation] = useState({ lat: 14.7167, lng: -17.4677 });
  const [manageBassinLocation, setManageBassinLocation] = useState({ lat: 14.7167, lng: -17.4677 });

  // ✅ Maintenance gérée uniquement côté frontend
  const [maintenanceStates, setMaintenanceStates] = useState<{ [id: string]: boolean }>({});

  // State pour le formulaire Ajouter un bassin
  const [newBassinData, setNewBassinData] = useState({
    name: "",
    code: "",
    area: undefined,
    location: "",
    is_active: false,
  });

  // Statistiques calculées dynamiquement
  const stats = {
    actifs: bassins.filter(b => b.is_active && !maintenanceStates[b.id]).length,
    repos: bassins.filter(b => !b.is_active && !maintenanceStates[b.id]).length,
    maintenance: bassins.filter(b => maintenanceStates[b.id]).length,
    surfaceTotale: bassins.reduce((sum, b) => sum + (b.area || 0), 0).toFixed(1),
  };

  /** Gestion des boutons Détails et Gérer **/
  const handleViewDetails = (bassin) => {
    setSelectedBassin(bassin); // on sélectionne le bassin pour le dialog
    setShowDetailsDialog(true); // on ouvre le dialog
  };

  const handleManage = (bassin) => {
    setSelectedBassin(bassin);
    setManageBassinLocation({ lat: bassin.latitude || 14.7167, lng: bassin.longitude || -17.4677 });
    setShowManageDialog(true);
  };

  // Sauvegarde des modifications dans le dialog Gérer - persistance réelle
  const handleSaveManage = async () => {
    if (!selectedBassin) return;
    
    try {
      await updateBassin({
        id: selectedBassin.id,
        name: selectedBassin.name,
        code: selectedBassin.code,
        area: selectedBassin.area,
        location: selectedBassin.location,
        is_active: !maintenanceStates[selectedBassin.id]
      });
      setShowManageDialog(false);
    } catch (error) {
      console.error("Update bassin error:", error);
    }
  };

  // Ouvre le dialog Ajouter un bassin
  const handleAddBassin = () => setShowAddDialog(true);

  // Sauvegarde du nouveau bassin (appel createBassin, DB uniquement pour is_active)
  const handleSaveNewBassin = async () => {
    try {
      await createBassin({
        name: newBassinData.name,
        code: newBassinData.code,
        area: newBassinData.area,
        location: newBassinData.location,
        is_active: newBassinData.is_active,
      });
      toast({ title: "Bassin créé", description: "Bassin créé avec succès !" });
      setShowAddDialog(false);
      setNewBassinData({ name: "", code: "", area: undefined, location: "", is_active: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  /** Gestion des changements de localisation pour MapPicker **/
  const handleLocationChange = (lat: number, lng: number) => setNewBassinLocation({ lat, lng });
  const handleManageLocationChange = (lat: number, lng: number) => setManageBassinLocation({ lat, lng });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 p-4 md:p-6 space-y-4 md:space-y-6 transition-all duration-300", isOpen ? "md:ml-64" : "md:ml-16")}>

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">Gestion des Bassins Salants</h1>
              <p className="text-sm sm:text-base text-muted-foreground break-words">
                {isLoading ? "Chargement..." : `Vue d'ensemble et suivi de vos ${bassins.length} bassins de production`}
              </p>
            </div>
            <Button onClick={handleAddBassin} className="gap-2 bg-gradient-to-r from-primary to-accent flex-shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau bassin</span>
            </Button>
          </div>

          {/* Stats */}
          {isLoading ? <StatsSkeleton count={4} /> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-3 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Actifs</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.actifs}</p>
                  </div>
                  <Droplets className="h-6 w-6 text-green-600" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Repos</p>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.repos}</p>
                  </div>
                  <Droplets className="h-6 w-6 text-yellow-600" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Maintenance</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.maintenance}</p>
                  </div>
                  <Settings className="h-6 w-6 text-red-600" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Surface totale</p>
                    <p className="text-xl sm:text-2xl font-bold">{`${stats.surfaceTotale} ha`}</p>
                  </div>
                  <MapPin className="h-6 w-6 text-primary" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Liste des bassins */}
          {isLoading ? <CardGridSkeleton cards={6} columns={2} /> :
            bassins.length === 0 ? (
              <Card className="col-span-full text-center p-12">
                <Droplets className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Aucun bassin</h3>
                <p className="text-muted-foreground mb-4">Commencez par créer votre premier bassin de production</p>
                <Button onClick={handleAddBassin} className="gap-2"><Plus className="h-4 w-4" />Créer un bassin</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bassins.map((bassin) => (
                  <Card key={bassin.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="p-4 md:p-6 flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg md:text-xl">{bassin.name}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {bassin.location || "Non spécifié"}
                          {bassin.code && <>• <span className="text-primary">{bassin.code}</span></>}
                        </p>
                      </div>
                      <Badge className={statusConfig[getBassinStatus(bassin, maintenanceStates)].className}>
                        {statusConfig[getBassinStatus(bassin, maintenanceStates)].label}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 md:p-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Surface</p>
                          <p className="text-lg font-semibold">{bassin.area ? `${bassin.area} ha` : "Non spécifié"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Statut</p>
                          <p className="text-lg font-semibold">
                            {getBassinStatus(bassin, maintenanceStates) === "active" ? "Actif" :
                              getBassinStatus(bassin, maintenanceStates) === "repos" ? "Repos" : "Maintenance"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => handleViewDetails(bassin)}>
                          <Eye className="h-4 w-4" />Détails
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => handleManage(bassin)}>
                          <Settings className="h-4 w-4" />Gérer
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
                <DialogDescription>Informations complètes sur {selectedBassin?.name}</DialogDescription>
              </DialogHeader>
              {selectedBassin && (
                <div className="space-y-4">
                  {/* Identifiant et Code */}
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

                  {/* Surface et Localisation */}
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

                  {/* Statut */}
                  <div>
                    <Label>Statut</Label>
                    <Badge className={statusConfig[getBassinStatus(selectedBassin, maintenanceStates)].className}>
                      {statusConfig[getBassinStatus(selectedBassin, maintenanceStates)].label}
                    </Badge>
                  </div>

                  {/* Dates */}
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

          {/* Dialog Gérer un bassin (avec toggle Maintenance) */}
          <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gérer le bassin</DialogTitle>
                <DialogDescription>Modifier les paramètres de {selectedBassin?.name}</DialogDescription>
              </DialogHeader>
              {selectedBassin && (
                <div className="space-y-4">
                  {/* Nom & Code */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom du bassin</Label>
                      <Input value={selectedBassin.name} />
                    </div>
                    <div className="space-y-2">
                      <Label>Code</Label>
                      <Input value={selectedBassin.code} />
                    </div>
                  </div>

                  {/* Surface & Localisation */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Surface (ha)</Label>
                      <Input type="number" value={selectedBassin.area} />
                    </div>
                    <div className="space-y-2">
                      <Label>Localisation</Label>
                      <Input value={selectedBassin.location} />
                    </div>
                  </div>

                  {/* ✅ Toggle Maintenance */}
                  <div className="flex items-center gap-2 pt-2">
                    <Switch id="maintenance" checked={!!maintenanceStates[selectedBassin.id]} onCheckedChange={(checked) => setMaintenanceStates({ ...maintenanceStates, [selectedBassin.id]: checked })} />
                    <Label htmlFor="maintenance" className="mb-0">Maintenance</Label>
                  </div>

                  {/* Localisation GPS */}
                  <div className="space-y-2">
                    <Label>Localisation GPS</Label>
                    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
                      <MapPicker onLocationChange={handleManageLocationChange} initialLat={manageBassinLocation.lat} initialLng={manageBassinLocation.lng} />
                    </Suspense>
                  </div>

                  {/* Boutons */}
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => setShowManageDialog(false)}>Annuler</Button>
                    <Button className="flex-1 bg-gradient-to-r from-primary to-accent" onClick={handleSaveManage}>Enregistrer</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

        </main>
      </div>
    </div>
  );
};

export default Bassins;
