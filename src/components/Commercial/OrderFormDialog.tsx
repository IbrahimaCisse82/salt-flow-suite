import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Warehouse, Info, Plus, Trash2, Package } from "lucide-react";
import { useMemo, useState, useCallback } from "react";

export interface OrderLineItem {
  id: string;
  salt_type: string;
  warehouse_id: string;
  quantity: string;
  unit_price: string;
}

export interface OrderFormState {
  client_id: string;
  notes: string;
  apply_tva?: boolean;
  items: OrderLineItem[];
}

// Legacy compat — keep old shape available for callers that haven't migrated
export interface LegacyOrderFormState {
  client_id: string;
  salt_type: string;
  quantity: string;
  unit_price: string;
  notes: string;
  warehouse_id: string;
  apply_tva?: boolean;
}

interface InventoryStock {
  item_name: string;
  storage_location: string;
  quantity_on_hand: number;
  reserved_quantity: number;
}

interface OrderFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
  warehouses: any[];
  inventoryItems?: any[];
  form: OrderFormState;
  onFormChange: (form: OrderFormState) => void;
  onSubmit: () => void;
  isCreating: boolean;
  tvaRate?: number;
}

const SALT_TYPES = [
  { value: "gros", label: "Sel gros" },
  { value: "fin", label: "Sel fin" },
  { value: "iode", label: "Sel iodé" },
  { value: "export", label: "Sel export" },
];

const formatNumber = (value: number) =>
  !isNaN(value) ? value.toLocaleString("fr-FR") : "0";

let lineCounter = 0;
const createEmptyLine = (): OrderLineItem => ({
  id: `line-${++lineCounter}-${Date.now()}`,
  salt_type: "gros",
  warehouse_id: "",
  quantity: "",
  unit_price: "",
});

