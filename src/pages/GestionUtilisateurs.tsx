import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Mail, Trash2, Shield, Loader2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Email invalide");

const roleLabels: Record<string, { label: string; description: string; color: string }> = {
  gerant: {
    label: "Gérant",
    description: "Accès complet à toutes les fonctionnalités",
    color: "bg-purple-500"
  },
  commercial: {
    label: "Commercial",
    description: "Gestion des ventes, clients et commandes",
    color: "bg-blue-500"
  },
  production: {
    label: "Production",
    description: "Gestion des bassins, récoltes et production",
    color: "bg-green-500"
  },
  comptable: {
    label: "Comptable",
    description: "Gestion financière et comptabilité",
    color: "bg-orange-500"
  }
};

const GestionUtilisateurs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("production");
  const [invitePassword, setInvitePassword] = useState("");

  // Récupérer l'utilisateur actuel et vérifier qu'il est gérant
  const { data: currentUser } = useQuery({
    queryKey: ['current-user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single();
      
      return { user, profile };
    }
  });

  // Récupérer tous les utilisateurs du tenant
  const { data: users = [] } = useQuery({
    queryKey: ['tenant-users'],
    queryFn: async () => {
      if (!currentUser?.profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', currentUser.profile.tenant_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.profile?.tenant_id
  });

  // Mutation pour inviter un utilisateur
  const inviteUserMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.profile?.tenant_id) {
        throw new Error('Tenant non trouvé');
      }

      // Validation
      emailSchema.parse(inviteEmail);
      
      if (!inviteFullName.trim()) {
        throw new Error('Le nom complet est obligatoire');
      }
      
      if (!invitePassword || invitePassword.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      // Récupérer le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session non trouvée');

      // Appeler la Edge Function pour créer l'utilisateur
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: inviteEmail,
          password: invitePassword,
          full_name: inviteFullName.trim(),
          role: inviteRole
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      toast({
        title: "Utilisateur invité",
        description: "L'utilisateur a été créé avec succès",
      });
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteFullName("");
      setInviteRole("production");
      setInvitePassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'inviter l'utilisateur",
        variant: "destructive",
      });
    }
  });

  // Mutation pour supprimer un utilisateur
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Récupérer le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session non trouvée');

      // Appeler la Edge Function pour supprimer l'utilisateur
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur",
        variant: "destructive",
      });
    }
  });

  const handleInviteUser = () => {
    inviteUserMutation.mutate();
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Vérifier que l'utilisateur est gérant
  const isGerant = currentUser?.profile?.role === 'gerant';

  if (!isGerant) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 md:ml-64">
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                  Seuls les gérants peuvent gérer les utilisateurs.
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 md:ml-64">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">Gestion des utilisateurs</h1>
              <p className="text-sm sm:text-base text-muted-foreground break-words">
                Gérez les membres de votre équipe et leurs accès
              </p>
            </div>
            <Button 
              className="gap-2 bg-gradient-to-r from-primary to-accent"
              onClick={() => setShowInviteDialog(true)}
            >
              <UserPlus className="h-4 w-4" />
              Inviter un utilisateur
            </Button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {Object.entries(roleLabels).map(([role, info]) => {
              const count = users.filter(u => u.role === role).length;
              return (
                <Card key={role}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${info.color}`} />
                      {info.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{count}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Liste des utilisateurs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Utilisateurs ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={`${roleLabels[user.role]?.color} text-white border-0`}
                        >
                          {roleLabels[user.role]?.label || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.id !== currentUser?.user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Aucun utilisateur
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Dialog d'invitation */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un utilisateur</DialogTitle>
            <DialogDescription>
              Créez un compte pour un nouveau membre de votre équipe
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Nom complet *</Label>
              <Input
                id="invite-name"
                placeholder="Jean Dupont"
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="jean@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-password">Mot de passe temporaire *</Label>
              <Input
                id="invite-password"
                type="password"
                placeholder="Min. 6 caractères"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                L'utilisateur pourra le changer après sa première connexion
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invite-role">Rôle *</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([role, info]) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex flex-col">
                        <span className="font-medium">{info.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {info.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowInviteDialog(false)}
                disabled={inviteUserMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-accent"
                onClick={handleInviteUser}
                disabled={inviteUserMutation.isPending}
              >
                {inviteUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Créer l'utilisateur
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestionUtilisateurs;
