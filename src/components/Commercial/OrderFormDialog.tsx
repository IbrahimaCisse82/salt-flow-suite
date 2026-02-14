import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderFormState {
  client_id: string;
  salt_type: string;
  quantity: string;
  unit_price: string;
  notes: string;
}

interface OrderFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
  form: OrderFormState;
  onFormChange: (form: OrderFormState) => void;
  onSubmit: () => void;
  isCreating: boolean;
}

export const OrderFormDialog = ({
  isOpen,
  onOpenChange,
  clients,
  form,
  onFormChange,
  onSubmit,
  isCreating,
}: OrderFormDialogProps) => (
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
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
