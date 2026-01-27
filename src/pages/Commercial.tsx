import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useClients } from "@/hooks/useClients";
import { useSales } from "@/hooks/useSales";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  Users,
  ShoppingCart,
  Truck,
  FileText,
  CheckCircle,
  Package
} from "lucide-react";
import { ListSkeleton } from "@/components/LoadingSkeletons/ListSkeleton";

const formatNumber = (value?: number | null) => {
  return typeof value === "number" && !isNaN(value)
    ? value.toLocaleString()
    : "0";
};

const Commercial = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isOpen } = useSidebar();
  const { profile } = useAuth();

  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false);
  const [isClientDetailsDialogOpen, setIsClientDetailsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { sales, isLoading: salesLoading, updateSale, createSale, isCreating, isUpdating } = useSales();

  // Formulaire nouvelle commande
  const [orderForm, setOrderForm] = useState({
    client_id: "",
    salt_type: "gros",
    quantity: "",
    unit_price: "",
    notes: ""
  });

  // Filtrer les ventes par statut
  const draftSales = sales.filter(s => !s.sale_status || s.sale_status === 'draft');
  const invoicedSales = sales.filter(s => ['invoiced', 'confirmed'].includes(s.sale_status || ''));
  const deliverableSales = sales.filter(s => s.can_be_delivered && s.sale_status !== 'completed');
  const deliveredSales = sales.filter(s => s.sale_status === 'delivered' || s.sale_status === 'completed');

  const handleViewClientDetails = (client: any) => {
    setSelectedClient({
      ...client,
      totalOrders: client.totalOrders ?? 0,
      totalRevenue: client.totalRevenue ?? 0,
      paymentTerms: client.paymentTerms ?? "N/A",
      status: client.status ?? "actif"
    });
    setIsClientDetailsDialogOpen(true);
  };

  // Créer une nouvelle commande
  const handleCreateOrder = async () => {
    if (!orderForm.client_id || !orderForm.quantity || !orderForm.unit_price) {
      toast({ title: "Erreur", description: "Remplissez tous les champs obligatoires", variant: "destructive" });
      return;
    }

    const quantity = parseFloat(orderForm.quantity);
    const unitPrice = parseFloat(orderForm.unit_price);

    try {
      await createSale({
        client_id: orderForm.client_id,
        salt_type: orderForm.salt_type,
        quantity,
        unit_price: unitPrice,
        notes: orderForm.notes,
        payment_status: 'pending'
      });
      toast({ title: "Commande créée", description: "La commande a été enregistrée" });
      setIsNewOrderDialogOpen(false);
      setOrderForm({ client_id: "", salt_type: "gros", quantity: "", unit_price: "", notes: "" });
    } catch (error) {
      console.error('Erreur création commande:', error);
    }
  };

  // Valider une commande (passer en invoiced)
  const handleValidateOrder = async (saleId: string) => {
    try {
      await updateSale({ id: saleId, sale_status: 'invoiced' });
      toast({ title: "Commande validée", description: "La commande est prête pour facturation" });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    } catch (error) {
      console.error('Erreur validation commande:', error);
    }
  };

  // Marquer comme livrée
  const handleMarkDelivered = async (saleId: string) => {
    try {
      await updateSale({ id: saleId, sale_status: 'completed' });
      toast({ title: "Livraison confirmée", description: "La commande a été livrée et le stock mis à jour" });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    } catch (error) {
      console.error('Erreur confirmation livraison:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />

        <main
          className={cn(
            "flex-1 p-3 sm:p-6 space-y-6 transition-all duration-300",
            isOpen ? "md:ml-64" : "md:ml-16"
          )}
        >
          {/* Dialog Détail Client */}
          <Dialog open={isClientDetailsDialogOpen} onOpenChange={setIsClientDetailsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Détails du client</DialogTitle>
                <DialogDescription>Informations complètes du client</DialogDescription>
              </DialogHeader>
              {selectedClient && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="font-semibold text-lg">{selectedClient.name}</p>
                    <Badge variant="outline">
                      {selectedClient.client_type === "local" ? "Local" : "Export"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total commandes</span>
                      <span>{formatNumber(selectedClient.totalOrders)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Chiffre d'affaires</span>
                      <span className="font-semibold text-primary">
                        {formatNumber(selectedClient.totalRevenue)} FCFA
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setIsClientDetailsDialogOpen(false)}>
                    Fermer
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog Nouvelle Commande */}
          <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nouvelle commande</DialogTitle>
                <DialogDescription>Enregistrer une nouvelle vente</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Client *</Label>
                  <Select value={orderForm.client_id} onValueChange={(v) => setOrderForm(prev => ({ ...prev, client_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type de sel *</Label>
                  <Select value={orderForm.salt_type} onValueChange={(v) => setOrderForm(prev => ({ ...prev, salt_type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gros">Sel gros</SelectItem>
                      <SelectItem value="fin">Sel fin</SelectItem>
                      <SelectItem value="iode">Sel iodé</SelectItem>
                      <SelectItem value="export">Sel export</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantité (kg) *</Label>
                    <Input type="number" value={orderForm.quantity} onChange={(e) => setOrderForm(prev => ({ ...prev, quantity: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Prix unitaire (FCFA) *</Label>
                    <Input type="number" value={orderForm.unit_price} onChange={(e) => setOrderForm(prev => ({ ...prev, unit_price: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={orderForm.notes} onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsNewOrderDialogOpen(false)}>Annuler</Button>
                  <Button className="flex-1" onClick={handleCreateOrder} disabled={isCreating}>
                    {isCreating ? "Création..." : "Créer"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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

            {/* ONGLET CLIENTS */}
            <TabsContent value="clients">
              <Card>
                <CardHeader>
                  <CardTitle>Liste des clients</CardTitle>
                </CardHeader>
                <CardContent>
                  {clientsLoading ? (
                    <ListSkeleton items={4} showAvatar={false} />
                  ) : clients.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aucun client enregistré</p>
                  ) : (
                    <div className="space-y-4">
                      {clients.map((client: any) => (
                        <div key={client.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{client.name}</p>
                              <Badge variant="outline" className="mt-1">
                                {client.client_type === 'local' ? 'Local' : 'Export'}
                              </Badge>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleViewClientDetails(client)}>
                              Voir détails
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ONGLET COMMANDES */}
            <TabsContent value="commandes">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Commandes en cours</CardTitle>
                  <Button onClick={() => setIsNewOrderDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle commande
                  </Button>
                </CardHeader>
                <CardContent>
                  {salesLoading ? (
                    <ListSkeleton items={4} showAvatar={false} />
                  ) : draftSales.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aucune commande en attente</p>
                  ) : (
                    <div className="space-y-4">
                      {draftSales.map((sale: any) => (
                        <div key={sale.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{sale.client?.name || 'Client inconnu'}</p>
                              <p className="text-sm text-muted-foreground">
                                {sale.quantity} kg - {sale.salt_type}
                              </p>
                              <p className="text-lg font-bold text-primary mt-1">
                                {formatNumber(sale.total_amount)} FCFA
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <Badge variant="secondary">Brouillon</Badge>
                              <Button size="sm" onClick={() => handleValidateOrder(sale.id)}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Valider
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ONGLET FACTURATION */}
            <TabsContent value="facturation">
              <Card>
                <CardHeader>
                  <CardTitle>Ventes facturées</CardTitle>
                </CardHeader>
                <CardContent>
                  {salesLoading ? (
                    <ListSkeleton items={4} showAvatar={false} />
                  ) : invoicedSales.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aucune facture en cours</p>
                  ) : (
                    <div className="space-y-4">
                      {invoicedSales.map((sale: any) => (
                        <div key={sale.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{sale.client?.name || 'Client inconnu'}</p>
                              <p className="text-sm text-muted-foreground">
                                {sale.invoice_number || `Facture #${sale.id.slice(0, 8)}`}
                              </p>
                              <p className="text-lg font-bold text-primary mt-1">
                                {formatNumber(sale.total_amount)} FCFA
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <Badge variant={sale.payment_status === 'paid' ? 'default' : 'secondary'}>
                                {sale.payment_status === 'paid' ? 'Payée' : sale.payment_status === 'partial' ? 'Partiel' : 'En attente'}
                              </Badge>
                              {sale.can_be_delivered && (
                                <Badge variant="default">Livrable</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ONGLET LIVRAISON */}
            <TabsContent value="livraison">
              <Card>
                <CardHeader>
                  <CardTitle>Livraisons à effectuer</CardTitle>
                </CardHeader>
                <CardContent>
                  {salesLoading ? (
                    <ListSkeleton items={4} showAvatar={false} />
                  ) : deliverableSales.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Aucune livraison en attente. Les ventes avec "Peut être livrée" cochée apparaîtront ici.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {deliverableSales.map((sale: any) => (
                        <div key={sale.id} className="p-4 border rounded-lg bg-muted/30">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{sale.client?.name || 'Client inconnu'}</p>
                              <p className="text-sm text-muted-foreground">
                                {sale.quantity} kg - {sale.salt_type}
                              </p>
                              <p className="text-lg font-bold text-primary mt-1">
                                {formatNumber(sale.total_amount)} FCFA
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Paiement: {sale.payment_status === 'paid' ? 'Complet' : 'Partiel'}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <Badge variant="default">Prête à livrer</Badge>
                              <Button 
                                size="sm" 
                                onClick={() => handleMarkDelivered(sale.id)}
                                disabled={isUpdating}
                              >
                                <Package className="h-4 w-4 mr-1" />
                                Confirmer livraison
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>

                {/* Section historique des livraisons */}
                {deliveredSales.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="font-semibold mb-4 px-6">Livraisons effectuées</h3>
                    <div className="space-y-2 px-6 pb-4">
                      {deliveredSales.slice(0, 5).map((sale: any) => (
                        <div key={sale.id} className="p-3 border rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-medium">{sale.client?.name || 'Client inconnu'}</p>
                            <p className="text-sm text-muted-foreground">{sale.quantity} kg</p>
                          </div>
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Livrée
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Commercial;
