import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { logger } from "@/utils/logger";
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
import { Building2 } from "lucide-react";
import { toast } from "sonner";

export default function Tenants() {
  const queryClient = useQueryClient();
  const { isOpen } = useSidebar();

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const updateTenantStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('tenants')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      toast.success("Statut de l'entreprise mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      logger.error(error);
    }
  });

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
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Gestion des Entreprises
              </h1>
              <p className="text-muted-foreground mt-2">
                Gérer l'activation et les informations des entreprises clientes
              </p>
            </div>
            
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
                        <TableRow key={tenant.id}>
                          <TableCell className="font-medium">{tenant.name}</TableCell>
                          <TableCell>{tenant.subdomain}</TableCell>
                          <TableCell>{tenant.contact_email || '-'}</TableCell>
                          <TableCell>{tenant.contact_phone || '-'}</TableCell>
                          <TableCell>{tenant.manager_name || '-'}</TableCell>
                          <TableCell>
                            {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Switch
                              checked={tenant.is_active}
                              onCheckedChange={(checked) => {
                                updateTenantStatus.mutate({
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
          </div>
        </main>
      </div>
    </div>
  );
}
