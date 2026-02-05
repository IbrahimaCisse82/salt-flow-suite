 import { useState } from "react";
 import { Header } from "@/components/Layout/Header";
 import { Sidebar } from "@/components/Layout/Sidebar";
 import { Card, CardContent } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { useSidebar } from "@/contexts/SidebarContext";
 import { cn } from "@/lib/utils";
 import { Plus, Package, ShoppingCart, Clock, CheckCircle, TrendingUp } from "lucide-react";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { useSuppliers } from "@/hooks/useSuppliers";
 import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
 import { usePurchaseNotifications } from "@/hooks/usePurchaseNotifications";
 
 // Composants
 import { PurchaseOrderForm } from "@/components/Purchases/PurchaseOrderForm";
 import { PurchaseOrdersTable } from "@/components/Purchases/PurchaseOrdersTable";
 import { SuppliersTable } from "@/components/Purchases/SuppliersTable";
 import { PurchaseNotificationsWidget } from "@/components/Purchases/PurchaseNotificationsWidget";
 
 const Achats = () => {
   const { isOpen } = useSidebar();
   const [orderDialogOpen, setOrderDialogOpen] = useState(false);
 
   const { suppliers } = useSuppliers();
   const { purchaseOrders, isManager } = usePurchaseOrders();
   const { unreadCount } = usePurchaseNotifications();
 
   // Statistiques améliorées
   const activeSuppliers = suppliers?.filter(s => s.is_active !== false).length || 0;
   const pendingApproval = purchaseOrders?.filter(o => o.status === "pending_approval").length || 0;
   const approvedOrders = purchaseOrders?.filter(o => ["approved", "partially_paid"].includes(o.status)).length || 0;
   const toReceive = purchaseOrders?.filter(o => ["paid", "partially_received"].includes(o.status)).length || 0;
   const totalOrdersAmount = purchaseOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
 
   return (
     <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
       <Header />
       <div className="flex">
         <Sidebar />
         <main className={cn("flex-1 p-6 transition-all duration-300", isOpen ? "md:ml-64" : "md:ml-16")}>
           
           {/* En-tête */}
           <div className="flex justify-between items-center mb-6">
             <div>
               <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                 Module Achats
               </h1>
               <p className="text-muted-foreground">
                 Gestion des fournisseurs, commandes et réceptions
               </p>
             </div>
             <Button onClick={() => setOrderDialogOpen(true)} className="gap-2">
               <Plus className="h-4 w-4" />
               Nouvelle commande
             </Button>
           </div>
 
           {/* Statistiques */}
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
             <Card>
               <CardContent className="p-4">
                 <Package className="h-6 w-6 text-primary mb-2" />
                 <p className="text-xs text-muted-foreground">Fournisseurs</p>
                 <p className="text-2xl font-bold">{activeSuppliers}</p>
               </CardContent>
             </Card>
             {isManager && (
               <Card className={pendingApproval > 0 ? "border-amber-500" : ""}>
                 <CardContent className="p-4">
                   <Clock className="h-6 w-6 text-amber-500 mb-2" />
                   <p className="text-xs text-muted-foreground">À approuver</p>
                   <div className="flex items-center gap-2">
                     <p className="text-2xl font-bold">{pendingApproval}</p>
                     {pendingApproval > 0 && <Badge variant="destructive">!</Badge>}
                   </div>
                 </CardContent>
               </Card>
             )}
             <Card>
               <CardContent className="p-4">
                 <ShoppingCart className="h-6 w-6 text-blue-500 mb-2" />
                 <p className="text-xs text-muted-foreground">Approuvées</p>
                 <p className="text-2xl font-bold">{approvedOrders}</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="p-4">
                 <CheckCircle className="h-6 w-6 text-purple-500 mb-2" />
                 <p className="text-xs text-muted-foreground">À recevoir</p>
                 <p className="text-2xl font-bold">{toReceive}</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="p-4">
                 <TrendingUp className="h-6 w-6 text-primary mb-2" />
                 <p className="text-xs text-muted-foreground">Total achats</p>
                 <p className="text-xl font-bold">{totalOrdersAmount.toLocaleString()} <span className="text-xs font-normal">F</span></p>
               </CardContent>
             </Card>
           </div>
 
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
             {/* Notifications (sidebar) */}
             <div className="lg:col-span-1">
               <PurchaseNotificationsWidget />
             </div>
 
             {/* Contenu principal */}
             <div className="lg:col-span-3">
               <Tabs defaultValue="orders" className="space-y-4">
                 <TabsList>
                   <TabsTrigger value="orders" className="gap-2">
                     Commandes
                     {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
                   </TabsTrigger>
                   <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
                 </TabsList>
 
                 <TabsContent value="orders">
                   <PurchaseOrdersTable />
                 </TabsContent>
 
                 <TabsContent value="suppliers">
                   <SuppliersTable />
                 </TabsContent>
               </Tabs>
             </div>
           </div>
 
           {/* Dialog Nouvelle commande */}
           <PurchaseOrderForm 
             open={orderDialogOpen} 
             onOpenChange={setOrderDialogOpen} 
           />
         </main>
       </div>
     </div>
   );
 };
 
 export default Achats;
