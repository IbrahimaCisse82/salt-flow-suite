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

const bassins = [
  {
    id: "B1",
    name: "Bassin Nord A",
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
    surface: 3.1,
    status: "repos",
    salinity: 12,
    waterLevel: 40,
    location: "Secteur Ouest",
    lastHarvest: "2025-01-25",
    production: "14.2 tonnes",
  },
];

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
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
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
                    <div>
                      <CardTitle className="text-xl">{bassin.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {bassin.location}
                      </p>
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
                    <Button variant="outline" className="flex-1 gap-2">
                      <Eye className="h-4 w-4" />
                      Détails
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2">
                      <Settings className="h-4 w-4" />
                      Gérer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Bassins;
