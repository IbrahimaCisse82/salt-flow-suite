import { useState } from "react";
import { Plus, Pencil, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useChartOfAccounts, SYSCOHADA_CLASSES } from "@/hooks/useChartOfAccounts";
import { toast } from "@/hooks/use-toast";

export function ChartOfAccountsTable() {
  const { accounts, isLoading, createAccount, toggleAccountStatus, getAccountsByClass } = useChartOfAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    account_number: "",
    account_name: "",
    account_type: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.account_number || !formData.account_name || !formData.account_type) {
      toast({ title: "Erreur", description: "Remplissez tous les champs", variant: "destructive" });
      return;
    }

    try {
      await createAccount.mutateAsync(formData);
      setDialogOpen(false);
      setFormData({ account_number: "", account_name: "", account_type: "" });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleAccountStatus.mutateAsync({ id, is_active: !currentStatus });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  // Grouper les comptes par classe
  const accountsByClass = SYSCOHADA_CLASSES.map(cls => ({
    ...cls,
    accounts: getAccountsByClass(cls.value),
    count: getAccountsByClass(cls.value).length,
  }));

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Plan Comptable SYSCOHADA
              </CardTitle>
              <CardDescription>
                Gestion des comptes selon le plan comptable OHADA révisé
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un compte
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : (
            <Tabs defaultValue="6" className="space-y-4">
              <TabsList className="flex flex-wrap h-auto gap-1">
                {accountsByClass.map((cls) => (
                  <TabsTrigger key={cls.value} value={cls.value} className="text-xs">
                    Classe {cls.value} ({cls.count})
                  </TabsTrigger>
                ))}
              </TabsList>

              {accountsByClass.map((cls) => (
                <TabsContent key={cls.value} value={cls.value}>
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-medium">{cls.label}</h4>
                    <p className="text-sm text-muted-foreground">{cls.description}</p>
                  </div>

                  {cls.accounts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-32">N° Compte</TableHead>
                          <TableHead>Intitulé</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-center">Actif</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cls.accounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-mono font-medium">{account.account_number}</TableCell>
                            <TableCell>{account.account_name}</TableCell>
                            <TableCell className="text-muted-foreground">{account.account_type}</TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={account.is_active}
                                onCheckedChange={() => handleToggleStatus(account.id, account.is_active)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      Aucun compte dans cette classe
                    </p>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nouveau compte */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau compte comptable</DialogTitle>
            <DialogDescription>Ajouter un compte au plan comptable SYSCOHADA</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Numéro de compte *</Label>
              <Input 
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                placeholder="Ex: 601"
                required
              />
              <p className="text-xs text-muted-foreground">
                Le premier chiffre détermine la classe (1-8)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Intitulé du compte *</Label>
              <Input 
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value.toUpperCase() })}
                placeholder="Ex: ACHATS DE MARCHANDISES"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Type de compte *</Label>
              <Select 
                value={formData.account_type}
                onValueChange={(value) => setFormData({ ...formData, account_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Capitaux">Capitaux</SelectItem>
                  <SelectItem value="Immobilisations">Immobilisations</SelectItem>
                  <SelectItem value="Stocks">Stocks</SelectItem>
                  <SelectItem value="Tiers">Tiers</SelectItem>
                  <SelectItem value="Trésorerie">Trésorerie</SelectItem>
                  <SelectItem value="Charges">Charges</SelectItem>
                  <SelectItem value="Produits">Produits</SelectItem>
                  <SelectItem value="Autres">Autres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit">Créer le compte</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
