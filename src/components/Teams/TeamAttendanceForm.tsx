import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Team } from "@/hooks/useTeams";
import { useCreateAttendance } from "@/hooks/useTeamAttendance";
import { CalendarDays, Clock, Users } from "lucide-react";
import { format } from "date-fns";

interface TeamAttendanceFormProps {
  teams: Team[];
}

export const TeamAttendanceForm = ({ teams }: TeamAttendanceFormProps) => {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [hoursWorked, setHoursWorked] = useState("8");
  const [dailyRate, setDailyRate] = useState("");
  const [notes, setNotes] = useState("");

  const { mutateAsync: createAttendance, isPending } = useCreateAttendance();

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const teamMembers = selectedTeam?.members || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !selectedEmployeeId) return;

    await createAttendance({
      team_id: selectedTeamId,
      employee_id: selectedEmployeeId,
      attendance_date: attendanceDate,
      hours_worked: Number(hoursWorked) || 8,
      daily_rate: Number(dailyRate) || 0,
      notes: notes || undefined,
    } as any);

    // Reset form
    setSelectedEmployeeId("");
    setHoursWorked("8");
    setDailyRate("");
    setNotes("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Enregistrer un pointage
        </CardTitle>
        <CardDescription>
          Saisissez les heures travaillées pour un membre d'équipe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Équipe</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une équipe" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {team.name} ({team.members.length} membres)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Membre</Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
                disabled={!selectedTeamId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.length > 0 ? (
                    teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.employee_id}>
                        {member.full_name}
                        {member.role && ` (${member.role})`}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Aucun membre dans cette équipe
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendance-date">Date</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="attendance-date"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours-worked">Heures travaillées</Label>
              <Input
                id="hours-worked"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                placeholder="8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="daily-rate">Taux journalier (FCFA)</Label>
              <Input
                id="daily-rate"
                type="number"
                min="0"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                placeholder="5000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations sur le travail effectué..."
              rows={2}
            />
          </div>

          <Button
            type="submit"
            disabled={isPending || !selectedTeamId || !selectedEmployeeId}
            className="w-full md:w-auto"
          >
            {isPending ? "Enregistrement..." : "Enregistrer le pointage"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
