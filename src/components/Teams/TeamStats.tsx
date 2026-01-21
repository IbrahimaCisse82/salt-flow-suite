import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, TrendingUp, Clock } from "lucide-react";
import { Team } from "@/hooks/useTeams";

interface TeamStatsProps {
  teams: Team[];
}

export const TeamStats = ({ teams }: TeamStatsProps) => {
  const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0);
  const totalTarget = teams.reduce((sum, team) => sum + team.production_target, 0);
  const avgEfficiency = teams.length > 0
    ? teams.reduce((sum, team) => sum + team.efficiency_rate, 0) / teams.length
    : 0;
  const activeTeams = teams.filter(t => t.status === "active").length;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Équipes actives</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeTeams}</div>
          <p className="text-xs text-muted-foreground">
            sur {teams.length} équipes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Membres total</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMembers}</div>
          <p className="text-xs text-muted-foreground">
            Moyenne: {teams.length > 0 ? (totalMembers / teams.length).toFixed(1) : 0} / équipe
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Objectif total</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTarget.toFixed(1)} T</div>
          <p className="text-xs text-muted-foreground">
            Production cible
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Efficacité moyenne</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgEfficiency.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Performance globale
          </p>
        </CardContent>
      </Card>
    </div>
  );
};