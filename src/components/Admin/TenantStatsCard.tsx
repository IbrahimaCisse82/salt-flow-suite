import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Package, ShoppingCart } from "lucide-react";

interface TenantStatsCardProps {
  tenant: {
    id: string;
    name: string;
    is_active: boolean;
    stats: {
      users: number;
      production: number;
      sales: number;
    };
  };
}

export const TenantStatsCard = ({ tenant }: TenantStatsCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {tenant.name}
          </CardTitle>
          <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
            {tenant.is_active ? 'Actif' : 'Inactif'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <Users className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{tenant.stats.users}</p>
            <p className="text-xs text-muted-foreground">Utilisateurs</p>
          </div>
          <div className="text-center">
            <Package className="h-6 w-6 mx-auto mb-1 text-accent" />
            <p className="text-2xl font-bold">{tenant.stats.production}</p>
            <p className="text-xs text-muted-foreground">Productions</p>
          </div>
          <div className="text-center">
            <ShoppingCart className="h-6 w-6 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">{tenant.stats.sales}</p>
            <p className="text-xs text-muted-foreground">Ventes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
