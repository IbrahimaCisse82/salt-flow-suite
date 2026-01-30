import { useState } from "react";
import { Plus, Pencil, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useExpenseTypes, ExpenseType } from "@/hooks/useExpenseTypes";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { toast } from "@/hooks/use-toast";

export function ExpenseTypesTable() {
  const { expenseTypes, isLoading, createExpenseType, updateExpenseType, deleteExpenseType } = useExpenseTypes();
  const { chargeAccounts } = useChartOfAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ExpenseType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    syscohada_category: "",
    account_number: "",
    account_id: "",
    observations: "",
    is_active: true,
  });

  const handleOpenDialog = (type?: ExpenseType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        syscohada_category: type.syscohada_category,
        account_number: type.account_number || "",
        account_id: type.account_id || "",
        observations: type.observations || "",
        is_active: type.is_active,
      });
    } else {
      setEditingType(null);
      setFormData({
        name: "",
        syscohada_category: "",
        account_number: "",
        account_id: "",
        observations: "",
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleAccountChange = (accountId: string) => {
    const account = chargeAccounts.find(a => a.id === accountId);
    if (account) {
      setFormData({
        ...formData,
        account_id: accountId,
        account_number: account.account_number,
        syscohada_category: `${account.account_number} - ${account.account_name}`,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.syscohada_category) {
      toast({ title: "Erreur", description: "Remplissez les champs obligatoires", variant: "destructive" });
      return;
    }

    try {
      if (editingType) {
        await updateExpenseType.mutateAsync({
          id: editingType.id,
          ...formData,
        });
      } else {
        await createExpenseType.mutateAsync(formData);
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (type: ExpenseType) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${type.name}" ?`)) return;

    try {
      await deleteExpenseType.mutateAsync(type.id);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Types de Dépenses
            </CardTitle>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : expenseTypes && expenseTypes.length > 0 ? (
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
                {expenseTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {type.syscohada_category}
                    </TableCell>
                    <TableCell>{type.account_number || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {type.observations || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.is_active ? "default" : "secondary"}>
                        {type.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(type)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(type)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-muted-foreground">Aucun type de dépense configuré</p>
          )}
        </CardContent>
      </Card>

      {/* Dialog Type de dépense */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingType ? "Modifier le type de dépense" : "Nouveau type de dépense"}</DialogTitle>
            <DialogDescription>Configurer les catégories de dépenses liées au plan comptable</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la dépense *</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Carburant"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Compte comptable (Classe 6) *</Label>
              <Select 
                value={formData.account_id}
                onValueChange={handleAccountChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un compte" />
                </SelectTrigger>
                <SelectContent>
                  {chargeAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_number} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catégorie SYSCOHADA</Label>
              <Input 
                value={formData.syscohada_category}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Généré automatiquement depuis le compte sélectionné</p>
            </div>

            <div className="space-y-2">
              <Label>Observations</Label>
              <Textarea 
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Notes ou précisions..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch 
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Type de dépense actif</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit">{editingType ? "Modifier" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