export const OrderFormDialog = ({
  isOpen,
  onOpenChange,
  clients,
  warehouses,
  inventoryItems = [],
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
  const applyTva = form.apply_tva !== undefined ? form.apply_tva : !isExport;
  const effectiveTvaRate = isExport ? 0 : applyTva ? tvaRate : 0;

  // Calculate stock availability per warehouse per salt type
  const stockByWarehouseSalt = useMemo(() => {
    const map: Record<string, number> = {};
    inventoryItems
      .filter((i: any) => i.item_category === "production" && i.is_active)
      .forEach((item: any) => {
        const available = Math.max(0, (Number(item.quantity_on_hand) || 0) - (Number(item.reserved_quantity) || 0));
        const key = `${item.storage_location}::${item.item_name}`;
        map[key] = (map[key] || 0) + available;
      });
    return map;
  }, [inventoryItems]);

  const getAvailableStock = useCallback(
    (warehouseId: string, saltType: string) => {
      const wh = warehouses.find((w: any) => w.id === warehouseId);
      if (!wh) return 0;
      const saltLabel = SALT_TYPES.find((s) => s.value === saltType)?.label || saltType;
      const key = `${wh.item_name}::${saltLabel}`;
      return stockByWarehouseSalt[key] || 0;
    },
    [warehouses, stockByWarehouseSalt]
  );

  // Line item handlers
  const updateLine = (lineId: string, field: keyof OrderLineItem, value: string) => {
    const updatedItems = form.items.map((item) =>
      item.id === lineId ? { ...item, [field]: value } : item
    );
    onFormChange({ ...form, items: updatedItems });
  };

  const addLine = () => {
    onFormChange({ ...form, items: [...form.items, createEmptyLine()] });
  };

  const removeLine = (lineId: string) => {
    if (form.items.length <= 1) return;
    onFormChange({ ...form, items: form.items.filter((i) => i.id !== lineId) });
  };

  // Totals
  const lineTotals = form.items.map((item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return qty * price;
  });
  const totalHT = lineTotals.reduce((sum, v) => sum + v, 0);
  const tvaAmount = Math.round((totalHT * effectiveTvaRate) / 100);
  const totalTTC = totalHT + tvaAmount;
  const totalQuantity = form.items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);

  const isValid = form.client_id && form.items.every((i) => i.salt_type && i.warehouse_id && parseFloat(i.quantity) > 0 && parseFloat(i.unit_price) > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle commande</DialogTitle>
          <DialogDescription>Commande multi-produits avec choix d'entrepôts</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Client selection */}
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
            <div
              className={`flex items-center gap-2 text-sm p-2 rounded-md ${
                isExport
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              }`}
            >
              <Info className="h-4 w-4 shrink-0" />
              {isExport
                ? "Client export — TVA exonérée (0%)"
                : applyTva
                ? `Client local — TVA ${tvaRate}%`
                : "Client local — Sans TVA"}
            </div>
          )}

          {selectedClient && !isExport && (
            <div className="flex items-center justify-between p-2 rounded-md border">
              <Label htmlFor="apply-tva" className="text-sm cursor-pointer">
                Appliquer la TVA ({tvaRate}%)
              </Label>
              <Switch
                id="apply-tva"
                checked={applyTva}
                onCheckedChange={(checked) => onFormChange({ ...form, apply_tva: checked })}
              />
            </div>
          )}

          {/* Product lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produits ({form.items.length} ligne{form.items.length > 1 ? "s" : ""})
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1">
                <Plus className="h-3 w-3" />
                Ajouter un produit
              </Button>
            </div>

            {form.items.map((line, index) => {
              const available = getAvailableStock(line.warehouse_id, line.salt_type);
              const qty = parseFloat(line.quantity) || 0;
              const lineTotal = qty * (parseFloat(line.unit_price) || 0);
              const isOverStock = line.warehouse_id && qty > available;

              return (
                <div key={line.id} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Ligne {index + 1}</span>
                    {form.items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeLine(line.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Type de sel *</Label>
                      <Select value={line.salt_type} onValueChange={(v) => updateLine(line.id, "salt_type", v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SALT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        <Warehouse className="h-3 w-3" />
                        Entrepôt *
                      </Label>
                      <Select value={line.warehouse_id} onValueChange={(v) => updateLine(line.id, "warehouse_id", v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Entrepôt" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((w: any) => {
                            const saltLabel = SALT_TYPES.find((s) => s.value === line.salt_type)?.label || "";
                            const key = `${w.item_name}::${saltLabel}`;
                            const stock = stockByWarehouseSalt[key] || 0;
                            return (
                              <SelectItem key={w.id} value={w.id}>
                                {w.item_name} ({stock.toLocaleString("fr-FR")} t dispo)
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Quantité (tonnes) *</Label>
                      <Input
                        type="number"
                        min={0}
                        className="h-9"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.id, "quantity", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Prix unitaire (FCFA) *</Label>
                      <Input
                        type="number"
                        min={0}
                        className="h-9"
                        value={line.unit_price}
                        onChange={(e) => updateLine(line.id, "unit_price", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Stock availability warning */}
                  {line.warehouse_id && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Disponible : <span className="font-medium">{available.toLocaleString("fr-FR")} t</span>
                      </span>
                      {isOverStock && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          Stock insuffisant
                        </Badge>
                      )}
                      {lineTotal > 0 && (
                        <span className="font-medium">{formatNumber(lineTotal)} FCFA</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grand Total summary */}
          {totalHT > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Total quantité</span>
                <span className="font-medium">{totalQuantity.toLocaleString("fr-FR")} tonnes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant HT</span>
                <span className="font-medium">{formatNumber(totalHT)} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA ({effectiveTvaRate}%)</span>
                <span className="font-medium">{formatNumber(tvaAmount)} FCFA</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="font-semibold">Total {effectiveTvaRate > 0 ? "TTC" : "HT"}</span>
                <span className="font-bold text-primary">{formatNumber(totalTTC)} FCFA</span>
              </div>
            </div>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => onFormChange({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button className="flex-1" onClick={onSubmit} disabled={isCreating || !isValid}>
              {isCreating ? "Création..." : `Créer (${form.items.length} produit${form.items.length > 1 ? "s" : ""})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper to create initial form state
export const createEmptyOrderForm = (): OrderFormState => ({
  client_id: "",
  notes: "",
  items: [createEmptyLine()],
});
