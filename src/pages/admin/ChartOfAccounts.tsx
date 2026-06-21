// @ts-nocheck
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logger } from "@/utils/logger";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Plus, ShieldAlert, Filter } from "lucide-react";
import { toast } from "sonner";

// Classes SYSCOHADA révisé
const SYSCOHADA_CLASSES = [
  { value: "all", label: "Toutes les classes" },
  { value: "1", label: "Classe 1 – Capitaux", type: "capitaux" },
  { value: "2", label: "Classe 2 – Immobilisations", type: "immobilisations" },
  { value: "3", label: "Classe 3 – Stocks", type: "stocks" },
  { value: "4", label: "Classe 4 – Tiers", type: "tiers" },
  { value: "5", label: "Classe 5 – Trésorerie", type: "tresorerie" },
  { value: "6", label: "Classe 6 – Charges", type: "charges" },
  { value: "7", label: "Classe 7 – Produits", type: "produits" },
  { value: "8", label: "Classe 8 – Autres charges", type: "autres_charges" },
  { value: "9", label: "Classe 9 – Engagements", type: "engagements" },
];

// Comptes protégés - ne peuvent être ni modifiés ni désactivés manuellement
const PROTECTED_ACCOUNT_PREFIXES = ["101", "103", "11", "12", "13"];

const isProtectedAccount = (accountNumber: string): boolean => {
  return PROTECTED_ACCOUNT_PREFIXES.some(prefix => accountNumber.startsWith(prefix));
};

const getAccountTypeFromNumber = (accountNumber: string): string => {
  const classNum = accountNumber.charAt(0);
  const classInfo = SYSCOHADA_CLASSES.find(c => c.value === classNum);
  return classInfo?.type || "autre";
};

const getClassLabel = (accountNumber: string): string => {
  const classNum = accountNumber.charAt(0);
  const classInfo = SYSCOHADA_CLASSES.find(c => c.value === classNum);
  return classInfo?.label || `Classe ${classNum}`;
};

