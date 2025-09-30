import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp,
  Plus,
  DollarSign,
  Users,
  ShoppingCart,
  Truck
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";

const salesData = [
  { name: "Sel gros", value: 245000, color: "hsl(var(--primary))" },
  { name: "Sel fin", value: 180000, color: "hsl(var(--accent))" },
  { name: "Sel iodé", value: 125000, color: "hsl(var(--primary-glow))" },
  { name: "Sel industriel", value: 95000, color: "hsl(200 75% 55%)" },
];

const recentOrders = [
  {
    client: "Grossiste Dakar",
    type: "Sel gros",
    quantity: "50 tonnes",
    amount: "7,500 FCFA",
    status: "livré",
    date: "2025-03-15"
  },
  {
    client: "Export Maroc",
    type: "Sel iodé",
    quantity: "80 tonnes",
    amount: "20,000 FCFA",
    status: "en cours",
    date: "2025-03-14"
  },
  {
    client: "Industrie Chimique SN",
    type: "Sel industriel",
    quantity: "120 tonnes",
    amount: "14,400 FCFA",
    status: "livré",
    date: "2025-03-13"
  },
  {
    client: "Détaillant Thiès",
    type: "Sel fin",
    quantity: "25 tonnes",
    amount: "5,000 FCFA",
    status: "en préparation",
    date: "2025-03-12"
  },
];

const topClients = [
  { name: "Export Maroc", revenue: "185,000 FCFA", orders: 12 },
  { name: "Grossiste Dakar", revenue: "142,000 FCFA", orders: 28 },
  { name: "Industrie Chimique SN", revenue: "98,500 FCFA", orders: 8 },
  { name: "Coopérative Fatick", revenue: "76,200 FCFA", orders: 15 },
];

const Commercial = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gestion Commerciale</h1>
              <p className="text-muted-foreground">
                Suivi des ventes, clients et commandes
              </p>
            </div>
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
              <Plus className="h-4 w-4" />
              Nouvelle commande
            </Button>
          </div>

          {/* KPIs Commerciaux */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="h-8 w-8 text-primary" />
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">CA ce mois</p>
                <p className="text-3xl font-bold">128k FCFA</p>
                <p className="text-xs text-green-600 mt-1">+18% vs. février</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <ShoppingCart className="h-8 w-8 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground">Commandes</p>
                <p className="text-3xl font-bold">48</p>
                <p className="text-xs text-muted-foreground mt-1">Ce mois</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Clients actifs</p>
                <p className="text-3xl font-bold">32</p>
                <p className="text-xs text-green-600 mt-1">+4 nouveaux</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Truck className="h-8 w-8 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground">Livraisons</p>
                <p className="text-3xl font-bold">42</p>
                <p className="text-xs text-muted-foreground mt-1">87% à temps</p>
              </CardContent>
            </Card>
          </div>

          {/* Répartition des ventes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Répartition des ventes par type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {salesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => `${(value / 1000).toFixed(0)}k FCFA`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Top clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topClients.map((client, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{client.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {client.orders} commandes
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-primary">{client.revenue}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commandes récentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Commandes récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders.map((order, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{order.client}</h3>
                        <Badge 
                          variant="outline"
                          className={
                            order.status === "livré"
                              ? "text-green-600 border-green-600"
                              : order.status === "en cours"
                              ? "text-blue-600 border-blue-600"
                              : "text-yellow-600 border-yellow-600"
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.type} • {order.quantity} • {order.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{order.amount}</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Détails
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats supplémentaires */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Panier moyen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-2">2,667 FCFA</p>
                <p className="text-sm text-green-600">+8% ce mois</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Taux de conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-2">76%</p>
                <p className="text-sm text-muted-foreground">Devis → Commandes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Délai livraison moyen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-2">3.2 jours</p>
                <p className="text-sm text-green-600">-0.5 jour vs. février</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Commercial;
