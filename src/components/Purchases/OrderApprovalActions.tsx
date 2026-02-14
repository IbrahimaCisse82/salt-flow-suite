 import { useState } from "react";
 import { Check, X, Send } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
 import { Textarea } from "@/components/ui/textarea";
 import { Label } from "@/components/ui/label";
 import { usePurchaseOrders, PurchaseOrderWithSupplier } from "@/hooks/usePurchaseOrders";
 import { toast } from "@/hooks/use-toast";
 
 interface Props {
   order: PurchaseOrderWithSupplier;
 }
 
 export function OrderApprovalActions({ order }: Props) {
   const { isManager, submitForApproval, approveOrder, rejectOrder, cancelOrder } = usePurchaseOrders();
   const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
   const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
   const [reason, setReason] = useState("");
 
   const handleSubmitForApproval = async () => {
     try {
       await submitForApproval.mutateAsync(order.id);
       toast({ 
         title: isManager ? "Commande approuvée" : "Demande envoyée", 
         description: isManager 
           ? "La commande a été approuvée. Le comptable sera notifié pour le décaissement."
           : "La demande d'approbation a été envoyée au gérant." 
       });
     } catch (error: any) {
       toast({ title: "Erreur", description: error.message, variant: "destructive" });
     }
   };
 
   const handleApprove = async () => {
     try {
       await approveOrder.mutateAsync(order.id);
       toast({ 
         title: "Commande approuvée", 
         description: "Le comptable sera notifié pour effectuer le décaissement."
       });
     } catch (error: any) {
       toast({ title: "Erreur", description: error.message, variant: "destructive" });
     }
   };
 
   const handleReject = async () => {
     if (!reason.trim()) {
       toast({ title: "Erreur", description: "Veuillez indiquer une raison", variant: "destructive" });
       return;
     }
     try {
       await rejectOrder.mutateAsync({ orderId: order.id, reason });
       toast({ title: "Commande rejetée", description: "L'initiateur sera notifié." });
       setRejectDialogOpen(false);
       setReason("");
     } catch (error: any) {
       toast({ title: "Erreur", description: error.message, variant: "destructive" });
     }
   };
 
   const handleCancel = async () => {
     try {
       await cancelOrder.mutateAsync({ orderId: order.id, reason });
       toast({ title: "Commande annulée" });
       setCancelDialogOpen(false);
       setReason("");
     } catch (error: any) {
       toast({ title: "Erreur", description: error.message, variant: "destructive" });
     }
   };
 
   // Brouillon -> Soumettre pour approbation
   if (order.status === "draft") {
     return (
       <Button onClick={handleSubmitForApproval} size="sm" className="gap-2">
         <Send className="h-4 w-4" />
         {isManager ? "Approuver" : "Soumettre pour approbation"}
       </Button>
     );
   }
 
   // En attente d'approbation -> Approuver/Rejeter (gérant uniquement)
   if (order.status === "pending_approval" && isManager) {
     return (
       <div className="flex gap-2">
         <Button onClick={handleApprove} size="sm" className="gap-2">
           <Check className="h-4 w-4" />
           Approuver
         </Button>
         <Button onClick={() => setRejectDialogOpen(true)} size="sm" variant="destructive" className="gap-2">
           <X className="h-4 w-4" />
           Rejeter
         </Button>
 
         <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Rejeter la commande</DialogTitle>
               <DialogDescription>Indiquez la raison du rejet</DialogDescription>
             </DialogHeader>
             <div className="space-y-4">
               <div className="space-y-2">
                 <Label>Raison du rejet *</Label>
                 <Textarea 
                   value={reason}
                   onChange={(e) => setReason(e.target.value)}
                   placeholder="Expliquez pourquoi cette commande est rejetée..."
                   rows={3}
                 />
               </div>
             </div>
             <DialogFooter>
               <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Annuler</Button>
               <Button variant="destructive" onClick={handleReject}>Confirmer le rejet</Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </div>
     );
   }
 
   // Modifiée avec revalidation requise -> Approuver (gérant uniquement)
   if (order.requires_reapproval && isManager) {
     return (
       <Button onClick={handleApprove} size="sm" className="gap-2">
         <Check className="h-4 w-4" />
         Revalider les modifications
       </Button>
     );
   }
 
   // Annuler (brouillon, en attente, rejetée, approuvée, partiellement payée — pas reçue ni partiellement reçue)
   if (["draft", "pending_approval", "rejected", "approved", "partially_paid"].includes(order.status)) {
     return (
       <>
         <Button onClick={() => setCancelDialogOpen(true)} size="sm" variant="outline" className="gap-2 text-destructive">
           <X className="h-4 w-4" />
           Annuler
         </Button>
 
         <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Annuler la commande</DialogTitle>
               <DialogDescription>Cette action est irréversible</DialogDescription>
             </DialogHeader>
             <div className="space-y-4">
               <div className="space-y-2">
                 <Label>Raison (optionnel)</Label>
                 <Textarea 
                   value={reason}
                   onChange={(e) => setReason(e.target.value)}
                   placeholder="Raison de l'annulation..."
                   rows={2}
                 />
               </div>
             </div>
             <DialogFooter>
               <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Retour</Button>
               <Button variant="destructive" onClick={handleCancel}>Confirmer l'annulation</Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </>
     );
   }
 
   return null;
 }