import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const productionData = [
  { bassin: "Nord A", selGros: 45, selFin: 28, selIode: 12 },
  { bassin: "Nord B", selGros: 52, selFin: 31, selIode: 15 },
  { bassin: "Est A", selGros: 38, selFin: 24, selIode: 10 },
  { bassin: "Est B", selGros: 48, selFin: 29, selIode: 14 },
];

const recentHarvests = [
  {
    date: "2025-03-15",
    bassin: "Bassin Nord B",
    quantity: 15.2,
    type: "Sel gros",
    quality: "A+",
    status: "completed",
    team: "Équipe Alpha"
  },
  {
    date: "2025-03-14",
    bassin: "Bassin Est B",
    quantity: 13.1,
    type: "Sel fin",
    quality: "A",
    status: "completed",
    team: "Équipe Beta"
  },
  {
    date: "2025-03-13",
    bassin: "Bassin Nord A",
    quantity: 12.5,
    type: "Sel gros",
    quality: "A+",
    status: "completed",
    team: "Équipe Alpha"
  },
  {
    date: "2025-03-12",
    bassin: "Bassin Est A",
    quantity: 10.5,
    type: "Sel iodé",
    quality: "A",
    status: "processing",
    team: "Équipe Gamma"
  },
];

const Production = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    bassin: "",
    quantity: "",
    type: "",
    quality: "",
    team: "",
    status: "completed"
  });

  const handleNewHarvest = () => {
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    toast({
      title: "Récolte enregistrée",
      description: `${formData.quantity} tonnes de ${formData.type} enregistrées avec succès`,
    });
    setIsDialogOpen(false);
    setFormData({
      date: "",
      bassin: "",
      quantity: "",
      type: "",
      quality: "",
      team: "",
      status: "completed"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6 md:ml-64">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
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
                      <SelectItem value="Bassin Nord A">Bassin Nord A</SelectItem>
                      <SelectItem value="Bassin Nord B">Bassin Nord B</SelectItem>
                      <SelectItem value="Bassin Est A">Bassin Est A</SelectItem>
                      <SelectItem value="Bassin Est B">Bassin Est B</SelectItem>
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
                  <Select 
                    value={formData.team} 
                    onValueChange={(value) => setFormData({...formData, team: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'équipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Équipe Alpha">Équipe Alpha</SelectItem>
                      <SelectItem value="Équipe Beta">Équipe Beta</SelectItem>
                      <SelectItem value="Équipe Gamma">Équipe Gamma</SelectItem>
                    </SelectContent>
                  </Select>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Suivi de Production</h1>
              <p className="text-muted-foreground">
                Gestion et traçabilité de la production saline
              </p>
            </div>
            <Button onClick={handleNewHarvest} className="gap-2 bg-gradient-to-r from-primary to-accent">
              <Plus className="h-4 w-4" />
              Nouvelle récolte
            </Button>
          </div>

          {/* KPIs Production */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Database className="h-8 w-8 text-primary" />
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">Production totale</p>
                <p className="text-3xl font-bold">438 t</p>
                <p className="text-xs text-green-600 mt-1">+12% vs. objectif</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Droplets className="h-8 w-8 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground">Rendement moyen</p>
                <p className="text-3xl font-bold">4.2 t/ha</p>
                <p className="text-xs text-muted-foreground mt-1">Par bassin actif</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Récoltes ce mois</p>
                <p className="text-3xl font-bold">24</p>
                <p className="text-xs text-muted-foreground mt-1">Mars 2025</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">Qualité A+</p>
                <p className="text-3xl font-bold">87%</p>
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productionData}>
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
              <div className="space-y-3">
                {recentHarvests.map((harvest, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        harvest.status === "completed" 
                          ? "bg-green-500/10" 
                          : "bg-yellow-500/10"
                      }`}>
                        {harvest.status === "completed" ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <Clock className="h-6 w-6 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{harvest.bassin}</p>
                        <p className="text-sm text-muted-foreground">
                          {harvest.date} • {harvest.team}
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
                        className={
                          harvest.status === "completed"
                            ? "bg-green-500/10 text-green-700 hover:bg-green-500/20"
                            : "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20"
                        }
                      >
                        {harvest.status === "completed" ? "Complété" : "En traitement"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contrôle qualité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Paramètres de qualité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Salinité moyenne</span>
                  <span className="font-bold text-primary">29.5%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Taux d'humidité</span>
                  <span className="font-bold text-accent">3.2%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Granulométrie</span>
                  <span className="font-bold text-green-600">Conforme</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Pureté</span>
                  <span className="font-bold text-primary">98.5%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistiques hebdomadaires</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Production semaine</span>
                  <span className="font-bold">68.5 tonnes</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Nombre de récoltes</span>
                  <span className="font-bold">8 récoltes</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Coût moyen/tonne</span>
                  <span className="font-bold">145 FCFA</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Taux de conformité</span>
                  <span className="font-bold text-green-600">96%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Production;
