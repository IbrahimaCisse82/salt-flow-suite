import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { StatsCard } from "@/components/Dashboard/StatsCard";
import { BassinOverview } from "@/components/Dashboard/BassinOverview";
import { ProductionChart } from "@/components/Dashboard/ProductionChart";
import { 
  Droplets, 
  TrendingUp, 
  Users, 
  Package,
  Sun,
  CloudRain,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6">
          {/* Hero Section */}
          <div className="rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-8 text-primary-foreground shadow-elevated">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Bienvenue sur G-Suite Sel</h2>
                <p className="text-primary-foreground/90 mb-4">
                  Campagne de production 2025 - Saison sèche en cours
                </p>
                <div className="flex gap-3">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Sun className="h-3 w-3 mr-1" />
                    Météo favorable
                  </Badge>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    4 bassins actifs
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-foreground/80 mb-1">Température</p>
                <p className="text-4xl font-bold">32°C</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Production totale"
              value="438 t"
              change="+12% vs. 2024"
              icon={TrendingUp}
              trend="up"
              gradient
            />
            <StatsCard
              title="Bassins actifs"
              value="4/8"
              change="50% capacité"
              icon={Droplets}
            />
            <StatsCard
              title="Employés actifs"
              value="42"
              change="18 journaliers"
              icon={Users}
            />
            <StatsCard
              title="Stock disponible"
              value="156 t"
              change="3 semaines"
              icon={Package}
            />
          </div>

          {/* Alerts */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">Alerte météorologique</p>
                  <p className="text-sm text-muted-foreground">
                    Risque de pluie prévu dans 3 jours. Planifier la récolte du Bassin Nord B avant mercredi.
                  </p>
                </div>
                <Badge variant="outline" className="text-yellow-700 border-yellow-600">
                  Moyenne
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Charts and Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProductionChart />
            <BassinOverview />
          </div>

          {/* Weather Forecast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-primary" />
                Prévisions météorologiques - 7 prochains jours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-3">
                {[
                  { day: "Lun", temp: "32°", icon: Sun, rain: 0 },
                  { day: "Mar", temp: "34°", icon: Sun, rain: 0 },
                  { day: "Mer", temp: "31°", icon: CloudRain, rain: 40 },
                  { day: "Jeu", temp: "28°", icon: CloudRain, rain: 60 },
                  { day: "Ven", temp: "30°", icon: Sun, rain: 10 },
                  { day: "Sam", temp: "33°", icon: Sun, rain: 0 },
                  { day: "Dim", temp: "35°", icon: Sun, rain: 0 },
                ].map((day, i) => (
                  <div 
                    key={i}
                    className="text-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-xs font-medium mb-2">{day.day}</p>
                    <day.icon className={`h-6 w-6 mx-auto mb-2 ${
                      day.icon === Sun ? "text-yellow-500" : "text-blue-500"
                    }`} />
                    <p className="text-sm font-bold mb-1">{day.temp}</p>
                    {day.rain > 0 && (
                      <p className="text-xs text-blue-600">{day.rain}%</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Index;
