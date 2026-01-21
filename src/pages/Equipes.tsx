import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Plus, 
  UserPlus, 
  UserMinus, 
  Settings2, 
  Trash2,
  RefreshCw,
  Target,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { useEmployees } from "@/hooks/useEmployees";
import { useTeams, Team, TeamMember } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const Equipes = () => {
  const { isOpen } = useSidebar();
  const { profile } = useAuth();

  // Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // États
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamSector, setNewTeamSector] = useState("");
  const [newTeamTarget, setNewTeamTarget] = useState("0");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  // Données
  const { data: employees = [] } = useEmployees();
  const { 
    teams, 
    isLoading, 
    createTeam, 
    updateTeam, 
    deleteTeam,
    addMember,
    removeMember,
    initializeDefaultTeams,
    isCreating,
    isUpdating
  } = useTeams();

  const isManager = profile?.role === "admin" || profile?.role === "gerant";

  // Employés disponibles (pas encore dans l'équipe sélectionnée)
  const availableEmployees = employees.filter((emp) => {
    if (!selectedTeam) return emp.is_active;
    const isMember = selectedTeam.members.some((m) => m.employee_id === emp.id);
    return emp.is_active && !isMember;
  });

  // Handlers
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    
    await createTeam({
      name: newTeamName.trim(),
      sector: newTeamSector || null,
      status: "active",
      production_target: Number(newTeamTarget) || 0,
    });
    
    setNewTeamName("");
    setNewTeamSector("");
    setNewTeamTarget("0");
    setIsCreateDialogOpen(false);
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam) return;
    
    await updateTeam({
      id: selectedTeam.id,
      name: selectedTeam.name,
      sector: selectedTeam.sector,
      status: selectedTeam.status,
      leader_id: selectedTeam.leader_id,
      production_target: selectedTeam.production_target,
    });
    
    setIsEditDialogOpen(false);
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;
    
    await deleteTeam(selectedTeam.id);
    setSelectedTeam(null);
    setIsDeleteDialogOpen(false);
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedEmployeeId) return;
    
    await addMember({
      team_id: selectedTeam.id,
      employee_id: selectedEmployeeId,
      role: selectedRole || undefined,
    });
    
    setSelectedEmployeeId("");
    setSelectedRole("");
    setIsAddMemberDialogOpen(false);
  };

  const handleRemoveMember = async (member: TeamMember) => {
    await removeMember(member.id);
  };

  const openEditDialog = (team: Team) => {
    setSelectedTeam({ ...team });
    setIsEditDialogOpen(true);
  };

  const openAddMemberDialog = (team: Team) => {
    setSelectedTeam(team);
    setIsAddMemberDialogOpen(true);
  };

  const openDeleteDialog = (team: Team) => {
    setSelectedTeam(team);
    setIsDeleteDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 border-green-600 bg-green-50";
      case "repos":
        return "text-yellow-600 border-yellow-600 bg-yellow-50";
      default:
        return "text-muted-foreground border-muted";
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
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Gestion des équipes</h1>
              <p className="text-muted-foreground">
                Organisez vos équipes de terrain pour la production de sel
              </p>
            </div>
            {isManager && (
              <div className="flex gap-2">
                {teams.length === 0 && (
                  <Button
                    variant="outline"
                    onClick={initializeDefaultTeams}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Créer équipes par défaut
                  </Button>
                )}
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="gap-2 bg-gradient-to-r from-primary to-accent"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle équipe
                </Button>
              </div>
            )}
          </div>

          {/* Liste des équipes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Équipes de terrain ({teams.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : teams.length > 0 ? (
                <div className="space-y-4">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
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
                          <p className="text-2xl font-bold text-primary">
                            {team.members.length}
                          </p>
                          <p className="text-xs text-muted-foreground">membres</p>
                        </div>
                      </div>

                      {/* Membres de l'équipe */}
                      {team.members.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
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
                                  onClick={() => handleRemoveMember(member)}
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
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t">
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
                              onClick={() => openAddMemberDialog(team)}
                              className="gap-1"
                            >
                              <UserPlus className="h-4 w-4" />
                              Ajouter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(team)}
                              className="gap-1"
                            >
                              <Settings2 className="h-4 w-4" />
                              Gérer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(team)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">Aucune équipe créée</p>
                  {isManager && (
                    <Button
                      onClick={initializeDefaultTeams}
                      variant="outline"
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Créer les équipes par défaut
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog: Créer une équipe */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle équipe</DialogTitle>
                <DialogDescription>
                  Créez une nouvelle équipe de terrain
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Nom de l'équipe</Label>
                  <Input
                    id="team-name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Ex: Équipe Récolte"
                  />
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-target">Objectif (tonnes)</Label>
                    <Input
                      id="team-target"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={newTeamTarget}
                      onChange={(e) => setNewTeamTarget(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="team-sector">Secteur (optionnel)</Label>
                  <Select value={newTeamSector} onValueChange={setNewTeamSector}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un secteur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preparation">Préparation des bassins</SelectItem>
                      <SelectItem value="mise-en-eau">Mise en eau</SelectItem>
                      <SelectItem value="evaporation">Évaporation</SelectItem>
                      <SelectItem value="recolte">Récolte</SelectItem>
                      <SelectItem value="stockage">Traitement et stockage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateTeam} disabled={isCreating || !newTeamName.trim()}>
                  {isCreating ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog: Modifier une équipe */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier l'équipe</DialogTitle>
                <DialogDescription>
                  Modifiez les informations de l'équipe
                </DialogDescription>
              </DialogHeader>
              {selectedTeam && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-team-name">Nom</Label>
                    <Input
                      id="edit-team-name"
                      value={selectedTeam.name}
                      onChange={(e) =>
                        setSelectedTeam({ ...selectedTeam, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-team-target">Objectif (tonnes)</Label>
                    <Input
                      id="edit-team-target"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={String(selectedTeam.production_target ?? 0)}
                      onChange={(e) =>
                        setSelectedTeam({
                          ...selectedTeam,
                          production_target: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secteur</Label>
                    <Select
                      value={selectedTeam.sector || "none"}
                      onValueChange={(v) =>
                        setSelectedTeam({
                          ...selectedTeam,
                          sector: v === "none" ? null : v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un secteur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non défini</SelectItem>
                        <SelectItem value="preparation">Préparation des bassins</SelectItem>
                        <SelectItem value="mise-en-eau">Mise en eau</SelectItem>
                        <SelectItem value="evaporation">Évaporation</SelectItem>
                        <SelectItem value="recolte">Récolte</SelectItem>
                        <SelectItem value="stockage">Traitement et stockage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Chef d'équipe</Label>
                    <Select
                      value={selectedTeam.leader_id || "none"}
                      onValueChange={(v) =>
                        setSelectedTeam({
                          ...selectedTeam,
                          leader_id: v === "none" ? null : v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un chef" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non assigné</SelectItem>
                        {employees
                          .filter((e) => e.is_active)
                          .map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.full_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select
                      value={selectedTeam.status}
                      onValueChange={(v) =>
                        setSelectedTeam({ ...selectedTeam, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">En activité</SelectItem>
                        <SelectItem value="repos">Repos</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleUpdateTeam} disabled={isUpdating}>
                  {isUpdating ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog: Ajouter un membre */}
          <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un membre</DialogTitle>
                <DialogDescription>
                  Ajouter un employé à l'équipe {selectedTeam?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Employé</Label>
                  <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEmployees.length > 0 ? (
                        availableEmployees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name} ({emp.employee_type || "N/A"})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Aucun employé disponible
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-role">Rôle (optionnel)</Label>
                  <Input
                    id="member-role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    placeholder="Ex: Récolteur, Conducteur..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddMember} disabled={!selectedEmployeeId}>
                  Ajouter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog: Confirmer suppression */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer l'équipe ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. L'équipe "{selectedTeam?.name}" sera
                  définitivement supprimée ainsi que tous ses membres.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTeam}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  );
};

export default Equipes;
