import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Plus } from "lucide-react";
import { toast } from "sonner";

export default function ChartOfAccounts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    account_number: "",
    account_name: "",
    account_type: ""
  });
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['admin-chart-of-accounts'],
    queryFn: async () => {
      const { data: authUser } = await supabase.auth.getUser();
      const user = authUser?.user;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user?.id)
        .maybeSingle();

      const role = profile?.role || (user?.user_metadata?.role as string);
      const tenantId = profile?.tenant_id || (role === 'admin' ? '00000000-0000-0000-0000-000000000001' : undefined);

      // Les admins peuvent voir tous les comptes
      let query = supabase
        .from('chart_of_accounts')
        .select('*');
      
      // Si ce n'est pas un admin, filtrer par tenant. Si pas de tenant, renvoyer []
      if (role !== 'admin') {
        if (!tenantId) return [];
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query.order('account_number');
      
      if (error) throw error;
      return data;
    }
  });

  const addAccount = useMutation({
    mutationFn: async () => {
      const { data: authUser } = await supabase.auth.getUser();
      const user = authUser?.user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user?.id)
        .maybeSingle();

      const role = profile?.role || (user?.user_metadata?.role as string);
      const tenantId = profile?.tenant_id || (role === 'admin' ? '00000000-0000-0000-0000-000000000001' : undefined);

      if (!tenantId) throw new Error("Aucun tenant associé à l'utilisateur");

      const { error } = await supabase
        .from('chart_of_accounts')
        .insert({
          tenant_id: tenantId,
          ...newAccount
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chart-of-accounts'] });
      toast.success("Compte ajouté");
      setDialogOpen(false);
      setNewAccount({ account_number: "", account_name: "", account_type: "" });
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    }
  });

  const toggleAccountStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('chart_of_accounts')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chart-of-accounts'] });
      toast.success("Statut du compte mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto md:ml-64">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Plan Comptable SYSCOHADA (Global)
                </CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un compte
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouveau compte</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="account_number">Numéro de compte</Label>
                        <Input
                          id="account_number"
                          value={newAccount.account_number}
                          onChange={(e) => setNewAccount({ ...newAccount, account_number: e.target.value })}
                          placeholder="Ex: 101"
                        />
                      </div>
                      <div>
                        <Label htmlFor="account_name">Nom du compte</Label>
                        <Input
                          id="account_name"
                          value={newAccount.account_name}
                          onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
                          placeholder="Ex: Capital social"
                        />
                      </div>
                      <div>
                        <Label htmlFor="account_type">Type</Label>
                        <Input
                          id="account_type"
                          value={newAccount.account_type}
                          onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value })}
                          placeholder="Ex: Capitaux propres"
                        />
                      </div>
                      <Button 
                        onClick={() => addAccount.mutate()}
                        disabled={!newAccount.account_number || !newAccount.account_name || !newAccount.account_type}
                        className="w-full"
                      >
                        Ajouter
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Chargement...</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Compte</TableHead>
                        <TableHead>Nom du compte</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts?.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.account_number}</TableCell>
                          <TableCell>{account.account_name}</TableCell>
                          <TableCell className="text-muted-foreground">{account.account_type}</TableCell>
                          <TableCell className="text-right">
                            <Switch
                              checked={account.is_active}
                              onCheckedChange={(checked) => {
                                toggleAccountStatus.mutate({
                                  id: account.id,
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
        </main>
      </div>
    </div>
  );
}
