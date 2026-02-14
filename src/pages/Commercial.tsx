import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useClients } from "@/hooks/useClients";
import { useSales } from "@/hooks/useSales";
import { useAuth } from "@/contexts/AuthContext";
import { useInventoryItems } from "@/hooks/useInventoryItems";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShoppingCart, Truck, FileText } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClientList } from "@/components/Commercial/ClientList";
import { ClientDetailsDialog } from "@/components/Commercial/ClientDetailsDialog";
import { ClientFormDialog } from "@/components/Commercial/ClientFormDialog";
import { OrderFormDialog } from "@/components/Commercial/OrderFormDialog";
import { OrdersTab, InvoicesTab, DeliveryTab } from "@/components/Commercial/SalesTab";
import { CommercialStats } from "@/components/Commercial/CommercialStats";

const Commercial = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isOpen } = useSidebar();
  const { profile, tenant } = useAuth();
  const { items: inventoryItems } = useInventoryItems();
  const warehouses = inventoryItems.filter(item => item.item_category === 'warehouse');

  // Fetch full tenant details for invoice PDF
  const { data: tenantFull } = useQuery({
    queryKey: ['tenant-full', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const { data } = await supabase.from('tenants').select('*').eq('id', tenant.id).single();
      return data;
    },
    enabled: !!tenant?.id,
  });

  // Fetch tenant invoice style preference
  const { data: invoiceStyleSetting } = useQuery({
    queryKey: ['tenant-invoice-style', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const { data } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', `invoice_style_${tenant.id}`)
        .maybeSingle();
      return data?.setting_value as string | null;
    },
    enabled: !!tenant?.id,
  });
  const invoiceStyle = (invoiceStyleSetting as any) || "classic";

  // Dialogs state
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false);
  const [isClientDetailsDialogOpen, setIsClientDetailsDialogOpen] = useState(false);
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Hooks
  const {
    clients,
    isLoading: clientsLoading,
    createClient,
    updateClient,
    deleteClient,
    isCreating: isCreatingClient,
    isUpdating: isUpdatingClient,
    isDeleting: isDeletingClient,
  } = useClients();
  const { sales, isLoading: salesLoading, updateSale, createSale, isCreating, isUpdating } = useSales();

  // Forms
  const [orderForm, setOrderForm] = useState({
    client_id: "",
    salt_type: "gros",
    quantity: "",
    unit_price: "",
    notes: "",
    warehouse_id: "",
  });

  const [clientForm, setClientForm] = useState({
    name: "",
    client_type: "local",
    email: "",
    phone: "",
    address: "",
  });

  // Filter sales by status
  const draftSales = sales.filter((s) => !s.sale_status || s.sale_status === "draft");
  const invoicedSales = sales.filter((s) => ["invoiced", "confirmed"].includes(s.sale_status || ""));
  const deliverableSales = sales.filter((s) => s.can_be_delivered && s.sale_status !== "completed");
  const deliveredSales = sales.filter((s) => s.sale_status === "completed");

  // Client stats
  const getClientStats = (clientId: string) => {
    const clientSales = sales.filter((s) => s.client_id === clientId);
    return {
      totalOrders: clientSales.length,
      totalRevenue: clientSales.reduce((sum, s) => sum + (s.total_amount || 0), 0),
    };
  };

  const handleViewClientDetails = (client: any) => {
    setSelectedClient({ ...client, ...getClientStats(client.id) });
    setIsClientDetailsDialogOpen(true);
  };

  const handleEditClient = (client: any) => {
    setSelectedClient(client);
    setClientForm({
      name: client.name || "",
      client_type: client.client_type || "local",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
    });
    setIsEditClientDialogOpen(true);
  };

  const handleCreateClient = async () => {
    if (!clientForm.name) {
      toast({ title: "Erreur", description: "Le nom du client est obligatoire", variant: "destructive" });
      return;
    }
    try {
      await createClient({
        name: clientForm.name,
        client_type: clientForm.client_type,
        email: clientForm.email || undefined,
        phone: clientForm.phone || undefined,
        address: clientForm.address || undefined,
      });
      setIsNewClientDialogOpen(false);
      setClientForm({ name: "", client_type: "local", email: "", phone: "", address: "" });
    } catch (error) {
      console.error("Erreur création client:", error);
    }
  };

  const handleUpdateClient = async () => {
    if (!selectedClient?.id || !clientForm.name) return;
    try {
      await updateClient({
        id: selectedClient.id,
        ...clientForm,
        email: clientForm.email || null,
        phone: clientForm.phone || null,
        address: clientForm.address || null,
      } as any);
      setIsEditClientDialogOpen(false);
      setSelectedClient(null);
    } catch (error) {
      console.error("Erreur mise à jour client:", error);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient(clientToDelete);
      setClientToDelete(null);
    } catch (error) {
      console.error("Erreur suppression client:", error);
    }
  };

  const TVA_RATE = 18; // Taux TVA standard SYSCOHADA

  const handleCreateOrder = async () => {
    if (!orderForm.client_id || !orderForm.quantity || !orderForm.unit_price || !orderForm.warehouse_id) {
      toast({ title: "Erreur", description: "Remplissez tous les champs obligatoires", variant: "destructive" });
      return;
    }

    const selectedClient = clients.find((c: any) => c.id === orderForm.client_id);
    if (!selectedClient?.client_type) {
      toast({ title: "Erreur", description: "Le type de client (local/export) doit être renseigné avant de créer une commande", variant: "destructive" });
      return;
    }

    const isExport = selectedClient.client_type.toLowerCase() === "export";
    const qty = parseFloat(orderForm.quantity);
    const price = parseFloat(orderForm.unit_price);
    const amountHT = qty * price;
    const tvaRate = isExport ? 0 : TVA_RATE;
    const tvaAmount = Math.round(amountHT * tvaRate / 100);

    try {
      await createSale({
        client_id: orderForm.client_id,
        salt_type: orderForm.salt_type,
        quantity: qty,
        unit_price: price,
        notes: orderForm.notes,
        payment_status: "pending",
        warehouse_id: orderForm.warehouse_id,
        tva_rate: tvaRate,
        tva_amount: tvaAmount,
        amount_ht: amountHT,
      });
      toast({ title: "Commande créée", description: "La commande a été enregistrée et le stock réservé" });
      setIsNewOrderDialogOpen(false);
      setOrderForm({ client_id: "", salt_type: "gros", quantity: "", unit_price: "", notes: "", warehouse_id: "" });
    } catch (error) {
      console.error("Erreur création commande:", error);
    }
  };

  const handleValidateOrder = async (saleId: string) => {
    try {
      await updateSale({ id: saleId, sale_status: "invoiced" });
      toast({ title: "Commande validée", description: "La commande est prête pour facturation et le stock a été mis à jour" });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    } catch (error) {
      console.error("Erreur validation commande:", error);
    }
  };

  const handleMarkDelivered = async (saleId: string) => {
    try {
      await updateSale({ id: saleId, sale_status: "completed" });
      toast({ title: "Livraison confirmée", description: "Le stock a été déduit définitivement de l'entrepôt" });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-stats"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    } catch (error) {
      console.error("Erreur confirmation livraison:", error);
    }
  };

  const handleCancelSale = async (saleId: string) => {
    try {
      await updateSale({ id: saleId, sale_status: "cancelled" });
      toast({ title: "Commande annulée", description: "La commande a été annulée et le stock réservé libéré" });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    } catch (error) {
      console.error("Erreur annulation:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 p-3 sm:p-6 space-y-6 transition-all duration-300", isOpen ? "md:ml-64" : "md:ml-16")}>
          {/* Dialogs */}
          <ClientDetailsDialog
            isOpen={isClientDetailsDialogOpen}
            onOpenChange={setIsClientDetailsDialogOpen}
            client={selectedClient}
          />
          <ClientFormDialog
            isOpen={isNewClientDialogOpen}
            onOpenChange={(open) => {
              setIsNewClientDialogOpen(open);
              if (!open) setClientForm({ name: "", client_type: "local", email: "", phone: "", address: "" });
            }}
            title="Nouveau client"
            onSubmit={handleCreateClient}
            isLoading={isCreatingClient}
            submitLabel="Créer"
            form={clientForm}
            onFormChange={setClientForm}
          />
          <ClientFormDialog
            isOpen={isEditClientDialogOpen}
            onOpenChange={(open) => {
              setIsEditClientDialogOpen(open);
              if (!open) setSelectedClient(null);
            }}
            title="Modifier le client"
            onSubmit={handleUpdateClient}
            isLoading={isUpdatingClient}
            submitLabel="Enregistrer"
            form={clientForm}
            onFormChange={setClientForm}
          />
          <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Le client sera définitivement supprimé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteClient} disabled={isDeletingClient}>
                  {isDeletingClient ? "Suppression..." : "Supprimer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <OrderFormDialog
            isOpen={isNewOrderDialogOpen}
            onOpenChange={setIsNewOrderDialogOpen}
            clients={clients}
            warehouses={warehouses}
            form={orderForm}
            onFormChange={setOrderForm}
            onSubmit={handleCreateOrder}
            isCreating={isCreating}
            tvaRate={TVA_RATE}
          />

          {/* KPI Widgets */}
          <CommercialStats
            clients={clients}
            sales={sales}
            isLoading={clientsLoading || salesLoading}
          />

          {/* Tabs */}
          <Tabs defaultValue="clients">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="clients">
                <Users className="h-4 w-4 mr-2" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="commandes">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Commandes
              </TabsTrigger>
              <TabsTrigger value="facturation">
                <FileText className="h-4 w-4 mr-2" />
                Facturation
              </TabsTrigger>
              <TabsTrigger value="livraison">
                <Truck className="h-4 w-4 mr-2" />
                Livraison
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients">
              <ClientList
                clients={clients}
                isLoading={clientsLoading}
                onViewDetails={handleViewClientDetails}
                onEdit={handleEditClient}
                onDelete={setClientToDelete}
                onNewClient={() => setIsNewClientDialogOpen(true)}
              />
            </TabsContent>

            <TabsContent value="commandes">
              <OrdersTab
                sales={draftSales}
                allSales={sales}
                isLoading={salesLoading}
                isUpdating={isUpdating}
                onValidate={handleValidateOrder}
                onNewOrder={() => setIsNewOrderDialogOpen(true)}
                onCancelOrder={handleCancelSale}
              />
            </TabsContent>

            <TabsContent value="facturation">
              <InvoicesTab
                sales={invoicedSales}
                allSales={sales}
                isLoading={salesLoading}
                isUpdating={isUpdating}
                onCancelInvoice={handleCancelSale}
                tenant={tenantFull}
                invoiceStyle={invoiceStyle}
              />
            </TabsContent>

            <TabsContent value="livraison">
              <DeliveryTab
                deliverableSales={deliverableSales}
                deliveredSales={deliveredSales}
                isLoading={salesLoading}
                isUpdating={isUpdating}
                onMarkDelivered={handleMarkDelivered}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Commercial;
