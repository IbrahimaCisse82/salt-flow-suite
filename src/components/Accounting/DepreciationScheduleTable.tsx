import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, Clock, AlertTriangle, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import type { FixedAsset } from "@/hooks/useFixedAssets";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount) + " FCFA";

interface Props {
  assets: FixedAsset[];
}

interface ScheduleLine {
  id: string;
  fixed_asset_id: string;
  period_start: string;
  period_end: string;
  depreciation_amount: number;
  cumulative_depreciation: number;
  net_book_value: number;
  is_posted: boolean;
  posted_at: string | null;
  transaction_id: string | null;
}

export const DepreciationScheduleTable = ({ assets }: Props) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [confirmPost, setConfirmPost] = useState<ScheduleLine | null>(null);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  const { data: schedule = [], isLoading } = useQuery({
    queryKey: ["depreciation-schedule", selectedAssetId],
    queryFn: async (): Promise<ScheduleLine[]> => {
      if (!selectedAssetId) return [];
      const { data, error } = await supabase
        .from("depreciation_schedule")
        .select("*")
        .eq("fixed_asset_id", selectedAssetId)
        .order("period_start", { ascending: true });
      if (error) {
        console.error("Error loading depreciation schedule:", error);
        return [];
      }
      return (data as ScheduleLine[]) || [];
    },
    enabled: !!selectedAssetId,
  });

  const postDepreciation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase.rpc("post_depreciation", {
        p_schedule_id: scheduleId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["depreciation-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Dotation comptabilisée (681 → 28x)");
      setConfirmPost(null);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const postedCount = schedule.filter((s) => s.is_posted).length;
  const pendingCount = schedule.filter((s) => !s.is_posted).length;
  const totalDepreciation = schedule.reduce((s, l) => s + l.depreciation_amount, 0);

  // Find next line eligible for posting (sequential order)
  const nextPostable = schedule.find((s) => !s.is_posted);

  return (
    <div className="space-y-4">
      {/* Asset selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Tableau d'amortissements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Sélectionner une immobilisation" />
            </SelectTrigger>
            <SelectContent>
              {assets.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.asset_name} — {a.account_number} ({formatCurrency(a.acquisition_cost)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedAsset && schedule.length > 0 && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Durée</p>
                <p className="text-lg font-bold">{selectedAsset.useful_life_years} ans</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Dotation totale</p>
                <p className="text-lg font-bold">{formatCurrency(totalDepreciation)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" /> Comptabilisées
                </p>
                <p className="text-lg font-bold text-green-600">{postedCount} / {schedule.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-orange-500" /> En attente
                </p>
                <p className="text-lg font-bold text-orange-600">{pendingCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Schedule table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Année</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead className="text-right">Dotation</TableHead>
                    <TableHead className="text-right">Amort. cumulé</TableHead>
                    <TableHead className="text-right">VNC</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((line, idx) => {
                    const isNextPostable = nextPostable?.id === line.id;
                    return (
                      <TableRow
                        key={line.id}
                        className={line.is_posted ? "bg-muted/30" : isNextPostable ? "bg-accent/10" : ""}
                      >
                        <TableCell className="font-medium">An {idx + 1}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(line.period_start), "dd/MM/yyyy")} → {format(new Date(line.period_end), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(line.depreciation_amount)}</TableCell>
                        <TableCell className="text-right text-destructive">
                          {formatCurrency(line.cumulative_depreciation)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(line.net_book_value)}</TableCell>
                        <TableCell>
                          {line.is_posted ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Comptabilisée
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" /> En attente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!line.is_posted && isNextPostable && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setConfirmPost(line)}
                            >
                              Comptabiliser
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {selectedAssetId && !isLoading && schedule.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            <p>Aucun plan d'amortissement généré pour cette immobilisation.</p>
            <p className="text-xs">Le plan est généré automatiquement à la création de l'actif.</p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation dialog */}
      <Dialog open={!!confirmPost} onOpenChange={() => setConfirmPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comptabiliser la dotation</DialogTitle>
          </DialogHeader>
          {confirmPost && selectedAsset && (
            <div className="space-y-3">
              <p className="text-sm">
                <strong>{selectedAsset.asset_name}</strong> — Période:{" "}
                {format(new Date(confirmPost.period_start), "MMM yyyy", { locale: fr })} →{" "}
                {format(new Date(confirmPost.period_end), "MMM yyyy", { locale: fr })}
              </p>
              <Card className="bg-accent/10 border-accent">
                <CardContent className="pt-3 text-sm space-y-1">
                  <p className="font-medium">Écritures générées:</p>
                  <p>• Débit 681 — Dotations aux amortissements: {formatCurrency(confirmPost.depreciation_amount)}</p>
                  <p>• Crédit 28{selectedAsset.account_number.slice(1)} — Amortissement: {formatCurrency(confirmPost.depreciation_amount)}</p>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPost(null)}>Annuler</Button>
            <Button
              onClick={() => confirmPost && postDepreciation.mutate(confirmPost.id)}
              disabled={postDepreciation.isPending}
            >
              {postDepreciation.isPending ? "En cours..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
