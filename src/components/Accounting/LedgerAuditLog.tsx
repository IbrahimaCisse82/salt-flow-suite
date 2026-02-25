import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/hooks/useTenantId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle2, Ban } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { LedgerAuditLogRow } from "@/types/database.types";

const ACTION_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "destructive" | "outline" | "secondary" }> = {
  validation: { label: "Validation", icon: <CheckCircle2 className="h-3 w-3" />, variant: "default" },
  blocked_update: { label: "Modif. bloquée", icon: <Ban className="h-3 w-3" />, variant: "destructive" },
  blocked_delete: { label: "Suppr. bloquée", icon: <AlertTriangle className="h-3 w-3" />, variant: "destructive" },
};

export const LedgerAuditLog = () => {
  const tenantId = useTenantId();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["ledger-audit-log", tenantId],
    queryFn: async (): Promise<LedgerAuditLogRow[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("ledger_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("Error loading audit log:", error);
        return [];
      }
      return (data as LedgerAuditLogRow[]) || [];
    },
    enabled: !!tenantId,
  });

  if (isLoading) return null;
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Aucune activité dans le journal d'audit</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5" />
          Journal d'audit du Grand Livre
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Détails</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const config = ACTION_CONFIG[log.action_type] || ACTION_CONFIG.blocked_update;
              const details = log.details as Record<string, unknown> | null;
              return (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={config.variant} className="gap-1">
                      {config.icon} {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{log.table_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {details?.reason
                      ? String(details.reason)
                      : details?.total_debit != null
                        ? `D: ${details.total_debit} / C: ${details.total_credit}`
                        : JSON.stringify(details).slice(0, 80)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
