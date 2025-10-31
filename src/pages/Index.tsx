import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { BassinOverview } from "@/components/Dashboard/BassinOverview";
import { ProductionChart } from "@/components/Dashboard/ProductionChart";
import { WeatherWidget } from "@/components/Dashboard/WeatherWidget";
import { DynamicKPIGrid } from "@/components/Dashboard/DynamicKPIGrid";
import { KPICustomizer } from "@/components/Dashboard/KPICustomizer";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { useDailyWorkers } from "@/hooks/useDailyWorkers";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
import { useBassins } from "@/hooks/useBassins";
import { useProductionStats } from "@/hooks/useProductionRecords";
import { useStockStats } from "@/hooks/useStockStats";
import { useCampagnes } from "@/hooks/useCampagnes";
import { DashboardSkeleton } from "@/components/LoadingSkeletons/DashboardSkeleton";

const Index = () => {
  const { isOpen } = useSidebar();
  const { profile, loading } = useAuth();
  
  // Attendre que le profil soit chargé avant d'exécuter les hooks
  const { data: employees = [] } = useEmployees();
  const { data: dailyWorkers = [] } = useDailyWorkers();
  const { teams } = useTeams();
  const { bassins } = useBassins();
  const { data: productionStats } = useProductionStats();
  const { data: stockStats } = useStockStats();
  const { activeCampagne } = useCampagnes();

  // Afficher un loader pendant le chargement du profil
  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className={cn(
            "flex-1 p-6 transition-all duration-300",
            isOpen ? "md:ml-64" : "md:ml-16"
          )}>
            <DashboardSkeleton />
          </main>
        </div>
      </div>
    );
  }

  // Calculer les statistiques du personnel pour les gérants
  const isManager = profile.role === 'admin' || profile.role === 'gerant';
  const permanentCount = employees.filter(e => e.employee_type === 'permanent').length;
  const seasonalCount = employees.filter(e => e.employee_type === 'saisonnier').length;
  const activeTeamsCount = teams?.filter(t => t.status === 'active').length || 0;
  
  // Statistiques des bassins
  const activeBassinsCount = bassins?.filter(b => b.is_active).length || 0;
  const totalBassinsCount = bassins?.length || 0;
  
  // Stats production et stock
  const totalProduction = productionStats?.total || 0;
  const availableStock = stockStats?.available || 0;
  
  // Total employés actifs (permanents + journaliers)
  const totalActiveEmployees = permanentCount + seasonalCount + dailyWorkers.length;
  
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
                  {activeCampagne ? `Campagne ${activeCampagne.name}` : "Aucune campagne active"}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {activeBassinsCount > 0 && (
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs sm:text-sm">
                      {activeBassinsCount} bassin{activeBassinsCount > 1 ? 's' : ''} actif{activeBassinsCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
              <KPICustomizer />
            </div>
          </div>

          {/* Stats Grid - Dynamic KPIs */}
          <DynamicKPIGrid
            productionTotale={totalProduction}
            productionObjectif={activeCampagne?.target_production}
            bassinsActifs={activeBassinsCount}
            bassinsTotal={totalBassinsCount}
            employesActifs={totalActiveEmployees}
            employesJournaliers={dailyWorkers.length}
            stockDisponible={availableStock}
            stockEntrees={productionStats?.records}
            campagneProgress={
              activeCampagne?.target_production 
                ? (totalProduction / activeCampagne.target_production) * 100 
                : 0
            }
          />

          {/* Personnel Stats - Only for Managers */}
          {isManager && (permanentCount > 0 || seasonalCount > 0 || activeTeamsCount > 0) && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Effectif du personnel</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Personnel Permanent</p>
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary">{permanentCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Employés permanents actifs
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-accent">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Personnel Saisonnier</p>
                      <Users className="h-5 w-5 text-accent" />
                    </div>
                    <div className="text-3xl font-bold text-accent">{seasonalCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Employés saisonniers actifs
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-secondary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Équipes Terrain</p>
                      <Users className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="text-3xl font-bold text-secondary">{activeTeamsCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Équipes actives avec {dailyWorkers.length} journaliers
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Charts and Overview */}
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <ProductionChart />
            <WeatherWidget 
              latitude={14.6928}
              longitude={-17.4467}
              location="Dakar, Sénégal"
            />
          </div>
          
          <BassinOverview />
        </main>
      </div>
    </div>
  );
};

export default Index;
