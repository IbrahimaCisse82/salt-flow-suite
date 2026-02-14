import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientFormState {
  name: string;
  client_type: string;
  email: string;
  phone: string;
  address: string;
}

interface ClientFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSubmit: () => void;
  isLoading: boolean;
  submitLabel: string;
  form: ClientFormState;
  onFormChange: (form: ClientFormState) => void;
}

export const ClientFormDialog = ({
  isOpen,
  onOpenChange,
  title,
  onSubmit,
  isLoading,
  submitLabel,
  form,
  onFormChange,
}: ClientFormDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {title.includes("Nouveau") ? "Ajouter un nouveau client" : "Modifier les informations du client"}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Nom *</Label>
          <Input
            value={form.name}
            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            placeholder="Nom du client"
          />
        </div>
        <div>
          <Label>Type de client</Label>
          <Select
            value={form.client_type}
            onValueChange={(v) => onFormChange({ ...form, client_type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local</SelectItem>
              <SelectItem value="export">Export</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => onFormChange({ ...form, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input
              value={form.phone}
              onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
              placeholder="+221 XX XXX XX XX"
            />
          </div>
        </div>
        <div>
          <Label>Adresse</Label>
          <Textarea
            value={form.address}
            onChange={(e) => onFormChange({ ...form, address: e.target.value })}
            placeholder="Adresse complète"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button className="flex-1" onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Enregistrement..." : submitLabel}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
