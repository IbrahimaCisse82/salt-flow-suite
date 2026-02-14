import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Team } from "@/hooks/useTeams";

// --- Create Team Dialog ---
interface CreateTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  setName: (v: string) => void;
  sector: string;
  setSector: (v: string) => void;
  target: string;
  setTarget: (v: string) => void;
  onCreate: () => void;
  isCreating: boolean;
}

export const CreateTeamDialog = ({
  isOpen, onOpenChange, name, setName, sector, setSector, target, setTarget, onCreate, isCreating,
}: CreateTeamDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nouvelle équipe</DialogTitle>
        <DialogDescription>Créez une nouvelle équipe de terrain</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="team-name">Nom de l'équipe</Label>
          <Input id="team-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Équipe Récolte" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="team-target">Objectif (tonnes)</Label>
          <Input id="team-target" type="number" inputMode="decimal" min={0} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="team-sector">Secteur (optionnel)</Label>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un secteur" /></SelectTrigger>
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
        <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
        <Button onClick={onCreate} disabled={isCreating || !name.trim()}>
          {isCreating ? "Création..." : "Créer"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// --- Edit Team Dialog ---
interface EditTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  setTeam: (t: Team) => void;
  employees: { id: string; full_name: string; is_active: boolean }[];
  onUpdate: () => void;
  isUpdating: boolean;
}

export const EditTeamDialog = ({
  isOpen, onOpenChange, team, setTeam, employees, onUpdate, isUpdating,
}: EditTeamDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Modifier l'équipe</DialogTitle>
        <DialogDescription>Modifiez les informations de l'équipe</DialogDescription>
      </DialogHeader>
      {team && (
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-team-name">Nom</Label>
            <Input id="edit-team-name" value={team.name} onChange={(e) => setTeam({ ...team, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-team-target">Objectif (tonnes)</Label>
            <Input id="edit-team-target" type="number" inputMode="decimal" min={0} value={String(team.production_target ?? 0)} onChange={(e) => setTeam({ ...team, production_target: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <Label>Secteur</Label>
            <Select value={team.sector || "none"} onValueChange={(v) => setTeam({ ...team, sector: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un secteur" /></SelectTrigger>
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
            <Select value={team.leader_id || "none"} onValueChange={(v) => setTeam({ ...team, leader_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un chef" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Non assigné</SelectItem>
                {employees.filter((e) => e.is_active).map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={team.status} onValueChange={(v) => setTeam({ ...team, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
        <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
        <Button onClick={onUpdate} disabled={isUpdating}>
          {isUpdating ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// --- Add Member Dialog ---
interface AddMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  availableEmployees: { id: string; full_name: string; employee_type: string | null }[];
  selectedEmployeeId: string;
  setSelectedEmployeeId: (v: string) => void;
  selectedRole: string;
  setSelectedRole: (v: string) => void;
  onAdd: () => void;
}

export const AddMemberDialog = ({
  isOpen, onOpenChange, teamName, availableEmployees, selectedEmployeeId, setSelectedEmployeeId, selectedRole, setSelectedRole, onAdd,
}: AddMemberDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Ajouter un membre</DialogTitle>
        <DialogDescription>Ajouter un employé à l'équipe {teamName}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Employé</Label>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un employé" /></SelectTrigger>
            <SelectContent>
              {availableEmployees.length > 0 ? (
                availableEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_type || "N/A"})
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground text-center">Aucun employé disponible</div>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-role">Rôle (optionnel)</Label>
          <Input id="member-role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} placeholder="Ex: Récolteur, Conducteur..." />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
        <Button onClick={onAdd} disabled={!selectedEmployeeId}>Ajouter</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// --- Delete Team Dialog ---
interface DeleteTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  onDelete: () => void;
}

export const DeleteTeamDialog = ({ isOpen, onOpenChange, teamName, onDelete }: DeleteTeamDialogProps) => (
  <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Supprimer l'équipe ?</AlertDialogTitle>
        <AlertDialogDescription>
          Cette action est irréversible. L'équipe "{teamName}" sera définitivement supprimée ainsi que tous ses membres.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Annuler</AlertDialogCancel>
        <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          Supprimer
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
