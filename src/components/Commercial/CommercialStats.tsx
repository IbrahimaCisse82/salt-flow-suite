import { Card, CardContent } from "@/components/ui/card";
import { Users, ShoppingCart, Banknote, Truck, TrendingUp, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CommercialStatsProps {
  clients: any[];
  sales: any[];
  isLoading: boolean;
}

export const CommercialStats = ({ clients, sales, isLoading }: CommercialStatsProps) => {
  const totalClients = clients.length;
  const totalOrders = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const pendingOrders = sales.filter(s => !s.sale_status || s.sale_status === "draft").length;
  const deliveredOrders = sales.filter(s => s.sale_status === "completed").length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const stats = [
    {
      label: "Clients",
      value: totalClients,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      format: "number",
    },
    {
      label: "Commandes",
      value: totalOrders,
      icon: ShoppingCart,
      color: "text-accent-foreground",
      bgColor: "bg-accent",
      format: "number",
    },
    {
      label: "Chiffre d'affaires",
      value: totalRevenue,
      icon: Banknote,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      format: "currency",
    },
    {
      label: "Panier moyen",
      value: avgOrderValue,
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      format: "currency",
    },
    {
      label: "En attente",
      value: pendingOrders,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      format: "number",
    },
    {
      label: "Livrées",
      value: deliveredOrders,
      icon: Truck,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      format: "number",
    },
  ];

  const formatValue = (value: number, format: string) => {
    if (format === "currency") {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XOF",
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toLocaleString("fr-FR");
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <span className="text-xs text-muted-foreground truncate">{stat.label}</span>
            </div>
            <p className="text-lg font-bold truncate">
              {formatValue(stat.value, stat.format)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
