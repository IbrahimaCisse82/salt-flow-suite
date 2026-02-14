import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, CheckCircle, Package } from "lucide-react";
import { ListSkeleton } from "@/components/LoadingSkeletons/ListSkeleton";

const formatNumber = (value?: number | null) =>
  typeof value === "number" && !isNaN(value) ? value.toLocaleString() : "0";

interface SalesTabProps {
  sales: any[];
  isLoading: boolean;
  isUpdating: boolean;
  onValidate: (id: string) => void;
  onNewOrder: () => void;
}

export const OrdersTab = ({ sales, isLoading, isUpdating, onValidate, onNewOrder }: SalesTabProps) => (
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
        <p className="text-muted-foreground text-center py-8">Aucune commande en attente</p>
      ) : (
        <div className="space-y-4">
          {sales.map((sale: any) => (
            <div key={sale.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{sale.client?.name || 'Client inconnu'}</p>
                  <p className="text-sm text-muted-foreground">{sale.quantity} kg - {sale.salt_type}</p>
                  <p className="text-lg font-bold text-primary mt-1">{formatNumber(sale.total_amount)} FCFA</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge variant="secondary">Brouillon</Badge>
                  <Button size="sm" onClick={() => onValidate(sale.id)} disabled={isUpdating}>
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
);

interface InvoicesTabProps {
  sales: any[];
  isLoading: boolean;
}

export const InvoicesTab = ({ sales, isLoading }: InvoicesTabProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Ventes facturées</CardTitle>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <ListSkeleton items={4} showAvatar={false} />
      ) : sales.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Aucune facture en cours</p>
      ) : (
        <div className="space-y-4">
          {sales.map((sale: any) => (
            <div key={sale.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{sale.client?.name || 'Client inconnu'}</p>
                  <p className="text-sm text-muted-foreground">
                    {sale.invoice_number || `Facture #${sale.id.slice(0, 8)}`}
                  </p>
                  <p className="text-lg font-bold text-primary mt-1">{formatNumber(sale.total_amount)} FCFA</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge variant={sale.payment_status === 'paid' ? 'default' : 'secondary'}>
                    {sale.payment_status === 'paid' ? 'Payée' : sale.payment_status === 'partial' ? 'Partiel' : 'En attente'}
                  </Badge>
                  {sale.can_be_delivered && <Badge variant="default">Livrable</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

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
                  <p className="font-semibold">{sale.client?.name || 'Client inconnu'}</p>
                  <p className="text-sm text-muted-foreground">{sale.quantity} kg - {sale.salt_type}</p>
                  <p className="text-lg font-bold text-primary mt-1">{formatNumber(sale.total_amount)} FCFA</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Paiement: {sale.payment_status === 'paid' ? 'Complet' : 'Partiel'}
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
);
