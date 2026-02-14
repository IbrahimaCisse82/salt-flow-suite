import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCostPerTon, CostPerTonData } from "@/hooks/useCostPerTon";
import { useCampagnes } from "@/hooks/useCampagnes";
import { 
  Calculator, 
  Save, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  TrendingUp,
  Package,
  Users,
  Zap,
  Truck,
  Wrench,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const CostPerTonCalculator = () => {
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [selectedCampagne, setSelectedCampagne] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [previewData, setPreviewData] = useState<CostPerTonData | null>(null);

  const { 
    costRecords, 
    isLoading, 
    calculateCost, 
    saveCalculation,
    validateCost,
    deleteCost,
    latestCostPerTon
  } = useCostPerTon();

  const { campagnes } = useCampagnes();

  const handleCalculate = async () => {
    if (!periodStart || !periodEnd) return;
    
    const result = await calculateCost.mutateAsync({
      period_start: periodStart,
      period_end: periodEnd,
      campagne_id: selectedCampagne || undefined,
    });
    
    setPreviewData(result);
  };

  const handleSave = () => {
    if (!periodStart || !periodEnd) return;
    
    saveCalculation.mutate({
      period_start: periodStart,
      period_end: periodEnd,
      campagne_id: selectedCampagne || undefined,
      notes,
    });
    
    setPreviewData(null);
    setNotes("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " FCFA";
  };

  const formatWeight = (kg: number) => {
    const tonnes = kg / 1000;
    return `${tonnes.toFixed(2)} tonnes`;
  };

  const costCategories = previewData ? [
    { icon: Users, label: "Main d'œuvre", value: previewData.cout_main_oeuvre, color: "text-blue-600" },
    { icon: Package, label: "Matières premières", value: previewData.cout_matieres_premieres, color: "text-amber-600" },
    { icon: Zap, label: "Énergie", value: previewData.cout_energie, color: "text-yellow-600" },
    { icon: Truck, label: "Transport", value: previewData.cout_transport, color: "text-green-600" },
    { icon: Wrench, label: "Maintenance", value: previewData.cout_maintenance, color: "text-purple-600" },
    { icon: MoreHorizontal, label: "Autres coûts", value: previewData.autres_couts, color: "text-gray-600" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* En-tête avec le dernier coût */}
      {latestCostPerTon && (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Calculator className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dernier coût de revient calculé</p>
                  <p className="text-2xl font-bold">{formatCurrency(latestCostPerTon)} / tonne</p>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/40" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire de calcul */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculer le Coût de Revient par Tonne
          </CardTitle>
          <CardDescription>
            Calculez automatiquement le coût de production en intégrant tous les postes de dépenses
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

          <Button
            onClick={handleCalculate}
            disabled={!periodStart || !periodEnd || calculateCost.isPending}
            className="w-full"
          >
            {calculateCost.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4 mr-2" />
            )}
            Calculer
          </Button>
        </CardContent>
      </Card>

      {/* Aperçu du calcul */}
      {previewData && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Résultat du Calcul</span>
              <Badge variant="secondary">Aperçu</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Production totale */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Production Totale</div>
                  <div className="text-2xl font-bold">{formatWeight(previewData.total_production_kg)}</div>
                </CardContent>
              </Card>
              <Card className="bg-primary/10">
                <CardContent className="pt-4">
                  <div className="text-sm font-medium">Coût par Tonne</div>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(previewData.cout_par_tonne)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Répartition des coûts */}
            <div>
              <h4 className="font-medium mb-3">Répartition des Coûts</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {costCategories.map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Icon className={`h-5 w-5 ${color}`} />
                    <div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="font-semibold">{formatCurrency(value)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coût total */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">COÛT TOTAL</span>
                <span className="text-2xl font-bold">{formatCurrency(previewData.cout_total)}</span>
              </div>
            </div>

            {/* Détails par type de sel */}
            {Object.keys(previewData.details_par_type).length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Détails par Type de Sel</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Production</TableHead>
                      <TableHead className="text-right">Coût Estimé</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(previewData.details_par_type).map(([type, data]: [string, any]) => (
                      <TableRow key={type}>
                        <TableCell className="font-medium capitalize">{type.replace('_', ' ')}</TableCell>
                        <TableCell className="text-right">{formatWeight(data.production_kg)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.cout_estime)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Notes et sauvegarde */}
            <div className="space-y-3 pt-4 border-t">
              <div className="space-y-2">
                <Label>Notes (optionnel)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez des observations ou commentaires..."
                  rows={2}
                />
              </div>
              <Button 
                onClick={handleSave} 
                disabled={saveCalculation.isPending}
                className="w-full"
              >
                {saveCalculation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer le Calcul
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historique des calculs */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Calculs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : costRecords.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Aucun calcul enregistré. Utilisez le formulaire ci-dessus pour calculer le coût de revient.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-right">Production</TableHead>
                  <TableHead className="text-right">Coût Total</TableHead>
                  <TableHead className="text-right">Coût/Tonne</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(record.period_start), "dd MMM", { locale: fr })} - {format(new Date(record.period_end), "dd MMM yyyy", { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatWeight(record.total_production_kg)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(record.cout_total)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(record.cout_par_tonne)}</TableCell>
                    <TableCell>
                      <Badge variant={record.status === "validated" ? "default" : "secondary"}>
                        {record.status === "validated" ? "Validé" : "Calculé"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {record.status !== "validated" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => validateCost.mutate(record.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCost.mutate(record.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
