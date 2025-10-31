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

const Achats = () => {
  const { isOpen } = useSidebar();
  const { suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { purchaseOrders, isLoading: ordersLoading } = usePurchaseOrders();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 p-6 transition-all duration-300", isOpen ? "ml-64" : "ml-16")}>
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
                <p className="text-3xl font-bold">{suppliers?.filter(s => s.is_active).length || 0}</p>
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
                    <Button className="gap-2">
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
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suppliers.map((supplier: any) => (
                          <TableRow key={supplier.id}>
                            <TableCell className="font-medium">{supplier.name}</TableCell>
                            <TableCell>{supplier.supplier_type}</TableCell>
                            <TableCell>{supplier.phone}</TableCell>
                            <TableCell>
                              <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                                {supplier.is_active ? 'Actif' : 'Inactif'}
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
                    <Button className="gap-2">
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
