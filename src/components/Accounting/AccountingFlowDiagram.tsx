import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Factory, Package, ShoppingCart, CreditCard, Users, BookOpen } from "lucide-react";

export const AccountingFlowDiagram = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Flux comptables automatisés
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {/* Production → Stock → Comptabilité */}
          <div className="flex flex-wrap items-center gap-2 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                <Factory className="h-4 w-4 text-purple-600" />
              </div>
              <span className="font-medium">Production</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <span>Stock</span>
              <Badge variant="secondary">+Quantité</Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1">
              <Badge className="bg-purple-500">Débit 35</Badge>
              <span className="text-xs text-muted-foreground">Stocks produits finis</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-emerald-500">Crédit 72</Badge>
              <span className="text-xs text-muted-foreground">Production stockée</span>
            </div>
          </div>

          {/* Vente → Stock → Comptabilité */}
          <div className="flex flex-wrap items-center gap-2 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
                <ShoppingCart className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="font-medium">Vente facturée</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <span>Stock</span>
              <Badge variant="destructive">-Quantité</Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1">
              <Badge className="bg-emerald-500">Débit 411</Badge>
              <span className="text-xs text-muted-foreground">Clients</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-emerald-500">Crédit 701</Badge>
              <span className="text-xs text-muted-foreground">Ventes</span>
            </div>
          </div>

          {/* Achat payé → Stock → Comptabilité */}
          <div className="flex flex-wrap items-center gap-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-medium">Achat payé</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <span>Stock (réception)</span>
              <Badge variant="secondary">+Quantité</Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1">
              <Badge className="bg-blue-500">Débit 601</Badge>
              <span className="text-xs text-muted-foreground">Achats</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-blue-500">Crédit 521</Badge>
              <span className="text-xs text-muted-foreground">Banque</span>
            </div>
          </div>

          {/* Salaire → Comptabilité */}
          <div className="flex flex-wrap items-center gap-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                <Users className="h-4 w-4 text-amber-600" />
              </div>
              <span className="font-medium">Paiement salaire</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1">
              <Badge className="bg-amber-500">Débit 661</Badge>
              <span className="text-xs text-muted-foreground">Rémunérations</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-amber-500">Crédit 521</Badge>
              <span className="text-xs text-muted-foreground">Banque</span>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50">
          <h4 className="font-medium mb-2">💡 Valorisation au coût de revient</h4>
          <p className="text-sm text-muted-foreground">
            La production stockée est valorisée automatiquement en utilisant le dernier coût par tonne calculé 
            (module Rapports → Coût de revient). Cette valorisation garantit une comptabilité conforme aux principes 
            de gestion et permet le calcul automatique des marges commerciales.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
