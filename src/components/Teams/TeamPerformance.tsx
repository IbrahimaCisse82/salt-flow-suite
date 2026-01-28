import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Team } from "@/hooks/useTeams";
import { BarChart3, Target, TrendingUp, Users, Award } from "lucide-react";

interface TeamPerformanceProps {
  teams: Team[];
}

const getPerformanceColor = (rate: number) => {
  if (rate >= 90) return "text-green-600";
  if (rate >= 70) return "text-yellow-600";
  return "text-red-600";
};

const getPerformanceLabel = (rate: number) => {
  if (rate >= 90) return { text: "Excellent", variant: "default" as const };
  if (rate >= 70) return { text: "Bon", variant: "secondary" as const };
  if (rate >= 50) return { text: "Moyen", variant: "outline" as const };
  return { text: "À améliorer", variant: "destructive" as const };
};

export const TeamPerformance = ({ teams }: TeamPerformanceProps) => {
  const activeTeams = teams.filter((t) => t.status === "active");
  const avgEfficiency = activeTeams.length > 0
    ? activeTeams.reduce((sum, t) => sum + t.efficiency_rate, 0) / activeTeams.length
    : 0;
  const totalTarget = teams.reduce((sum, t) => sum + t.production_target, 0);
  const topTeam = [...teams].sort((a, b) => b.efficiency_rate - a.efficiency_rate)[0];

  // Tri des équipes par performance
  const sortedTeams = [...teams].sort((a, b) => b.efficiency_rate - a.efficiency_rate);

  return (
    <div className="space-y-6">
      {/* Stats globales */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficacité moyenne</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(avgEfficiency)}`}>
              {avgEfficiency.toFixed(1)}%
            </div>
            <Progress value={avgEfficiency} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objectif global</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTarget.toFixed(1)} T</div>
            <p className="text-xs text-muted-foreground mt-1">
              Réparti sur {activeTeams.length} équipes actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilleure équipe</CardTitle>
            <Award className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {topTeam?.name || "-"}
            </div>
            {topTeam && (
              <p className="text-xs text-muted-foreground mt-1">
                {topTeam.efficiency_rate}% d'efficacité
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total membres</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teams.reduce((sum, t) => sum + t.members.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              personnes mobilisées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Classement des équipes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Classement par performance
          </CardTitle>
          <CardDescription>
            Performance des équipes basée sur leur taux d'efficacité
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedTeams.length > 0 ? (
            <div className="space-y-4">
              {sortedTeams.map((team, index) => {
                const perf = getPerformanceLabel(team.efficiency_rate);
                return (
                  <div
                    key={team.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{team.name}</h4>
                        <Badge variant={perf.variant}>{perf.text}</Badge>
                        {team.status !== "active" && (
                          <Badge variant="outline" className="text-xs">
                            {team.status === "repos" ? "Repos" : "Inactive"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {team.members.length} membres
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {team.production_target} T
                        </span>
                        {team.leader && (
                          <span>Chef: {team.leader.full_name}</span>
                        )}
                      </div>
                    </div>

                    <div className="w-32 hidden sm:block">
                      <Progress value={team.efficiency_rate} className="h-2" />
                    </div>

                    <div className={`text-right font-bold ${getPerformanceColor(team.efficiency_rate)}`}>
                      {team.efficiency_rate}%
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Aucune équipe à afficher</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
