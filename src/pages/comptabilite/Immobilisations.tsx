// @ts-nocheck
import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Breadcrumbs } from "@/components/Layout/Breadcrumbs";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { useFixedAssets, DisposalParams } from "@/hooks/useFixedAssets";
import { useAccounts } from "@/hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, TrendingDown, Package, Ban, HandCoins } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DepreciationScheduleTable } from "@/components/Accounting/DepreciationScheduleTable";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount) + " FCFA";

const Immobilisations = () => {
  const { isOpen } = useSidebar();
  const { activeAssets, disposedAssets, isLoading, disposeAsset, totalAcquisition, totalVNC, totalAmort } = useFixedAssets();
  const { accounts } = useAccounts();
  const [disposalOpen, setDisposalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [disposalForm, setDisposalForm] = useState({
    disposal_type: "vente" as "vente" | "rebut" | "don",
    disposal_price: "",
    disposal_date: new Date().toISOString().split("T")[0],
    payment_account_id: "",
    notes: "",
  });

  const treasuryAccounts = accounts.filter(
    (a) => a.account_type?.toLowerCase().includes("banque") || a.account_type?.toLowerCase().includes("caisse")
  );

  const openDisposal = (assetId: string) => {
    setSelectedAsset(assetId);
    setDisposalForm({
      disposal_type: "vente",
      disposal_price: "",
      disposal_date: new Date().toISOString().split("T")[0],
      payment_account_id: "",
      notes: "",
    });
    setDisposalOpen(true);
  };

  const handleDispose = () => {
    if (!selectedAsset) return;
    const params: DisposalParams = {
      asset_id: selectedAsset,
      disposal_type: disposalForm.disposal_type,
      disposal_price: Number(disposalForm.disposal_price) || 0,
      disposal_date: disposalForm.disposal_date,
      payment_account_id: disposalForm.payment_account_id || undefined,
      notes: disposalForm.notes || undefined,
    };
    disposeAsset.mutate(params, {
      onSuccess: () => setDisposalOpen(false),
    });
  };

  const asset = activeAssets.find((a) => a.id === selectedAsset);

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      <div className={cn("flex-1 flex flex-col transition-all duration-300", isOpen ? "md:ml-64" : "md:ml-16")}>
        <Header />
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          <Breadcrumbs />

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Building2 className="h-4 w-4" /> Actifs immobilisés
                </div>
                <p className="text-2xl font-bold">{activeAssets.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground mb-1">Valeur brute</div>
                <p className="text-2xl font-bold">{formatCurrency(totalAcquisition)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground mb-1">Amortissements cumulés</div>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalAmort)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground mb-1">Valeur Nette Comptable</div>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalVNC)}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Actifs ({activeAssets.length})</TabsTrigger>
              <TabsTrigger value="amortissements">Amortissements</TabsTrigger>
              <TabsTrigger value="disposed">Cédés ({disposedAssets.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Désignation</TableHead>
                        <TableHead>Compte</TableHead>
                        <TableHead>Date acquisition</TableHead>
                        <TableHead className="text-right">Valeur brute</TableHead>
                        <TableHead className="text-right">Amort. cumulé</TableHead>
                        <TableHead className="text-right">VNC</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeAssets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Aucune immobilisation active
                          </TableCell>
                        </TableRow>
                      ) : (
                        activeAssets.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{a.asset_name}</TableCell>
                            <TableCell><Badge variant="outline">{a.account_number}</Badge></TableCell>
                            <TableCell>{format(new Date(a.acquisition_date), "dd/MM/yyyy")}</TableCell>
                            <TableCell className="text-right">{formatCurrency(a.acquisition_cost)}</TableCell>
                            <TableCell className="text-right text-destructive">{formatCurrency(a.total_depreciated || 0)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(a.net_book_value || 0)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{a.depreciation_method === "lineaire" ? "Linéaire" : a.depreciation_method}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => openDisposal(a.id)}>
                                <HandCoins className="h-4 w-4 mr-1" /> Céder
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="amortissements">
              <DepreciationScheduleTable assets={activeAssets} />
            </TabsContent>

            <TabsContent value="disposed">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Désignation</TableHead>
                        <TableHead>Type cession</TableHead>
                        <TableHead>Date cession</TableHead>
                        <TableHead className="text-right">Valeur brute</TableHead>
                        <TableHead className="text-right">Prix cession</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disposedAssets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Aucune immobilisation cédée
                          </TableCell>
                        </TableRow>
                      ) : (
                        disposedAssets.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{a.asset_name}</TableCell>
                            <TableCell>
                              <Badge variant={a.disposal_type === "vente" ? "default" : "secondary"}>
                                {a.disposal_type === "vente" ? "Vente" : a.disposal_type === "rebut" ? "Mise au rebut" : "Don"}
                              </Badge>
                            </TableCell>
                            <TableCell>{a.disposal_date ? format(new Date(a.disposal_date), "dd/MM/yyyy") : "-"}</TableCell>
                            <TableCell className="text-right">{formatCurrency(a.acquisition_cost)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(a.disposal_price || 0)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{a.disposal_notes || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Dialog de cession */}
          <Dialog open={disposalOpen} onOpenChange={setDisposalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cession d'immobilisation</DialogTitle>
              </DialogHeader>
              {asset && (
                <div className="space-y-4">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 space-y-1">
                      <p className="font-semibold">{asset.asset_name}</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valeur brute:</span>
                          <p className="font-medium">{formatCurrency(asset.acquisition_cost)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amort. cumulé:</span>
                          <p className="font-medium text-destructive">{formatCurrency(asset.total_depreciated || 0)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">VNC:</span>
                          <p className="font-medium text-primary">{formatCurrency(asset.net_book_value || 0)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Type de cession</Label>
                      <Select
                        value={disposalForm.disposal_type}
                        onValueChange={(v: "vente" | "rebut" | "don") =>
                          setDisposalForm({ ...disposalForm, disposal_type: v, disposal_price: v !== "vente" ? "0" : disposalForm.disposal_price })
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vente">Vente</SelectItem>
                          <SelectItem value="rebut">Mise au rebut</SelectItem>
                          <SelectItem value="don">Don</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {disposalForm.disposal_type === "vente" && (
                      <>
                        <div className="space-y-2">
                          <Label>Prix de cession (FCFA)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={disposalForm.disposal_price}
                            onChange={(e) => setDisposalForm({ ...disposalForm, disposal_price: e.target.value })}
                            placeholder="Montant de la vente"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Compte d'encaissement</Label>
                          <Select
                            value={disposalForm.payment_account_id}
                            onValueChange={(v) => setDisposalForm({ ...disposalForm, payment_account_id: v })}
                          >
                            <SelectTrigger><SelectValue placeholder="Sélectionner un compte" /></SelectTrigger>
                            <SelectContent>
                              {treasuryAccounts.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.account_number} – {acc.account_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label>Date de cession</Label>
                      <Input
                        type="date"
                        value={disposalForm.disposal_date}
                        onChange={(e) => setDisposalForm({ ...disposalForm, disposal_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={disposalForm.notes}
                        onChange={(e) => setDisposalForm({ ...disposalForm, notes: e.target.value })}
                        placeholder="Motif de cession, acheteur..."
                        rows={2}
                      />
                    </div>

                    {/* Aperçu comptable */}
                    {disposalForm.disposal_type === "vente" && Number(disposalForm.disposal_price) > 0 && (
                      <Card className="bg-accent/10 border-accent">
                        <CardContent className="pt-3 text-sm space-y-1">
                          <p className="font-medium">Aperçu des écritures:</p>
                          <p>• Débit 28xx: {formatCurrency(asset.total_depreciated || 0)} (reprise amort.)</p>
                          <p>• Crédit {asset.account_number}: {formatCurrency(asset.acquisition_cost)} (sortie actif)</p>
                          <p>• Débit Trésorerie: {formatCurrency(Number(disposalForm.disposal_price))} (encaissement)</p>
                          <p>• Crédit 822: {formatCurrency(Number(disposalForm.disposal_price))} (produit cession)</p>
                          {Number(disposalForm.disposal_price) < (asset.net_book_value || 0) && (
                            <p className="text-destructive">• Débit 812: {formatCurrency((asset.net_book_value || 0) - Number(disposalForm.disposal_price))} (moins-value)</p>
                          )}
                          <Badge variant={Number(disposalForm.disposal_price) >= (asset.net_book_value || 0) ? "default" : "destructive"} className="mt-2">
                            {Number(disposalForm.disposal_price) >= (asset.net_book_value || 0) ? "Plus-value" : "Moins-value"}: {formatCurrency(Math.abs(Number(disposalForm.disposal_price) - (asset.net_book_value || 0)))}
                          </Badge>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDisposalOpen(false)}>Annuler</Button>
                <Button
                  onClick={handleDispose}
                  disabled={disposeAsset.isPending}
                  variant="destructive"
                >
                  {disposeAsset.isPending ? "En cours..." : "Confirmer la cession"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default Immobilisations;
