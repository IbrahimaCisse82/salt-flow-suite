import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Plus, Package, ShoppingCart, Clock, CheckCircle, TrendingUp, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSuppliers } from "@/hooks/useSuppliers";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { usePurchaseNotifications } from "@/hooks/usePurchaseNotifications";
import { PurchaseWorkflowStepper } from "@/components/Purchases/PurchaseWorkflowStepper";

// Composants
import { PurchaseOrderForm } from "@/components/Purchases/PurchaseOrderForm";
import { PurchaseOrdersTable } from "@/components/Purchases/PurchaseOrdersTable";
import { SuppliersTable } from "@/components/Purchases/SuppliersTable";
import { PurchaseNotificationsWidget } from "@/components/Purchases/PurchaseNotificationsWidget";

const Achats = () => {
  const { isOpen } = useSidebar();
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState("orders");

  const { suppliers } = useSuppliers();
  const { purchaseOrders, isManager } = usePurchaseOrders();
  const { unreadCount } = usePurchaseNotifications();

  // Statistiques
  const activeSuppliers = suppliers?.filter(s => s.is_active !== false).length || 0;
  const pendingApproval = purchaseOrders?.filter(o => o.status === "pending_approval").length || 0;
  const approvedOrders = purchaseOrders?.filter(o => ["approved", "partially_paid"].includes(o.status)).length || 0;
  const toReceive = purchaseOrders?.filter(o => ["paid", "partially_received"].includes(o.status)).length || 0;
  const completedOrders = purchaseOrders?.filter(o => o.status === "received").length || 0;
  const totalOrdersAmount = purchaseOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

  // When stepper is clicked, switch to orders tab and set the sub-filter
  const [orderSubTab, setOrderSubTab] = useState("all");
  const handleStepperClick = (step: string) => {
    setActiveMainTab("orders");
    setOrderSubTab(step);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 p-3 sm:p-6 space-y-6 transition-all duration-300", isOpen ? "md:ml-64" : "md:ml-16")}>
          
          {/* En-tête */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Module Achats</h1>
              <p className="text-muted-foreground text-sm">
                Gestion des fournisseurs, commandes et réceptions
              </p>
            </div>
            <Button onClick={() => setOrderDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle commande</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Fournisseurs</p>
                <p className="text-xl sm:text-2xl font-bold">{activeSuppliers}</p>
              </CardContent>
            </Card>
            {isManager && (
              <Card className={pendingApproval > 0 ? "border-destructive/50" : ""}>
                <CardContent className="p-3 sm:p-4">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-destructive mb-2" />
                  <p className="text-xs text-muted-foreground">À approuver</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl sm:text-2xl font-bold">{pendingApproval}</p>
                    {pendingApproval > 0 && <Badge variant="destructive" className="text-[10px]">!</Badge>}
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-3 sm:p-4">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Approuvées</p>
                <p className="text-xl sm:text-2xl font-bold">{approvedOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">À recevoir</p>
                <p className="text-xl sm:text-2xl font-bold">{toReceive}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Total achats</p>
                <p className="text-lg sm:text-xl font-bold">{totalOrdersAmount.toLocaleString("fr-FR")} <span className="text-xs font-normal">FCFA</span></p>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Stepper */}
          <PurchaseWorkflowStepper
            pendingCount={pendingApproval}
            approvedCount={approvedOrders}
            toReceiveCount={toReceive}
            completedCount={completedOrders}
            activeTab={orderSubTab}
            onTabChange={handleStepperClick}
            isManager={isManager}
          />

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Notifications (sidebar) */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <PurchaseNotificationsWidget />
            </div>

            {/* Contenu principal */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="orders" className="gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Commandes
                    {unreadCount > 0 && <Badge variant="destructive" className="ml-1 text-[10px] px-1.5">{unreadCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="suppliers" className="gap-2">
                    <Users className="h-4 w-4" />
                    Fournisseurs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="orders">
                  <PurchaseOrdersTable externalTab={orderSubTab} onTabChange={setOrderSubTab} />
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
