import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CheckCircle, XCircle, Activity, Zap, Database } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const AdminDashboard = () => {
  // Statistiques des tenants
  const { data: tenantStats } = useQuery({
    queryKey: ['admin-tenant-stats'],
    queryFn: async () => {
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select('is_active');
      
      if (error) throw error;
      
      const active = tenants?.filter(t => t.is_active).length || 0;
      const inactive = tenants?.filter(t => !t.is_active).length || 0;
      
      return { active, inactive, total: active + inactive };
    }
  });

  // Simuler les métriques de performance (à remplacer par de vraies métriques)
  const performanceMetrics = {
    serverLoad: 45, // %
    responseTime: 120, // ms
    uptime: 99.8, // %
    activeUsers: 24,
    databaseSize: 2.4, // GB
    requestsPerMinute: 450
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Tableau de bord administrateur
        </h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble du système et des entreprises
        </p>
      </div>

      {/* Statistiques des entreprises */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Entreprises
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenantStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Entreprises enregistrées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Comptes Actifs
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tenantStats?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              En activité
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Comptes Inactifs
            </CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {tenantStats?.inactive || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Désactivés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performances serveur */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Utilisation des serveurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Charge CPU</span>
                <span className="text-sm text-muted-foreground">
                  {performanceMetrics.serverLoad}%
                </span>
              </div>
              <Progress value={performanceMetrics.serverLoad} />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Disponibilité</span>
                <span className="text-sm text-muted-foreground">
                  {performanceMetrics.uptime}%
                </span>
              </div>
              <Progress value={performanceMetrics.uptime} className="bg-green-100" />
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Base de données</span>
                </div>
                <span className="text-sm font-medium">
                  {performanceMetrics.databaseSize} GB
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Performances application
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Temps de réponse moyen</span>
              <span className="text-xl font-bold text-primary">
                {performanceMetrics.responseTime}ms
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Requêtes/minute</span>
              <span className="text-xl font-bold text-primary">
                {performanceMetrics.requestsPerMinute}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Utilisateurs actifs</span>
              <span className="text-xl font-bold text-primary">
                {performanceMetrics.activeUsers}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique d'activité récente */}
      <Card>
        <CardHeader>
          <CardTitle>Statut du système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Base de données</span>
              </div>
              <span className="text-xs text-green-700">Opérationnel</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">API</span>
              </div>
              <span className="text-xs text-green-700">Opérationnel</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Authentification</span>
              </div>
              <span className="text-xs text-green-700">Opérationnel</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Stockage</span>
              </div>
              <span className="text-xs text-green-700">Opérationnel</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
