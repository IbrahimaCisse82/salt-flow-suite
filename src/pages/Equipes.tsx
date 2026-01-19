import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/contexts/SidebarContext";
import { logger } from "@/utils/logger";
import { useEmployees } from "@/hooks/useEmployees";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";

// -------------------
// Interfaces TypeScript
// -------------------
interface Employee {
  id: string;
  full_name: string;
  position?: string;
  employee_type: "permanent" | "journalier" | "saisonnier";
  is_active: boolean;
}

interface Team {
  id: string;
  name: string;
  leader_id?: string;
  supervisor?: Employee[];
  sector?: string;
  status?: "active" | "repos";
  members?: Employee[];
  production_target?: number;
  efficiency_rate?: number;
}

// -------------------
// Composant principal
// -------------------
const Equipes = () => {
  const { toast } = useToast();
  const { isOpen } = useSidebar();
  const { profile } = useAuth();

  // Dialogs
  const [isManageTeamDialogOpen, setIsManageTeamDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Données
  const { data: employees = [] } = useEmployees();
  const { data: teams = [], createTeam, updateTeam } = useTeams();

  const userRole = profile?.role;
  const canViewSalary = userRole === "admin" || userRole === "gerant" || userRole === "comptable";

  // Filtrage employés permanents actifs
  const permanentEmployees = employees.filter(
    (e) => e.employee_type === "permanent" && e.is_active
  );

  // -------------------
  // Handlers
  // -------------------
  const handleManageTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsManageTeamDialogOpen(true);
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    try {
      await updateTeam({
        id: selectedTeam.id,
        name: selectedTeam.name,
        supervisor_id: selectedTeam.leader_id || null,
        sector: selectedTeam.sector,
        status: selectedTeam.status,
      });
      setIsManageTeamDialogOpen(false);
    } catch (error) {
      logger.error("Team update error:", error);
      toast({ title: "Erreur", description: "Impossible de mettre à jour l'équipe." });
    }
  };

  // -------------------
  // Render
  // -------------------
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main
          className={cn(
            "flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 transition-all duration-300",
            isOpen ? "md:ml-64" : "md:ml-16"
          )}
        >
          {/* Liste des équipes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Équipes de terrain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(teams) && teams.length > 0 ? (
                  teams.map((team) => (
                    <div
                      key={team.id}
                      className="p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{team.name}</h3>
                            <Badge
                              variant="outline"
                              className={
                                team.status === "active"
                                  ? "text-green-600 border-green-600"
                                  : "text-yellow-600 border-yellow-600"
                              }
                            >
                              {team.status === "active" ? "En activité" : "Repos"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Chef:{" "}
                            {Array.isArray(team.supervisor) &&
                            team.supervisor.length > 0
                              ? team.supervisor[0].full_name
                              : "Non assigné"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {Array.isArray(team.members) ? team.members.length : 0}
                          </p>
                          <p className="text-xs text-muted-foreground">membres</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Objectif</p>
                          <p className="font-semibold">
                            {team.production_target || 0} T
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Efficacité</p>
                          <p className="font-semibold text-primary">
                            {team.efficiency_rate || 0}%
                          </p>
                        </div>
                        <div className="flex items-end justify-end">
                          <Button
                            onClick={() => handleManageTeam(team)}
                            variant="outline"
                            size="sm"
                          >
                            Gérer équipe
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune équipe créée
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Equipes;
