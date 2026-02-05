 import { useState } from "react";
 import { Check, Package } from "lucide-react";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Textarea } from "@/components/ui/textarea";
 import { Label } from "@/components/ui/label";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { usePurchaseOrderItems, PurchaseOrderItem } from "@/hooks/usePurchaseOrderItems";
 import { toast } from "@/hooks/use-toast";
 
 interface Props {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   orderId: string;
   orderNumber: string;
 }
 
 export function OrderReceptionDialog({ open, onOpenChange, orderId, orderNumber }: Props) {
   const { items, isLoading, receivedCount, totalCount, receiveItem } = usePurchaseOrderItems(orderId);
   const [notes, setNotes] = useState<Record<string, string>>({});
 
   const handleReceiveItem = async (item: PurchaseOrderItem) => {
     try {
       await receiveItem.mutateAsync({ 
         itemId: item.id, 
         orderId, 
         notes: notes[item.id] 
       });
       toast({ title: "Article reçu", description: `${item.item_name} marqué comme reçu` });
     } catch (error: any) {
       toast({ title: "Erreur", description: error.message, variant: "destructive" });
     }
   };
 
   const handleReceiveAll = async () => {
     const unreceived = items.filter(i => !i.is_received);
     for (const item of unreceived) {
       await receiveItem.mutateAsync({ itemId: item.id, orderId });
     }
     toast({ title: "Réception complète", description: "Tous les articles ont été marqués comme reçus" });
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
             {receivedCount} / {totalCount} articles reçus
           </DialogDescription>
         </DialogHeader>
 
         {isLoading ? (
           <div className="py-8 text-center text-muted-foreground">Chargement...</div>
         ) : items.length === 0 ? (
           <div className="py-8 text-center text-muted-foreground">Aucun article</div>
         ) : (
           <>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="w-12">Reçu</TableHead>
                   <TableHead>Article</TableHead>
                   <TableHead className="text-right">Qté</TableHead>
                   <TableHead>Notes réception</TableHead>
                   <TableHead className="w-24">Action</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {items.map((item) => (
                   <TableRow key={item.id} className={item.is_received ? "bg-muted/30" : ""}>
                     <TableCell>
                       <Checkbox checked={item.is_received} disabled />
                     </TableCell>
                     <TableCell>
                       <div className="font-medium">{item.item_name}</div>
                       {item.item_category && (
                         <div className="text-xs text-muted-foreground">{item.item_category}</div>
                       )}
                     </TableCell>
                     <TableCell className="text-right">
                       {item.quantity} {item.unit_of_measure}
                     </TableCell>
                     <TableCell>
                       {item.is_received ? (
                         <span className="text-sm text-muted-foreground">{item.received_notes || "-"}</span>
                       ) : (
                         <Textarea
                           value={notes[item.id] || ""}
                           onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                           placeholder="Notes..."
                           rows={1}
                           className="text-sm"
                         />
                       )}
                     </TableCell>
                     <TableCell>
                       {item.is_received ? (
                         <Badge variant="outline" className="text-green-600">
                           <Check className="h-3 w-3 mr-1" />
                           Reçu
                         </Badge>
                       ) : (
                         <Button 
                           size="sm" 
                           onClick={() => handleReceiveItem(item)}
                           disabled={receiveItem.isPending}
                         >
                           Valider
                         </Button>
                       )}
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
 
             {receivedCount < totalCount && (
               <div className="flex justify-end pt-4">
                 <Button onClick={handleReceiveAll} disabled={receiveItem.isPending}>
                   <Check className="h-4 w-4 mr-2" />
                   Tout marquer comme reçu
                 </Button>
               </div>
             )}
           </>
         )}
       </DialogContent>
     </Dialog>
   );
 }