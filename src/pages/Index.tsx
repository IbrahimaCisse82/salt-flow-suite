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
  AlertTriangle,
  UserCheck,
  UserCog,
  UsersRound,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { useDailyWorkers } from "@/hooks/useDailyWorkers";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { isOpen } = useSidebar();
  const { profile, loading } = useAuth();
  
  // Attendre que le profil soit chargé avant d'exécuter les hooks
  const { data: employees = [] } = useEmployees();
  const { data: dailyWorkers = [] } = useDailyWorkers();
  const { teams } = useTeams();

  // Afficher un loader pendant le chargement du profil
  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculer les statistiques du personnel pour les gérants
  const isManager = profile.role === 'admin' || profile.role === 'gerant';
  const permanentCount = employees.filter(e => e.employee_type === 'permanent').length;
  const seasonalCount = employees.filter(e => e.employee_type === 'saisonnier').length;
  const activeTeamsCount = teams?.filter(t => t.status === 'active').length || 0;
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className={cn(
          "flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 transition-all duration-300",
          isOpen ? "md:ml-64" : "md:ml-16"
        )}>
          {/* Hero Section */}
          <div className="rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-4 sm:p-8 text-primary-foreground shadow-elevated">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 break-words">Bienvenue sur G-Suite Sel</h2>
                <p className="text-sm sm:text-base text-primary-foreground/90 mb-4 break-words">
                  Campagne de production 2025 - Saison sèche en cours
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs sm:text-sm">
                    <Sun className="h-3 w-3 mr-1" />
                    Météo favorable
                  </Badge>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs sm:text-sm">
                    4 bassins actifs
                  </Badge>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm text-primary-foreground/80 mb-1">Température</p>
                <p className="text-3xl sm:text-4xl font-bold">32°C</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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

          {/* Personnel Stats - Only for Managers */}
          {isManager && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Effectif du personnel</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-primary">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Personnel Permanent
                    </CardTitle>
                    <UserCheck className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{permanentCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Employés permanents actifs
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-accent">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Personnel Saisonnier
                    </CardTitle>
                    <UserCog className="h-5 w-5 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-accent">{seasonalCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Employés saisonniers actifs
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-secondary">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Équipes Terrain
                    </CardTitle>
                    <UsersRound className="h-5 w-5 text-secondary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-secondary">{activeTeamsCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Équipes actives avec {dailyWorkers.length} journaliers
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Alerts */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm mb-1 break-words">Alerte météorologique</p>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    Risque de pluie prévu dans 3 jours. Planifier la récolte du Bassin Nord B avant mercredi.
                  </p>
                </div>
                <Badge variant="outline" className="text-yellow-700 border-yellow-600 text-xs flex-shrink-0">
                  Moyenne
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Charts and Overview */}
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <ProductionChart />
            <BassinOverview />
          </div>

          {/* Weather Forecast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base break-words">
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span>Prévisions météo - 7 jours</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 sm:gap-3">
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
                    className="text-center p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-[10px] sm:text-xs font-medium mb-1 sm:mb-2 truncate">{day.day}</p>
                    <day.icon className={`h-4 w-4 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 ${
                      day.icon === Sun ? "text-yellow-500" : "text-blue-500"
                    }`} />
                    <p className="text-xs sm:text-sm font-bold mb-0.5 sm:mb-1">{day.temp}</p>
                    {day.rain > 0 && (
                      <p className="text-[10px] sm:text-xs text-blue-600">{day.rain}%</p>
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
