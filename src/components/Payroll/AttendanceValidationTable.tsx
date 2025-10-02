import { format, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, Filter, Calendar, Users, DollarSign, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTeamAttendance, useValidateAttendance } from "@/hooks/useTeamAttendance";
import { useTeams } from "@/hooks/useTeams";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export function AttendanceValidationTable() {
  const { teams } = useTeams();
  const validateAttendance = useValidateAttendance();
  
  // Filters state
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Build filters
  const filters: any = {};
  if (selectedTeam !== 'all') filters.teamId = selectedTeam;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;

  // Fetch pending and recent validated attendances
  const { data: pendingAttendances = [], isLoading: isPendingLoading } = useTeamAttendance({ 
    ...filters, 
    status: 'pending' 
  });
  
  const { data: validatedAttendances = [], isLoading: isValidatedLoading } = useTeamAttendance({ 
    ...filters, 
    status: 'validated' 
  });

  const { data: allAttendances = [] } = useTeamAttendance(filters);

  // Calculate statistics
  const totalPending = pendingAttendances.length;
  const totalPendingAmount = pendingAttendances.reduce((sum, a) => sum + Number(a.calculated_amount), 0);
  const totalValidatedThisMonth = validatedAttendances.length;
  const totalValidatedAmount = validatedAttendances.reduce((sum, a) => sum + Number(a.calculated_amount), 0);
  
  // Group by team for statistics
  const teamStats = pendingAttendances.reduce((acc: any, attendance) => {
    const teamName = attendance.teams?.name || 'Sans équipe';
    if (!acc[teamName]) {
      acc[teamName] = { count: 0, amount: 0 };
    }
    acc[teamName].count += 1;
    acc[teamName].amount += Number(attendance.calculated_amount);
    return acc;
  }, {});

  const handleValidate = async (id: string) => {
    await validateAttendance.mutateAsync(id);
    setSelectedIds(prev => prev.filter(sid => sid !== id));
  };

  const handleValidateSelected = async () => {
    for (const id of selectedIds) {
      await validateAttendance.mutateAsync(id);
    }
    setSelectedIds([]);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingAttendances.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingAttendances.map(a => a.id));
    }
  };

  const isLoading = isPendingLoading || isValidatedLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Chargement des pointages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalPending}</div>
            <p className="text-xs text-muted-foreground">
              {totalPendingAmount.toLocaleString()} FCFA à valider
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validés ce mois</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalValidatedThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {totalValidatedAmount.toLocaleString()} FCFA validés
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Équipes actives</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(teamStats).length}</div>
            <p className="text-xs text-muted-foreground">
              Équipes avec pointages en attente
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total période</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allAttendances.length}</div>
            <p className="text-xs text-muted-foreground">
              Pointages dans la période
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Équipe</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les équipes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les équipes</SelectItem>
                  {teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date de début</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Statistics */}
      {Object.keys(teamStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif par équipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(teamStats).map(([teamName, stats]: [string, any]) => (
                <div key={teamName} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{teamName}</p>
                      <p className="text-sm text-muted-foreground">{stats.count} pointage(s)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{stats.amount.toLocaleString()} FCFA</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Attendances Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pointages en attente de validation</CardTitle>
              <CardDescription>
                Validez les pointages pour envoyer une notification au comptable
              </CardDescription>
            </div>
            {selectedIds.length > 0 && (
              <Button
                onClick={handleValidateSelected}
                disabled={validateAttendance.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Valider {selectedIds.length} sélectionné(s)
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!pendingAttendances || pendingAttendances.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Aucun pointage en attente</p>
              <p className="text-sm text-muted-foreground">
                Tous les pointages ont été validés pour la période sélectionnée
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === pendingAttendances.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Équipe</TableHead>
                    <TableHead>Employé</TableHead>
                    <TableHead className="text-right">Heures</TableHead>
                    <TableHead className="text-right">Taux/h</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingAttendances.map((attendance) => (
                    <TableRow key={attendance.id} className={selectedIds.includes(attendance.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(attendance.id)}
                          onCheckedChange={() => toggleSelection(attendance.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(attendance.attendance_date), "dd MMM yyyy", { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{attendance.teams?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{attendance.employees?.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {attendance.employees?.employee_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{attendance.hours_worked}h</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {attendance.daily_rate.toLocaleString()} FCFA
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-bold text-primary">
                          {attendance.calculated_amount.toLocaleString()} FCFA
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {attendance.notes ? (
                          <p className="text-sm text-muted-foreground truncate" title={attendance.notes}>
                            {attendance.notes}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Aucune note</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          onClick={() => handleValidate(attendance.id)}
                          disabled={validateAttendance.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Valider
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Validated */}
      {validatedAttendances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Récemment validés
            </CardTitle>
            <CardDescription>
              Les 10 derniers pointages validés dans la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {validatedAttendances.slice(0, 10).map((attendance) => (
                <div 
                  key={attendance.id} 
                  className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950/20"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{attendance.employees?.full_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {attendance.teams?.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(attendance.attendance_date), "dd MMM yyyy", { locale: fr })} 
                        {" • "}
                        {attendance.hours_worked}h
                        {attendance.validated_at && (
                          <> • Validé le {format(new Date(attendance.validated_at), "dd/MM à HH:mm", { locale: fr })}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-bold text-green-700">
                      {attendance.calculated_amount.toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
