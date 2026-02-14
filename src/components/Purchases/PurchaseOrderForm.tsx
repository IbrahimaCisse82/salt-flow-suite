import { useState, useMemo } from "react";
import { Plus, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useSuppliers } from "@/hooks/useSuppliers";
import { supabase } from "@/integrations/supabase/client";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { usePurchaseOrderItems } from "@/hooks/usePurchaseOrderItems";
import { useCampagnes } from "@/hooks/useCampagnes";
import { useCampagneBudgetLines } from "@/hooks/useCampagneBudgetLines";
import { toast } from "@/hooks/use-toast";

const phaseLabels: Record<string, string> = {
  'preparation-bassins': 'Préparation des bassins',
  'mise-en-eau': 'Mise en eau',
  'evaporation': 'Évaporation',
  'recolte-principale': 'Récolte principale',
  'traitement-stockage': 'Traitement et stockage'
};

const CHARGE_ACCOUNTS = [
  { value: '6011', label: '6011 – Achats de marchandises' },
  { value: '6021', label: '6021 – Achats de matières premières' },
  { value: '6041', label: '6041 – Achats de services' },
  { value: '6051', label: '6051 – Autres achats' },
  { value: '611', label: '611 – Transports' },
  { value: '621', label: '621 – Services extérieurs' },
];

