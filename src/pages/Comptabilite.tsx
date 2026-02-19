import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Breadcrumbs } from "@/components/Layout/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { logger } from "@/utils/logger";
import { TableSkeleton } from "@/components/LoadingSkeletons/TableSkeleton";
import { ListSkeleton } from "@/components/LoadingSkeletons/ListSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
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
import { JournalEntryForm } from "@/components/Accounting/JournalEntryForm";
import { ChartOfAccountsTable } from "@/components/Accounting/ChartOfAccountsTable";
import { AccountantNotificationWidget } from "@/components/Payroll/AccountantNotificationWidget";
import { PayrollPaymentForm } from "@/components/Payroll/PayrollPaymentForm";
import { BankReconciliation } from "@/components/Accounting/BankReconciliation";
import { GeneralLedger } from "@/components/Accounting/GeneralLedger";
import { AccountingFlowDiagram } from "@/components/Accounting/AccountingFlowDiagram";
import { PurchasePaymentsTab } from "@/components/Accounting/PurchasePaymentsTab";
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  FileText,
  Package,
  BookOpen
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useAuth } from "@/contexts/AuthContext";


const Comptabilite = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isOpen } = useSidebar();
  const { profile } = useAuth();
  const { purchaseOrders, isLoading: purchaseOrdersLoading } = usePurchaseOrders();
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<"achat" | "salaire" | "virement_interne" | "divers">("achat");
  const [paymentFormData, setPaymentFormData] = useState({
    accountId: "",
    paymentDate: "",
    amountReceived: "",
    canBeDelivered: false
  });
  
  // État pour le formulaire de création de compte
  const [newAccountData, setNewAccountData] = useState({
    accountName: "",
    accountType: "",
    accountNumber: "",
    initialBalance: "0"
  });
  
  // État pour le formulaire d'achat (anciennement dépense)
  const [expenseFormData, setExpenseFormData] = useState({
    date: "",
    accountId: "",
    campagneId: "",
    campagnePhase: "",
    expenseTypeId: "",
    description: "",
    amount: "",
    reference: "",
    notes: ""
  });

  // État pour le formulaire de salaire
  const [salaryFormData, setSalaryFormData] = useState({
    date: "",
    accountId: "",
    employeeType: "" as "permanent" | "saisonnier" | "journalier" | "",
    employeeId: "",
    amount: "",
    period: "",
    notes: ""
  });
  
  // État pour le formulaire de virement
  const [virementFormData, setVirementFormData] = useState({
    date: "",
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    notes: ""
  });

  // Récupérer les types de dépenses
  const { data: expenseTypes = [], isLoading: expenseTypesLoading } = useQuery({
    queryKey: ['expense-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        logger.error('Error fetching expense types:', error);
        throw error;
      }
      logger.info('Expense types loaded:', data?.length || 0);
      return data || [];
    }
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: dailyWorkers = [] } = useQuery({
    queryKey: ['daily-workers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_workers')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Récupérer les comptes depuis Supabase
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('account_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Récupérer les factures en attente depuis Supabase
  const { data: pendingInvoices = [], isLoading: invoicesLoading } = useQuery({
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
  const { data: recentTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          campagne:campagnes(name)
        `)
        .order('transaction_date', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      return (data || []).map(t => ({
        id: t.id,
        date: t.transaction_date,
        type: t.transaction_type,
        description: t.description,
        amount: Number(t.amount),
        account: 'N/A',
        campagne: t.campagne?.name || null,
        campagnePhase: t.campagne_phase || null
      }));
    }
  });

  // Récupérer les écritures diverses avec leurs lignes
  const { data: diversEntries = [] } = useQuery({
    queryKey: ['divers-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          journal_entries:journal_entries(
            *,
            account:chart_of_accounts(account_number, account_name)
          )
        `)
        .eq('transaction_type', 'divers' as any)
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const totalBalance = accounts.reduce((sum: number, acc: any) => sum + Number(acc.balance || 0), 0);

  // Récupérer les transactions du mois en cours pour les KPIs
  const { data: monthlyTransactions = [] } = useQuery({
    queryKey: ['monthly-transactions'],
    queryFn: async () => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('transaction_type, amount')
        .gte('transaction_date', firstDay)
        .lte('transaction_date', lastDay);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calculer les revenus du mois (encaissements : ventes, recettes)
  const monthlyRevenue = monthlyTransactions
    .filter((t: any) => ['vente_locale', 'vente_export', 'recette'].includes(t.transaction_type))
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  // Calculer les dépenses du mois (décaissements : dépenses, salaires, achats)
  const monthlyExpenses = monthlyTransactions
    .filter((t: any) => ['depense', 'salaire', 'achat'].includes(t.transaction_type))
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

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
      
      // Récupérer la vente pour connaître le type de client
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select('amount_paid, total_amount, client:clients(client_type)')
        .eq('id', sale_id)
        .single();
      
      if (saleError) throw saleError;

      // 1. Créer l'enregistrement de paiement
      // Insérer dans la table payments avec les bonnes colonnes
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          tenant_id: profile.tenant_id,
          facture_id: sale_id,  // La colonne s'appelle facture_id, pas sale_id
          payment_date,
          amount: Number(amount),
          payment_method: 'manual',
          notes: `Compte: ${account_id}` // On stocke l'account_id dans les notes pour référence
        });
      
      if (paymentError) throw paymentError;

      // 2. Mettre à jour la vente
      const newAmountPaid = Number(saleData.amount_paid || 0) + Number(amount);
      const newBalance = Number(saleData.total_amount) - newAmountPaid;

      // Déterminer le nouveau statut de vente:
      // Si can_be_delivered est true, passer à 'delivered' pour déclencher le trigger de stock
      const newSaleStatus = can_be_delivered ? 'delivered' : 'invoiced';

      const { error: updateError } = await supabase
        .from('sales')
        .update({
          amount_paid: newAmountPaid,
          payment_status: newBalance <= 0 ? 'paid' : 'partial',
          can_be_delivered: can_be_delivered,
          sale_status: newSaleStatus  // Mettre à jour le statut pour déclencher le trigger stock
        })
        .eq('id', sale_id);
      
      if (updateError) throw updateError;

      // 3. Générer le numéro de document avec code journal VTE
      const clientType = saleData.client?.client_type || 'local';
      const transactionType = clientType === 'local' ? 'vente_locale' : 'vente_export';
      const journalCode = 'VTE';
      const dateFormatted = payment_date.replace(/-/g, '');
      
      // Compter les transactions du même type pour la même date
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: false })
        .eq('tenant_id', profile.tenant_id)
        .eq('journal_code', journalCode)
        .eq('transaction_date', payment_date);
      
      const sequenceNumber = String((existingTx?.length || 0) + 1).padStart(3, '0');
      const documentNumber = `${journalCode}${dateFormatted}${sequenceNumber}`;
      
      // 4. Créer une transaction pour enregistrer la vente
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          tenant_id: profile.tenant_id,
          account_id: account_id,
          transaction_type: transactionType,
          journal_code: journalCode,
          transaction_date: payment_date,  // Correction: c'est transaction_date, pas date
          amount: amount,
          description: `Vente ${clientType === 'local' ? 'locale' : 'export'}`,
          reference: documentNumber
        } as any)
        .select()
        .single();

      if (txError) throw txError;

      // 4b. Mettre à jour le solde du compte (banque/caisse)
      const { data: currentAccount } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', account_id)
        .single();
      
      const { error: balanceError } = await supabase
        .from('accounts')
        .update({ 
          balance: (Number(currentAccount?.balance) || 0) + Number(amount), 
          updated_at: new Date().toISOString() 
        })
        .eq('id', account_id);
      
      if (balanceError) console.warn('Erreur mise à jour solde:', balanceError);

      // 5. Trouver le compte de produits approprié (701 pour local, 702 pour export)
      // Utiliser ilike avec % pour trouver un compte commençant par 701 ou 702
      const productAccountNumber = clientType === 'local' ? '701' : '702';
      const { data: productAccount } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .ilike('account_number', `${productAccountNumber}%`)
        .limit(1)
        .maybeSingle();

      // Si pas de compte trouvé, on continue sans écritures comptables détaillées
      // (l'essentiel est que le paiement soit enregistré)
      let productAccountId = productAccount?.id;

      // 6. Créer les écritures comptables (double entrée) - seulement si compte produit trouvé
      if (productAccountId) {
        const journalEntries = [
          {
            transaction_id: transaction.id,
            account_id: account_id,
            debit: amount,
            credit: 0,
            description: `Encaissement vente ${clientType === 'local' ? 'locale' : 'export'}`
          },
          {
            transaction_id: transaction.id,
            account_id: productAccountId,
            debit: 0,
            credit: amount,
            description: `Vente ${clientType === 'local' ? 'locale' : 'export'}`
          }
        ];

        const { error: entriesError } = await supabase
          .from('journal_entries')
          .insert(journalEntries as any);

        if (entriesError) {
          console.warn('Erreur écritures comptables:', entriesError);
        }
      }

      return { newBalance, newAmountPaid };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pending-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
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
      logger.error('Payment error:', error);
    }
  });

  // Mutation pour créer un compte avec transaction initiale si solde > 0
  const createAccountMutation = useMutation({
    mutationFn: async (formData: typeof newAccountData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profileData?.tenant_id) throw new Error('Tenant not found');
      
      const balance = parseFloat(formData.initialBalance) || 0;
      
      // Générer un numéro de compte par défaut si non fourni
      const accountNumber = formData.accountNumber || 
        `${formData.accountType === 'banque' ? 'BQ' : 'CA'}-${Date.now().toString().slice(-8)}`;
      
      // 1. Créer le compte
      const { data: newAccount, error } = await supabase
        .from('accounts')
        .insert({
          tenant_id: profileData.tenant_id,
          account_name: formData.accountName,
          account_type: formData.accountType,
          account_number: accountNumber,
          balance: balance
        })
        .select()
        .single();
      
      if (error) throw error;

      // 2. Si solde initial > 0, créer une transaction de solde initial
      if (balance > 0) {
        const today = new Date().toISOString().split('T')[0];
        const journalCode = 'OUV'; // Ouverture
        const dateFormatted = today.replace(/-/g, '');
        
        // Compter les transactions existantes pour générer le numéro
        const { data: existingTx } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: false })
          .eq('tenant_id', profileData.tenant_id)
          .eq('journal_code', journalCode)
          .eq('transaction_date', today);
        
        const sequenceNumber = String((existingTx?.length || 0) + 1).padStart(3, '0');
        const documentNumber = `${journalCode}${dateFormatted}${sequenceNumber}`;

        // Créer la transaction de solde initial
        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            tenant_id: profileData.tenant_id,
            account_id: newAccount.id,
            transaction_type: 'recette',
            journal_code: journalCode,
            transaction_date: today,
            amount: balance,
            description: `Solde initial - ${formData.accountName}`,
            reference: documentNumber,
            notes: `Solde d'ouverture du compte ${formData.accountType === 'banque' ? 'bancaire' : 'caisse'}`
          } as any);

        if (txError) {
          logger.error('Error creating initial balance transaction:', txError);
          // Ne pas faire échouer la création du compte
        }
      }
      
      return newAccount;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      const balance = parseFloat(newAccountData.initialBalance) || 0;
      toast({
        title: "Compte ajouté",
        description: balance > 0 
          ? `Le compte a été créé avec un solde initial de ${balance.toLocaleString()} FCFA`
          : "Le nouveau compte a été créé avec succès",
      });
      setShowAccountDialog(false);
      setNewAccountData({
        accountName: "",
        accountType: "",
        accountNumber: "",
        initialBalance: "0"
      });
    },
    onError: (error) => {
      logger.error('Error creating account:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le compte",
        variant: "destructive"
      });
    }
  });

  const handleAddAccount = () => {
    if (!newAccountData.accountName || !newAccountData.accountType) {
      toast({
        title: "Champs requis",
        description: "Veuillez renseigner le nom et le type de compte",
        variant: "destructive"
      });
      return;
    }
    createAccountMutation.mutate(newAccountData);
  };


  // Mutation pour créer un achat (anciennement dépense) avec écritures comptables
  const createExpenseMutation = useMutation({
    mutationFn: async (formData: typeof expenseFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile) throw new Error('Profile not found');

      const amount = parseFloat(formData.amount);
      if (!amount || amount <= 0) throw new Error('Montant invalide');

      // 1. Récupérer le type de dépense et son compte comptable associé
      const { data: expenseType, error: expenseTypeError } = await supabase
        .from('expense_types')
        .select('*, account_id, name')
        .eq('id', formData.expenseTypeId)
        .single();

      if (expenseTypeError || !expenseType) throw new Error('Type de dépense introuvable');
      if (!expenseType.account_id) throw new Error('Aucun compte comptable associé à ce type de dépense');

      // 2. Générer le numéro de document avec code journal ACH
      const journalCode = 'ACH';
      const dateFormatted = formData.date.replace(/-/g, '');
      
      // Compter les transactions du même type pour la même date
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: false })
        .eq('tenant_id', profile.tenant_id)
        .eq('journal_code', journalCode)
        .eq('transaction_date', formData.date);
      
      const sequenceNumber = String((existingTx?.length || 0) + 1).padStart(3, '0');
      const documentNumber = `${journalCode}${dateFormatted}${sequenceNumber}`;

      // 3. Créer la transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          tenant_id: profile.tenant_id,
          account_id: formData.accountId,
          transaction_type: 'depense',
          journal_code: journalCode,
          transaction_date: formData.date,
          amount: amount,
          description: formData.description,
          reference: documentNumber,
          notes: formData.notes || null,
          campagne_id: formData.campagneId && formData.campagneId !== 'none' ? formData.campagneId : null,
          campagne_phase: formData.campagnePhase || null
        } as any)
        .select()
        .single();

      if (txError) throw txError;

      // 4. Créer les écritures comptables (double entrée)
      const journalEntries = [
        {
          tenant_id: profile.tenant_id,
          transaction_id: transaction.id,
          account_id: expenseType.account_id,
          debit: amount,
          credit: 0,
          description: `${expenseType.name}: ${formData.description}`
        },
        {
          tenant_id: profile.tenant_id,
          transaction_id: transaction.id,
          account_id: formData.accountId,
          debit: 0,
          credit: amount,
          description: `Paiement: ${expenseType.name}`
        }
      ];

      const { error: entriesError } = await supabase
        .from('journal_entries')
        .insert(journalEntries as any);

      if (entriesError) throw entriesError;

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({
        title: "Achat enregistré",
        description: "L'achat et ses écritures comptables ont été enregistrés",
      });
      setShowTransactionDialog(false);
      setExpenseFormData({
        date: "",
        accountId: "",
        campagneId: "",
        campagnePhase: "",
        expenseTypeId: "",
        description: "",
        amount: "",
        reference: "",
        notes: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation pour créer un paiement de salaire
  const createSalaryMutation = useMutation({
    mutationFn: async (formData: typeof salaryFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile) throw new Error('Profile not found');

      const amount = parseFloat(formData.amount);
      if (!amount || amount <= 0) throw new Error('Montant invalide');

      // 1. Trouver le compte comptable de charge de personnel (661 - Salaires)
      const { data: salaryAccount } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('account_number', '661')
        .maybeSingle();

      if (!salaryAccount) throw new Error('Compte 661 (Salaires) introuvable dans le plan comptable');

      // 2. Générer le numéro de document avec code journal SAL
      const journalCode = 'SAL';
      const dateFormatted = formData.date.replace(/-/g, '');
      
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: false })
        .eq('tenant_id', profile.tenant_id)
        .eq('journal_code', journalCode)
        .eq('transaction_date', formData.date);
      
      const sequenceNumber = String((existingTx?.length || 0) + 1).padStart(3, '0');
      const documentNumber = `${journalCode}${dateFormatted}${sequenceNumber}`;

      // 3. Récupérer le nom de l'employé/journalier
      let employeeName = '';
      if (formData.employeeType === 'journalier') {
        const worker = dailyWorkers.find(w => w.id === formData.employeeId);
        employeeName = worker ? worker.full_name : 'Journalier';
      } else {
        const emp = employees.find(e => e.id === formData.employeeId);
        employeeName = emp ? emp.full_name : 'Employé';
      }

      const employeeTypeLabel = 
        formData.employeeType === 'permanent' ? 'Permanent' :
        formData.employeeType === 'saisonnier' ? 'Saisonnier' :
        'Journalier';

      // 4. Créer la transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          tenant_id: profile.tenant_id,
          account_id: formData.accountId,
          transaction_type: 'depense',
          journal_code: journalCode,
          transaction_date: formData.date,
          amount: amount,
          description: `Salaire ${employeeTypeLabel} - ${employeeName}`,
          reference: documentNumber,
          notes: formData.notes || null
        } as any)
        .select()
        .single();

      if (txError) throw txError;

      // 5. Créer les écritures comptables (double entrée)
      const journalEntries = [
        {
          transaction_id: transaction.id,
          account_id: salaryAccount.id,
          debit: amount,
          credit: 0,
          description: `Salaire ${employeeTypeLabel} - ${employeeName} - ${formData.period}`
        },
        {
          transaction_id: transaction.id,
          account_id: formData.accountId,
          debit: 0,
          credit: amount,
          description: `Paiement salaire - ${employeeName}`
        }
      ];

      const { error: entriesError } = await supabase
        .from('journal_entries')
        .insert(journalEntries as any);

      if (entriesError) throw entriesError;

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Salaire enregistré",
        description: "Le paiement de salaire et ses écritures comptables ont été enregistrés",
      });
      setShowTransactionDialog(false);
      setSalaryFormData({
        date: "",
        accountId: "",
        employeeType: "",
        employeeId: "",
        amount: "",
        period: "",
        notes: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation pour créer un virement avec écritures comptables
  const createVirementMutation = useMutation({
    mutationFn: async (formData: typeof virementFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile) throw new Error('Profile not found');

      const amount = parseFloat(formData.amount);
      if (!amount || amount <= 0) throw new Error('Montant invalide');
      if (formData.fromAccountId === formData.toAccountId) throw new Error('Les comptes source et destination doivent être différents');

      // 1. Générer le numéro de document avec code journal OD
      const journalCode = 'OD';
      const dateFormatted = formData.date.replace(/-/g, '');
      
      // Compter les transactions du même type pour la même date
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: false })
        .eq('tenant_id', profile.tenant_id)
        .eq('journal_code', journalCode)
        .eq('transaction_date', formData.date);
      
      const sequenceNumber = String((existingTx?.length || 0) + 1).padStart(3, '0');
      const documentNumber = `${journalCode}${dateFormatted}${sequenceNumber}`;

      // Resolve account details from accounts table
      const fromAccount = accounts.find(a => a.id === formData.fromAccountId);
      const toAccount = accounts.find(a => a.id === formData.toAccountId);
      if (!fromAccount || !toAccount) throw new Error('Comptes introuvables');

      // 2. Créer la transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          tenant_id: profile.tenant_id,
          account_id: formData.fromAccountId,
          transaction_type: 'virement_interne',
          journal_code: journalCode,
          transaction_date: formData.date,
          amount: amount,
          description: 'Virement interne',
          reference: documentNumber,
          notes: formData.notes || null
        } as any)
        .select()
        .single();

      if (txError) throw txError;

      // 3. Créer les écritures comptables (using account_number/account_name, NOT account_id which references chart_of_accounts)
      const journalEntries = [
        {
          transaction_id: transaction.id,
          account_number: toAccount.account_number,
          account_name: toAccount.account_name,
          debit: amount,
          credit: 0,
          description: 'Virement reçu'
        },
        {
          transaction_id: transaction.id,
          account_number: fromAccount.account_number,
          account_name: fromAccount.account_name,
          debit: 0,
          credit: amount,
          description: 'Virement envoyé'
        }
      ];

      const { error: entriesError } = await supabase
        .from('journal_entries')
        .insert(journalEntries as any);

      if (entriesError) throw entriesError;

      // 4. Mettre à jour les soldes des comptes
      const { error: fromBalanceError } = await supabase
        .from('accounts')
        .update({ balance: (fromAccount.balance || 0) - amount, updated_at: new Date().toISOString() })
        .eq('id', fromAccount.id);
      if (fromBalanceError) throw fromBalanceError;

      const { error: toBalanceError } = await supabase
        .from('accounts')
        .update({ balance: (toAccount.balance || 0) + amount, updated_at: new Date().toISOString() })
        .eq('id', toAccount.id);
      if (toBalanceError) throw toBalanceError;

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Virement enregistré",
        description: "Le virement et ses écritures comptables ont été enregistrés",
      });
      setShowTransactionDialog(false);
      setVirementFormData({
        date: "",
        fromAccountId: "",
        toAccountId: "",
        amount: "",
        notes: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAddTransaction = () => {
    if (transactionType === "achat") {
      createExpenseMutation.mutate(expenseFormData);
    } else if (transactionType === "salaire") {
      createSalaryMutation.mutate(salaryFormData);
    } else if (transactionType === "virement_interne") {
      createVirementMutation.mutate(virementFormData);
    }
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
        
        <main className={cn(
          "flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden transition-all duration-300",
          isOpen ? "md:ml-64" : "md:ml-16"
        )}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
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
                <p className="text-2xl font-bold text-green-600">{monthlyRevenue.toLocaleString()} FCFA</p>
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
                <p className="text-2xl font-bold text-red-600">{monthlyExpenses.toLocaleString()} FCFA</p>
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
                            <p className="font-semibold">{account.account_name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{account.account_type}</p>
                          </div>
                      </div>
                    <p className="text-lg font-bold">{account.balance.toLocaleString()} FCFA</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>


          <Tabs defaultValue="achats" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="achats">Achats</TabsTrigger>
              <TabsTrigger value="salaires">Salaires</TabsTrigger>
              <TabsTrigger value="vente">Vente</TabsTrigger>
              <TabsTrigger value="virement">Virement</TabsTrigger>
            </TabsList>

            {/* Onglet Achats (anciennement Dépenses) */}
            <TabsContent value="achats" className="space-y-4">
              <PurchasePaymentsTab />
            </TabsContent>

            {/* Onglet Salaires */}
            <TabsContent value="salaires" className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Gestion des Salaires RH</h2>
                <p className="text-muted-foreground">Notifications de pointages validés et paiements du personnel</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AccountantNotificationWidget />
                <PayrollPaymentForm />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Historique des paiements RH</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTransactions.filter(t => t.description?.toLowerCase().includes('salaire') || t.description?.toLowerCase().includes('rh')).length > 0 ? (
                      recentTransactions.filter(t => t.description?.toLowerCase().includes('salaire') || t.description?.toLowerCase().includes('rh')).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <TrendingDown className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold">{transaction.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {transaction.date} • {transaction.account}
                              </p>
                            </div>
                          </div>
                          <p className="text-lg font-bold text-blue-600">
                            -{transaction.amount.toLocaleString()} FCFA
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun paiement RH enregistré
                      </p>
                    )}
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
                  {invoicesLoading ? (
                    <ListSkeleton items={3} showAvatar={false} />
                  ) : pendingInvoices.filter(inv => inv.clientType === "local" && inv.balance > 0).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucune facture en attente</p>
                    </div>
                  ) : (
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
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="vente_export" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Factures en attente de paiement - Vente Export</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {invoicesLoading ? (
                        <ListSkeleton items={3} showAvatar={false} />
                      ) : pendingInvoices.filter(inv => inv.clientType === "export" && inv.balance > 0).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Aucune facture export en attente</p>
                        </div>
                      ) : (
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
                      )}
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






          </Tabs>

          {/* Dialog Nouveau Compte */}
          <Dialog open={showAccountDialog} onOpenChange={(open) => {
            setShowAccountDialog(open);
            if (!open) {
              setNewAccountData({
                accountName: "",
                accountType: "",
                accountNumber: "",
                initialBalance: "0"
              });
            }
          }}>
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
                  <Input 
                    id="account-name" 
                    placeholder="Ex: Banque Atlantique"
                    value={newAccountData.accountName}
                    onChange={(e) => setNewAccountData({...newAccountData, accountName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-type">Type de compte</Label>
                  <Select
                    value={newAccountData.accountType}
                    onValueChange={(value) => setNewAccountData({...newAccountData, accountType: value})}
                  >
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
                  <Input 
                    id="account-number" 
                    placeholder="Ex: 123456789"
                    value={newAccountData.accountNumber}
                    onChange={(e) => setNewAccountData({...newAccountData, accountNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initial-balance">Solde initial (FCFA)</Label>
                  <Input 
                    id="initial-balance" 
                    type="number" 
                    placeholder="0"
                    value={newAccountData.initialBalance}
                    onChange={(e) => setNewAccountData({...newAccountData, initialBalance: e.target.value})}
                  />
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
                    disabled={createAccountMutation.isPending}
                  >
                    {createAccountMutation.isPending ? "Création..." : "Créer le compte"}
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
                  {transactionType === "achat" && "Enregistrer un achat"}
                  {transactionType === "salaire" && "Enregistrer un paiement de salaire"}
                  {transactionType === "virement_interne" && "Enregistrer un virement interne"}
                  {transactionType === "divers" && "Enregistrer une écriture diverse"}
                </DialogTitle>
                <DialogDescription>
                  {transactionType === "achat" && "Ajoutez un nouvel achat"}
                  {transactionType === "salaire" && "Enregistrer le paiement d'un salaire"}
                  {transactionType === "virement_interne" && "Transférer des fonds entre comptes"}
                  {transactionType === "divers" && "Enregistrer une régularisation comptable"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {transactionType === "achat" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="depense-date">Date</Label>
                        <Input 
                          id="depense-date" 
                          type="date" 
                          value={expenseFormData.date}
                          onChange={(e) => setExpenseFormData({...expenseFormData, date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="depense-account">Compte</Label>
                        <Select 
                          value={expenseFormData.accountId}
                          onValueChange={(value) => setExpenseFormData({...expenseFormData, accountId: value})}
                        >
                          <SelectTrigger id="depense-account">
                            <SelectValue placeholder="Sélectionnez un compte" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.account_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="depense-campagne">Campagne (optionnel)</Label>
                        <Select
                          value={expenseFormData.campagneId}
                          onValueChange={(value) => setExpenseFormData({...expenseFormData, campagneId: value})}
                        >
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
                        <Select
                          value={expenseFormData.campagnePhase}
                          onValueChange={(value) => setExpenseFormData({...expenseFormData, campagnePhase: value})}
                        >
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
                      <Label htmlFor="depense-type">Type de dépense *</Label>
                      <Select
                        value={expenseFormData.expenseTypeId}
                        onValueChange={(value) => {
                          const selectedType = expenseTypes.find(t => t.id === value);
                          setExpenseFormData({
                            ...expenseFormData, 
                            expenseTypeId: value,
                            description: selectedType?.name || ""
                          });
                        }}
                        disabled={expenseTypesLoading}
                      >
                        <SelectTrigger id="depense-type">
                          <SelectValue placeholder={
                            expenseTypesLoading 
                              ? "Chargement..." 
                              : expenseTypes.length === 0
                              ? "Aucun type de dépense disponible"
                              : "Sélectionnez un type de dépense"
                          } />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {expenseTypes.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              Aucun type de dépense configuré
                            </div>
                          ) : (
                            expenseTypes.map((expenseType) => (
                              <SelectItem key={expenseType.id} value={expenseType.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{expenseType.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {expenseType.account_number} - {expenseType.syscohada_category}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {expenseTypes.length === 0 && !expenseTypesLoading && (
                        <p className="text-xs text-muted-foreground">
                          Veuillez configurer les types de dépenses dans la section Administration
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depense-description">Description (optionnel)</Label>
                      <Input 
                        id="depense-description"
                        placeholder="Détails supplémentaires..."
                        value={expenseFormData.description}
                        onChange={(e) => setExpenseFormData({...expenseFormData, description: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depense-amount">Montant (FCFA)</Label>
                      <Input 
                        id="depense-amount" 
                        type="number" 
                        placeholder="0" 
                        value={expenseFormData.amount}
                        onChange={(e) => setExpenseFormData({...expenseFormData, amount: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depense-reference">Référence (optionnel)</Label>
                      <Input 
                        id="depense-reference" 
                        placeholder="Ex: Facture #123" 
                        value={expenseFormData.reference}
                        onChange={(e) => setExpenseFormData({...expenseFormData, reference: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depense-notes">Notes (optionnel)</Label>
                      <Textarea 
                        id="depense-notes" 
                        placeholder="Notes supplémentaires..." 
                        value={expenseFormData.notes}
                        onChange={(e) => setExpenseFormData({...expenseFormData, notes: e.target.value})}
                      />
                    </div>
                  </>
                )}

                {transactionType === "salaire" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salaire-date">Date de paiement</Label>
                        <Input 
                          id="salaire-date" 
                          type="date" 
                          value={salaryFormData.date}
                          onChange={(e) => setSalaryFormData({...salaryFormData, date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salaire-account">Compte de paiement</Label>
                        <Select 
                          value={salaryFormData.accountId}
                          onValueChange={(value) => setSalaryFormData({...salaryFormData, accountId: value})}
                        >
                          <SelectTrigger id="salaire-account">
                            <SelectValue placeholder="Sélectionnez un compte" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.account_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salaire-type">Type d'employé</Label>
                      <Select
                        value={salaryFormData.employeeType}
                        onValueChange={(value: any) => setSalaryFormData({...salaryFormData, employeeType: value, employeeId: ""})}
                      >
                        <SelectTrigger id="salaire-type">
                          <SelectValue placeholder="Sélectionnez le type" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="permanent">Permanent</SelectItem>
                          <SelectItem value="saisonnier">Saisonnier</SelectItem>
                          <SelectItem value="journalier">Journalier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {salaryFormData.employeeType && (
                      <div className="space-y-2">
                        <Label htmlFor="salaire-employee">
                          {salaryFormData.employeeType === 'journalier' ? 'Journalier' : 'Employé'}
                        </Label>
                        <Select
                          value={salaryFormData.employeeId}
                          onValueChange={(value) => setSalaryFormData({...salaryFormData, employeeId: value})}
                        >
                          <SelectTrigger id="salaire-employee">
                            <SelectValue placeholder="Sélectionnez la personne" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            {salaryFormData.employeeType === 'journalier' 
                              ? dailyWorkers.map((worker) => (
                                  <SelectItem key={worker.id} value={worker.id}>
                                    {worker.full_name}
                                  </SelectItem>
                                ))
                              : employees.filter(e => e.employee_type === salaryFormData.employeeType).map((emp) => (
                                  <SelectItem key={emp.id} value={emp.id}>
                                    {emp.full_name} - {emp.position || 'N/A'}
                                  </SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="salaire-period">Période</Label>
                      <Input 
                        id="salaire-period" 
                        type="text"
                        placeholder="Ex: Janvier 2025 ou Semaine 1" 
                        value={salaryFormData.period}
                        onChange={(e) => setSalaryFormData({...salaryFormData, period: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salaire-amount">Montant (FCFA)</Label>
                      <Input 
                        id="salaire-amount" 
                        type="number" 
                        placeholder="0" 
                        value={salaryFormData.amount}
                        onChange={(e) => setSalaryFormData({...salaryFormData, amount: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salaire-notes">Notes (optionnel)</Label>
                      <Textarea 
                        id="salaire-notes" 
                        placeholder="Notes supplémentaires..." 
                        value={salaryFormData.notes}
                        onChange={(e) => setSalaryFormData({...salaryFormData, notes: e.target.value})}
                      />
                    </div>
                  </>
                )}

                {transactionType === "virement_interne" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="virement-date">Date</Label>
                      <Input 
                        id="virement-date" 
                        type="date" 
                        value={virementFormData.date}
                        onChange={(e) => setVirementFormData({...virementFormData, date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="virement-from">Compte source</Label>
                      <Select
                        value={virementFormData.fromAccountId}
                        onValueChange={(value) => setVirementFormData({...virementFormData, fromAccountId: value})}
                      >
                        <SelectTrigger id="virement-from">
                          <SelectValue placeholder="Sélectionnez le compte source" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.account_name} ({account.balance.toLocaleString()} FCFA)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="virement-to">Compte destination</Label>
                      <Select
                        value={virementFormData.toAccountId}
                        onValueChange={(value) => setVirementFormData({...virementFormData, toAccountId: value})}
                      >
                        <SelectTrigger id="virement-to">
                          <SelectValue placeholder="Sélectionnez le compte destination" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.account_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="virement-amount">Montant (FCFA)</Label>
                      <Input 
                        id="virement-amount" 
                        type="number" 
                        placeholder="0" 
                        value={virementFormData.amount}
                        onChange={(e) => setVirementFormData({...virementFormData, amount: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="virement-notes">Notes (optionnel)</Label>
                      <Textarea 
                        id="virement-notes" 
                        placeholder="Notes supplémentaires..." 
                        value={virementFormData.notes}
                        onChange={(e) => setVirementFormData({...virementFormData, notes: e.target.value})}
                      />
                    </div>
                  </>
                )}

                {transactionType === "divers" && (
                  <JournalEntryForm
                    onSuccess={() => {
                      setShowTransactionDialog(false);
                      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
                      queryClient.invalidateQueries({ queryKey: ['divers-entries'] });
                    }}
                    onCancel={() => setShowTransactionDialog(false)}
                  />
                )}

                {transactionType === "divers" ? null : (
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
                )}
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
                            {account.account_name} ({account.account_type})
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
