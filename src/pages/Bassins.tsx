import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Droplets, Plus, MapPin, Eye, Settings } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBassins, BassinStatus, BassinType } from "@/hooks/useBassins";
import { CardGridSkeleton } from "@/components/LoadingSkeletons/CardGridSkeleton";
import { StatsSkeleton } from "@/components/LoadingSkeletons/StatsSkeleton";

const statusConfig: Record<BassinStatus, { label: string; className: string }> = {
  active: { label: "En production", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400" },
  repos: { label: "Repos", className: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400" },
  maintenance: { label: "Maintenance", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

const bassinTypes: BassinType[] = ['Bassin 1', 'Bassin 2', 'Bassin 3', 'Bassin 4', 'Table Salante'];

const getBassinStatus = (bassin: any): BassinStatus => {
  return (bassin.status as BassinStatus) || 'repos';
};

const Bassins = () => {
  const { toast } = useToast();
  const { isOpen } = useSidebar();
  const { bassins, isLoading, createBassin, updateBassin } = useBassins();

  const [selectedBassin, setSelectedBassin] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);

  const [newBassinData, setNewBassinData] = useState({
    name: "",
    code: "",
    area: undefined as number | undefined,
    location: "",
    status: "repos" as BassinStatus,
    bassin_type: undefined as BassinType | undefined,
  });

  const stats = {
    actifs: bassins.filter(b => b.status === 'active').length,
    repos: bassins.filter(b => b.status === 'repos' || !b.status).length,
    maintenance: bassins.filter(b => b.status === 'maintenance').length,
    surfaceTotale: bassins.reduce((sum, b) => sum + (b.area || 0), 0).toFixed(1),
  };

  const handleAddBassin = () => setShowAddDialog(true);
  
  const handleViewDetails = (bassin: any) => {
    setSelectedBassin(bassin);
    setShowDetailsDialog(true);
  };
  
  const handleManage = (bassin: any) => {
    setSelectedBassin({ ...bassin });
    setShowManageDialog(true);
  };

  const handleSaveNewBassin = async () => {
    try {
      await createBassin(newBassinData);
      toast({ title: "Bassin créé", description: "Bassin créé avec succès !" });
      setShowAddDialog(false);
      setNewBassinData({ name: "", code: "", area: undefined, location: "", status: "repos", bassin_type: undefined });
    } catch (error: any) {
      const message = error?.message || (typeof error === 'string' ? error : "Impossible de créer le bassin");
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  const handleSaveManage = async () => {
    if (!selectedBassin) return;
    try {
      await updateBassin({
        id: selectedBassin.id,
        name: selectedBassin.name,
        code: selectedBassin.code,
        area: selectedBassin.area,
        location: selectedBassin.location,
        status: selectedBassin.status,
        bassin_type: selectedBassin.bassin_type,
      });
      toast({
        title: "Modifications enregistrées",
        description: `Les modifications du bassin ${selectedBassin?.name} ont été enregistrées.`,
      });
      setShowManageDialog(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 p-4 md:p-6 space-y-4 md:space-y-6 transition-all duration-300", isOpen ? "md:ml-64" : "md:ml-16")}>

          {/* Header et bouton créer */}
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
                    <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.actifs}</p>
                  </div>
                  <Droplets className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Repos</p>
                    <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.repos}</p>
                  </div>
                  <Droplets className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Maintenance</p>
                    <p className="text-xl sm:text-2xl font-bold text-destructive">{stats.maintenance}</p>
                  </div>
                  <Settings className="h-6 w-6 text-destructive" />
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
                {bassins.map((bassin) => {
                  const status = getBassinStatus(bassin);
                  return (
                    <Card key={bassin.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="p-4 md:p-6 flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg md:text-xl">{bassin.name}</CardTitle>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {bassin.location || "Non spécifié"}
                            {bassin.code && <>• <span className="text-primary">{bassin.code}</span></>}
                            {(bassin as any).bassin_type && <>• <span className="text-muted-foreground">{(bassin as any).bassin_type}</span></>}
                          </p>
                        </div>
                        <Badge className={statusConfig[status].className}>
                          {statusConfig[status].label}
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
                            <p className="text-lg font-semibold">{statusConfig[status].label}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={() => handleViewDetails(bassin)}>
                            <Eye className="h-4 w-4 mr-1" />Détails
                          </Button>
                          <Button variant="outline" className="flex-1" onClick={() => handleManage(bassin)}>
                            <Settings className="h-4 w-4 mr-1" />Gérer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

          {/* Dialog Ajouter un bassin */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Nouveau bassin</DialogTitle>
                <DialogDescription>Ajouter un bassin au système</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input value={newBassinData.name} onChange={e => setNewBassinData({ ...newBassinData, name: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Type de bassin</Label>
                  <Select value={newBassinData.bassin_type} onValueChange={(value) => setNewBassinData({ ...newBassinData, bassin_type: value as BassinType })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      {bassinTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={newBassinData.status} onValueChange={(value) => setNewBassinData({ ...newBassinData, status: value as BassinStatus })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">En production</SelectItem>
                      <SelectItem value="repos">Repos</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input value={newBassinData.code} onChange={e => setNewBassinData({ ...newBassinData, code: e.target.value })} placeholder="Ex: B1-001" />
                </div>

                <div className="space-y-2">
                  <Label>Surface (ha)</Label>
                  <Input type="number" step="0.01" value={newBassinData.area ?? ''} onChange={e => setNewBassinData({ ...newBassinData, area: e.target.value ? parseFloat(e.target.value) : undefined })} />
                </div>

                <div className="space-y-2">
                  <Label>Localisation</Label>
                  <Input value={newBassinData.location} onChange={e => setNewBassinData({ ...newBassinData, location: e.target.value })} placeholder="Ex: Zone Nord" />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>Annuler</Button>
                  <Button className="flex-1 bg-gradient-to-r from-primary to-accent" onClick={handleSaveNewBassin} disabled={!newBassinData.name}>Créer</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog Détails */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Détails du bassin</DialogTitle>
              </DialogHeader>
              {selectedBassin && (
                <div className="space-y-4">
                  <p><strong>Nom :</strong> {selectedBassin.name}</p>
                  <p><strong>Type :</strong> {selectedBassin.bassin_type || "Non défini"}</p>
                  <p><strong>Code :</strong> {selectedBassin.code || "Non défini"}</p>
                  <p><strong>Surface :</strong> {selectedBassin.area ? `${selectedBassin.area} ha` : "Non spécifié"}</p>
                  <p><strong>Localisation :</strong> {selectedBassin.location || "Non spécifiée"}</p>
                  <p><strong>Statut :</strong> {statusConfig[getBassinStatus(selectedBassin)].label}</p>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog Gérer */}
          <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gérer le bassin</DialogTitle>
              </DialogHeader>
              {selectedBassin && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input value={selectedBassin.name} onChange={e => setSelectedBassin({ ...selectedBassin, name: e.target.value })} />
                  </div>

                  <div className="space-y-2">
                    <Label>Type de bassin</Label>
                    <Select value={selectedBassin.bassin_type || ''} onValueChange={(value) => setSelectedBassin({ ...selectedBassin, bassin_type: value as BassinType })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        {bassinTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={selectedBassin.status || 'repos'} onValueChange={(value) => setSelectedBassin({ ...selectedBassin, status: value as BassinStatus })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">En production</SelectItem>
                        <SelectItem value="repos">Repos</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input value={selectedBassin.code || ''} onChange={e => setSelectedBassin({ ...selectedBassin, code: e.target.value })} />
                  </div>

                  <div className="space-y-2">
                    <Label>Surface (ha)</Label>
                    <Input type="number" step="0.01" value={selectedBassin.area ?? ''} onChange={e => setSelectedBassin({ ...selectedBassin, area: e.target.value ? parseFloat(e.target.value) : undefined })} />
                  </div>

                  <div className="space-y-2">
                    <Label>Localisation</Label>
                    <Input value={selectedBassin.location || ''} onChange={e => setSelectedBassin({ ...selectedBassin, location: e.target.value })} />
                  </div>

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
