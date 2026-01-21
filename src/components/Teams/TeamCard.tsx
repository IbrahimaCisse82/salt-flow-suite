import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  UserMinus, 
  Settings2, 
  Trash2,
  Target,
  TrendingUp,
  Users as UsersIcon
} from "lucide-react";
import { Team, TeamMember } from "@/hooks/useTeams";

interface TeamCardProps {
  team: Team;
  isManager: boolean;
  onAddMember: (team: Team) => void;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onRemoveMember: (member: TeamMember) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "text-primary border-primary/20 bg-primary/10";
    case "repos":
      return "text-accent-foreground border-accent/20 bg-accent/10";
    default:
      return "text-muted-foreground border-border bg-muted/30";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "En activité";
    case "repos":
      return "Repos";
    default:
      return "Inactive";
  }
};

export const TeamCard = ({
  team,
  isManager,
  onAddMember,
  onEdit,
  onDelete,
  onRemoveMember,
}: TeamCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">{team.name}</h3>
              <Badge variant="outline" className={getStatusColor(team.status)}>
                {getStatusLabel(team.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Chef: {team.leader?.full_name || "Non assigné"}
            </p>
            {team.sector && (
              <p className="text-xs text-muted-foreground mt-1">
                Secteur: {team.sector}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold text-primary">
                {team.members.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">membres</p>
          </div>
        </div>

        {/* Membres */}
        {team.members.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {team.members.map((member) => (
              <Badge
                key={member.id}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {member.full_name}
                {member.role && (
                  <span className="text-xs opacity-70">({member.role})</span>
                )}
                {isManager && (
                  <button
                    onClick={() => onRemoveMember(member)}
                    className="ml-1 hover:text-destructive"
                    title="Retirer de l'équipe"
                  >
                    <UserMinus className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats et actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <Target className="h-3 w-3" />
              Objectif
            </div>
            <p className="font-semibold">{team.production_target} T</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              Efficacité
            </div>
            <p className="font-semibold text-primary">
              {team.efficiency_rate}%
            </p>
          </div>
          {isManager && (
            <div className="col-span-2 flex items-end justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddMember(team)}
                className="gap-1"
              >
                <UserPlus className="h-4 w-4" />
                Ajouter
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(team)}
                className="gap-1"
              >
                <Settings2 className="h-4 w-4" />
                Gérer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(team)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};