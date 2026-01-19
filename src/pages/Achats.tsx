import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Breadcrumbs } from "@/components/Layout/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Plus, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSuppliers, type SupplierFormData } from "@/hooks/useSuppliers";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Achats = () => {
  const { toast } = useToast();
  const { isOpen } = useSidebar();
  const { suppliers, isLoading: suppliersLoading, createSupplier } = useSuppliers();
  const { purchaseOrders, isLoading: ordersLoading, createPurchaseOrder } = usePurchaseOrders();
  
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  
  const [supplierFormData, setSupplierFormData] = useState({
    name: "",
    supplierType: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  });
  
  const [orderFormData, setOrderFormData] = useState({
    supplierId: "",
    orderDate: "",
    deliveryDate: "",
    items: "",
    quantity: "",
    unitPrice: "",
    notes: ""
  });
  
  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData: SupplierFormData = {
        name: supplierFormData.name,
        supplier_type: supplierFormData.supplierType,
        contact_person: supplierFormData.contact,
        phone: supplierFormData.phone,
        email: supplierFormData.email,
        address: supplierFormData.address,
        notes: supplierFormData.notes,
      };
      await createSupplier.mutateAsync(formData);
      setIsSupplierDialogOpen(false);
      setSupplierFormData({
        name: "",
        supplierType: "",
        contact: "",
        phone: "",
        email: "",
        address: "",
        notes: ""
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };
  
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPurchaseOrder.mutateAsync({
        supplier_id: orderFormData.supplierId,
        order_date: orderFormData.orderDate,
        expected_delivery_date: orderFormData.deliveryDate,
        notes: orderFormData.notes,
        quantity: orderFormData.quantity,
        unit_price: orderFormData.unitPrice,
      });
      setIsOrderDialogOpen(false);
      setOrderFormData({
        supplierId: "",
        orderDate: "",
        deliveryDate: "",
        items: "",
        quantity: "",
        unitPrice: "",
        notes: ""
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Brouillon", variant: "secondary" },
      pending: { label: "En attente", variant: "outline" },
      approved: { label: "Approuvée", variant: "default" },
      ordered: { label: "Commandée", variant: "default" },
      received: { label: "Reçue", variant: "default" },
      cancelled: { label: "Annulée", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={cn(
          "flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 transition-all duration-300",
          isOpen ? "md:ml-64" : "md:ml-16"
        )}>
          <Breadcrumbs />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Achats & Approvisionnements</h1>
              <p className="text-muted-foreground">Gestion des fournisseurs et commandes</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setIsSupplierDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Fournisseur
              </Button>
              <Button 
                className="gap-2"
                onClick={() => setIsOrderDialogOpen(true)}
              >
                <ShoppingCart className="h-4 w-4" />
                Nouvelle commande
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Fournisseurs</p>
                    <p className="text-2xl font-bold">{suppliers.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Commandes</p>
                    <p className="text-2xl font-bold">{purchaseOrders.length}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En attente</p>
                    <p className="text-2xl font-bold">
                      {purchaseOrders.filter(o => o.status === "pending").length}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">
                      {purchaseOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toLocaleString()} FCFA
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="orders">Commandes</TabsTrigger>
              <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Commandes d'achat</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <p className="text-center py-8 text-muted-foreground">Chargement...</p>
                  ) : purchaseOrders.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">Aucune commande</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° Commande</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.order_number}</TableCell>
                            <TableCell>{order.order_date}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell className="text-right">
                              {(order.total_amount || 0).toLocaleString()} FCFA
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suppliers">
              <Card>
                <CardHeader>
                  <CardTitle>Liste des fournisseurs</CardTitle>
                </CardHeader>
                <CardContent>
                  {suppliersLoading ? (
                    <p className="text-center py-8 text-muted-foreground">Chargement...</p>
                  ) : suppliers.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">Aucun fournisseur</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suppliers.map((supplier) => (
                          <TableRow key={supplier.id}>
                            <TableCell className="font-medium">{supplier.name}</TableCell>
                            <TableCell>{supplier.supplier_type}</TableCell>
                            <TableCell>{supplier.contact_person || "-"}</TableCell>
                            <TableCell>{supplier.phone || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={supplier.is_active ? "default" : "secondary"}>
                                {supplier.is_active ? "Actif" : "Inactif"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Dialog Nouveau Fournisseur */}
          <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nouveau fournisseur</DialogTitle>
                <DialogDescription>Ajouter un nouveau fournisseur</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSupplierSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      value={supplierFormData.name}
                      onChange={(e) => setSupplierFormData({...supplierFormData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplierType">Type</Label>
                    <Select 
                      value={supplierFormData.supplierType}
                      onValueChange={(value) => setSupplierFormData({...supplierFormData, supplierType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fournisseur">Fournisseur</SelectItem>
                        <SelectItem value="prestataire">Prestataire</SelectItem>
                        <SelectItem value="transporteur">Transporteur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact</Label>
                    <Input
                      id="contact"
                      value={supplierFormData.contact}
                      onChange={(e) => setSupplierFormData({...supplierFormData, contact: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={supplierFormData.phone}
                      onChange={(e) => setSupplierFormData({...supplierFormData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={supplierFormData.email}
                    onChange={(e) => setSupplierFormData({...supplierFormData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={supplierFormData.address}
                    onChange={(e) => setSupplierFormData({...supplierFormData, address: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={supplierFormData.notes}
                    onChange={(e) => setSupplierFormData({...supplierFormData, notes: e.target.value})}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsSupplierDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createSupplier.isPending}>
                    {createSupplier.isPending ? "Création..." : "Créer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog Nouvelle Commande */}
          <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nouvelle commande</DialogTitle>
                <DialogDescription>Créer une nouvelle commande d'achat</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleOrderSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Fournisseur *</Label>
                  <Select 
                    value={orderFormData.supplierId}
                    onValueChange={(value) => setOrderFormData({...orderFormData, supplierId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un fournisseur" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderDate">Date commande *</Label>
                    <Input
                      id="orderDate"
                      type="date"
                      value={orderFormData.orderDate}
                      onChange={(e) => setOrderFormData({...orderFormData, orderDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryDate">Livraison prévue</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={orderFormData.deliveryDate}
                      onChange={(e) => setOrderFormData({...orderFormData, deliveryDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantité</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={orderFormData.quantity}
                      onChange={(e) => setOrderFormData({...orderFormData, quantity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Prix unitaire (FCFA)</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      value={orderFormData.unitPrice}
                      onChange={(e) => setOrderFormData({...orderFormData, unitPrice: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderNotes">Notes</Label>
                  <Textarea
                    id="orderNotes"
                    value={orderFormData.notes}
                    onChange={(e) => setOrderFormData({...orderFormData, notes: e.target.value})}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createPurchaseOrder.isPending}>
                    {createPurchaseOrder.isPending ? "Création..." : "Créer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default Achats;
