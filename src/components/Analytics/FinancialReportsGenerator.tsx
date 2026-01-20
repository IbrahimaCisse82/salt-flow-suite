import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinancialReports, BalanceSheetData, IncomeStatementData } from "@/hooks/useFinancialReports";
import { useCampagnes } from "@/hooks/useCampagnes";
import { FileText, Download, CheckCircle, Trash2, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const FinancialReportsGenerator = () => {
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [selectedCampagne, setSelectedCampagne] = useState<string>("");
  const [activeTab, setActiveTab] = useState("generate");

  const { 
    reports, 
    isLoading, 
    generateBalanceSheet, 
    generateIncomeStatement,
    validateReport,
    deleteReport 
  } = useFinancialReports();

  const { campagnes } = useCampagnes();

  const handleGenerateBalanceSheet = () => {
    if (!periodStart || !periodEnd) return;
    generateBalanceSheet.mutate({
      period_start: periodStart,
      period_end: periodEnd,
      campagne_id: selectedCampagne || undefined,
    });
  };

  const handleGenerateIncomeStatement = () => {
    if (!periodStart || !periodEnd) return;
    generateIncomeStatement.mutate({
      period_start: periodStart,
      period_end: periodEnd,
      campagne_id: selectedCampagne || undefined,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " FCFA";
  };

  const bilans = reports.filter(r => r.report_type === "bilan");
  const comptesResultat = reports.filter(r => r.report_type === "compte_resultat");

  const renderBalanceSheet = (data: BalanceSheetData) => (
    <div className="grid grid-cols-2 gap-6">
      {/* ACTIF */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary border-b pb-2">ACTIF</h3>
        
        <div>
          <h4 className="font-medium text-muted-foreground mb-2">Actif Immobilisé</h4>
          <Table>
            <TableBody>
              {(data.actif.actif_immobilise || []).filter(a => a.balance !== 0).map((account, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-sm">{account.account_number}</TableCell>
                  <TableCell className="text-sm">{account.account_name}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(account.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h4 className="font-medium text-muted-foreground mb-2">Actif Circulant</h4>
          <Table>
            <TableBody>
              {(data.actif.actif_circulant || []).filter(a => a.balance !== 0).map((account, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-sm">{account.account_number}</TableCell>
                  <TableCell className="text-sm">{account.account_name}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(account.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-primary/10 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold">TOTAL ACTIF</span>
            <span className="font-bold text-lg">{formatCurrency(data.actif.total)}</span>
          </div>
        </div>
      </div>

      {/* PASSIF */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary border-b pb-2">PASSIF</h3>
        
        <div>
          <h4 className="font-medium text-muted-foreground mb-2">Capitaux Propres</h4>
          <Table>
            <TableBody>
              {(data.passif.capitaux_propres || []).filter(a => a.balance !== 0).map((account, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-sm">{account.account_number}</TableCell>
                  <TableCell className="text-sm">{account.account_name}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(account.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h4 className="font-medium text-muted-foreground mb-2">Dettes</h4>
          <Table>
            <TableBody>
              {(data.passif.dettes || []).filter(a => a.balance !== 0).map((account, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-sm">{account.account_number}</TableCell>
                  <TableCell className="text-sm">{account.account_name}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(account.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-primary/10 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold">TOTAL PASSIF</span>
            <span className="font-bold text-lg">{formatCurrency(data.passif.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIncomeStatement = (data: IncomeStatementData) => (
    <div className="space-y-6">
      {/* PRODUITS */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-green-600 border-b pb-2 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          PRODUITS
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-muted-foreground mb-2">Produits d'Exploitation</h4>
            <Table>
              <TableBody>
                {(data.produits.exploitation || []).filter(a => a.balance !== 0).map((account, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-sm">{account.account_number}</TableCell>
                    <TableCell className="text-sm">{account.account_name}</TableCell>
                    <TableCell className="text-right font-mono text-green-600">{formatCurrency(account.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div>
            <h4 className="font-medium text-muted-foreground mb-2">Produits Financiers</h4>
            <Table>
              <TableBody>
                {(data.produits.financiers || []).filter(a => a.balance !== 0).map((account, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-sm">{account.account_number}</TableCell>
                    <TableCell className="text-sm">{account.account_name}</TableCell>
                    <TableCell className="text-right font-mono text-green-600">{formatCurrency(account.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold">TOTAL PRODUITS</span>
            <span className="font-bold text-lg text-green-600">{formatCurrency(data.produits.total)}</span>
          </div>
        </div>
      </div>

      {/* CHARGES */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-red-600 border-b pb-2 flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          CHARGES
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-muted-foreground mb-2">Charges d'Exploitation</h4>
            <Table>
              <TableBody>
                {(data.charges.exploitation || []).filter(a => a.balance !== 0).map((account, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-sm">{account.account_number}</TableCell>
                    <TableCell className="text-sm">{account.account_name}</TableCell>
                    <TableCell className="text-right font-mono text-red-600">{formatCurrency(account.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div>
            <h4 className="font-medium text-muted-foreground mb-2">Charges Financières</h4>
            <Table>
              <TableBody>
                {(data.charges.financieres || []).filter(a => a.balance !== 0).map((account, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-sm">{account.account_number}</TableCell>
                    <TableCell className="text-sm">{account.account_name}</TableCell>
                    <TableCell className="text-right font-mono text-red-600">{formatCurrency(account.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold">TOTAL CHARGES</span>
            <span className="font-bold text-lg text-red-600">{formatCurrency(data.charges.total)}</span>
          </div>
        </div>
      </div>

      {/* RÉSULTATS */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Résultat d'Exploitation</div>
            <div className={`text-xl font-bold ${data.resultats.exploitation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.resultats.exploitation)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Résultat Financier</div>
            <div className={`text-xl font-bold ${data.resultats.financier >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.resultats.financier)}
            </div>
          </CardContent>
        </Card>
        
        <Card className={`${data.resultats.net >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
          <CardContent className="pt-4">
            <div className="text-sm font-medium">RÉSULTAT NET</div>
            <div className={`text-2xl font-bold ${data.resultats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.resultats.net)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Générer</TabsTrigger>
          <TabsTrigger value="bilans">Bilans ({bilans.length})</TabsTrigger>
          <TabsTrigger value="resultats">Comptes de Résultat ({comptesResultat.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Générer les États Financiers
              </CardTitle>
              <CardDescription>
                Générez automatiquement le Bilan et le Compte de Résultat conformes au SYSCOHADA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Campagne (optionnel)</Label>
                  <Select value={selectedCampagne} onValueChange={setSelectedCampagne}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les campagnes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les campagnes</SelectItem>
                      {(campagnes || []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleGenerateBalanceSheet}
                  disabled={!periodStart || !periodEnd || generateBalanceSheet.isPending}
                  className="flex-1"
                >
                  {generateBalanceSheet.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Générer le Bilan
                </Button>
                <Button
                  onClick={handleGenerateIncomeStatement}
                  disabled={!periodStart || !periodEnd || generateIncomeStatement.isPending}
                  variant="secondary"
                  className="flex-1"
                >
                  {generateIncomeStatement.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Générer le Compte de Résultat
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bilans" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : bilans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucun bilan généré. Utilisez l'onglet "Générer" pour créer un bilan.
              </CardContent>
            </Card>
          ) : (
            bilans.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Bilan</CardTitle>
                      <CardDescription>
                        Période: {format(new Date(report.period_start), "dd MMM yyyy", { locale: fr })} - {format(new Date(report.period_end), "dd MMM yyyy", { locale: fr })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={report.status === "validated" ? "default" : "secondary"}>
                        {report.status === "validated" ? "Validé" : "Brouillon"}
                      </Badge>
                      {report.status !== "validated" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => validateReport.mutate(report.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteReport.mutate(report.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderBalanceSheet(report.report_data as BalanceSheetData)}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resultats" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : comptesResultat.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucun compte de résultat généré. Utilisez l'onglet "Générer" pour en créer un.
              </CardContent>
            </Card>
          ) : (
            comptesResultat.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Compte de Résultat</CardTitle>
                      <CardDescription>
                        Période: {format(new Date(report.period_start), "dd MMM yyyy", { locale: fr })} - {format(new Date(report.period_end), "dd MMM yyyy", { locale: fr })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={report.status === "validated" ? "default" : "secondary"}>
                        {report.status === "validated" ? "Validé" : "Brouillon"}
                      </Badge>
                      {report.status !== "validated" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => validateReport.mutate(report.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteReport.mutate(report.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderIncomeStatement(report.report_data as IncomeStatementData)}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
