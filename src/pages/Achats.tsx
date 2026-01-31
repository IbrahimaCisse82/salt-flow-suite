import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Plus, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSuppliers } from "@/hooks/useSuppliers";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";

// Composants
import { PurchaseOrderForm } from "@/components/Purchases/PurchaseOrderForm";
import { PurchaseOrdersTable } from "@/components/Purchases/PurchaseOrdersTable";
import { SuppliersTable } from "@/components/Purchases/SuppliersTable";

const Achats = () => {
  const { isOpen } = useSidebar();
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const { suppliers } = useSuppliers();
  const { purchaseOrders } = usePurchaseOrders();

  // Statistiques
  const activeSuppliers = suppliers?.filter(s => s.is_active !== false).length || 0;
  const pendingOrders = purchaseOrders?.filter(o => ['sent', 'confirmed'].includes(o.status)).length || 0;
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
                Gestion des fournisseurs, commandes et dépenses
              </p>
            </div>
            <Button onClick={() => setOrderDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle commande
            </Button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Fournisseurs actifs</p>
                <p className="text-3xl font-bold">{activeSuppliers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <ShoppingCart className="h-8 w-8 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Commandes en cours</p>
                <p className="text-3xl font-bold">{pendingOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Total achats</p>
                <p className="text-2xl font-bold">{totalOrdersAmount.toLocaleString()} <span className="text-sm font-normal">FCFA</span></p>
              </CardContent>
            </Card>
          </div>

          {/* Onglets */}
          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="orders">Commandes</TabsTrigger>
              <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <PurchaseOrdersTable />
            </TabsContent>

            <TabsContent value="suppliers">
              <SuppliersTable />
            </TabsContent>
          </Tabs>

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
