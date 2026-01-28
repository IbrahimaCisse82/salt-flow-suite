import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Team } from "@/hooks/useTeams";
import { useTeamAttendance, useValidateAttendance, TeamAttendance } from "@/hooks/useTeamAttendance";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, Clock, Filter, ListChecks } from "lucide-react";

interface TeamAttendanceListProps {
  teams: Team[];
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "validated":
      return <Badge variant="default">Validé</Badge>;
    case "paid":
      return <Badge className="bg-accent/20 text-accent-foreground border-accent/30">Payé</Badge>;
    default:
      return <Badge variant="secondary">En attente</Badge>;
  }
};

export const TeamAttendanceList = ({ teams }: TeamAttendanceListProps) => {
  const [filterTeamId, setFilterTeamId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [filterDateTo, setFilterDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: attendances = [], isLoading } = useTeamAttendance({
    teamId: filterTeamId || undefined,
    status: filterStatus || undefined,
    dateFrom: filterDateFrom || undefined,
    dateTo: filterDateTo || undefined,
  });

  const { mutateAsync: validateAttendance, isPending: isValidating } = useValidateAttendance();

  const handleValidate = async (attendanceId: string) => {
    await validateAttendance(attendanceId);
  };

  const totalAmount = attendances.reduce((sum, a) => sum + (a.calculated_amount || 0), 0);
  const pendingCount = attendances.filter((a) => a.status === "pending").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          Historique des pointages
        </CardTitle>
        <CardDescription>
          Consultez et validez les pointages des équipes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtres */}
        <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtres:</span>
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs">Équipe</Label>
            <Select value={filterTeamId} onValueChange={setFilterTeamId}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les équipes</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Statut</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="validated">Validé</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Du</Label>
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-36"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Au</Label>
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-36"
            />
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-primary/5 rounded-lg">
            <p className="text-xs text-muted-foreground">Total pointages</p>
            <p className="text-xl font-bold">{attendances.length}</p>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg">
            <p className="text-xs text-muted-foreground">En attente</p>
            <p className="text-xl font-bold text-secondary-foreground">{pendingCount}</p>
          </div>
          <div className="p-3 bg-accent/10 rounded-lg col-span-2">
            <p className="text-xs text-muted-foreground">Montant total</p>
            <p className="text-xl font-bold text-primary">
              {totalAmount.toLocaleString()} FCFA
            </p>
          </div>
        </div>

        {/* Tableau */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : attendances.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Équipe</TableHead>
                  <TableHead>Employé</TableHead>
                  <TableHead className="text-center">Heures</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell className="font-medium">
                      {format(new Date(attendance.attendance_date), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>{attendance.teams?.name || "-"}</TableCell>
                    <TableCell>
                      <div>
                        <p>{attendance.employees?.full_name || "-"}</p>
                        <p className="text-xs text-muted-foreground">
                          {attendance.employees?.employee_number}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        {attendance.hours_worked}h
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {attendance.calculated_amount?.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(attendance.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {attendance.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleValidate(attendance.id)}
                          disabled={isValidating}
                          className="gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Valider
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Aucun pointage trouvé</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
