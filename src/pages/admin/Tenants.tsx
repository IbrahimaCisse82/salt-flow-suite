import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Building2, Plus, TrendingUp } from "lucide-react";
import { useTenants, useTenantStats } from "@/hooks/useTenants";
import { TenantForm } from "@/components/Admin/TenantForm";
import { TenantStatsCard } from "@/components/Admin/TenantStatsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Tenants() {
  const { isOpen } = useSidebar();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  
  const { tenants, isLoading, updateTenant } = useTenants();
  const { data: tenantStats, isLoading: isLoadingStats } = useTenantStats();

  const handleEdit = (tenant: any) => {
    setSelectedTenant(tenant);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setSelectedTenant(null);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className={cn(
          "flex-1 p-6 overflow-auto transition-all duration-300",
          isOpen ? "md:ml-64" : "md:ml-16"
        )}>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Gestion Multi-Entreprises
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gérer l'activation, les informations et les statistiques des entreprises clientes
                </p>
              </div>
              <Button onClick={handleNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle entreprise
              </Button>
            </div>

            {/* Stats globales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Building2 className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total entreprises</p>
                      <p className="text-2xl font-bold">{tenants?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Actives</p>
                      <p className="text-2xl font-bold">{tenants?.filter(t => t.is_active).length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Inactives</p>
                      <p className="text-2xl font-bold">{tenants?.filter(t => !t.is_active).length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <TrendingUp className="h-8 w-8 text-accent" />
                    <div>
                      <p className="text-sm text-muted-foreground">Taux d'activité</p>
                      <p className="text-2xl font-bold">
                        {tenants && tenants.length > 0 
                          ? Math.round((tenants.filter(t => t.is_active).length / tenants.length) * 100) 
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="list">
              <TabsList>
                <TabsTrigger value="list">Liste</TabsTrigger>
                <TabsTrigger value="stats">Statistiques</TabsTrigger>
              </TabsList>

              <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Liste des Entreprises
                </CardTitle>
              </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Chargement...</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Sous-domaine</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Gestionnaire</TableHead>
                        <TableHead>Date de création</TableHead>
                        <TableHead className="text-right">Actif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenants?.map((tenant) => (
                        <TableRow key={tenant.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(tenant)}>
                          <TableCell className="font-medium">{tenant.name}</TableCell>
                          <TableCell>{tenant.subdomain || '-'}</TableCell>
                          <TableCell>{tenant.contact_email || '-'}</TableCell>
                          <TableCell>{tenant.contact_phone || '-'}</TableCell>
                          <TableCell>{tenant.manager_name || '-'}</TableCell>
                          <TableCell>
                            {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Switch
                              checked={tenant.is_active}
                              onCheckedChange={(checked) => {
                                updateTenant({
                                  id: tenant.id,
                                  is_active: checked
                                });
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            </Card>
              </TabsContent>

              <TabsContent value="stats">
                <div className="space-y-4">
                  {isLoadingStats ? (
                    <p className="text-center py-8 text-muted-foreground">Chargement des statistiques...</p>
                  ) : tenantStats && tenantStats.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tenantStats.map((tenant) => (
                        <TenantStatsCard key={tenant.id} tenant={tenant} />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Aucune statistique disponible
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <TenantForm 
              open={isFormOpen} 
              onOpenChange={setIsFormOpen} 
              tenant={selectedTenant}
            />
          </div>
        </main>
      </div>
    </div>
  );
}