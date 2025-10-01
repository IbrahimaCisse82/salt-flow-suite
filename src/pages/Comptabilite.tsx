import { useState, useEffect } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { BudgetTrackingTab } from "@/components/Campaign/BudgetTrackingTab";
import { 
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard
} from "lucide-react";

const expenseCategories = [
  {
    type: "Frais de maintenance",
    category: "Charges externes",
    account: "615 – Entretien et réparations",
    notes: "Pour machines, véhicules, bâtiments"
  },
  {
    type: "Voyage",
    category: "Charges externes",
    account: "618 – Déplacements, missions, réceptions",
    notes: "Inclut billets, hébergements"
  },
  {
    type: "Foire et atelier",
    category: "Charges externes",
    account: "618 – Publicité, publications, relations publiques",
    notes: "Participation salons, expositions"
  },
  {
    type: "Frais communication et marketing",
    category: "Charges externes",
    account: "618 – Publicité, communication",
    notes: "Campagnes médias, flyers, pub"
  },
  {
    type: "Achat fournitures de bureau",
    category: "Charges externes",
    account: "334 – Fournitures de bureau",
    notes: "Consommables de bureau"
  },
  {
    type: "Matériel informatique",
    category: "Immobilisations corporelles",
    account: "2442 – Matériel informatique",
    notes: "Ordinateurs, serveurs, imprimantes"
  },
  {
    type: "Achat camion",
    category: "Immobilisations corporelles",
    account: "2451 – Matériel automobile",
    notes: "Véhicule amortissable"
  },
  {
    type: "Électricité",
    category: "Charges externes",
    account: "611 – Électricité",
    notes: "Dépenses récurrentes"
  },
  {
    type: "Eau",
    category: "Charges externes",
    account: "612 – Eau",
    notes: "Dépenses récurrentes"
  },
  {
    type: "Internet",
    category: "Charges externes",
    account: "616 – Télécommunications",
    notes: "Abonnements internet"
  },
  {
    type: "Mobilier de bureau",
    category: "Immobilisations corporelles",
    account: "2444 – Mobilier de bureau",
    notes: "Tables, chaises, armoires"
  },
  {
    type: "Location bureau",
    category: "Charges externes",
    account: "616 – Loyers",
    notes: "Location immeuble / local"
  }
];

