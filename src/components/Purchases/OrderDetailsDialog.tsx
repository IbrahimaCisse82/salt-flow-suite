 import { format } from "date-fns";
 import { fr } from "date-fns/locale";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
 import { Badge } from "@/components/ui/badge";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Separator } from "@/components/ui/separator";
 import { usePurchaseOrderItems } from "@/hooks/usePurchaseOrderItems";
 import { usePurchasePayments } from "@/hooks/usePurchasePayments";
 import { PurchaseOrderWithSupplier, ORDER_STATUS } from "@/hooks/usePurchaseOrders";
 import { Check, Clock } from "lucide-react";
 
 interface Props {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   order: PurchaseOrderWithSupplier;
 }
 
 export function OrderDetailsDialog({ open, onOpenChange, order }: Props) {
   const { items, isLoading: itemsLoading, receivedCount, totalCount } = usePurchaseOrderItems(order.id);
   const { payments, isLoading: paymentsLoading } = usePurchasePayments(order.id);
 
   const statusConfig = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || ORDER_STATUS.draft;
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-3">
             {order.order_number}
             <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
           </DialogTitle>
           <DialogDescription>
             Fournisseur: {order.supplier?.name} • 
             Date: {format(new Date(order.order_date), "dd MMMM yyyy", { locale: fr })}
           </DialogDescription>
         </DialogHeader>
 
         {/* Informations générales */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
           <div>
             <div className="text-xs text-muted-foreground">Total commande</div>
             <div className="font-bold text-lg">{(order.total_amount || 0).toLocaleString()} F</div>
           </div>
           <div>
             <div className="text-xs text-muted-foreground">Total payé</div>
             <div className="font-bold text-lg text-primary">{(order.total_paid || 0).toLocaleString()} F</div>
           </div>
           <div>
             <div className="text-xs text-muted-foreground">Restant à payer</div>
             <div className="font-bold text-lg text-destructive">
               {((order.total_amount || 0) - (order.total_paid || 0)).toLocaleString()} F
             </div>
           </div>
           <div>
             <div className="text-xs text-muted-foreground">Réception</div>
             <div className="font-medium">{receivedCount} / {totalCount} articles</div>
           </div>
         </div>
 
         {/* Articles */}
         <div>
           <h4 className="font-medium mb-2">Articles commandés</h4>
           {itemsLoading ? (
             <div className="py-4 text-center text-muted-foreground">Chargement...</div>
           ) : items.length > 0 ? (
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Article</TableHead>
                   <TableHead>Catégorie</TableHead>
                   <TableHead className="text-right">Qté</TableHead>
                   <TableHead className="text-right">Prix unit.</TableHead>
                   <TableHead className="text-right">Total</TableHead>
                   <TableHead className="w-16">Reçu</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {items.map((item) => (
                   <TableRow key={item.id}>
                     <TableCell className="font-medium">{item.item_name}</TableCell>
                     <TableCell className="text-muted-foreground">{item.item_category || "-"}</TableCell>
                     <TableCell className="text-right">{item.quantity}</TableCell>
                     <TableCell className="text-right">{(item.unit_price || 0).toLocaleString()} F</TableCell>
                     <TableCell className="text-right font-medium">{(item.line_total || 0).toLocaleString()} F</TableCell>
                     <TableCell>
                       {item.is_received ? (
                         <Check className="h-4 w-4 text-primary" />
                       ) : (
                         <Clock className="h-4 w-4 text-muted-foreground" />
                       )}
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           ) : (
             <div className="py-4 text-center text-muted-foreground">Aucun article</div>
           )}
         </div>
 
         <Separator />
 
         {/* Historique des paiements */}
         <div>
           <h4 className="font-medium mb-2">Historique des paiements</h4>
           {paymentsLoading ? (
             <div className="py-4 text-center text-muted-foreground">Chargement...</div>
           ) : payments.length > 0 ? (
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Date</TableHead>
                   <TableHead>Type</TableHead>
                   <TableHead>Mode</TableHead>
                   <TableHead className="text-right">Montant</TableHead>
                   <TableHead>Notes</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {payments.map((payment) => (
                   <TableRow key={payment.id}>
                     <TableCell>{format(new Date(payment.payment_date), "dd/MM/yyyy", { locale: fr })}</TableCell>
                     <TableCell>
                       <Badge variant={payment.payment_type === "refund" ? "outline" : "default"}>
                         {payment.payment_type === "advance" ? "Avance" : 
                          payment.payment_type === "refund" ? "Retour" : "Paiement"}
                       </Badge>
                     </TableCell>
                     <TableCell className="capitalize">{payment.payment_method}</TableCell>
                     <TableCell className={`text-right font-medium ${payment.payment_type === "refund" ? "text-destructive" : ""}`}>
                       {payment.payment_type === "refund" ? "-" : ""}{payment.amount.toLocaleString()} F
                     </TableCell>
                     <TableCell className="text-muted-foreground">{payment.notes || "-"}</TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           ) : (
             <div className="py-4 text-center text-muted-foreground">Aucun paiement enregistré</div>
           )}
         </div>
 
         {order.notes && (
           <div className="p-3 bg-muted rounded-lg">
             <p className="text-sm"><strong>Notes:</strong> {order.notes}</p>
           </div>
         )}
       </DialogContent>
     </Dialog>
   );
 }