export default function ChartOfAccounts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [classFilter, setClassFilter] = useState("all");
  const [newAccount, setNewAccount] = useState({
    account_number: "",
    account_name: "",
    account_type: ""
  });
  const [validationError, setValidationError] = useState("");
  const queryClient = useQueryClient();
  const { isOpen } = useSidebar();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['admin-chart-of-accounts'],
    queryFn: async () => {
      const { data: authUser } = await supabase.auth.getUser();
      const user = authUser?.user;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .maybeSingle();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .order('role')
        .limit(1)
        .maybeSingle();

      const role = roleData?.role || (user?.user_metadata?.role as string);
      const tenantId = profile?.tenant_id || (role === 'admin' ? '00000000-0000-0000-0000-000000000001' : undefined);

      let query = supabase
        .from('chart_of_accounts')
        .select('*');
      
      if (role !== 'admin') {
        if (!tenantId) return [];
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query.order('account_number');
      
      if (error) throw error;
      return data;
    }
  });

  // Filtrage par classe
  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    if (classFilter === "all") return accounts;
    return accounts.filter(acc => acc.account_number.startsWith(classFilter));
  }, [accounts, classFilter]);

  // Stats par classe
  const classStats = useMemo(() => {
    if (!accounts) return {};
    const stats: Record<string, number> = {};
    accounts.forEach(acc => {
      const cls = acc.account_number.charAt(0);
      stats[cls] = (stats[cls] || 0) + 1;
    });
    return stats;
  }, [accounts]);

  const validateAccountNumber = (num: string): boolean => {
    if (!/^\d{2,6}$/.test(num)) {
      setValidationError("Le numéro doit contenir entre 2 et 6 chiffres");
      return false;
    }
    if (isProtectedAccount(num)) {
      setValidationError("⛔ Ce compte est protégé (101, 103, 11x, 12x, 13x). Il est géré automatiquement par les procédures de clôture.");
      return false;
    }
    // Vérifier que la classe existe (1-9)
    const cls = num.charAt(0);
    if (cls === "0" || !SYSCOHADA_CLASSES.find(c => c.value === cls)) {
      setValidationError("La classe doit être entre 1 et 9");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleAccountNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    const accountType = cleaned.length > 0 ? getAccountTypeFromNumber(cleaned) : "";
    setNewAccount({ ...newAccount, account_number: cleaned, account_type: accountType });
    if (cleaned.length >= 2) {
      validateAccountNumber(cleaned);
    } else {
      setValidationError("");
    }
  };

  const addAccount = useMutation({
    mutationFn: async () => {
      if (!validateAccountNumber(newAccount.account_number)) {
        throw new Error(validationError);
      }

      const { data: authUser } = await supabase.auth.getUser();
      const user = authUser?.user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .maybeSingle();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .order('role')
        .limit(1)
        .maybeSingle();

      const role = roleData?.role || (user?.user_metadata?.role as string);
      const tenantId = profile?.tenant_id || (role === 'admin' ? '00000000-0000-0000-0000-000000000001' : undefined);

      if (!tenantId) throw new Error("Aucun tenant associé à l'utilisateur");

      const { error } = await supabase
        .from('chart_of_accounts')
        .insert({
          tenant_id: tenantId,
          ...newAccount
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chart-of-accounts'] });
      toast.success("Compte ajouté avec succès");
      setDialogOpen(false);
      setNewAccount({ account_number: "", account_name: "", account_type: "" });
      setValidationError("");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
      logger.error(error);
    }
  });

  const toggleAccountStatus = useMutation({
    mutationFn: async ({ id, is_active, account_number }: { id: string; is_active: boolean; account_number: string }) => {
      if (isProtectedAccount(account_number)) {
        throw new Error("Ce compte est protégé et ne peut pas être modifié manuellement.");
      }
      const { error } = await supabase
        .from('chart_of_accounts')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chart-of-accounts'] });
      toast.success("Statut du compte mis à jour");
    },
    onError: (error) => {
      toast.error(error.message);
      logger.error(error);
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className={cn(
          "flex-1 p-6 overflow-auto transition-all duration-300",
          isOpen ? "md:ml-64" : "md:ml-16"
        )}>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Plan Comptable SYSCOHADA
              </h1>
              <p className="text-muted-foreground mt-2">
                Gestion du plan comptable selon le référentiel SYSCOHADA révisé (Classes 1 à 9)
              </p>
            </div>

            {/* Stats par classe */}
            <div className="flex flex-wrap gap-2">
              {SYSCOHADA_CLASSES.filter(c => c.value !== "all").map(cls => (
                <Badge
                  key={cls.value}
                  variant={classFilter === cls.value ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setClassFilter(classFilter === cls.value ? "all" : cls.value)}
                >
                  {cls.label.split("–")[0].trim()} ({classStats[cls.value] || 0})
                </Badge>
              ))}
              {classFilter !== "all" && (
                <Badge variant="secondary" className="cursor-pointer text-xs" onClick={() => setClassFilter("all")}>
                  ✕ Réinitialiser
                </Badge>
              )}
            </div>

            {/* Alerte comptes protégés */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Comptes protégés</p>
                <p className="text-muted-foreground">
                  Les comptes <strong>101</strong> (Capital), <strong>103</strong> (Capital personnel), <strong>11x</strong> (Réserves), <strong>12x</strong> (Report à nouveau) et <strong>13x</strong> (Résultat) sont gérés exclusivement par les procédures automatiques de clôture et d'affectation du résultat. Ils ne peuvent pas être modifiés manuellement.
                </p>
              </div>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Comptes Comptables
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filteredAccounts.length} compte(s) affiché(s)
                    {classFilter !== "all" && ` — ${getClassLabel(classFilter)}`}
                  </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Ajouter un compte
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouveau compte comptable</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="account_number">Numéro de compte *</Label>
                        <Input
                          id="account_number"
                          value={newAccount.account_number}
                          onChange={(e) => handleAccountNumberChange(e.target.value)}
                          placeholder="Ex: 601, 4111, 5211..."
                          maxLength={6}
                        />
                        {validationError && (
                          <p className="text-sm text-destructive mt-1">{validationError}</p>
                        )}
                        {newAccount.account_number.length >= 1 && !validationError && (
                          <p className="text-sm text-muted-foreground mt-1">
                            → {getClassLabel(newAccount.account_number)} — Type: <strong>{newAccount.account_type}</strong>
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="account_name">Nom du compte *</Label>
                        <Input
                          id="account_name"
                          value={newAccount.account_name}
                          onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
                          placeholder="Ex: Achats de matières premières"
                        />
                      </div>
                      <div>
                        <Label htmlFor="account_type">Type (classe SYSCOHADA)</Label>
                        <Input
                          id="account_type"
                          value={newAccount.account_type}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Déterminé automatiquement par le numéro de compte
                        </p>
                      </div>
                      <Button 
                        onClick={() => addAccount.mutate()}
                        disabled={
                          !newAccount.account_number || 
                          !newAccount.account_name || 
                          !newAccount.account_type ||
                          !!validationError
                        }
                        className="w-full"
                      >
                        Ajouter
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">Chargement...</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Compte</TableHead>
                          <TableHead>Nom du compte</TableHead>
                          <TableHead className="w-[150px]">Type</TableHead>
                          <TableHead className="w-[100px]">Statut</TableHead>
                          <TableHead className="text-right w-[80px]">Actif</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAccounts?.map((account) => {
                          const isProtected = isProtectedAccount(account.account_number);
                          return (
                            <TableRow key={account.id} className={isProtected ? "bg-amber-500/5" : undefined}>
                              <TableCell className="font-mono font-medium">
                                {account.account_number}
                              </TableCell>
                              <TableCell>
                                <span className="flex items-center gap-2">
                                  {account.account_name}
                                  {isProtected && (
                                    <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                                  )}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {account.account_type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={account.is_active ? "default" : "secondary"} className="text-xs">
                                  {account.is_active ? "Actif" : "Inactif"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Switch
                                  checked={account.is_active}
                                  disabled={isProtected}
                                  onCheckedChange={(checked) => {
                                    toggleAccountStatus.mutate({
                                      id: account.id,
                                      is_active: checked,
                                      account_number: account.account_number
                                    });
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