const Comptabilite = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<"depense" | "virement_interne" | "divers">("depense");
  const [paymentFormData, setPaymentFormData] = useState({
    accountId: "",
    paymentDate: "",
    amountReceived: "",
    canBeDelivered: false
  });

  // Récupérer les comptes depuis Supabase
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Récupérer les factures en attente depuis Supabase
  const { data: pendingInvoices = [] } = useQuery({
    queryKey: ['pending-invoices'],
    queryFn: async () => {
      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`
          *,
          client:clients(name, client_type)
        `)
        .order('sale_date', { ascending: false });
      
      if (error) throw error;
      
      return (salesData || []).map(sale => ({
        id: sale.id,
        invoiceNumber: sale.invoice_number || `INV-${sale.id.slice(0, 6)}`,
        clientName: sale.client?.name || 'N/A',
        clientType: sale.client?.client_type || 'local',
        invoiceDate: sale.sale_date,
        totalAmount: Number(sale.total_amount),
        amountPaid: Number(sale.amount_paid || 0),
        balance: Number(sale.total_amount) - Number(sale.amount_paid || 0),
        saltType: sale.salt_type,
        quantity: Number(sale.quantity),
        canBeDelivered: sale.can_be_delivered || false
      })).filter(invoice => invoice.balance > 0);
    }
  });

  // Récupérer les campagnes actives
  const { data: campagnes = [] } = useQuery({
    queryKey: ['campagnes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campagnes')
        .select('*')
        .order('year', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Récupérer les transactions récentes
  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          account:accounts(name),
          campagne:campagnes(name)
        `)
        .order('date', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      return (data || []).map(t => ({
        id: t.id,
        date: t.date,
        type: t.transaction_type,
        description: t.description,
        amount: Number(t.amount),
        account: t.account?.name || 'N/A',
        campagne: t.campagne?.name || null,
        campagnePhase: t.campagne_phase || null
      }));
    }
  });

  const totalBalance = accounts.reduce((sum: number, acc: any) => sum + Number(acc.balance || 0), 0);

  // Mutation pour enregistrer un paiement
  const recordPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const { sale_id, account_id, payment_date, amount, can_be_delivered } = paymentData;
      
      // Get tenant_id from profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile) throw new Error('Profile not found');
      
      // 1. Créer l'enregistrement de paiement
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          tenant_id: profile.tenant_id,
          sale_id,
          account_id,
          payment_date,
          amount: amount.toString(),
          payment_method: 'manual',
        });
      
      if (paymentError) throw paymentError;

      // 2. Mettre à jour la vente
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select('amount_paid, total_amount')
        .eq('id', sale_id)
        .single();
      
      if (saleError) throw saleError;

      const newAmountPaid = Number(saleData.amount_paid || 0) + Number(amount);
      const newBalance = Number(saleData.total_amount) - newAmountPaid;

      const { error: updateError } = await supabase
        .from('sales')
        .update({
          amount_paid: newAmountPaid,
          payment_status: newBalance <= 0 ? 'paid' : 'partial',
          can_be_delivered: can_be_delivered
        })
        .eq('id', sale_id);
      
      if (updateError) throw updateError;

      return { newBalance, newAmountPaid };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pending-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      
      toast({
        title: "Paiement enregistré",
        description: result.newBalance > 0 
          ? `Paiement enregistré. Reliquat: ${result.newBalance.toLocaleString()} FCFA`
          : `Paiement complet enregistré`,
      });
      
      setShowPaymentDialog(false);
      setSelectedInvoice(null);
      setPaymentFormData({
        accountId: "",
        paymentDate: "",
        amountReceived: "",
        canBeDelivered: false
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le paiement",
        variant: "destructive"
      });
      console.error('Payment error:', error);
    }
  });

  const handleAddAccount = () => {
    toast({
      title: "Compte ajouté",
      description: "Le nouveau compte a été créé avec succès",
    });
    setShowAccountDialog(false);
  };

  const handleAddTransaction = () => {
    toast({
      title: "Transaction enregistrée",
      description: "La transaction a été enregistrée avec succès",
    });
    setShowTransactionDialog(false);
  };

  const handlePaymentSubmit = () => {
    if (!selectedInvoice || !paymentFormData.accountId || !paymentFormData.paymentDate || !paymentFormData.amountReceived) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    const amountReceived = parseFloat(paymentFormData.amountReceived);
    
    if (amountReceived <= 0 || amountReceived > selectedInvoice.balance) {
      toast({
        title: "Erreur",
        description: "Le montant doit être positif et inférieur ou égal au solde restant",
        variant: "destructive"
      });
      return;
    }

    recordPaymentMutation.mutate({
      sale_id: selectedInvoice.id,
      account_id: paymentFormData.accountId,
      payment_date: paymentFormData.paymentDate,
      amount: amountReceived,
      can_be_delivered: paymentFormData.canBeDelivered
    });
  };

  const handleOpenPayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowPaymentDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Comptabilité</h1>
              <p className="text-muted-foreground">
                Gestion des comptes et transactions
              </p>
            </div>
            <Button 
              variant="outline"
              className="gap-2"
              onClick={() => setShowAccountDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Nouveau compte
            </Button>
          </div>

          {/* Vue d'ensemble des comptes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  Solde Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalBalance.toLocaleString()} FCFA</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Revenus du mois
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">350,000 FCFA</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-600">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Dépenses du mois
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">75,000 FCFA</p>
              </CardContent>
            </Card>
          </div>

          {/* Liste des comptes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Comptes bancaires et caisses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 rounded-lg bg-muted">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {account.account_type === "banque" ? (
                            <DollarSign className="h-5 w-5 text-primary" />
                          ) : (
                            <Wallet className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{account.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{account.account_type}</p>
                        </div>
                      </div>
                    <p className="text-lg font-bold">{account.balance.toLocaleString()} FCFA</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Onglets principaux */}
          <Tabs defaultValue="depenses" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="depenses">Dépenses</TabsTrigger>
              <TabsTrigger value="vente">Vente</TabsTrigger>
              <TabsTrigger value="virement">Virement interne</TabsTrigger>
              <TabsTrigger value="divers">Divers</TabsTrigger>
              <TabsTrigger value="suivi-budget">Suivi budgétaire</TabsTrigger>
            </TabsList>

            {/* Onglet Dépenses */}
            <TabsContent value="depenses" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Dépenses</h2>
                <Button 
                  className="gap-2 bg-gradient-to-r from-primary to-accent"
                  onClick={() => {
                    setTransactionType("depense");
                    setShowTransactionDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle transaction
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Transactions récentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTransactions.filter(t => t.type === "depense").map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.date} • {transaction.account}
                              {transaction.campagne && (
                                <>
                                  {' '}• {transaction.campagne}
                                  {transaction.campagnePhase && ` (${transaction.campagnePhase})`}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-red-600">
                          -{transaction.amount.toLocaleString()} FCFA
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Vente */}
            <TabsContent value="vente" className="space-y-4">
              <h2 className="text-xl font-semibold">Ventes</h2>

              <Tabs defaultValue="vente_locale">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="vente_locale">Vente Locale</TabsTrigger>
                  <TabsTrigger value="vente_export">Vente Export</TabsTrigger>
                </TabsList>

                <TabsContent value="vente_locale" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Factures en attente de paiement - Vente Locale</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {pendingInvoices.filter(inv => inv.clientType === "local" && inv.balance > 0).map((invoice) => (
                          <div key={invoice.id} className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{invoice.clientName}</p>
                                <p className="text-sm text-muted-foreground">Facture {invoice.id} - {invoice.invoiceDate}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Montant total</p>
                                <p className="font-medium">{invoice.totalAmount.toLocaleString()} FCFA</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Déjà payé</p>
                                <p className="font-medium text-green-600">{invoice.amountPaid.toLocaleString()} FCFA</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Reste à payer</p>
                                <p className="font-medium text-orange-600">{invoice.balance.toLocaleString()} FCFA</p>
                              </div>
                              <div className="flex items-end justify-end">
                                <Button 
                                  size="sm"
                                  onClick={() => handleOpenPayment(invoice)}
                                >
                                  Enregistrer un paiement
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="vente_export" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Factures en attente de paiement - Vente Export</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {pendingInvoices.filter(inv => inv.clientType === "export" && inv.balance > 0).map((invoice) => (
                          <div key={invoice.id} className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{invoice.clientName}</p>
                                <p className="text-sm text-muted-foreground">Facture {invoice.id} - {invoice.invoiceDate}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Montant total</p>
                                <p className="font-medium">{invoice.totalAmount.toLocaleString()} FCFA</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Déjà payé</p>
                                <p className="font-medium text-green-600">{invoice.amountPaid.toLocaleString()} FCFA</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Reste à payer</p>
                                <p className="font-medium text-orange-600">{invoice.balance.toLocaleString()} FCFA</p>
                              </div>
                              <div className="flex items-end justify-end">
                                <Button 
                                  size="sm"
                                  onClick={() => handleOpenPayment(invoice)}
                                >
                                  Enregistrer un paiement
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Onglet Virement interne */}
            <TabsContent value="virement" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Virements internes</h2>
                <Button 
                  className="gap-2 bg-gradient-to-r from-primary to-accent"
                  onClick={() => {
                    setTransactionType("virement_interne");
                    setShowTransactionDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle transaction
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Historique des virements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-muted-foreground text-center py-8">Aucun virement enregistré</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Divers */}
            <TabsContent value="divers" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Écritures diverses</h2>
                <Button 
                  className="gap-2 bg-gradient-to-r from-primary to-accent"
                  onClick={() => {
                    setTransactionType("divers");
                    setShowTransactionDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle transaction
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Régularisations comptables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-muted-foreground text-center py-8">Aucune écriture diverse enregistrée</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Suivi budgétaire */}
            <TabsContent value="suivi-budget" className="space-y-4">
              <BudgetTrackingTab />
            </TabsContent>
          </Tabs>

          {/* Dialog Nouveau Compte */}
          <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau compte</DialogTitle>
                <DialogDescription>
                  Ajoutez un compte bancaire ou une caisse
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account-name">Nom du compte</Label>
                  <Input id="account-name" placeholder="Ex: Banque Atlantique" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-type">Type de compte</Label>
                  <Select>
                    <SelectTrigger id="account-type">
                      <SelectValue placeholder="Sélectionnez le type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="banque">Banque</SelectItem>
                      <SelectItem value="caisse">Caisse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-number">Numéro de compte (optionnel)</Label>
                  <Input id="account-number" placeholder="Ex: 123456789" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initial-balance">Solde initial (FCFA)</Label>
                  <Input id="initial-balance" type="number" placeholder="0" />
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowAccountDialog(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-primary to-accent"
                    onClick={handleAddAccount}
                  >
                    Créer le compte
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog Nouvelle Transaction */}
          <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {transactionType === "depense" && "Enregistrer une dépense"}
                  {transactionType === "virement_interne" && "Enregistrer un virement interne"}
                  {transactionType === "divers" && "Enregistrer une écriture diverse"}
                </DialogTitle>
                <DialogDescription>
                  {transactionType === "depense" && "Ajoutez une nouvelle dépense"}
                  {transactionType === "virement_interne" && "Transférer des fonds entre comptes"}
                  {transactionType === "divers" && "Enregistrer une régularisation comptable"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {transactionType === "depense" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="depense-date">Date</Label>
                        <Input id="depense-date" type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="depense-account">Compte</Label>
                        <Select>
                          <SelectTrigger id="depense-account">
                            <SelectValue placeholder="Sélectionnez un compte" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="depense-campagne">Campagne (optionnel)</Label>
                        <Select>
                          <SelectTrigger id="depense-campagne">
                            <SelectValue placeholder="Sélectionnez une campagne" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="none">Aucune campagne</SelectItem>
                            {campagnes.map((campagne) => (
                              <SelectItem key={campagne.id} value={campagne.id}>
                                {campagne.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="depense-phase">Phase (optionnel)</Label>
                        <Select>
                          <SelectTrigger id="depense-phase">
                            <SelectValue placeholder="Sélectionnez une phase" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="preparation-bassins">Préparation des bassins</SelectItem>
                            <SelectItem value="mise-en-eau">Mise en eau</SelectItem>
                            <SelectItem value="evaporation">Évaporation</SelectItem>
                            <SelectItem value="recolte-principale">Récolte principale</SelectItem>
                            <SelectItem value="traitement-stockage">Traitement et stockage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depense-description">Type de dépense</Label>
                      <Select>
                        <SelectTrigger id="depense-description">
                          <SelectValue placeholder="Sélectionnez une catégorie de dépense" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {expenseCategories.map((expense) => (
                            <SelectItem key={expense.type} value={expense.type}>
                              <div className="flex flex-col">
                                <span className="font-medium">{expense.type}</span>
                                <span className="text-xs text-muted-foreground">{expense.account}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depense-amount">Montant (FCFA)</Label>
                      <Input id="depense-amount" type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depense-reference">Référence (optionnel)</Label>
                      <Input id="depense-reference" placeholder="Ex: Facture #123" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depense-notes">Notes (optionnel)</Label>
                      <Textarea id="depense-notes" placeholder="Notes supplémentaires..." />
                    </div>
                  </>
                )}

                {transactionType === "virement_interne" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="virement-date">Date</Label>
                      <Input id="virement-date" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="virement-from">Compte source</Label>
                      <Select>
                        <SelectTrigger id="virement-from">
                          <SelectValue placeholder="Sélectionnez le compte source" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} ({account.balance.toLocaleString()} FCFA)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="virement-to">Compte destination</Label>
                      <Select>
                        <SelectTrigger id="virement-to">
                          <SelectValue placeholder="Sélectionnez le compte destination" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="virement-amount">Montant (FCFA)</Label>
                      <Input id="virement-amount" type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="virement-notes">Notes (optionnel)</Label>
                      <Textarea id="virement-notes" placeholder="Notes supplémentaires..." />
                    </div>
                  </>
                )}

                {transactionType === "divers" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="divers-date">Date</Label>
                        <Input id="divers-date" type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="divers-account">Compte</Label>
                        <Select>
                          <SelectTrigger id="divers-account">
                            <SelectValue placeholder="Sélectionnez un compte" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="divers-type">Type d'écriture</Label>
                      <Select>
                        <SelectTrigger id="divers-type">
                          <SelectValue placeholder="Sélectionnez le type" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="correction">Correction d'erreur</SelectItem>
                          <SelectItem value="ajustement">Ajustement de solde</SelectItem>
                          <SelectItem value="provision">Provision</SelectItem>
                          <SelectItem value="depreciation">Amortissement</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="divers-description">Description</Label>
                      <Input id="divers-description" placeholder="Description de la régularisation" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="divers-amount">Montant (FCFA)</Label>
                      <Input id="divers-amount" type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="divers-notes">Notes (optionnel)</Label>
                      <Textarea id="divers-notes" placeholder="Notes supplémentaires..." />
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowTransactionDialog(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-primary to-accent"
                    onClick={handleAddTransaction}
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog Enregistrement de Paiement */}
          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Enregistrer un paiement</DialogTitle>
                <DialogDescription>
                  Enregistrez le paiement reçu pour cette facture
                </DialogDescription>
              </DialogHeader>
              {selectedInvoice && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-semibold text-lg">{selectedInvoice.clientName}</p>
                    <p className="text-xs text-muted-foreground mt-1">Facture {selectedInvoice.id}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-primary/10 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Montant total</p>
                      <p className="text-lg font-bold">{selectedInvoice.totalAmount.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reste à payer</p>
                      <p className="text-lg font-bold text-primary">{selectedInvoice.balance.toLocaleString()} FCFA</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment-account">Compte de paiement *</Label>
                    <Select
                      value={paymentFormData.accountId}
                      onValueChange={(value) => setPaymentFormData({...paymentFormData, accountId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Banque ou Caisse" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} ({account.account_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment-date">Date de paiement *</Label>
                    <Input
                      id="payment-date"
                      type="date"
                      value={paymentFormData.paymentDate}
                      onChange={(e) => setPaymentFormData({...paymentFormData, paymentDate: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount-received">Montant reçu (FCFA) *</Label>
                    <Input
                      id="amount-received"
                      type="number"
                      placeholder="0"
                      value={paymentFormData.amountReceived}
                      onChange={(e) => setPaymentFormData({...paymentFormData, amountReceived: e.target.value})}
                    />
                  </div>

                  {paymentFormData.amountReceived && parseFloat(paymentFormData.amountReceived) < selectedInvoice.balance && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800">Reliquat</p>
                      <p className="text-lg font-bold text-yellow-900">
                        {(selectedInvoice.balance - parseFloat(paymentFormData.amountReceived)).toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Ce montant restera en suspens en comptabilité
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <Checkbox 
                      id="can-deliver" 
                      checked={paymentFormData.canBeDelivered}
                      onCheckedChange={(checked) => setPaymentFormData({...paymentFormData, canBeDelivered: checked as boolean})}
                    />
                    <label
                      htmlFor="can-deliver"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Peut être livrée (même avec reliquat)
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowPaymentDialog(false)} 
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button 
                      onClick={handlePaymentSubmit}
                      className="flex-1 bg-gradient-to-r from-primary to-accent"
                      disabled={!paymentFormData.accountId || !paymentFormData.paymentDate || !paymentFormData.amountReceived}
                    >
                      Enregistrer le paiement
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default Comptabilite;
