import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, CheckCircle, Package, Pencil, XCircle, Download, History, ChevronDown, ChevronUp, FileText, ShoppingCart, Truck } from "lucide-react";
import { ListSkeleton } from "@/components/LoadingSkeletons/ListSkeleton";
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
import { generateInvoicePdf } from "@/utils/invoicePdf";
import type { InvoiceStyle } from "@/components/Settings/InvoiceTemplateSelector";

const formatNumber = (value?: number | null) =>
  typeof value === "number" && !isNaN(value) ? value.toLocaleString() : "0";

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const statusLabel = (status?: string | null) => {
  switch (status) {
    case "draft": return "Brouillon";
    case "invoiced": return "Facturée";
    case "confirmed": return "Confirmée";
    case "delivered": return "Livrée";
    case "completed": return "Terminée";
    case "cancelled": return "Annulée";
    default: return "Brouillon";
  }
};

const paymentLabel = (status?: string | null) => {
  switch (status) {
    case "paid": return "Payé";
    case "partial": return "Partiel";
    default: return "En attente";
  }
};

// ============================
// ORDERS TAB
// ============================
interface SalesTabProps {
  sales: any[];
  allSales: any[];
  isLoading: boolean;
  isUpdating: boolean;
  onValidate: (id: string) => void;
  onNewOrder: () => void;
  onEditOrder?: (sale: any) => void;
  onCancelOrder?: (id: string) => void;
}

