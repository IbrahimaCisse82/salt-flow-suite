import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  TrendingUp,
  Plus,
  DollarSign,
  Users,
  ShoppingCart,
  Truck,
  FileText,
  CheckCircle,
  Package
} from "lucide-react";

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

// Fonctions de génération de numéros
const generateClientNumber = (existingClients: any[]) => {
  const count = existingClients.length + 1;
  return `CLI-${count.toString().padStart(4, '0')}`;
};

const generateOrderNumber = (existingOrders: Order[]) => {
  const count = existingOrders.length + 1;
  return `CMD-${count.toString().padStart(4, '0')}`;
};

const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  return `FAC-${timestamp}`;
};

const generateDeliveryNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  return `LIV-${timestamp}`;
};

const Commercial = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [isClientDetailsDialogOpen, setIsClientDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Query pour récupérer les ventes prêtes à être livrées depuis Supabase
  const { data: deliverySales = [] } = useQuery({
    queryKey: ['delivery-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          client:clients(name, client_type)
        `)
        .eq('can_be_delivered', true)
        .order('delivery_date');
      
      if (error) throw error;
      
      return (data || []).map(sale => ({
        id: sale.id,
        orderNumber: sale.invoice_number || `CMD-${sale.id.slice(0, 6)}`,
        invoiceNumber: sale.invoice_number,
        deliveryNumber: sale.delivery_number,
        client: sale.client?.name || 'N/A',
        clientType: sale.client?.client_type || 'local',
        saltType: sale.salt_type,
        quantity: Number(sale.quantity),
        unitPrice: Number(sale.unit_price),
        discount: Number(sale.discount || 0),
        totalAmount: Number(sale.total_amount),
        deliveryDate: sale.delivery_date,
        paymentTerms: sale.payment_status,
        notes: sale.notes || '',
        date: sale.sale_date,
        validated: true,
        invoiced: true,
        invoiceValidated: true,
        paid: sale.payment_status === 'paid',
        canBeDelivered: sale.can_be_delivered,
        delivered: sale.delivered || false
      }));
    }
  });

  // Mutation pour marquer une vente comme livrée
  const markAsDeliveredMutation = useMutation({
    mutationFn: async (saleId: string) => {
      const deliveryNumber = generateDeliveryNumber();
      
      const { error } = await supabase
        .from('sales')
        .update({
          delivered: true,
          delivery_number: deliveryNumber
        })
        .eq('id', saleId);
      
      if (error) throw error;
      
      return { deliveryNumber };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-sales'] });
      
      toast({
        title: "Livraison enregistrée",
        description: `Numéro de livraison: ${result.deliveryNumber}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la livraison",
        variant: "destructive"
      });
      console.error('Delivery error:', error);
    }
  });

  const [clients, setClients] = useState([
    {
      id: "1",
      clientNumber: "CLI-0001",
      name: "Grossiste Dakar",
      type: "local",
      email: "contact@grossistedakar.sn",
      phone: "+221 77 123 45 67",
      address: "Rue 10, Dakar",
      totalOrders: 28,
      totalRevenue: 142000,
      paymentTerms: "30j",
      status: "actif"
    },
    {
      id: "2",
      clientNumber: "CLI-0002",
      name: "Export Maroc",
      type: "export",
      email: "export@marocsel.ma",
      phone: "+212 6 12 34 56 78",
      address: "Casablanca, Maroc",
      totalOrders: 12,
      totalRevenue: 185000,
      paymentTerms: "60j",
      status: "actif"
    },
    {
      id: "3",
      clientNumber: "CLI-0003",
      name: "Industrie Chimique SN",
      type: "local",
      email: "achats@chimiesn.com",
      phone: "+221 77 987 65 43",
      address: "Zone Industrielle, Thiès",
      totalOrders: 8,
      totalRevenue: 98500,
      paymentTerms: "45j",
      status: "actif"
    }
  ]);

  const [clientFormData, setClientFormData] = useState({
    name: "",
    type: "",
    email: "",
    phone: "",
    address: "",
    paymentTerms: "",
    taxId: "",
    notes: ""
  });

  const [orders, setOrders] = useState<Order[]>([
    {
      id: "1",
      orderNumber: "CMD-0001",
      invoiceNumber: "",
      deliveryNumber: "",
      client: "Grossiste Dakar",
      clientType: "local",
      saltType: "Sel gros",
      quantity: 50,
      unitPrice: 150,
      discount: 0,
      totalAmount: 7500,
      deliveryDate: "2025-03-20",
      paymentTerms: "30j",
      notes: "",
      date: "2025-03-15",
      validated: false,
      invoiced: false,
      invoiceValidated: false,
      paid: false,
      canBeDelivered: false,
      delivered: false
    }
  ]);

  const [orderFormData, setOrderFormData] = useState({
    clientId: "",
    clientName: "",
    clientType: "",
    saltType: "",
    quantity: "",
    unitPrice: "",
    discount: "",
    deliveryDate: "",
    paymentTerms: "",
    notes: ""
  });

  const handleNewOrder = () => {
    setIsNewOrderDialogOpen(true);
  };

  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      setOrderFormData({
        ...orderFormData,
        clientId: clientId,
        clientName: selectedClient.name,
        clientType: selectedClient.type
      });
    }
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = (parseFloat(orderFormData.quantity) * parseFloat(orderFormData.unitPrice)) - (parseFloat(orderFormData.discount) || 0);
    
    const orderNumber = generateOrderNumber(orders);
    
    const newOrder: Order = {
      id: Date.now().toString(),
      orderNumber: orderNumber,
      invoiceNumber: "",
      deliveryNumber: "",
      client: orderFormData.clientName,
      clientType: orderFormData.clientType,
      saltType: orderFormData.saltType,
      quantity: parseFloat(orderFormData.quantity),
      unitPrice: parseFloat(orderFormData.unitPrice),
      discount: parseFloat(orderFormData.discount) || 0,
      totalAmount,
      deliveryDate: orderFormData.deliveryDate,
      paymentTerms: orderFormData.paymentTerms,
      notes: orderFormData.notes,
      date: new Date().toISOString().split('T')[0],
      validated: false,
      invoiced: false,
      invoiceValidated: false,
      paid: false,
      canBeDelivered: false,
      delivered: false
    };

    setOrders([...orders, newOrder]);
    toast({
      title: "Commande créée",
      description: `Commande ${orderNumber} pour ${orderFormData.clientName} d'un montant de ${totalAmount.toLocaleString()} FCFA`,
    });
    setIsNewOrderDialogOpen(false);
    setOrderFormData({
      clientId: "",
      clientName: "",
      clientType: "",
      saltType: "",
      quantity: "",
      unitPrice: "",
      discount: "",
      deliveryDate: "",
      paymentTerms: "",
      notes: ""
    });
  };

  const handleValidateOrder = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, validated: true } : order
    ));
    toast({
      title: "Commande validée",
      description: "La commande peut maintenant être facturée",
    });
  };

  const handleCreateInvoice = (order: Order) => {
    if (!order.validated) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "La commande doit être validée avant de créer une facture",
      });
      return;
    }
    setSelectedOrder(order);
    setIsInvoiceDialogOpen(true);
  };

  const handleInvoiceSubmit = () => {
    if (!selectedOrder) return;
    
    const invoiceNumber = generateInvoiceNumber();
    
    setOrders(orders.map(order => 
      order.id === selectedOrder.id ? { ...order, invoiced: true, invoiceNumber: invoiceNumber } : order
    ));
    toast({
      title: "Facture créée",
      description: `Facture ${invoiceNumber} générée avec succès`,
    });
    setIsInvoiceDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleValidateInvoice = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, invoiceValidated: true } : order
    ));
    toast({
      title: "Facture validée",
      description: "La facture est maintenant disponible dans Comptabilité pour le paiement",
    });
  };

  const handleDelivery = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order?.canBeDelivered) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "La commande n'est pas marquée comme pouvant être livrée",
      });
      return;
    }

    const deliveryNumber = generateDeliveryNumber();

    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, delivered: true, deliveryNumber: deliveryNumber } : o
    ));
    
    toast({
      title: "Livraison effectuée",
      description: `Livraison ${deliveryNumber} - Le stock a été automatiquement décrémenté`,
    });
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const clientNumber = generateClientNumber(clients);
    
    const newClient = {
      id: Date.now().toString(),
      clientNumber: clientNumber,
      name: clientFormData.name,
      type: clientFormData.type,
      email: clientFormData.email,
      phone: clientFormData.phone,
      address: clientFormData.address,
      totalOrders: 0,
      totalRevenue: 0,
      paymentTerms: clientFormData.paymentTerms,
      status: "actif"
    };

    setClients([...clients, newClient]);
    toast({
      title: "Client créé",
      description: `${clientFormData.name} (${clientNumber}) a été ajouté avec succès`,
    });
    setIsNewClientDialogOpen(false);
    setClientFormData({
      name: "",
      type: "",
      email: "",
      phone: "",
      address: "",
      paymentTerms: "",
      taxId: "",
      notes: ""
    });
  };

  const handleViewClientDetails = (client: any) => {
    setSelectedClient(client);
    setIsClientDetailsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6">
          {/* Dialog Nouvelle commande */}
          <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouvelle commande</DialogTitle>
                <DialogDescription>
                  Créer une nouvelle commande client
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleOrderSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientSelect">Client *</Label>
                  <Select 
                    value={orderFormData.clientId} 
                    onValueChange={handleClientSelect}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-popover">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientTypeDisplay">Type de client</Label>
                  <Input
                    id="clientTypeDisplay"
                    value={orderFormData.clientType === "local" ? "Local" : orderFormData.clientType === "export" ? "Export" : ""}
                    placeholder="Sélectionnez d'abord un client"
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saltType">Type de sel</Label>
                  <Select 
                    value={orderFormData.saltType} 
                    onValueChange={(value) => setOrderFormData({...orderFormData, saltType: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type de sel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sel gros">Sel gros</SelectItem>
                      <SelectItem value="Sel fin">Sel fin</SelectItem>
                      <SelectItem value="Sel iodé">Sel iodé</SelectItem>
                      <SelectItem value="Sel industriel">Sel industriel</SelectItem>
                      <SelectItem value="Sel export">Sel export</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantité (tonnes)</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.1"
                      value={orderFormData.quantity}
                      onChange={(e) => setOrderFormData({...orderFormData, quantity: e.target.value})}
                      placeholder="Ex: 50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Prix unitaire (FCFA/tonne)</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      value={orderFormData.unitPrice}
                      onChange={(e) => setOrderFormData({...orderFormData, unitPrice: e.target.value})}
                      placeholder="Ex: 150"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount">Remise (FCFA)</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      value={orderFormData.discount}
                      onChange={(e) => setOrderFormData({...orderFormData, discount: e.target.value})}
                      placeholder="Ex: 500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryDate">Date de livraison</Label>
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
                  <Label htmlFor="paymentTerms">Conditions de paiement</Label>
                  <Select 
                    value={orderFormData.paymentTerms} 
                    onValueChange={(value) => setOrderFormData({...orderFormData, paymentTerms: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner les conditions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comptant">Comptant</SelectItem>
                      <SelectItem value="30j">30 jours</SelectItem>
                      <SelectItem value="60j">60 jours</SelectItem>
                      <SelectItem value="90j">90 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderNotes">Notes (optionnel)</Label>
                  <Textarea
                    id="orderNotes"
                    value={orderFormData.notes}
                    onChange={(e) => setOrderFormData({...orderFormData, notes: e.target.value})}
                    placeholder="Informations complémentaires..."
                    rows={3}
                  />
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Montant total</span>
                    <span className="text-2xl font-bold text-primary">
                      {orderFormData.quantity && orderFormData.unitPrice 
                        ? ((parseFloat(orderFormData.quantity) * parseFloat(orderFormData.unitPrice)) - (parseFloat(orderFormData.discount) || 0)).toLocaleString()
                        : "0"} FCFA
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsNewOrderDialogOpen(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent">
                    Créer la commande
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog Facturation */}
          <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une facture</DialogTitle>
                <DialogDescription>
                  Générer la facture pour la commande
                </DialogDescription>
              </DialogHeader>
              {selectedOrder && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-semibold text-lg">{selectedOrder.client}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Quantité</Label>
                      <p className="font-medium">{selectedOrder.quantity} tonnes</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Montant</Label>
                      <p className="font-medium text-primary">{selectedOrder.totalAmount.toLocaleString()} FCFA</p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)} className="flex-1">
                      Annuler
                    </Button>
                    <Button onClick={handleInvoiceSubmit} className="flex-1 bg-gradient-to-r from-primary to-accent">
                      Générer la facture
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog Nouveau Client */}
          <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouveau client</DialogTitle>
                <DialogDescription>
                  Ajouter un nouveau client
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleClientSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientNameForm">Nom du client *</Label>
                  <Input
                    id="clientNameForm"
                    value={clientFormData.name}
                    onChange={(e) => setClientFormData({...clientFormData, name: e.target.value})}
                    placeholder="Ex: Grossiste Dakar"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientTypeForm">Type de client *</Label>
                  <Select 
                    value={clientFormData.type} 
                    onValueChange={(value) => setClientFormData({...clientFormData, type: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="export">Export</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Email *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientFormData.email}
                      onChange={(e) => setClientFormData({...clientFormData, email: e.target.value})}
                      placeholder="contact@client.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">Téléphone *</Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      value={clientFormData.phone}
                      onChange={(e) => setClientFormData({...clientFormData, phone: e.target.value})}
                      placeholder="+221 77 123 45 67"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Adresse</Label>
                  <Input
                    id="clientAddress"
                    value={clientFormData.address}
                    onChange={(e) => setClientFormData({...clientFormData, address: e.target.value})}
                    placeholder="Adresse complète"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientPaymentTerms">Conditions de paiement</Label>
                    <Select 
                      value={clientFormData.paymentTerms} 
                      onValueChange={(value) => setClientFormData({...clientFormData, paymentTerms: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comptant">Comptant</SelectItem>
                        <SelectItem value="30j">30 jours</SelectItem>
                        <SelectItem value="60j">60 jours</SelectItem>
                        <SelectItem value="90j">90 jours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientTaxId">N° fiscal</Label>
                    <Input
                      id="clientTaxId"
                      value={clientFormData.taxId}
                      onChange={(e) => setClientFormData({...clientFormData, taxId: e.target.value})}
                      placeholder="Numéro d'identification"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientNotes">Notes</Label>
                  <Textarea
                    id="clientNotes"
                    value={clientFormData.notes}
                    onChange={(e) => setClientFormData({...clientFormData, notes: e.target.value})}
                    placeholder="Informations complémentaires..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsNewClientDialogOpen(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent">
                    Créer le client
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog Détails Client */}
          <Dialog open={isClientDetailsDialogOpen} onOpenChange={setIsClientDetailsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Détails du client</DialogTitle>
                <DialogDescription>
                  Informations complètes du client
                </DialogDescription>
              </DialogHeader>
              {selectedClient && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-semibold text-lg">{selectedClient.name}</p>
                      <p className="text-sm text-muted-foreground mb-1">Client {selectedClient.clientNumber}</p>
                      <Badge variant="outline">
                        {selectedClient.type === "local" ? "Local" : "Export"}
                      </Badge>
                    </div>
                    <Badge variant={selectedClient.status === "actif" ? "default" : "outline"}>
                      {selectedClient.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedClient.email}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Téléphone</Label>
                      <p className="font-medium">{selectedClient.phone}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Adresse</Label>
                    <p className="font-medium">{selectedClient.address}</p>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-xs text-muted-foreground">Statistiques</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-sm">Total commandes</span>
                        <span className="text-sm font-medium">{selectedClient.totalOrders}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-sm">Chiffre d'affaires</span>
                        <span className="text-sm font-medium text-primary">{selectedClient.totalRevenue.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/20 rounded">
                        <span className="text-sm">Conditions de paiement</span>
                        <span className="text-sm font-medium">{selectedClient.paymentTerms}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsClientDetailsDialogOpen(false)} className="flex-1">
                      Fermer
                    </Button>
                    <Button className="flex-1 bg-gradient-to-r from-primary to-accent">
                      Modifier
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gestion Commerciale</h1>
              <p className="text-muted-foreground">
                Commande → Facturation → Livraison
              </p>
            </div>
          </div>

          <Tabs defaultValue="clients" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="clients" className="gap-2">
                <Users className="h-4 w-4" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="commandes" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Commandes
              </TabsTrigger>
              <TabsTrigger value="facturation" className="gap-2">
                <FileText className="h-4 w-4" />
                Facturation
              </TabsTrigger>
              <TabsTrigger value="livraison" className="gap-2">
                <Truck className="h-4 w-4" />
                Livraison
              </TabsTrigger>
            </TabsList>

            {/* Onglet Clients */}
            <TabsContent value="clients" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Liste des clients</CardTitle>
                    <Button onClick={() => setIsNewClientDialogOpen(true)} size="sm" className="gap-2 bg-gradient-to-r from-primary to-accent">
                      <Plus className="h-4 w-4" />
                      Nouveau client
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {clients.map((client) => (
                      <div key={client.id} className="p-4 border rounded-lg space-y-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-lg">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.clientNumber} - {client.email}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Badge variant="outline">
                              {client.type === "local" ? "Local" : "Export"}
                            </Badge>
                            <Badge variant={client.status === "actif" ? "default" : "outline"}>
                              {client.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Téléphone</p>
                            <p className="font-medium">{client.phone}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Commandes</p>
                            <p className="font-medium">{client.totalOrders}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">CA Total</p>
                            <p className="font-medium text-primary">{client.totalRevenue.toLocaleString()} FCFA</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Paiement</p>
                            <p className="font-medium">{client.paymentTerms}</p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleViewClientDetails(client)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          Voir détails
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Commandes */}
            <TabsContent value="commandes" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Liste des commandes</CardTitle>
                    <Button onClick={handleNewOrder} size="sm" className="gap-2 bg-gradient-to-r from-primary to-accent">
                      <Plus className="h-4 w-4" />
                      Nouvelle commande
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-lg">{order.client}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.invoiceNumber ? `Facture ${order.invoiceNumber}` : `Commande ${order.orderNumber}`} - {order.date}
                            </p>
                          </div>
                          <Badge variant={order.validated ? "default" : "outline"}>
                            {order.validated ? "Validée" : "En attente"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-medium">{order.saltType}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Quantité</p>
                            <p className="font-medium">{order.quantity} tonnes</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Montant</p>
                            <p className="font-medium text-primary">{order.totalAmount.toLocaleString()} FCFA</p>
                          </div>
                        </div>
                        {!order.validated && (
                          <Button 
                            onClick={() => handleValidateOrder(order.id)}
                            className="w-full bg-gradient-to-r from-primary to-accent"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Valider la commande
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Facturation */}
            <TabsContent value="facturation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Facturation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.filter(o => o.validated).map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">{order.client}</p>
                        <p className="text-sm text-muted-foreground">Commande {order.orderNumber} - {order.date}</p>
                      </div>
                          <div className="flex gap-2">
                            {order.invoiced && (
                              <Badge variant={order.invoiceValidated ? "default" : "outline"}>
                                {order.invoiceValidated ? "Validée" : "En attente"}
                              </Badge>
                            )}
                            {order.paid && (
                              <Badge variant="default" className="bg-green-600">
                                Payée
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Quantité</p>
                            <p className="font-medium">{order.quantity} tonnes</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Montant</p>
                            <p className="font-medium text-primary">{order.totalAmount.toLocaleString()} FCFA</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!order.invoiced && (
                            <Button 
                              onClick={() => handleCreateInvoice(order)}
                              className="flex-1 bg-gradient-to-r from-primary to-accent"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Créer facture
                            </Button>
                          )}
                          {order.invoiced && !order.invoiceValidated && (
                            <Button 
                              onClick={() => handleValidateInvoice(order.id)}
                              className="flex-1 bg-gradient-to-r from-primary to-accent"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Valider facture
                            </Button>
                          )}
                          {order.invoiceValidated && !order.paid && (
                            <Button 
                              disabled
                              variant="outline"
                              className="flex-1"
                            >
                              Paiement à effectuer dans Comptabilité
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {orders.filter(o => o.validated).length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Aucune commande validée à facturer
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Livraison */}
            <TabsContent value="livraison" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Livraisons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {deliverySales.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-lg">{order.client}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.deliveryNumber ? `Livraison ${order.deliveryNumber}` : `Facture ${order.invoiceNumber}`} - Prévue: {order.deliveryDate}
                            </p>
                          </div>
                          <Badge variant={order.delivered ? "default" : "outline"}>
                            {order.delivered ? "Livrée" : "À livrer"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-medium">{order.saltType}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Quantité</p>
                            <p className="font-medium">{order.quantity} tonnes</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Montant</p>
                            <p className="font-medium text-primary">{order.totalAmount.toLocaleString()} FCFA</p>
                          </div>
                        </div>
                        {!order.delivered && (
                          <Button 
                            onClick={() => markAsDeliveredMutation.mutate(order.id)}
                            className="w-full bg-gradient-to-r from-primary to-accent"
                            disabled={markAsDeliveredMutation.isPending}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            {markAsDeliveredMutation.isPending ? "Enregistrement..." : "Marquer comme livrée"}
                          </Button>
                        )}
                      </div>
                    ))}
                    {deliverySales.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Aucune commande prête à être livrée
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Commercial;
