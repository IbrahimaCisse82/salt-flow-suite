import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePendingPayrollAttendance } from "@/hooks/useTeamAttendance";

export function AccountantNotificationWidget() {
  const { data: pendingAttendances = [], isLoading } = usePendingPayrollAttendance();

  const totalPending = pendingAttendances.reduce((sum, a) => sum + (a.calculated_amount || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications RH
            </CardTitle>
            <CardDescription>Paiements en attente</CardDescription>
          </div>
          {pendingAttendances.length > 0 && (
            <Badge variant="destructive" className="h-6 px-2">
              {pendingAttendances.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : pendingAttendances.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {/* Résumé total */}
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total en attente</span>
                  <span className="font-bold text-primary">
                    {totalPending.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              {/* Liste des pointages validés en attente de paiement */}
              {pendingAttendances.map((attendance) => (
                <div
                  key={attendance.id}
                  className="p-4 border rounded-lg bg-accent/50 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        <h5 className="font-medium">
                          {attendance.employees?.full_name || 'Employé'}
                        </h5>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pointage validé - {attendance.teams?.name || 'Équipe'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          {format(new Date(attendance.attendance_date), "dd MMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                        <span>{attendance.hours_worked}h travaillées</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-primary">
                        {(attendance.calculated_amount || 0).toLocaleString()} FCFA
                      </span>
                      <Badge variant="secondary" className="mt-1 block">
                        À payer
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
