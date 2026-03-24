import { useState, useEffect } from "react";
import { Eye, MoreHorizontal, Package, ShoppingCart, FileText, ShieldCheck, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePurchaseOrders, PurchaseOrderWithSupplier, ORDER_STATUS } from "@/hooks/usePurchaseOrders";
import { OrderApprovalActions } from "./OrderApprovalActions";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { OrderReceptionDialog } from "./OrderReceptionDialog";
import { useAuth } from "@/contexts/AuthContext";

interface PurchaseOrdersTableProps {
  externalTab?: string;
  onTabChange?: (tab: string) => void;
}

export function PurchaseOrdersTable({ externalTab, onTabChange }: PurchaseOrdersTableProps) {
  const { purchaseOrders, isLoading, isManager, userRole } = usePurchaseOrders();
  const { profile } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderWithSupplier | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [receptionDialogOpen, setReceptionDialogOpen] = useState(false);
  const [internalTab, setInternalTab] = useState("all");

  const activeTab = externalTab || internalTab;
  const handleTabChange = (tab: string) => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };

  const handleViewOrder = (order: PurchaseOrderWithSupplier) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const handleReception = (order: PurchaseOrderWithSupplier) => {
    setSelectedOrder(order);
    setReceptionDialogOpen(true);
  };

  // Filtrer selon l'onglet actif
  const filteredOrders = purchaseOrders?.filter(order => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return order.status === "pending_approval";
    if (activeTab === "approved") return ["approved", "partially_paid"].includes(order.status);
    if (activeTab === "to_receive") return ["paid", "partially_received"].includes(order.status);
    if (activeTab === "completed") return ["received"].includes(order.status);
    if (activeTab === "mine") return order.created_by === profile?.id;
    return true;
  }) || [];

  // Compteurs pour les badges
  const pendingCount = purchaseOrders?.filter(o => o.status === "pending_approval").length || 0;
  const toReceiveCount = purchaseOrders?.filter(o => ["paid", "partially_received"].includes(o.status)).length || 0;

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  // Empty state helper
  const getEmptyState = () => {
    switch (activeTab) {
      case "pending":
        return {
          icon: ShieldCheck,
          title: "Aucune commande à approuver",
          description: "Les nouvelles commandes en attente de validation apparaîtront ici.",
        };
      case "approved":
        return {
          icon: CreditCard,
          title: "Aucune commande à payer",
          description: "Les commandes approuvées en attente de paiement apparaîtront ici.\nApprouvez d'abord une commande dans l'onglet « À approuver ».",
        };
      case "to_receive":
        return {
          icon: Package,
          title: "Aucune réception en attente",
          description: "Les commandes payées en attente de livraison fournisseur apparaîtront ici.\nPayez d'abord une commande approuvée.",
        };
      case "completed":
        return {
          icon: FileText,
          title: "Aucune commande terminée",
          description: "Les commandes entièrement reçues seront archivées ici.",
        };
      default:
        return {
          icon: ShoppingCart,
          title: "Aucune commande",
          description: "Cliquez sur « Nouvelle commande » pour passer votre première commande fournisseur.",
        };
    }
  };

  const emptyState = getEmptyState();
  const EmptyIcon = emptyState.icon;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Bons de commande</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              {isManager && (
                <TabsTrigger value="pending" className="gap-1.5">
                  À approuver
                  {pendingCount > 0 && <Badge variant="destructive" className="ml-1 text-[10px] px-1.5">{pendingCount}</Badge>}
                </TabsTrigger>
              )}
              <TabsTrigger value="approved">Approuvées</TabsTrigger>
              <TabsTrigger value="to_receive" className="gap-1.5">
                À recevoir
                {toReceiveCount > 0 && <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{toReceiveCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="completed">Terminées</TabsTrigger>
              <TabsTrigger value="mine">Mes commandes</TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const statusConfig = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || ORDER_STATUS.draft;
                  const canReceive = ["paid", "partially_paid", "approved", "partially_received"].includes(order.status);
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.supplier?.name || "-"}</TableCell>
                      <TableCell>
                        {format(new Date(order.order_date), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(order.total_amount ?? 0).toLocaleString("fr-FR")} FCFA
                      </TableCell>
                      <TableCell className="text-right">
                        {(order.total_paid ?? 0).toLocaleString("fr-FR")} FCFA
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                        {order.requires_reapproval && (
                          <Badge variant="outline" className="ml-1 text-destructive">Revalidation</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <OrderApprovalActions order={order} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            {canReceive && (
                              <DropdownMenuItem onClick={() => handleReception(order)}>
                                <Package className="h-4 w-4 mr-2" />
                                Valider réception
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 space-y-3">
              <EmptyIcon className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <p className="text-muted-foreground font-medium">{emptyState.title}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{emptyState.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedOrder && (
        <>
          <OrderDetailsDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            order={selectedOrder}
          />
          <OrderReceptionDialog
            open={receptionDialogOpen}
            onOpenChange={setReceptionDialogOpen}
            orderId={selectedOrder.id}
            orderNumber={selectedOrder.order_number}
          />
        </>
      )}
    </>
  );
}
