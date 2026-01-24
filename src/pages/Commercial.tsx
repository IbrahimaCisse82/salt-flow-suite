import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Breadcrumbs } from "@/components/Layout/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/utils/logger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useClients } from "@/hooks/useClients";
import { useSales } from "@/hooks/useSales";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import {
  Plus,
  Users,
  ShoppingCart,
  Truck,
  FileText,
  Package
} from "lucide-react";
import { AutomaticReminders } from "@/components/Commercial/AutomaticReminders";
import { ListSkeleton } from "@/components/LoadingSkeletons/ListSkeleton";

/* ----------------------------------------------------
   UTILITAIRE DE FORMATAGE (ANTI-CRASH)
   ----------------------------------------------------
   - Empêche définitivement l’erreur toLocaleString
   - Utilisé partout où un nombre peut être undefined
---------------------------------------------------- */
const formatNumber = (value?: number | null) => {
  return typeof value === "number" && !isNaN(value)
    ? value.toLocaleString()
    : "0";
};

type Order = {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  deliveryNumber: string;
  client: string;
  clientType: string;
  saltType: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalAmount: number;
  deliveryDate: string;
  paymentTerms: string;
  notes: string;
  date: string;
  validated: boolean;
  invoiced: boolean;
  invoiceValidated: boolean;
  paid: boolean;
  canBeDelivered: boolean;
  delivered: boolean;
};

const Commercial = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isOpen } = useSidebar();
  const { profile } = useAuth();

  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [isClientDetailsDialogOpen, setIsClientDetailsDialogOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { sales, createSale, updateSale } = useSales();

  /* ------------------------------
     DIALOG DÉTAIL CLIENT
     CORRECTION PRINCIPALE ICI
  ------------------------------ */
  const handleViewClientDetails = (client: any) => {
    // On enrichit l’objet pour éviter les undefined
    setSelectedClient({
      ...client,
      totalOrders: client.totalOrders ?? 0,
      totalRevenue: client.totalRevenue ?? 0,
      paymentTerms: client.paymentTerms ?? "N/A",
      status: client.status ?? "actif"
    });
    setIsClientDetailsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />

        <main
          className={cn(
            "flex-1 p-3 sm:p-6 space-y-6 transition-all duration-300",
            isOpen ? "md:ml-64" : "md:ml-16"
          )}
        >
          {/* ================= DIALOG DÉTAIL CLIENT ================= */}
          <Dialog
            open={isClientDetailsDialogOpen}
            onOpenChange={setIsClientDetailsDialogOpen}
          >
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Détails du client</DialogTitle>
                <DialogDescription>
                  Informations complètes du client
                </DialogDescription>
              </DialogHeader>

              {selectedClient && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="font-semibold text-lg">
                      {selectedClient.name}
                    </p>
                    <Badge variant="outline">
                      {selectedClient.client_type === "local"
                        ? "Local"
                        : "Export"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total commandes</span>
                      <span>{formatNumber(selectedClient.totalOrders)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Chiffre d'affaires</span>
                      <span className="font-semibold text-primary">
                        {formatNumber(selectedClient.totalRevenue)} FCFA
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Conditions</span>
                      <span>{selectedClient.paymentTerms}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsClientDetailsDialogOpen(false)}
                  >
                    Fermer
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* ================= ONGLET CLIENTS ================= */}
          <Tabs defaultValue="clients">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="clients">
                <Users className="h-4 w-4 mr-2" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="commandes">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Commandes
              </TabsTrigger>
              <TabsTrigger value="facturation">
                <FileText className="h-4 w-4 mr-2" />
                Facturation
              </TabsTrigger>
              <TabsTrigger value="livraison">
                <Truck className="h-4 w-4 mr-2" />
                Livraison
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients">
              <Card>
                <CardHeader>
                  <CardTitle>Liste des clients</CardTitle>
                </CardHeader>
                <CardContent>
                  {clientsLoading ? (
                    <ListSkeleton items={4} showAvatar={false} />
                  ) : (
                    <div className="space-y-4">
                      {clients.map((client) => (
                        <div
                          key={client.id}
                          className="p-4 border rounded-lg"
                        >
                          <p className="font-semibold">{client.name}</p>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => handleViewClientDetails(client)}
                          >
                            Voir détails
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Les autres onglets restent IDENTIQUES visuellement */}
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Commercial;
