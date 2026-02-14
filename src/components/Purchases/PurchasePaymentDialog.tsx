 import { useState } from "react";
 import { CreditCard, ArrowDownLeft, ArrowUpRight } from "lucide-react";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Textarea } from "@/components/ui/textarea";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Badge } from "@/components/ui/badge";
 import { usePurchasePayments } from "@/hooks/usePurchasePayments";
 import { PurchaseOrderWithSupplier } from "@/hooks/usePurchaseOrders";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "@/hooks/use-toast";
 
 interface Props {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   order: PurchaseOrderWithSupplier | null;
 }
 
 export function PurchasePaymentDialog({ open, onOpenChange, order }: Props) {
   const { createPayment, payments } = usePurchasePayments(order?.id);
   const [paymentType, setPaymentType] = useState<"advance" | "payment" | "refund">("payment");
   const [formData, setFormData] = useState({
     amount: "",
     payment_method: "especes",
     payment_date: new Date().toISOString().split("T")[0],
     account_id: "",
     notes: "",
   });
 
   // Charger les comptes de trésorerie
   const { data: accounts = [] } = useQuery({
     queryKey: ["accounts"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("accounts")
         .select("*")
         .order("account_name");
       if (error) throw error;
       return data || [];
     },
   });
 
   if (!order) return null;
 
   const totalPaid = order.total_paid || 0;
   const totalAmount = order.total_amount || 0;
   const balance = totalAmount - totalPaid;
 
   const handleSubmit = async () => {
     const amount = parseFloat(formData.amount);
     if (!amount || amount <= 0) {
       toast({ title: "Erreur", description: "Montant invalide", variant: "destructive" });
       return;
     }
 
    if (paymentType !== "refund" && amount > balance) {
        toast({ title: "Erreur", description: "Le montant dépasse le solde restant", variant: "destructive" });
        return;
      }

      // Vérifier le solde du compte de trésorerie sélectionné
      if (formData.account_id && paymentType !== "refund") {
        const selectedAccount = accounts.find((acc: any) => acc.id === formData.account_id);
        if (selectedAccount && (selectedAccount.balance || 0) < amount) {
          toast({ 
            title: "Solde insuffisant", 
            description: `Le compte "${selectedAccount.account_name}" a un solde de ${(selectedAccount.balance || 0).toLocaleString()} FCFA, insuffisant pour un décaissement de ${amount.toLocaleString()} FCFA.`,
            variant: "destructive" 
          });
          return;
        }
      }

      try {
       await createPayment.mutateAsync({
         purchase_order_id: order.id,
         payment_type: paymentType,
         amount,
         payment_method: formData.payment_method,
         payment_date: formData.payment_date,
         account_id: formData.account_id || undefined,
         notes: formData.notes || undefined,
       });
 
       toast({ 
         title: paymentType === "refund" ? "Retour enregistré" : "Paiement enregistré",
         description: `${amount.toLocaleString()} FCFA ${paymentType === "refund" ? "encaissé" : "décaissé"}`
       });
 
       setFormData({
         amount: "",
         payment_method: "especes",
         payment_date: new Date().toISOString().split("T")[0],
         account_id: "",
         notes: "",
       });
       onOpenChange(false);
     } catch (error: any) {
       toast({ title: "Erreur", description: error.message, variant: "destructive" });
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-lg">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <CreditCard className="h-5 w-5" />
             Enregistrer un paiement
           </DialogTitle>
           <DialogDescription>
             {order.order_number} - {order.supplier?.name}
           </DialogDescription>
         </DialogHeader>
 
         {/* Résumé financier */}
         <div className="grid grid-cols-3 gap-3 p-3 bg-muted rounded-lg">
           <div className="text-center">
             <div className="text-xs text-muted-foreground">Total</div>
             <div className="font-bold">{totalAmount.toLocaleString()} F</div>
           </div>
           <div className="text-center">
             <div className="text-xs text-muted-foreground">Payé</div>
             <div className="font-bold text-primary">{totalPaid.toLocaleString()} F</div>
           </div>
           <div className="text-center">
             <div className="text-xs text-muted-foreground">Restant</div>
             <div className="font-bold text-destructive">{balance.toLocaleString()} F</div>
           </div>
         </div>
 
         {/* Type de transaction */}
         <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as any)}>
           <TabsList className="w-full">
             <TabsTrigger value="advance" className="flex-1 gap-2">
               <ArrowUpRight className="h-4 w-4" />
               Avance
             </TabsTrigger>
             <TabsTrigger value="payment" className="flex-1 gap-2">
               <ArrowUpRight className="h-4 w-4" />
               Paiement
             </TabsTrigger>
             <TabsTrigger value="refund" className="flex-1 gap-2">
               <ArrowDownLeft className="h-4 w-4" />
               Retour
             </TabsTrigger>
           </TabsList>
         </Tabs>
 
         <div className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Montant (FCFA) *</Label>
               <Input
                 type="number"
                 value={formData.amount}
                 onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                 placeholder={balance.toString()}
               />
             </div>
             <div className="space-y-2">
               <Label>Date *</Label>
               <Input
                 type="date"
                 value={formData.payment_date}
                 onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
               />
             </div>
           </div>
 
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Mode de paiement</Label>
               <Select
                 value={formData.payment_method}
                 onValueChange={(v) => setFormData({ ...formData, payment_method: v })}
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
               <Label>Compte de trésorerie</Label>
               <Select
                 value={formData.account_id}
                 onValueChange={(v) => setFormData({ ...formData, account_id: v })}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Sélectionner" />
                 </SelectTrigger>
                 <SelectContent>
                   {accounts.map((acc: any) => (
                     <SelectItem key={acc.id} value={acc.id}>
                       {acc.account_name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
 
           <div className="space-y-2">
             <Label>Notes</Label>
             <Textarea
               value={formData.notes}
               onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
               placeholder="Référence, commentaires..."
               rows={2}
             />
           </div>
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
           <Button onClick={handleSubmit} disabled={createPayment.isPending}>
             {createPayment.isPending ? "Enregistrement..." : (
               paymentType === "refund" ? "Enregistrer le retour" : "Enregistrer le décaissement"
             )}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }