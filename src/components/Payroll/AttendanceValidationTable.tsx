import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTeamAttendance, useValidateAttendance } from "@/hooks/useTeamAttendance";

export function AttendanceValidationTable() {
  const { data: attendances, isLoading } = useTeamAttendance({ status: 'pending' });
  const validateAttendance = useValidateAttendance();

  const handleValidate = async (id: string) => {
    await validateAttendance.mutateAsync(id);
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pointages en attente de validation</CardTitle>
        <CardDescription>Validez les pointages pour notifier le comptable</CardDescription>
      </CardHeader>
      <CardContent>
        {!attendances || attendances.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun pointage en attente de validation
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Équipe</TableHead>
                <TableHead>Employé</TableHead>
                <TableHead className="text-right">Heures</TableHead>
                <TableHead className="text-right">Taux/h</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendances.map((attendance) => (
                <TableRow key={attendance.id}>
                  <TableCell>
                    {format(new Date(attendance.attendance_date), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell>{attendance.teams?.name}</TableCell>
                  <TableCell>
                    {attendance.employees?.full_name}
                    <div className="text-sm text-muted-foreground">
                      {attendance.employees?.employee_number}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{attendance.hours_worked}</TableCell>
                  <TableCell className="text-right">
                    {attendance.daily_rate.toLocaleString()} FCFA
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {attendance.calculated_amount.toLocaleString()} FCFA
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">En attente</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      onClick={() => handleValidate(attendance.id)}
                      disabled={validateAttendance.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
