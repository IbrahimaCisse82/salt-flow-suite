import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";

const formatNumber = (value?: number | null) =>
  typeof value === "number" && !isNaN(value) ? value.toLocaleString() : "0";

interface ClientDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  client: any;
}

export const ClientDetailsDialog = ({ isOpen, onOpenChange, client }: ClientDetailsDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Détails du client</DialogTitle>
        <DialogDescription>Informations complètes du client</DialogDescription>
      </DialogHeader>
      {client && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="font-semibold text-lg">{client.name}</p>
            <Badge variant="outline">
              {client.client_type === "local" ? "Local" : "Export"}
            </Badge>
          </div>
          {(client.email || client.phone || client.address) && (
            <div className="space-y-2 text-sm">
              {client.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{client.address}</span>
                </div>
              )}
            </div>
          )}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span>Total commandes</span>
              <span className="font-semibold">{formatNumber(client.totalOrders)}</span>
            </div>
            <div className="flex justify-between">
              <span>Chiffre d'affaires</span>
              <span className="font-semibold text-primary">
                {formatNumber(client.totalRevenue)} FCFA
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      )}
    </DialogContent>
  </Dialog>
);
