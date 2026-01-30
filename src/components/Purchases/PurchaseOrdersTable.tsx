import { useState } from "react";
import { Eye, Check, CreditCard, Truck, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePurchaseOrders, PurchaseOrderWithSupplier } from "@/hooks/usePurchaseOrders";
import { usePurchaseOrderItems } from "@/hooks/usePurchaseOrderItems";
import { useTransactions } from "@/hooks/useTransactions";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  sent: { label: "Envoyée", variant: "outline" },
  confirmed: { label: "Confirmée", variant: "default" },
  received: { label: "Reçue", variant: "default" },
  paid: { label: "Payée", variant: "default" },
  cancelled: { label: "Annulée", variant: "destructive" },
};

export function PurchaseOrdersTable() {
  const { purchaseOrders, isLoading, updatePurchaseOrder } = usePurchaseOrders();
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderWithSupplier | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_method: "especes",
    payment_date: new Date().toISOString().split("T")[0],
  });

  const { items: orderItems, isLoading: itemsLoading } = usePurchaseOrderItems(selectedOrder?.id);

  const handleViewOrder = (order: PurchaseOrderWithSupplier) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === "received") {
        updates.actual_delivery_date = new Date().toISOString().split("T")[0];
      }

      await updatePurchaseOrder.mutateAsync({ id: orderId, ...updates });
      toast({ title: "Statut mis à jour", description: `La commande est maintenant "${STATUS_CONFIG[newStatus]?.label}"` });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleOpenPayment = (order: PurchaseOrderWithSupplier) => {
    setSelectedOrder(order);
    setPaymentData({
      ...paymentData,
      amount: order.total_amount || 0,
    });
    setPaymentDialogOpen(true);
  };

  const handlePayment = async () => {
    if (!selectedOrder) return;

    try {
      // Récupérer le tenant_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.tenant_id) throw new Error("Tenant non trouvé");

      // Créer la transaction comptable
      await supabase.from("transactions").insert({
        tenant_id: profile.tenant_id,
        transaction_date: paymentData.payment_date,
        transaction_type: "achat",
        amount: paymentData.amount,
        description: `Paiement fournisseur - ${selectedOrder.supplier?.name || "Fournisseur"}`,
        reference: selectedOrder.order_number,
      });

      // Mettre à jour le statut de la commande
      await updatePurchaseOrder.mutateAsync({
        id: selectedOrder.id,
        status: "paid",
      });

      toast({ title: "Paiement enregistré", description: "La transaction a été créée et la commande marquée comme payée" });
      setPaymentDialogOpen(false);
      setSelectedOrder(null);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bons de commande</CardTitle>
        </CardHeader>
        <CardContent>
          {purchaseOrders && purchaseOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Livraison prévue</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.supplier?.name || "-"}</TableCell>
                    <TableCell>
                      {format(new Date(order.order_date), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {order.expected_delivery_date 
                        ? format(new Date(order.expected_delivery_date), "dd MMM yyyy", { locale: fr })
                        : "-"
                      }
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {(order.total_amount ?? 0).toLocaleString()} FCFA
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_CONFIG[order.status]?.variant || "secondary"}>
                        {STATUS_CONFIG[order.status]?.label || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          {order.status === "draft" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "sent")}>
                              <Check className="h-4 w-4 mr-2" />
                              Marquer envoyée
                            </DropdownMenuItem>
                          )}
                          {order.status === "sent" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "confirmed")}>
                              <Check className="h-4 w-4 mr-2" />
                              Confirmer
                            </DropdownMenuItem>
                          )}
                          {(order.status === "confirmed" || order.status === "sent") && (
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "received")}>
                              <Truck className="h-4 w-4 mr-2" />
                              Marquer reçue
                            </DropdownMenuItem>
                          )}
                          {order.status === "received" && (
                            <DropdownMenuItem onClick={() => handleOpenPayment(order)}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Enregistrer paiement
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-muted-foreground">Aucune commande</p>
          )}
        </CardContent>
      </Card>

      {/* Dialog Détails commande */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails de la commande {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Fournisseur: {selectedOrder?.supplier?.name} • 
              Date: {selectedOrder && format(new Date(selectedOrder.order_date), "dd MMMM yyyy", { locale: fr })}
            </DialogDescription>
          </DialogHeader>

          {itemsLoading ? (
            <div className="py-8 text-center text-muted-foreground">Chargement des articles...</div>
          ) : orderItems && orderItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">Prix unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.item_category || "-"}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{(item.unit_price || 0).toLocaleString()} FCFA</TableCell>
                    <TableCell className="text-right font-medium">{(item.line_total || 0).toLocaleString()} FCFA</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={4} className="text-right font-medium">Total</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {(selectedOrder?.total_amount || 0).toLocaleString()} FCFA
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">Aucun article dans cette commande</div>
          )}

          {selectedOrder?.notes && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground"><strong>Notes:</strong> {selectedOrder.notes}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Paiement */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer le paiement</DialogTitle>
            <DialogDescription>
              Commande {selectedOrder?.order_number} - {selectedOrder?.supplier?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Montant (FCFA)</Label>
              <Input 
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <Select 
                value={paymentData.payment_method}
                onValueChange={(value) => setPaymentData({ ...paymentData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date de paiement</Label>
              <Input 
                type="date"
                value={paymentData.payment_date}
                onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Annuler</Button>
            <Button onClick={handlePayment}>Confirmer le paiement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
