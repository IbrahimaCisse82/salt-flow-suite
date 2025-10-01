import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
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
import { 
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard
} from "lucide-react";

const expenseCategories = [
  "Frais journaliers",
  "Frais employés contractants",
  "Carburant",
  "Motopompes",
  "Machines de broyage",
  "Machine de lavage",
  "Machine d'iodation",
  "Matériel de création de digues",
  "EPI",
  "Repas",
  "Transport",
  "Téléphone",
  "Tracteurs",
  "Pelles",
  "Brouettes",
  "Sacs",
  "Balance",
  "Testeur",
  "Location de marais salants",
  "Achat de marais salants",
];

const Comptabilite = () => {
  const { toast } = useToast();
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<"depense" | "vente_locale" | "vente_export">("depense");
  const [paymentFormData, setPaymentFormData] = useState({
    accountId: "",
    paymentDate: "",
    amountReceived: "",
    canBeDelivered: false
  });

  // Mock data - À remplacer par des données Supabase
  const accounts = [
    { id: "1", name: "Banque Atlantique", type: "banque", balance: 1500000 },
    { id: "2", name: "Caisse Principale", type: "caisse", balance: 250000 },
  ];

  // Factures en attente de paiement (venant de Commercial)
  const pendingInvoices = [
    {
      id: "INV-001",
      clientName: "Grossiste Dakar",
      clientType: "local",
      invoiceDate: "2025-03-15",
      totalAmount: 7500000,
      amountPaid: 0,
      balance: 7500000,
      saltType: "Sel gros",
      quantity: 50
    },
    {
      id: "INV-002",
      clientName: "Export Maroc",
      clientType: "export",
      invoiceDate: "2025-03-14",
      totalAmount: 12000000,
      amountPaid: 5000000,
      balance: 7000000,
      saltType: "Sel iodé",
      quantity: 80
    }
  ];

  const recentTransactions = [
    { id: "1", date: "2025-01-15", type: "depense", description: "Carburant", amount: 50000, account: "Caisse Principale" },
    { id: "2", date: "2025-01-14", type: "vente_locale", description: "Sel gros", amount: 350000, account: "Banque Atlantique" },
    { id: "3", date: "2025-01-13", type: "depense", description: "Frais journaliers", amount: 25000, account: "Caisse Principale" },
  ];

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

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
    if (!selectedInvoice) return;

    const amountReceived = parseFloat(paymentFormData.amountReceived);
    const balance = selectedInvoice.balance - amountReceived;

    toast({
      title: "Paiement enregistré",
      description: balance > 0 
        ? `Paiement de ${amountReceived.toLocaleString()} FCFA enregistré. Reliquat: ${balance.toLocaleString()} FCFA`
        : `Paiement complet de ${amountReceived.toLocaleString()} FCFA enregistré`,
    });

    setShowPaymentDialog(false);
    setSelectedInvoice(null);
    setPaymentFormData({
      accountId: "",
      paymentDate: "",
      amountReceived: "",
      canBeDelivered: false
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
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="gap-2"
                onClick={() => setShowAccountDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Nouveau compte
              </Button>
              <Button 
                className="gap-2 bg-gradient-to-r from-primary to-accent"
                onClick={() => setShowTransactionDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Nouvelle transaction
              </Button>
            </div>
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
                        {account.type === "banque" ? (
                          <DollarSign className="h-5 w-5 text-primary" />
                        ) : (
                          <Wallet className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{account.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{account.type}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold">{account.balance.toLocaleString()} FCFA</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transactions récentes */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.type === "depense" ? "bg-red-100" : "bg-green-100"
                      }`}>
                        {transaction.type === "depense" ? (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.date} • {transaction.account}
                        </p>
                      </div>
                    </div>
                    <p className={`text-lg font-bold ${
                      transaction.type === "depense" ? "text-red-600" : "text-green-600"
                    }`}>
                      {transaction.type === "depense" ? "-" : "+"}{transaction.amount.toLocaleString()} FCFA
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                <DialogTitle>Enregistrer une transaction</DialogTitle>
                <DialogDescription>
                  Ajoutez une dépense ou une vente
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="depense" onValueChange={(value) => setTransactionType(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="depense">Dépense</TabsTrigger>
                  <TabsTrigger value="vente_locale">Vente Locale</TabsTrigger>
                  <TabsTrigger value="vente_export">Vente Export</TabsTrigger>
                </TabsList>

                <TabsContent value="depense" className="space-y-4">
                  <div className="space-y-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="depense-description">Description</Label>
                      <Select>
                        <SelectTrigger id="depense-description">
                          <SelectValue placeholder="Sélectionnez une catégorie de dépense" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {expenseCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
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
                  </div>
                </TabsContent>

                <TabsContent value="vente_locale" className="space-y-4">
                  <div className="space-y-6">
                    {/* Factures en attente */}
                    <div>
                      <h3 className="font-semibold mb-3">Factures en attente de paiement</h3>
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
                                <p className="font-medium text-primary">{invoice.balance.toLocaleString()} FCFA</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Produit</p>
                                <p className="font-medium">{invoice.saltType} ({invoice.quantity}t)</p>
                              </div>
                            </div>
                            <Button 
                              onClick={() => handleOpenPayment(invoice)}
                              className="w-full bg-gradient-to-r from-primary to-accent"
                              size="sm"
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Enregistrer un paiement
                            </Button>
                          </div>
                        ))}
                        {pendingInvoices.filter(inv => inv.clientType === "local" && inv.balance > 0).length === 0 && (
                          <p className="text-center text-muted-foreground py-4">Aucune facture en attente</p>
                        )}
                      </div>
                    </div>

                    {/* Formulaire de transaction manuelle */}
                    <div className="pt-6 border-t">
                      <h3 className="font-semibold mb-3">Enregistrer une transaction manuelle</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="vente-locale-date">Date</Label>
                            <Input id="vente-locale-date" type="date" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vente-locale-account">Compte</Label>
                            <Select>
                              <SelectTrigger id="vente-locale-account">
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
                          <Label htmlFor="vente-locale-description">Description</Label>
                          <Input id="vente-locale-description" placeholder="Ex: Vente sel gros - Client ABC" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vente-locale-amount">Montant (FCFA)</Label>
                          <Input id="vente-locale-amount" type="number" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vente-locale-reference">Référence (optionnel)</Label>
                          <Input id="vente-locale-reference" placeholder="Ex: Facture #123" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vente-locale-notes">Notes (optionnel)</Label>
                          <Textarea id="vente-locale-notes" placeholder="Notes supplémentaires..." />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="vente_export" className="space-y-4">
                  <div className="space-y-6">
                    {/* Factures en attente */}
                    <div>
                      <h3 className="font-semibold mb-3">Factures en attente de paiement</h3>
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
                                <p className="font-medium text-primary">{invoice.balance.toLocaleString()} FCFA</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Produit</p>
                                <p className="font-medium">{invoice.saltType} ({invoice.quantity}t)</p>
                              </div>
                            </div>
                            <Button 
                              onClick={() => handleOpenPayment(invoice)}
                              className="w-full bg-gradient-to-r from-primary to-accent"
                              size="sm"
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Enregistrer un paiement
                            </Button>
                          </div>
                        ))}
                        {pendingInvoices.filter(inv => inv.clientType === "export" && inv.balance > 0).length === 0 && (
                          <p className="text-center text-muted-foreground py-4">Aucune facture en attente</p>
                        )}
                      </div>
                    </div>

                    {/* Formulaire de transaction manuelle */}
                    <div className="pt-6 border-t">
                      <h3 className="font-semibold mb-3">Enregistrer une transaction manuelle</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="vente-export-date">Date</Label>
                            <Input id="vente-export-date" type="date" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vente-export-account">Compte</Label>
                            <Select>
                              <SelectTrigger id="vente-export-account">
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
                          <Label htmlFor="vente-export-description">Description</Label>
                          <Input id="vente-export-description" placeholder="Ex: Vente sel export - Client XYZ" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vente-export-amount">Montant (FCFA)</Label>
                          <Input id="vente-export-amount" type="number" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vente-export-reference">Référence (optionnel)</Label>
                          <Input id="vente-export-reference" placeholder="Ex: Facture #123" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vente-export-notes">Notes (optionnel)</Label>
                          <Textarea id="vente-export-notes" placeholder="Notes supplémentaires..." />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

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
              </Tabs>
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
                            {account.name} ({account.type})
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