const IMMO_ACCOUNTS = [
  { value: '231', label: '231 – Bâtiments' },
  { value: '241', label: '241 – Matériel et outillage' },
  { value: '244', label: '244 – Matériel de transport' },
  { value: '245', label: '245 – Matériel de bureau' },
];

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
  const { createPurchaseOrder } = usePurchaseOrders();
  const { createItem } = usePurchaseOrderItems();
  const { activeCampagne } = useCampagnes();

  const [formData, setFormData] = useState({
    supplier_id: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    notes: "",
    campagne_phase: "",
    expense_category: "",
    purchase_type: "charge" as "charge" | "immobilisation",
    charge_account_number: "6011",
    tva_rate: 18,
    invoice_number: "",
  });

  const { budgetLines, getCategoriesForPhase, checkBudget, phasesWithBudget, isLoading: budgetLoading } = 
    useCampagneBudgetLines(activeCampagne?.id);

  const [items, setItems] = useState<OrderItem[]>([]);
  const [newItem, setNewItem] = useState({
    item_name: "",
    item_category: "",
    quantity: 1,
    unit_price: 0,
    unit_of_measure: "unité",
  });

  // Catégories disponibles pour la phase sélectionnée
  const availableCategories = useMemo(() => {
    if (!formData.campagne_phase) return [];
    return getCategoriesForPhase(formData.campagne_phase);
  }, [formData.campagne_phase, getCategoriesForPhase]);

  // Vérification budgétaire
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const tvaAmount = Math.round(subtotal * (formData.tva_rate / 100));
  const totalTTC = subtotal + tvaAmount;
  
  const budgetCheck = useMemo(() => {
    if (!formData.campagne_phase || !formData.expense_category || !activeCampagne?.id) {
      return null;
    }
    return checkBudget(formData.campagne_phase, formData.expense_category, subtotal);
  }, [formData.campagne_phase, formData.expense_category, subtotal, checkBudget, activeCampagne?.id]);

  const isBudgetExceeded = budgetCheck !== null && !budgetCheck.allowed && subtotal > 0;

  const addItem = () => {
    if (!newItem.item_name || newItem.quantity <= 0 || newItem.unit_price <= 0) {
      toast({ title: "Erreur", description: "Remplissez tous les champs de l'article", variant: "destructive" });
      return;
    }

    const item: OrderItem = {
      id: crypto.randomUUID(),
      ...newItem,
      item_category: formData.expense_category,
      line_total: newItem.quantity * newItem.unit_price,
    };

    setItems([...items, item]);
    setNewItem({ item_name: "", item_category: "", quantity: 1, unit_price: 0, unit_of_measure: "unité" });
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_id) {
      toast({ title: "Erreur", description: "Sélectionnez un fournisseur", variant: "destructive" });
      return;
    }

    if (!formData.campagne_phase) {
      toast({ title: "Erreur", description: "Sélectionnez une phase de campagne", variant: "destructive" });
      return;
    }

    if (!formData.expense_category) {
      toast({ title: "Erreur", description: "Sélectionnez une catégorie de dépense", variant: "destructive" });
      return;
    }

    if (items.length === 0) {
      toast({ title: "Erreur", description: "Ajoutez au moins un article", variant: "destructive" });
      return;
    }

    if (isBudgetExceeded) {
      toast({ 
        title: "Budget insuffisant", 
        description: "Le montant de la commande dépasse le budget disponible. Veuillez faire une révision budgétaire avant de continuer.",
        variant: "destructive" 
      });
      return;
    }

    try {
      const order = await createPurchaseOrder.mutateAsync({
        supplier_id: formData.supplier_id,
        order_date: formData.order_date,
        expected_delivery_date: formData.expected_delivery_date || undefined,
        notes: formData.notes || undefined,
        submit_for_approval: false,
        campagne_id: activeCampagne?.id,
        campagne_phase: formData.campagne_phase,
        expense_category: formData.expense_category,
        purchase_type: formData.purchase_type,
        charge_account_number: formData.charge_account_number,
        tva_rate: formData.tva_rate,
        invoice_number: formData.invoice_number || undefined,
      });

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

      // Mettre à jour les montants HT/TVA/TTC sur la commande
      const { error: updateError } = await supabase
        .from("purchase_orders")
        .update({
          subtotal: subtotal,
          amount_ht: subtotal,
          tva_amount: tvaAmount,
          tax_amount: tvaAmount,
          total_amount: totalTTC,
          tva_rate: formData.tva_rate,
        })
        .eq("id", order.id);

      if (updateError) console.error("Erreur mise à jour montants:", updateError);

      toast({ title: "Commande créée", description: `Bon de commande créé avec ${items.length} article(s)` });
      
      setFormData({
        supplier_id: "",
        order_date: new Date().toISOString().split("T")[0],
        expected_delivery_date: "",
        notes: "",
        campagne_phase: "",
        expense_category: "",
        purchase_type: "charge",
        charge_account_number: "6011",
        tva_rate: 18,
        invoice_number: "",
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
          <DialogDescription>Créer un bon de commande fournisseur avec contrôle budgétaire</DialogDescription>
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

            <div className="space-y-2">
              <Label>N° Facture fournisseur</Label>
              <Input 
                placeholder="FAC-XXXX"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              />
            </div>
          </div>

          {/* Type d'achat et compte comptable */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium">Imputation comptable SYSCOHADA</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Type d'achat *</Label>
                <Select
                  value={formData.purchase_type}
                  onValueChange={(value: "charge" | "immobilisation") => setFormData({ 
                    ...formData, 
                    purchase_type: value,
                    charge_account_number: value === 'charge' ? '6011' : '241',
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="charge">Charge (classe 6)</SelectItem>
                    <SelectItem value="immobilisation">Immobilisation (classe 2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Compte comptable *</Label>
                <Select
                  value={formData.charge_account_number}
                  onValueChange={(value) => setFormData({ ...formData, charge_account_number: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.purchase_type === 'charge' ? CHARGE_ACCOUNTS : IMMO_ACCOUNTS).map((acc) => (
                      <SelectItem key={acc.value} value={acc.value}>{acc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Taux TVA (%)</Label>
                <Input 
                  type="number"
                  min="0"
                  max="100"
                  value={formData.tva_rate}
                  onChange={(e) => setFormData({ ...formData, tva_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          {/* Sélection Phase et Catégorie budgétaire */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium flex items-center gap-2">
              Imputation budgétaire
              {activeCampagne && (
                <Badge variant="outline">{activeCampagne.name}</Badge>
              )}
            </h4>

            {!activeCampagne ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Aucune campagne active</AlertTitle>
                <AlertDescription>
                  Vous devez d'abord créer une campagne avec un budget pour pouvoir passer des commandes.
                </AlertDescription>
              </Alert>
            ) : phasesWithBudget.length === 0 && !budgetLoading ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Aucun budget défini</AlertTitle>
                <AlertDescription>
                  La campagne active n'a pas de lignes budgétaires. Allez dans "Plan de campagne" pour définir le budget.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phase de campagne *</Label>
                  <Select
                    value={formData.campagne_phase}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      campagne_phase: value, 
                      expense_category: "" 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner la phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {phasesWithBudget.map((phase) => (
                        <SelectItem key={phase} value={phase}>
                          {phaseLabels[phase] || phase}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Catégorie de dépense *</Label>
                  <Select
                    value={formData.expense_category}
                    onValueChange={(value) => setFormData({ ...formData, expense_category: value })}
                    disabled={!formData.campagne_phase}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.campagne_phase ? "Sélectionner la catégorie" : "Choisissez d'abord la phase"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.expense_category}>
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span>{cat.expense_category}</span>
                            <span className="text-xs text-muted-foreground">
                              Reste: {cat.remaining_amount.toLocaleString()} F
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Indicateur de budget */}
            {budgetCheck && formData.expense_category && (
              <div className="mt-3 space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget alloué</span>
                  <span className="font-medium">{budgetCheck.budgeted.toLocaleString()} F</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Déjà engagé</span>
                  <span className="font-medium">{budgetCheck.spent.toLocaleString()} F</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Disponible</span>
                  <span className={`font-bold ${budgetCheck.remaining <= 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {budgetCheck.remaining.toLocaleString()} F
                  </span>
                </div>
                <Progress 
                  value={Math.min((budgetCheck.spent / budgetCheck.budgeted) * 100, 100)} 
                  className={budgetCheck.spent >= budgetCheck.budgeted ? "[&>div]:bg-destructive" : ""}
                />
                {subtotal > 0 && (
                  <div className="flex items-center justify-between text-sm pt-1 border-t">
                    <span className="font-medium">Cette commande</span>
                    <span className={`font-bold ${isBudgetExceeded ? 'text-destructive' : 'text-green-600'}`}>
                      {subtotal.toLocaleString()} F
                    </span>
                  </div>
                )}
              </div>
            )}

            {isBudgetExceeded && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Budget dépassé</AlertTitle>
                <AlertDescription>
                  Le montant de cette commande ({subtotal.toLocaleString()} F) dépasse le budget disponible ({budgetCheck!.remaining.toLocaleString()} F).
                  Vous devez effectuer une révision budgétaire avant de continuer.
                </AlertDescription>
              </Alert>
            )}

            {budgetCheck && !isBudgetExceeded && subtotal > 0 && (
              <Alert className="border-green-600/30 bg-green-50/50 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-700 dark:text-green-400">Budget disponible</AlertTitle>
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Le budget est suffisant pour cette commande.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Ajout d'articles */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium">Ajouter un article</h4>
            <div className="grid grid-cols-5 gap-3 items-end">
              <div className="col-span-2 space-y-2">
                <Label>Désignation *</Label>
                <Input 
                  placeholder="Nom de l'article"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                />
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
              <Button type="button" onClick={addItem} className="gap-2" disabled={!formData.expense_category}>
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
                      Sous-total HT
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {subtotal.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  {tvaAmount > 0 && (
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={4} className="text-right font-medium">
                        TVA ({formData.tva_rate}%)
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {tvaAmount.toLocaleString()} FCFA
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={4} className="text-right font-bold">
                      Total TTC
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {totalTTC.toLocaleString()} FCFA
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
            <Button 
              type="submit" 
              disabled={items.length === 0 || createPurchaseOrder.isPending || isBudgetExceeded || !formData.campagne_phase || !formData.expense_category}
            >
              {createPurchaseOrder.isPending ? "Création..." : "Créer la commande"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
