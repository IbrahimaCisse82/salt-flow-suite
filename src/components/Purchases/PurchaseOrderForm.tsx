import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useExpenseTypes } from "@/hooks/useExpenseTypes";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { usePurchaseOrderItems } from "@/hooks/usePurchaseOrderItems";
import { toast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  item_name: string;
  item_category: string;
  quantity: number;
  unit_price: number;
  unit_of_measure: string;
  line_total: number;
}

interface PurchaseOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseOrderForm({ open, onOpenChange }: PurchaseOrderFormProps) {
  const { suppliers } = useSuppliers();
  const { activeExpenseTypes } = useExpenseTypes();
  const { createPurchaseOrder } = usePurchaseOrders();
  const { createItem } = usePurchaseOrderItems();

  const [formData, setFormData] = useState({
    supplier_id: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    notes: "",
  });

  const [items, setItems] = useState<OrderItem[]>([]);
  const [newItem, setNewItem] = useState({
    item_name: "",
    item_category: "",
    quantity: 1,
    unit_price: 0,
    unit_of_measure: "unité",
  });

  const addItem = () => {
    if (!newItem.item_name || newItem.quantity <= 0 || newItem.unit_price <= 0) {
      toast({ title: "Erreur", description: "Remplissez tous les champs de l'article", variant: "destructive" });
      return;
    }

    const item: OrderItem = {
      id: crypto.randomUUID(),
      ...newItem,
      line_total: newItem.quantity * newItem.unit_price,
    };

    setItems([...items, item]);
    setNewItem({ item_name: "", item_category: "", quantity: 1, unit_price: 0, unit_of_measure: "unité" });
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_id) {
      toast({ title: "Erreur", description: "Sélectionnez un fournisseur", variant: "destructive" });
      return;
    }

    if (items.length === 0) {
      toast({ title: "Erreur", description: "Ajoutez au moins un article", variant: "destructive" });
      return;
    }

    try {
      // 1. Créer la commande
      const order = await createPurchaseOrder.mutateAsync({
        supplier_id: formData.supplier_id,
        order_date: formData.order_date,
        expected_delivery_date: formData.expected_delivery_date || undefined,
        notes: formData.notes || undefined,
        status: "draft",
      });

      // 2. Créer les lignes de commande
      for (const item of items) {
        await createItem.mutateAsync({
          purchase_order_id: order.id,
          item_name: item.item_name,
          item_category: item.item_category,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit_of_measure: item.unit_of_measure,
        });
      }

      toast({ title: "Commande créée", description: `Bon de commande créé avec ${items.length} article(s)` });
      
      // Reset
      setFormData({
        supplier_id: "",
        order_date: new Date().toISOString().split("T")[0],
        expected_delivery_date: "",
        notes: "",
      });
      setItems([]);
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle commande d'achat</DialogTitle>
          <DialogDescription>Créer un bon de commande fournisseur avec articles</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fournisseur *</Label>
              <Select 
                value={formData.supplier_id} 
                onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date de commande *</Label>
              <Input 
                type="date" 
                value={formData.order_date}
                onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Date de livraison prévue</Label>
              <Input 
                type="date" 
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
              />
            </div>
          </div>

          {/* Ajout d'articles */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium">Ajouter un article</h4>
            <div className="grid grid-cols-6 gap-3 items-end">
              <div className="col-span-2 space-y-2">
                <Label>Désignation *</Label>
                <Input 
                  placeholder="Nom de l'article"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select 
                  value={newItem.item_category}
                  onValueChange={(value) => setNewItem({ ...newItem, item_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeExpenseTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantité *</Label>
                <Input 
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prix unitaire *</Label>
                <Input 
                  type="number"
                  min="0"
                  value={newItem.unit_price}
                  onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <Button type="button" onClick={addItem} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </div>

          {/* Liste des articles */}
          {items.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Désignation</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Qté</TableHead>
                    <TableHead className="text-right">Prix unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.item_category || "-"}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.unit_price.toLocaleString()} FCFA</TableCell>
                      <TableCell className="text-right font-medium">{item.line_total.toLocaleString()} FCFA</TableCell>
                      <TableCell>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={4} className="text-right font-medium">
                      Sous-total
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {subtotal.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              placeholder="Conditions particulières, remarques..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={items.length === 0 || createPurchaseOrder.isPending}>
              {createPurchaseOrder.isPending ? "Création..." : "Créer la commande"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
