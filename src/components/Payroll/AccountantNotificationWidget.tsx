import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, Wallet, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePendingPayrollAttendance } from "@/hooks/useTeamAttendance";
import { usePayrollPayments } from "@/hooks/usePayrollPayments";

export function AccountantNotificationWidget() {
  const { data: pendingAttendances = [], isLoading } = usePendingPayrollAttendance();
  const { data: allPayments = [] } = usePayrollPayments();

  // Calculer le montant déjà payé par pointage
  const getPaidAmountForAttendance = (attendanceId: string) => {
    return allPayments
      .filter(p => p.attendance_id === attendanceId)
      .reduce((sum, p) => sum + (p.paid_amount || 0), 0);
  };

  // Calculer le reliquat pour chaque pointage
  const attendancesWithBalance = pendingAttendances.map(attendance => {
    const paidAmount = getPaidAmountForAttendance(attendance.id);
    const remainingBalance = (attendance.calculated_amount || 0) - paidAmount;
    return {
      ...attendance,
      paidAmount,
      remainingBalance,
      hasPartialPayment: paidAmount > 0
    };
  });

  const totalPending = attendancesWithBalance.reduce((sum, a) => sum + a.remainingBalance, 0);

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
          {attendancesWithBalance.length > 0 && (
            <Badge variant="destructive" className="h-6 px-2">
              {attendancesWithBalance.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : attendancesWithBalance.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {/* Résumé total */}
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total restant à payer</span>
                  <span className="font-bold text-primary">
                    {totalPending.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              {/* Liste des pointages validés en attente de paiement */}
              {attendancesWithBalance.map((attendance) => (
                <div
                  key={attendance.id}
                  className={`p-4 border rounded-lg space-y-2 ${
                    attendance.hasPartialPayment 
                      ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800' 
                      : 'bg-accent/50'
                  }`}
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
                      
                      {/* Afficher le détail si paiement partiel */}
                      {attendance.hasPartialPayment && (
                        <div className="mt-2 text-xs space-y-1">
                          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            <AlertCircle className="h-3 w-3" />
                            <span>Paiement partiel effectué</span>
                          </div>
                          <div className="text-muted-foreground">
                            Total: {(attendance.calculated_amount || 0).toLocaleString()} FCFA • 
                            Payé: {attendance.paidAmount.toLocaleString()} FCFA
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`font-medium ${
                        attendance.hasPartialPayment 
                          ? 'text-orange-600 dark:text-orange-400' 
                          : 'text-primary'
                      }`}>
                        {attendance.remainingBalance.toLocaleString()} FCFA
                      </span>
                      <Badge 
                        variant={attendance.hasPartialPayment ? "outline" : "secondary"} 
                        className={`mt-1 block ${
                          attendance.hasPartialPayment 
                            ? 'border-orange-500 text-orange-600 dark:text-orange-400' 
                            : ''
                        }`}
                      >
                        {attendance.hasPartialPayment ? 'Reliquat' : 'À payer'}
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
