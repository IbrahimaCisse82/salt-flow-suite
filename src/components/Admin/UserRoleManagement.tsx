import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Edit2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

type UserRole = 'admin' | 'gerant' | 'commercial' | 'comptable' | 'production';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  tenant_id: string | null;
  role: UserRole;
  tenant_name?: string;
}

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-600',
  gerant: 'bg-green-600',
  commercial: 'bg-blue-600',
  comptable: 'bg-indigo-600',
  production: 'bg-orange-600',
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  gerant: 'Gérant',
  commercial: 'Commercial',
  comptable: 'Comptable',
  production: 'Production',
};

export const UserRoleManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<UserRole | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_profiles_with_roles');

      if (error) throw error;

      // Fetch tenant names
      const usersWithTenants = await Promise.all(
        (data || []).map(async (user) => {
          if (user.tenant_id) {
            const { data: tenant } = await supabase
              .from('tenants')
              .select('name')
              .eq('id', user.tenant_id)
              .single();
            
            return { ...user, tenant_name: tenant?.name };
          }
          return user;
        })
      );

      return usersWithTenants as UserWithRole[];
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { data, error } = await supabase.functions.invoke('update-user-role', {
        body: { userId, newRole: role }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Rôle mis à jour",
        description: `Le rôle a été changé de ${roleLabels[data.oldRole]} à ${roleLabels[data.newRole]}`,
      });
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      setShowConfirmDialog(false);
      setSelectedUser(null);
      setNewRole(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le rôle",
        variant: "destructive",
      });
    }
  });

  const handleRoleChange = (user: UserWithRole, role: UserRole) => {
    setSelectedUser(user);
    setNewRole(role);
    setShowConfirmDialog(true);
  };

  const confirmRoleChange = () => {
    if (selectedUser && newRole) {
      updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
    }
  };

  const filteredUsers = users?.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestion des Utilisateurs et Rôles
              </CardTitle>
              <CardDescription>
                Modifier les rôles des utilisateurs (les changements sont appliqués immédiatement)
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg">
              {users?.length || 0} utilisateurs
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Rechercher par email, nom ou entreprise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Rôle actuel</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.full_name || '-'}</TableCell>
                    <TableCell>{user.tenant_name || '-'}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role]}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user, value as UserRole)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="gerant">Gérant</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="comptable">Comptable</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun utilisateur trouvé
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Confirmer le changement de rôle
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Vous êtes sur le point de changer le rôle de <strong>{selectedUser?.email}</strong>
              </p>
              <p>
                De <Badge className={selectedUser?.role ? roleColors[selectedUser.role] : ''}>
                  {selectedUser?.role ? roleLabels[selectedUser.role] : ''}
                </Badge> à <Badge className={newRole ? roleColors[newRole] : ''}>
                  {newRole ? roleLabels[newRole] : ''}
                </Badge>
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-4">
                ⚠️ L'utilisateur sera automatiquement redirigé et devra peut-être se reconnecter pour que les changements prennent effet.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRoleChange}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "Mise à jour..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};