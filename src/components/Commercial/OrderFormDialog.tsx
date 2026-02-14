import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Warehouse, Info } from "lucide-react";
import { useMemo } from "react";

export interface OrderFormState {
  client_id: string;
  salt_type: string;
  quantity: string;
  unit_price: string;
  notes: string;
  warehouse_id: string;
}

interface OrderFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
  warehouses: any[];
  form: OrderFormState;
  onFormChange: (form: OrderFormState) => void;
  onSubmit: () => void;
  isCreating: boolean;
  tvaRate?: number;
}

const formatNumber = (value: number) =>
  !isNaN(value) ? value.toLocaleString("fr-FR") : "0";

export const OrderFormDialog = ({
  isOpen,
  onOpenChange,
  clients,
  warehouses,
  form,
  onFormChange,
  onSubmit,
  isCreating,
  tvaRate = 18,
}: OrderFormDialogProps) => {
  const selectedClient = useMemo(
    () => clients.find((c: any) => c.id === form.client_id),
    [clients, form.client_id]
  );

  const isExport = selectedClient?.client_type?.toLowerCase() === "export";
  const effectiveTvaRate = isExport ? 0 : tvaRate;

  const quantity = parseFloat(form.quantity) || 0;
  const unitPrice = parseFloat(form.unit_price) || 0;
  const amountHT = quantity * unitPrice;
  const tvaAmount = Math.round(amountHT * effectiveTvaRate / 100);
  const totalTTC = amountHT + tvaAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle commande</DialogTitle>
          <DialogDescription>Enregistrer une nouvelle vente</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Client *</Label>
            <Select value={form.client_id} onValueChange={(v) => onFormChange({ ...form, client_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.client_type === "export" ? "Export" : "Local"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClient && (
            <div className={`flex items-center gap-2 text-sm p-2 rounded-md ${isExport ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"}`}>
              <Info className="h-4 w-4 shrink-0" />
              {isExport
                ? "Client export — TVA exonérée (0%)"
                : `Client local — TVA ${tvaRate}%`}
            </div>
          )}

          <div>
            <Label>Type de sel *</Label>
            <Select value={form.salt_type} onValueChange={(v) => onFormChange({ ...form, salt_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gros">Sel gros</SelectItem>
                <SelectItem value="fin">Sel fin</SelectItem>
                <SelectItem value="iode">Sel iodé</SelectItem>
                <SelectItem value="export">Sel export</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="flex items-center gap-1">
              <Warehouse className="h-4 w-4" />
              Entrepôt source *
            </Label>
            <Select value={form.warehouse_id} onValueChange={(v) => onFormChange({ ...form, warehouse_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner l'entrepôt" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w: any) => (
                  <SelectItem key={w.id} value={w.id}>{w.item_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Le stock sera réservé dans cet entrepôt</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantité (tonnes) *</Label>
              <Input type="number" value={form.quantity} onChange={(e) => onFormChange({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <Label>Prix unitaire (FCFA) *</Label>
              <Input type="number" value={form.unit_price} onChange={(e) => onFormChange({ ...form, unit_price: e.target.value })} />
            </div>
          </div>

          {/* TVA & Total summary */}
          {amountHT > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant HT</span>
                <span className="font-medium">{formatNumber(amountHT)} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA ({effectiveTvaRate}%)</span>
                <span className="font-medium">{formatNumber(tvaAmount)} FCFA</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="font-semibold">Total TTC</span>
                <span className="font-bold text-primary">{formatNumber(totalTTC)} FCFA</span>
              </div>
            </div>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => onFormChange({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button className="flex-1" onClick={onSubmit} disabled={isCreating}>
              {isCreating ? "Création..." : "Créer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
