import { useState } from "react";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSuppliers, Supplier } from "@/hooks/useSuppliers";
import { toast } from "@/hooks/use-toast";

const SUPPLIER_TYPE_LABELS: Record<string, string> = {
  goods: "Fourniture",
  services: "Service",
  equipment: "Équipement",
};

export function SuppliersTable() {
  const { suppliers, isLoading, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    supplier_type: "goods",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        supplier_type: supplier.supplier_type || "goods",
        contact_person: supplier.contact_person || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        notes: supplier.notes || "",
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: "",
        supplier_type: "goods",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({ title: "Erreur", description: "Le nom du fournisseur est obligatoire", variant: "destructive" });
      return;
    }

    try {
      if (editingSupplier) {
        await updateSupplier.mutateAsync({
          id: editingSupplier.id,
          ...formData,
        });
        toast({ title: "Fournisseur modifié", description: "Les modifications ont été enregistrées" });
      } else {
        await createSupplier.mutateAsync(formData);
        toast({ title: "Fournisseur créé", description: `${formData.name} a été ajouté avec succès` });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${supplier.name} ?`)) return;

    try {
      await deleteSupplier.mutateAsync(supplier.id);
      toast({ title: "Fournisseur supprimé" });
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
              <Building2 className="h-5 w-5" />
              Fournisseurs
            </CardTitle>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau fournisseur
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : suppliers && suppliers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{SUPPLIER_TYPE_LABELS[supplier.supplier_type || "goods"]}</TableCell>
                    <TableCell>{supplier.contact_person || "-"}</TableCell>
                    <TableCell>{supplier.phone || "-"}</TableCell>
                    <TableCell>{supplier.email || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={supplier.is_active ? "default" : "secondary"}>
                        {supplier.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(supplier)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-muted-foreground">Aucun fournisseur enregistré</p>
          )}
        </CardContent>
      </Card>

      {/* Dialog Fournisseur */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}</DialogTitle>
            <DialogDescription>Renseignez les informations du fournisseur</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du fournisseur *</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Société ABC"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Type de fournisseur</Label>
              <Select 
                value={formData.supplier_type}
                onValueChange={(value) => setFormData({ ...formData, supplier_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="goods">Fourniture</SelectItem>
                  <SelectItem value="services">Service</SelectItem>
                  <SelectItem value="equipment">Équipement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact</Label>
                <Input 
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Nom du contact"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+221 XX XXX XX XX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemple.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input 
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adresse complète"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informations complémentaires..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit">{editingSupplier ? "Modifier" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
