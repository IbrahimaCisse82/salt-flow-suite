import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface ExpenseType {
  id: string;
  name: string;
  syscohada_category: string;
  account_number: string;
  account_id: string | null;
  observations: string;
  is_active: boolean;
}

interface ChartAccount {
  id: string;
  account_number: string;
  account_name: string;
  account_type: string;
}

export default function ExpenseTypes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    syscohada_category: "",
    account_number: "",
    account_id: null as string | null,
    observations: "",
    is_active: true,
  });

  const queryClient = useQueryClient();

  const { data: expenseTypes, isLoading } = useQuery({
    queryKey: ["expense-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_types")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as ExpenseType[];
    },
  });

  const { data: chartAccounts } = useQuery({
    queryKey: ["chart-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("id, account_number, account_name, account_type")
        .eq("is_active", true)
        .order("account_number");

      if (error) throw error;
      return data as ChartAccount[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { error } = await supabase.from("expense_types").insert({
        ...data,
        tenant_id: profile?.tenant_id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-types"] });
      toast.success("Type de dépense créé avec succès");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erreur lors de la création");
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("expense_types")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-types"] });
      toast.success("Type de dépense modifié avec succès");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erreur lors de la modification");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expense_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-types"] });
      toast.success("Type de dépense supprimé avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  const handleAccountChange = (accountId: string) => {
    const selectedAccount = chartAccounts?.find(acc => acc.id === accountId);
    if (selectedAccount) {
      setFormData({
        ...formData,
        account_id: accountId,
        account_number: selectedAccount.account_number,
        syscohada_category: selectedAccount.account_type,
      });
    }
  };

  const handleOpenDialog = (expense?: ExpenseType) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        name: expense.name,
        syscohada_category: expense.syscohada_category,
        account_number: expense.account_number || "",
        account_id: expense.account_id || null,
        observations: expense.observations || "",
        is_active: expense.is_active,
      });
    } else {
      setEditingExpense(null);
      setFormData({
        name: "",
        syscohada_category: "",
        account_number: "",
        account_id: null,
        observations: "",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce type de dépense ?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Types de dépenses</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les catégories de dépenses pour vos campagnes
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des types de dépenses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie SYSCOHADA</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead>Observations</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseTypes?.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.name}</TableCell>
                    <TableCell>{expense.syscohada_category}</TableCell>
                    <TableCell>{expense.account_number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {expense.observations}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          expense.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-50 text-gray-600"
                        }`}
                      >
                        {expense.is_active ? "Actif" : "Inactif"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Modifier le type de dépense" : "Nouveau type de dépense"}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations du type de dépense
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom de la dépense *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account">Compte comptable *</Label>
                <Select
                  value={formData.account_id || ""}
                  onValueChange={handleAccountChange}
                  required
                >
                  <SelectTrigger id="account" className="bg-background">
                    <SelectValue placeholder="Sélectionnez un compte" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {chartAccounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_number} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="syscohada_category">Catégorie SYSCOHADA</Label>
                <Input
                  id="syscohada_category"
                  value={formData.syscohada_category}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Généré automatiquement à partir du compte sélectionné
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="observations">Observations</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) =>
                    setFormData({ ...formData, observations: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Type de dépense actif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit">
                {editingExpense ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