export const OrdersTab = ({ sales, allSales, isLoading, isUpdating, onValidate, onNewOrder, onEditOrder, onCancelOrder }: SalesTabProps) => {
  const [showHistory, setShowHistory] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const recentOrders = allSales
    .filter((s) => s.sale_status !== "draft" && s.sale_status)
    .slice(0, 10);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Commandes en cours</CardTitle>
          <Button onClick={onNewOrder}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle commande
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ListSkeleton items={4} showAvatar={false} />
          ) : sales.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <p className="text-muted-foreground font-medium">Aucune commande en attente</p>
              <p className="text-sm text-muted-foreground">Cliquez sur « Nouvelle commande » pour commencer.<br/>Après validation, elle passera en facturation.</p>
              <Button onClick={onNewOrder} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Créer ma première commande
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sales.map((sale: any) => (
                <div key={sale.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold">{sale.client?.name || "Client inconnu"}</p>
                      {sale.sale_items && sale.sale_items.length > 0 ? (
                        <div className="mt-1 space-y-0.5">
                          {sale.sale_items.map((item: any) => (
                            <p key={item.id} className="text-sm text-muted-foreground">
                              {item.quantity} t · {item.salt_type} — {item.warehouse_name || 'N/A'}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{sale.quantity} t - {sale.salt_type}</p>
                      )}
                      <p className="text-lg font-bold text-primary mt-1">{formatNumber(sale.total_amount)} FCFA</p>
                      <p className="text-xs text-muted-foreground">{formatDate(sale.sale_date)}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant="secondary">Brouillon</Badge>
                      <div className="flex gap-1">
                        {onEditOrder && (
                          <Button size="sm" variant="outline" onClick={() => onEditOrder(sale)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {onCancelOrder && (
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setCancelId(sale.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" onClick={() => onValidate(sale.id)} disabled={isUpdating}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Valider
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order History */}
      {recentOrders.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="cursor-pointer flex flex-row items-center justify-between" onClick={() => setShowHistory(!showHistory)}>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique des 10 dernières commandes
            </CardTitle>
            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardHeader>
          {showHistory && (
            <CardContent>
              <div className="space-y-3">
                {recentOrders.map((sale: any) => (
                  <div key={sale.id} className="p-3 border rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">{sale.client?.name || "Client inconnu"}</p>
                      {sale.sale_items && sale.sale_items.length > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {sale.sale_items.map((i: any) => `${i.quantity}t ${i.salt_type}`).join(', ')} · {formatDate(sale.sale_date)}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">{sale.quantity} t - {sale.salt_type} · {formatDate(sale.sale_date)}</p>
                      )}
                      <p className="text-sm font-semibold text-primary">{formatNumber(sale.total_amount)} FCFA</p>
                    </div>
                    <Badge variant={sale.sale_status === "cancelled" ? "destructive" : "secondary"}>
                      {statusLabel(sale.sale_status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action changera le statut de la commande en "Annulée". Le stock réservé sera libéré.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (cancelId && onCancelOrder) { onCancelOrder(cancelId); setCancelId(null); } }}>
              Oui, annuler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ============================
// INVOICES TAB
// ============================
interface InvoicesTabProps {
  sales: any[];
  allSales: any[];
  isLoading: boolean;
  isUpdating?: boolean;
  onEditInvoice?: (sale: any) => void;
  onCancelInvoice?: (id: string) => void;
  tenant?: any;
  invoiceStyle?: InvoiceStyle;
}

export const InvoicesTab = ({ sales, allSales, isLoading, isUpdating, onEditInvoice, onCancelInvoice, tenant, invoiceStyle = "classic" }: InvoicesTabProps) => {
  const [showHistory, setShowHistory] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const recentInvoices = allSales
    .filter((s) => ["invoiced", "confirmed", "delivered", "completed", "cancelled"].includes(s.sale_status || ""))
    .slice(0, 10);

  const handleDownload = async (sale: any) => {
    await generateInvoicePdf(
      {
        invoiceNumber: sale.invoice_number || sale.id.slice(0, 8).toUpperCase(),
        date: formatDate(sale.sale_date),
        clientName: sale.client?.name || "Client inconnu",
        clientAddress: sale.client?.address,
        clientPhone: sale.client?.phone,
        clientEmail: sale.client?.email,
        clientType: sale.client?.client_type,
        saltType: sale.salt_type || "sel",
        quantity: sale.quantity || 0,
        unitPrice: sale.unit_price || 0,
        discount: sale.discount || 0,
        totalAmount: sale.total_amount || 0,
        paymentStatus: sale.payment_status || "pending",
        notes: sale.notes,
        tvaRate: sale.tva_rate || 0,
        tvaAmount: sale.tva_amount || 0,
        amountHT: sale.amount_ht || sale.total_amount || 0,
      },
      {
        name: tenant?.name || "Entreprise",
        address: tenant?.address || undefined,
        phone: tenant?.contact_phone || undefined,
        email: tenant?.contact_email || undefined,
        ninea: tenant?.ninea || undefined,
        rccm: tenant?.rccm || undefined,
        managerName: tenant?.manager_name || undefined,
        logoUrl: tenant?.logo_url || undefined,
      },
      invoiceStyle
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Ventes facturées</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ListSkeleton items={4} showAvatar={false} />
          ) : sales.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <p className="text-muted-foreground font-medium">Aucune facture en cours</p>
              <p className="text-sm text-muted-foreground">Validez une commande dans l'onglet « Commandes »<br/>pour qu'elle apparaisse ici automatiquement.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sales.map((sale: any) => (
                <div key={sale.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{sale.client?.name || "Client inconnu"}</p>
                      <p className="text-sm text-muted-foreground">
                        {sale.invoice_number || `Facture #${sale.id.slice(0, 8)}`} · {formatDate(sale.sale_date)}
                      </p>
                      {sale.sale_items && sale.sale_items.length > 0 ? (
                        <div className="space-y-0.5">
                          {sale.sale_items.map((item: any) => (
                            <p key={item.id} className="text-sm text-muted-foreground">
                              {item.quantity} t · {item.salt_type} — {item.warehouse_name || 'N/A'}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{sale.quantity} t - {sale.salt_type}</p>
                      )}
                      {sale.tva_amount > 0 && (
                        <p className="text-xs text-muted-foreground">HT: {formatNumber(sale.amount_ht)} · TVA {sale.tva_rate}%: {formatNumber(sale.tva_amount)}</p>
                      )}
                      <p className="text-lg font-bold text-primary mt-1">{formatNumber(sale.total_amount)} FCFA {sale.tva_amount > 0 ? "TTC" : "HT"}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={sale.payment_status === "paid" ? "default" : "secondary"}>
                        {paymentLabel(sale.payment_status)}
                      </Badge>
                      {sale.can_be_delivered && <Badge variant="default">Livrable</Badge>}
                      <div className="flex gap-1">
                        {onEditInvoice && sale.sale_status !== "completed" && sale.sale_status !== "cancelled" && sale.sale_status !== "delivered" && (
                          <Button size="sm" variant="outline" onClick={() => onEditInvoice(sale)} disabled={isUpdating}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {onCancelInvoice && sale.sale_status !== "completed" && sale.sale_status !== "cancelled" && sale.sale_status !== "delivered" && (
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setCancelId(sale.id)} disabled={isUpdating}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleDownload(sale)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice History */}
      {recentInvoices.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="cursor-pointer flex flex-row items-center justify-between" onClick={() => setShowHistory(!showHistory)}>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique des 10 dernières factures
            </CardTitle>
            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardHeader>
          {showHistory && (
            <CardContent>
              <div className="space-y-3">
                {recentInvoices.map((sale: any) => (
                  <div key={sale.id} className="p-3 border rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">{sale.client?.name || "Client inconnu"}</p>
                      <p className="text-sm text-muted-foreground">
                        {sale.invoice_number || `#${sale.id.slice(0, 8)}`} · {sale.quantity} kg · {formatDate(sale.sale_date)}
                      </p>
                      <p className="text-sm font-semibold text-primary">{formatNumber(sale.total_amount)} FCFA</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sale.sale_status === "cancelled" ? "destructive" : "secondary"}>
                        {statusLabel(sale.sale_status)}
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={() => handleDownload(sale)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action changera le statut en "Annulée".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (cancelId && onCancelInvoice) { onCancelInvoice(cancelId); setCancelId(null); } }}>
              Oui, annuler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ============================
// DELIVERY TAB
// ============================
interface DeliveryTabProps {
  deliverableSales: any[];
  deliveredSales: any[];
  isLoading: boolean;
  isUpdating: boolean;
  onMarkDelivered: (id: string) => void;
}

export const DeliveryTab = ({ deliverableSales, deliveredSales, isLoading, isUpdating, onMarkDelivered }: DeliveryTabProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Livraisons à effectuer</CardTitle>
    </CardHeader>
    <CardContent>
      {isLoading ? (
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
                  <p className="font-semibold">{sale.client?.name || "Client inconnu"}</p>
                  <p className="text-sm text-muted-foreground">{sale.quantity} kg - {sale.salt_type}</p>
                  <p className="text-lg font-bold text-primary mt-1">{formatNumber(sale.total_amount)} FCFA</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Paiement: {sale.payment_status === "paid" ? "Complet" : "Partiel"}
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge variant="default">Prête à livrer</Badge>
                  <Button size="sm" onClick={() => onMarkDelivered(sale.id)} disabled={isUpdating}>
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

    {deliveredSales.length > 0 && (
      <div className="mt-6 border-t pt-4">
        <h3 className="font-semibold mb-4 px-6">Livraisons effectuées</h3>
        <div className="space-y-2 px-6 pb-4">
          {deliveredSales.slice(0, 5).map((sale: any) => (
            <div key={sale.id} className="p-3 border rounded-lg flex justify-between items-center">
              <div>
                <p className="font-medium">{sale.client?.name || "Client inconnu"}</p>
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
);
