import { useState } from "react";
import { Check, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePurchaseOrderItems, PurchaseOrderItem } from "@/hooks/usePurchaseOrderItems";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
}

export function OrderReceptionDialog({ open, onOpenChange, orderId, orderNumber }: Props) {
  const { items, isLoading, receiveItem } = usePurchaseOrderItems(orderId);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const totalItems = items.length;
  const fullyReceivedCount = items.filter(i => i.is_received).length;
  const totalOrdered = items.reduce((s, i) => s + (i.quantity || 0), 0);
  const totalReceived = items.reduce((s, i) => s + (i.received_quantity || 0), 0);
  const progressPct = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;

  const handleReceiveItem = async (item: PurchaseOrderItem) => {
    const remaining = (item.quantity || 0) - (item.received_quantity || 0);
    const qtyStr = quantities[item.id];
    const qty = qtyStr ? parseFloat(qtyStr) : remaining;

    if (!qty || qty <= 0) {
      toast({ title: "Erreur", description: "Quantité invalide", variant: "destructive" });
      return;
    }
    if (qty > remaining) {
      toast({ title: "Erreur", description: `Quantité max : ${remaining}`, variant: "destructive" });
      return;
    }

    try {
      await receiveItem.mutateAsync({ 
        itemId: item.id, 
        orderId, 
        receivedQty: qty,
        notes: notes[item.id] 
      });
      toast({ title: "Réception enregistrée", description: `${qty} ${item.unit_of_measure || "unité(s)"} de ${item.item_name} reçu(s)` });
      setQuantities(prev => ({ ...prev, [item.id]: "" }));
      setNotes(prev => ({ ...prev, [item.id]: "" }));
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Réception - {orderNumber}
          </DialogTitle>
          <DialogDescription>
            {fullyReceivedCount} / {totalItems} articles complets — {totalReceived} / {totalOrdered} unités reçues
          </DialogDescription>
        </DialogHeader>

        <Progress value={progressPct} className="h-2" />

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Chargement...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">Aucun article</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article</TableHead>
                <TableHead className="text-right">Commandé</TableHead>
                <TableHead className="text-right">Reçu</TableHead>
                <TableHead className="text-right">Restant</TableHead>
                <TableHead>Qté à recevoir</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const ordered = item.quantity || 0;
                const received = item.received_quantity || 0;
                const remaining = ordered - received;
                const isFullyReceived = remaining <= 0;

                return (
                  <TableRow key={item.id} className={isFullyReceived ? "bg-muted/30" : ""}>
                    <TableCell>
                      <div className="font-medium">{item.item_name}</div>
                      {item.item_category && (
                        <div className="text-xs text-muted-foreground">{item.item_category}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{ordered} {item.unit_of_measure}</TableCell>
                    <TableCell className="text-right text-primary font-medium">{received}</TableCell>
                    <TableCell className="text-right font-medium">
                      {isFullyReceived ? (
                        <span className="text-green-600">0</span>
                      ) : (
                        <span className="text-destructive">{remaining}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!isFullyReceived && (
                        <Input
                          type="number"
                          value={quantities[item.id] || ""}
                          onChange={(e) => setQuantities({ ...quantities, [item.id]: e.target.value })}
                          placeholder={remaining.toString()}
                          className="w-20 text-sm"
                          max={remaining}
                          min={1}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {!isFullyReceived ? (
                        <Textarea
                          value={notes[item.id] || ""}
                          onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                          placeholder="Notes..."
                          rows={1}
                          className="text-sm"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{item.received_notes || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isFullyReceived ? (
                        <Badge variant="outline" className="text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Complet
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleReceiveItem(item)}
                          disabled={receiveItem.isPending}
                        >
                          Recevoir
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
