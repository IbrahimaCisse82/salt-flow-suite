 import { useState } from "react";
 import { CreditCard, Eye, ArrowUpRight, ArrowDownLeft } from "lucide-react";
 import { format } from "date-fns";
 import { fr } from "date-fns/locale";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { usePurchaseOrders, ORDER_STATUS, PurchaseOrderWithSupplier } from "@/hooks/usePurchaseOrders";
 import { usePurchaseNotifications } from "@/hooks/usePurchaseNotifications";
 import { PurchasePaymentDialog } from "@/components/Purchases/PurchasePaymentDialog";
 import { PurchaseNotificationsWidget } from "@/components/Purchases/PurchaseNotificationsWidget";
 import { OrderDetailsDialog } from "@/components/Purchases/OrderDetailsDialog";
 
 export function PurchasePaymentsTab() {
   const { purchaseOrders, isLoading } = usePurchaseOrders();
   const { notifications, unreadCount } = usePurchaseNotifications();
   const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderWithSupplier | null>(null);
   const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
   const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
   const [activeTab, setActiveTab] = useState("to_pay");
 
   // Filtrer les commandes selon l'onglet
   const filteredOrders = purchaseOrders?.filter(order => {
     if (activeTab === "to_pay") {
       return ["approved", "partially_paid"].includes(order.status);
     }
     if (activeTab === "paid") {
       return ["paid", "partially_received", "received"].includes(order.status);
     }
     if (activeTab === "refunds") {
       // Commandes modifiées avec moins à payer
       return order.requires_reapproval && order.previous_total && 
              (order.total_amount || 0) < order.previous_total;
     }
     return true;
   }) || [];
 
   // Statistiques
   const toPayCount = purchaseOrders?.filter(o => ["approved", "partially_paid"].includes(o.status)).length || 0;
   const totalToPay = purchaseOrders
     ?.filter(o => ["approved", "partially_paid"].includes(o.status))
     .reduce((sum, o) => sum + ((o.total_amount || 0) - (o.total_paid || 0)), 0) || 0;
 
   const handleOpenPayment = (order: PurchaseOrderWithSupplier) => {
     setSelectedOrder(order);
     setPaymentDialogOpen(true);
   };
 
   const handleViewDetails = (order: PurchaseOrderWithSupplier) => {
     setSelectedOrder(order);
     setDetailsDialogOpen(true);
   };
 
   const handleNotificationAction = (notification: any) => {
     const order = purchaseOrders?.find(o => o.id === notification.purchase_order_id);
     if (order) {
       if (["advance_request", "additional_payment", "refund_required"].includes(notification.notification_type)) {
         handleOpenPayment(order);
       } else {
         handleViewDetails(order);
       }
     }
   };
 
   if (isLoading) {
     return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
   }
 
   return (
     <div className="space-y-6">
       {/* KPIs */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card>
           <CardContent className="p-6">
             <div className="flex items-center justify-between">
               <CreditCard className="h-8 w-8 text-primary" />
               {unreadCount > 0 && <Badge variant="destructive">{unreadCount} notifications</Badge>}
             </div>
             <p className="text-sm text-muted-foreground mt-2">Commandes à payer</p>
             <p className="text-3xl font-bold">{toPayCount}</p>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="p-6">
             <ArrowUpRight className="h-8 w-8 text-destructive" />
             <p className="text-sm text-muted-foreground mt-2">Total à décaisser</p>
             <p className="text-2xl font-bold">{totalToPay.toLocaleString()} <span className="text-sm font-normal">FCFA</span></p>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="p-6">
             <ArrowDownLeft className="h-8 w-8 text-primary" />
             <p className="text-sm text-muted-foreground mt-2">Retours à encaisser</p>
             <p className="text-2xl font-bold">
               {purchaseOrders?.filter(o => o.requires_reapproval && o.previous_total && 
                 (o.total_amount || 0) < o.previous_total).length || 0}
             </p>
           </CardContent>
         </Card>
       </div>
 
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Notifications */}
         <div className="lg:col-span-1">
           <PurchaseNotificationsWidget onAction={handleNotificationAction} />
         </div>
 
         {/* Liste des commandes */}
         <div className="lg:col-span-2">
           <Card>
             <CardHeader className="pb-3">
               <CardTitle>Paiements Achats</CardTitle>
             </CardHeader>
             <CardContent>
               <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                 <TabsList>
                   <TabsTrigger value="to_pay" className="gap-2">
                     À payer
                     {toPayCount > 0 && <Badge variant="destructive">{toPayCount}</Badge>}
                   </TabsTrigger>
                   <TabsTrigger value="paid">Payées</TabsTrigger>
                   <TabsTrigger value="refunds">Retours</TabsTrigger>
                 </TabsList>
               </Tabs>
 
               {filteredOrders.length > 0 ? (
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Commande</TableHead>
                       <TableHead>Fournisseur</TableHead>
                       <TableHead className="text-right">Total</TableHead>
                       <TableHead className="text-right">Payé</TableHead>
                       <TableHead className="text-right">Restant</TableHead>
                       <TableHead>Statut</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredOrders.map((order) => {
                       const statusConfig = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || ORDER_STATUS.draft;
                       const balance = (order.total_amount || 0) - (order.total_paid || 0);
                       
                       return (
                         <TableRow key={order.id}>
                           <TableCell className="font-medium">{order.order_number}</TableCell>
                           <TableCell>{order.supplier?.name || "-"}</TableCell>
                           <TableCell className="text-right">{(order.total_amount || 0).toLocaleString()} F</TableCell>
                           <TableCell className="text-right text-primary">{(order.total_paid || 0).toLocaleString()} F</TableCell>
                           <TableCell className="text-right font-medium text-destructive">{balance.toLocaleString()} F</TableCell>
                           <TableCell>
                             <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                           </TableCell>
                           <TableCell className="text-right space-x-2">
                             <Button variant="ghost" size="icon" onClick={() => handleViewDetails(order)}>
                               <Eye className="h-4 w-4" />
                             </Button>
                             {balance > 0 && (
                               <Button size="sm" onClick={() => handleOpenPayment(order)}>
                                 <CreditCard className="h-4 w-4 mr-2" />
                                 Décaisser
                               </Button>
                             )}
                             {balance < 0 && (
                               <Button size="sm" variant="outline" onClick={() => handleOpenPayment(order)}>
                                 <ArrowDownLeft className="h-4 w-4 mr-2" />
                                 Retour
                               </Button>
                             )}
                           </TableCell>
                         </TableRow>
                       );
                     })}
                   </TableBody>
                 </Table>
               ) : (
                 <p className="text-center py-8 text-muted-foreground">
                   {activeTab === "to_pay" ? "Aucune commande à payer" : 
                    activeTab === "paid" ? "Aucune commande payée" : "Aucun retour à traiter"}
                 </p>
               )}
             </CardContent>
           </Card>
         </div>
       </div>
 
       {/* Dialogs */}
       <PurchasePaymentDialog
         open={paymentDialogOpen}
         onOpenChange={setPaymentDialogOpen}
         order={selectedOrder}
       />
 
       {selectedOrder && (
         <OrderDetailsDialog
           open={detailsDialogOpen}
           onOpenChange={setDetailsDialogOpen}
           order={selectedOrder}
         />
       )}
     </div>
   );
 }