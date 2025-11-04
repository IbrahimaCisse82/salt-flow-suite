import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Plus, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSuppliers } from "@/hooks/useSuppliers";
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
  const { suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { purchaseOrders, isLoading: ordersLoading } = usePurchaseOrders();
  
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
  
  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Fournisseur créé",
      description: `${supplierFormData.name} a été ajouté avec succès`,
    });
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
  };
  
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Commande créée",
      description: "La commande d'achat a été enregistrée avec succès",
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 p-6 transition-all duration-300", isOpen ? "ml-64" : "ml-16")}>
          {/* Dialog Nouveau Fournisseur */}
          <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Nouveau fournisseur</DialogTitle>
                <DialogDescription>
                  Ajouter un nouveau fournisseur au système
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSupplierSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du fournisseur *</Label>
                  <Input
                    id="name"
                    value={supplierFormData.name}
                    onChange={(e) => setSupplierFormData({...supplierFormData, name: e.target.value})}
                    placeholder="Ex: Société ABC"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplierType">Type de fournisseur *</Label>
                  <Select 
                    value={supplierFormData.supplierType} 
                    onValueChange={(value) => setSupplierFormData({...supplierFormData, supplierType: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipement">Équipement</SelectItem>
                      <SelectItem value="fourniture">Fourniture</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact</Label>
                    <Input
                      id="contact"
                      value={supplierFormData.contact}
                      onChange={(e) => setSupplierFormData({...supplierFormData, contact: e.target.value})}
                      placeholder="Nom du contact"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      value={supplierFormData.phone}
                      onChange={(e) => setSupplierFormData({...supplierFormData, phone: e.target.value})}
                      placeholder="+221 XX XXX XX XX"
                      required
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
                    placeholder="email@exemple.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={supplierFormData.address}
                    onChange={(e) => setSupplierFormData({...supplierFormData, address: e.target.value})}
                    placeholder="Adresse complète"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={supplierFormData.notes}
                    onChange={(e) => setSupplierFormData({...supplierFormData, notes: e.target.value})}
                    placeholder="Informations complémentaires..."
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsSupplierDialogOpen(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent">
                    Créer le fournisseur
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog Nouvelle Commande */}
          <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Nouvelle commande d'achat</DialogTitle>
                <DialogDescription>
                  Créer un bon de commande fournisseur
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleOrderSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Fournisseur *</Label>
                  <Select 
                    value={orderFormData.supplierId} 
                    onValueChange={(value) => setOrderFormData({...orderFormData, supplierId: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un fournisseur" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderDate">Date de commande *</Label>
                    <Input
                      id="orderDate"
                      type="date"
                      value={orderFormData.orderDate}
                      onChange={(e) => setOrderFormData({...orderFormData, orderDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryDate">Date de livraison prévue *</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={orderFormData.deliveryDate}
                      onChange={(e) => setOrderFormData({...orderFormData, deliveryDate: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="items">Articles/Services *</Label>
                  <Input
                    id="items"
                    value={orderFormData.items}
                    onChange={(e) => setOrderFormData({...orderFormData, items: e.target.value})}
                    placeholder="Description des articles"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantité *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.1"
                      value={orderFormData.quantity}
                      onChange={(e) => setOrderFormData({...orderFormData, quantity: e.target.value})}
                      placeholder="Ex: 10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Prix unitaire (FCFA) *</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      value={orderFormData.unitPrice}
                      onChange={(e) => setOrderFormData({...orderFormData, unitPrice: e.target.value})}
                      placeholder="Ex: 5000"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="orderNotes">Notes</Label>
                  <Textarea
                    id="orderNotes"
                    value={orderFormData.notes}
                    onChange={(e) => setOrderFormData({...orderFormData, notes: e.target.value})}
                    placeholder="Conditions particulières, remarques..."
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsOrderDialogOpen(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent">
                    Créer la commande
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Module Achats</h1>
              <p className="text-muted-foreground">Gestion des fournisseurs et commandes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Fournisseurs actifs</p>
                <p className="text-3xl font-bold">{suppliers?.filter((s: any) => s.is_active !== false).length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <ShoppingCart className="h-8 w-8 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Commandes en cours</p>
                <p className="text-3xl font-bold">{purchaseOrders?.filter(o => ['sent', 'confirmed'].includes(o.status)).length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Total commandes</p>
                <p className="text-3xl font-bold">{purchaseOrders?.length || 0}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="suppliers">
            <TabsList>
              <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
              <TabsTrigger value="orders">Commandes</TabsTrigger>
              <TabsTrigger value="inventory">Inventaire</TabsTrigger>
            </TabsList>

            <TabsContent value="suppliers" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Fournisseurs</CardTitle>
                    <Button onClick={() => setIsSupplierDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nouveau fournisseur
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {suppliersLoading ? (
                    <p className="text-center py-8 text-muted-foreground">Chargement...</p>
                  ) : suppliers && suppliers.length > 0 ? (
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
                        {suppliers.map((supplier: any) => (
                          <TableRow key={supplier.id}>
                            <TableCell className="font-medium">{supplier.name}</TableCell>
                            <TableCell>{supplier.supplier_type || '-'}</TableCell>
                            <TableCell>{supplier.contact_person || '-'}</TableCell>
                            <TableCell>{supplier.phone || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={supplier.is_active !== false ? 'default' : 'secondary'}>
                                {supplier.is_active !== false ? 'Actif' : 'Inactif'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">Aucun fournisseur</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Bons de commande</CardTitle>
                    <Button onClick={() => setIsOrderDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nouvelle commande
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <p className="text-center py-8 text-muted-foreground">Chargement...</p>
                  ) : purchaseOrders && purchaseOrders.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° Commande</TableHead>
                          <TableHead>Fournisseur</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseOrders.map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.order_number}</TableCell>
                            <TableCell>{order.supplier?.name}</TableCell>
                            <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                            <TableCell>{order.total_amount} FCFA</TableCell>
                            <TableCell>
                              <Badge>{order.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">Aucune commande</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Inventaire des fournitures</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-8 text-muted-foreground">Module en cours de développement</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Achats;
