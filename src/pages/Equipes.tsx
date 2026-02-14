import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, RefreshCw, Clock, BarChart3, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { useEmployees } from "@/hooks/useEmployees";
import { useTeams, Team, TeamMember } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamCard } from "@/components/Teams/TeamCard";
import { TeamStats } from "@/components/Teams/TeamStats";
import { TeamAttendanceForm } from "@/components/Teams/TeamAttendanceForm";
import { TeamAttendanceList } from "@/components/Teams/TeamAttendanceList";
import { TeamPerformance } from "@/components/Teams/TeamPerformance";
import { EmployeeManagement } from "@/components/Teams/EmployeeManagement";
import { CreateTeamDialog, EditTeamDialog, AddMemberDialog, DeleteTeamDialog } from "@/components/Teams/TeamDialogs";

const Equipes = () => {
  const { isOpen } = useSidebar();
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState("equipes");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamSector, setNewTeamSector] = useState("");
  const [newTeamTarget, setNewTeamTarget] = useState("0");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const { data: employees = [] } = useEmployees();
  const {
    teams, isLoading, createTeam, updateTeam, deleteTeam,
    addMember, removeMember, initializeDefaultTeams, isCreating, isUpdating,
  } = useTeams();

  const isManager = profile?.role === "admin" || profile?.role === "gerant";

  const availableEmployees = employees.filter((emp) => {
    if (!selectedTeam) return emp.is_active;
    return emp.is_active && !selectedTeam.members.some((m) => m.employee_id === emp.id);
  });

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    await createTeam({ name: newTeamName.trim(), sector: newTeamSector || null, status: "active", production_target: Number(newTeamTarget) || 0 });
    setNewTeamName(""); setNewTeamSector(""); setNewTeamTarget("0"); setIsCreateDialogOpen(false);
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam) return;
    await updateTeam({ id: selectedTeam.id, name: selectedTeam.name, sector: selectedTeam.sector, status: selectedTeam.status, leader_id: selectedTeam.leader_id, production_target: selectedTeam.production_target });
    setIsEditDialogOpen(false);
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;
    await deleteTeam(selectedTeam.id);
    setSelectedTeam(null); setIsDeleteDialogOpen(false);
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedEmployeeId) return;
    await addMember({ team_id: selectedTeam.id, employee_id: selectedEmployeeId, role: selectedRole || undefined });
    setSelectedEmployeeId(""); setSelectedRole(""); setIsAddMemberDialogOpen(false);
  };

  const handleRemoveMember = async (member: TeamMember) => { await removeMember(member.id); };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 transition-all duration-300", isOpen ? "md:ml-64" : "md:ml-16")}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Gestion des équipes</h1>
              <p className="text-muted-foreground">Organisez vos équipes de terrain pour la production de sel</p>
            </div>
            {isManager && activeTab === "equipes" && (
              <div className="flex gap-2">
                {teams.length === 0 && (
                  <Button variant="outline" onClick={initializeDefaultTeams} className="gap-2">
                    <RefreshCw className="h-4 w-4" />Créer équipes par défaut
                  </Button>
                )}
                <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 bg-gradient-to-r from-primary to-accent">
                  <Plus className="h-4 w-4" />Nouvelle équipe
                </Button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="employes" className="gap-2"><UserPlus className="h-4 w-4" /><span className="hidden sm:inline">Employés</span></TabsTrigger>
              <TabsTrigger value="equipes" className="gap-2"><Users className="h-4 w-4" /><span className="hidden sm:inline">Équipes</span></TabsTrigger>
              <TabsTrigger value="pointage" className="gap-2"><Clock className="h-4 w-4" /><span className="hidden sm:inline">Pointage</span></TabsTrigger>
              <TabsTrigger value="performance" className="gap-2"><BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">Performance</span></TabsTrigger>
            </TabsList>

            <TabsContent value="employes" className="space-y-6">
              <EmployeeManagement isManager={isManager} />
            </TabsContent>

            <TabsContent value="equipes" className="space-y-6">
              {teams.length > 0 && <TeamStats teams={teams} />}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />Équipes de terrain ({teams.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
                  ) : teams.length > 0 ? (
                    <div className="space-y-4">
                      {teams.map((team) => (
                        <TeamCard key={team.id} team={team} isManager={isManager}
                          onAddMember={(t) => { setSelectedTeam(t); setIsAddMemberDialogOpen(true); }}
                          onEdit={(t) => { setSelectedTeam({ ...t }); setIsEditDialogOpen(true); }}
                          onDelete={(t) => { setSelectedTeam(t); setIsDeleteDialogOpen(true); }}
                          onRemoveMember={handleRemoveMember}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-4">Aucune équipe créée</p>
                      {isManager && (
                        <Button onClick={initializeDefaultTeams} variant="outline" className="gap-2">
                          <RefreshCw className="h-4 w-4" />Créer les équipes par défaut
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pointage" className="space-y-6">
              {isManager && <TeamAttendanceForm teams={teams} />}
              <TeamAttendanceList teams={teams} />
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <TeamPerformance teams={teams} />
            </TabsContent>
          </Tabs>

          {/* Dialogs */}
          <CreateTeamDialog
            isOpen={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}
            name={newTeamName} setName={setNewTeamName}
            sector={newTeamSector} setSector={setNewTeamSector}
            target={newTeamTarget} setTarget={setNewTeamTarget}
            onCreate={handleCreateTeam} isCreating={isCreating}
          />
          <EditTeamDialog
            isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}
            team={selectedTeam} setTeam={setSelectedTeam as any}
            employees={employees} onUpdate={handleUpdateTeam} isUpdating={isUpdating}
          />
          <AddMemberDialog
            isOpen={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}
            teamName={selectedTeam?.name || ""}
            availableEmployees={availableEmployees}
            selectedEmployeeId={selectedEmployeeId} setSelectedEmployeeId={setSelectedEmployeeId}
            selectedRole={selectedRole} setSelectedRole={setSelectedRole}
            onAdd={handleAddMember}
          />
          <DeleteTeamDialog
            isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}
            teamName={selectedTeam?.name || ""} onDelete={handleDeleteTeam}
          />
        </main>
      </div>
    </div>
  );
};

export default Equipes;
