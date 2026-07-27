import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Breadcrumbs } from "@/components/Layout/Breadcrumbs";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAccountingLedger } from "@/hooks/useAccountingLedger";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Lock, Unlock, AlertTriangle, CheckCircle, Calculator,
  ArrowRight, BookOpen, TrendingUp, TrendingDown, Banknote
} from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(amount);

const ClotureExercice = () => {
  const { isOpen } = useSidebar();
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showAllocation, setShowAllocation] = useState(false);

  // Allocation form
  const [reserveLegale, setReserveLegale] = useState("");
  const [autresReserves, setAutresReserves] = useState("");
  const [reportNouveau, setReportNouveau] = useState("");
  const [dividendes, setDividendes] = useState("");

  const fiscalYearEnd = `${selectedYear}-12-31`;
  const fiscalYearStart = `${selectedYear}-01-01`;

  const { journalEntries, totalDebit, totalCredit, isLoading } = useAccountingLedger(fiscalYearStart, fiscalYearEnd);

  // Calculate charges (class 6 + HAO charges) and products (class 7 + HAO products)
  const totalCharges = journalEntries
    .filter(e => e.account_number?.match(/^(6|81|83|85|87|89)/))
    .reduce((sum, e) => sum + (e.debit || 0) - (e.credit || 0), 0);

  const totalProduits = journalEntries
    .filter(e => e.account_number?.match(/^(7|82|84|86|88)/))
    .reduce((sum, e) => sum + (e.credit || 0) - (e.debit || 0), 0);

  const resultat = totalProduits - totalCharges;
  const isBenefice = resultat >= 0;

  // Close fiscal year mutation
  const closeFiscalYear = useMutation({
    mutationFn: async () => {
      if (!profile?.tenant_id) throw new Error("Tenant non trouvé");

      const { data, error } = await supabase.rpc("close_fiscal_year", {
        p_tenant_id: profile.tenant_id,
        p_fiscal_year_end: fiscalYearEnd,
        p_description: `Clôture exercice ${selectedYear}`,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounting-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
      toast({ title: "Clôture effectuée", description: `L'exercice ${selectedYear} a été clôturé avec succès.` });
      setShowAllocation(true);
    },
    onError: (error: Error) => {
      toast({ title: "Erreur de clôture", description: error.message, variant: "destructive" });
    },
  });

  // Allocate result mutation
  const allocateResult = useMutation({
    mutationFn: async () => {
      if (!profile?.tenant_id) throw new Error("Tenant non trouvé");

      const { data, error } = await supabase.rpc("allocate_result", {
        p_tenant_id: profile.tenant_id,
        p_fiscal_year_end: fiscalYearEnd,
        p_reserve_legale: Number(reserveLegale) || 0,
        p_autres_reserves: Number(autresReserves) || 0,
        p_report_nouveau: Number(reportNouveau) || 0,
        p_dividendes: Number(dividendes) || 0,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounting-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
      toast({ title: "Affectation enregistrée", description: "Le résultat a été affecté conformément au SYSCOHADA." });
      setShowAllocation(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erreur d'affectation", description: error.message, variant: "destructive" });
    },
  });

  const allocationTotal = (Number(reserveLegale) || 0) + (Number(autresReserves) || 0) + (Number(reportNouveau) || 0) + (Number(dividendes) || 0);
  const allocationBalanced = Math.abs(allocationTotal - Math.abs(resultat)) < 0.01;

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      <div className={cn("flex-1 flex flex-col transition-all duration-300", isOpen ? "md:ml-64" : "md:ml-16")}>
        <Header />
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          <Breadcrumbs />

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Clôture d'exercice & Affectation du résultat
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Procédure conforme SYSCOHADA révisé — Classes 6, 7, 8 → Compte 13
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label>Exercice</Label>
              <Input
                type="number"
                className="w-24"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                min={2020}
                max={currentYear}
              />
            </div>
          </div>

          {/* Résumé de l'exercice */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-destructive/10">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Charges</p>
                    <p className="text-lg font-bold">{formatCurrency(totalCharges)}</p>
                    <p className="text-xs text-muted-foreground">Classes 6 + 8 (charges)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-accent/10">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Produits</p>
                    <p className="text-lg font-bold">{formatCurrency(totalProduits)}</p>
                    <p className="text-xs text-muted-foreground">Classes 7 + 8 (produits)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={isBenefice ? "border-accent/50" : "border-destructive/50"}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isBenefice ? "bg-accent/10" : "bg-destructive/10"}`}>
                    <Calculator className={`h-5 w-5 ${isBenefice ? "text-accent" : "text-destructive"}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Résultat net</p>
                    <p className="text-lg font-bold">{formatCurrency(resultat)}</p>
                    <Badge variant={isBenefice ? "default" : "destructive"}>
                      {isBenefice ? "Bénéfice → 131" : "Perte → 139"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Écritures</p>
                    <p className="text-lg font-bold">{journalEntries.length}</p>
                    <p className="text-xs text-muted-foreground">Exercice {selectedYear}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Étape 1: Clôture */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="text-base px-3">1</Badge>
                Clôture de l'exercice
              </CardTitle>
              <CardDescription>
                Solde les comptes de charges (6), produits (7) et HAO (8) vers le résultat (13).
                Vire automatiquement le compte 104 (exploitant) vers 103 (capital personnel).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
                    <h4 className="font-medium text-sm">Opérations automatiques :</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" /> Solde des comptes classe 6 → Crédit (pour solder)
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" /> Solde des comptes classe 7 → Débit (pour solder)
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" /> Résultat → Compte {isBenefice ? "131 (Bénéfice)" : "139 (Perte)"}
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" /> Virement 104 → 103 (si applicable)
                      </li>
                    </ul>
                  </div>

                  <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-sm">
                      <strong>Attention :</strong> Cette opération est irréversible. Assurez-vous que toutes les
                      écritures de l'exercice {selectedYear} sont saisies et vérifiées avant de procéder.
                    </AlertDescription>
                  </Alert>
                </div>

                <Button
                  className="w-full md:w-auto gap-2"
                  size="lg"
                  onClick={() => closeFiscalYear.mutate()}
                  disabled={closeFiscalYear.isPending || isLoading || journalEntries.length === 0}
                >
                  <Lock className="h-4 w-4" />
                  {closeFiscalYear.isPending ? "Clôture en cours..." : `Clôturer l'exercice ${selectedYear}`}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Étape 2: Affectation du résultat */}
          <Card className={!showAllocation ? "opacity-60" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="text-base px-3">2</Badge>
                Affectation du résultat
                {!showAllocation && <Badge variant="secondary">Après clôture</Badge>}
              </CardTitle>
              <CardDescription>
                Répartir le résultat entre réserves, report à nouveau et dividendes (SYSCOHADA Art. 37-38).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showAllocation && isBenefice ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/30">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span className="font-medium">Résultat à affecter : {formatCurrency(Math.abs(resultat))}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Réserve légale (111) — Min. 10%</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={reserveLegale}
                        onChange={(e) => setReserveLegale(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Suggestion : {formatCurrency(Math.abs(resultat) * 0.1)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Autres réserves (118)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={autresReserves}
                        onChange={(e) => setAutresReserves(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Report à nouveau (121)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={reportNouveau}
                        onChange={(e) => setReportNouveau(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dividendes (465)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={dividendes}
                        onChange={(e) => setDividendes(e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total affecté</p>
                      <p className={`text-lg font-bold ${allocationBalanced ? "text-accent" : "text-destructive"}`}>
                        {formatCurrency(allocationTotal)} / {formatCurrency(Math.abs(resultat))}
                      </p>
                    </div>
                    <Button
                      className="gap-2"
                      size="lg"
                      onClick={() => allocateResult.mutate()}
                      disabled={!allocationBalanced || allocateResult.isPending}
                    >
                      <Banknote className="h-4 w-4" />
                      {allocateResult.isPending ? "Affectation..." : "Valider l'affectation"}
                    </Button>
                  </div>
                </div>
              ) : showAllocation && !isBenefice ? (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      L'exercice se solde par une perte de {formatCurrency(Math.abs(resultat))}.
                      Celle-ci sera automatiquement reportée au compte 129 (Report à nouveau débiteur).
                    </AlertDescription>
                  </Alert>
                  <Button
                    className="gap-2"
                    onClick={() => allocateResult.mutate()}
                    disabled={allocateResult.isPending}
                  >
                    <Unlock className="h-4 w-4" />
                    {allocateResult.isPending ? "En cours..." : "Reporter la perte"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">
                  Effectuez d'abord la clôture de l'exercice pour accéder à l'affectation du résultat.
                </p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default ClotureExercice;