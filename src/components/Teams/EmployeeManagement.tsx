import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  UserPlus, 
  Pencil, 
  Trash2, 
  Search,
  Users,
  Phone,
  Mail,
  Briefcase
} from "lucide-react";
import { useEmployees, useEmployeeMutations, EmployeeFormData } from "@/hooks/useEmployees";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const EMPLOYEE_TYPES = [
  { value: "permanent", label: "Permanent" },
  { value: "saisonnier", label: "Saisonnier" },
  { value: "journalier", label: "Journalier" },
];

const POSITIONS = [
  "Ouvrier",
  "Chef d'équipe",
  "Superviseur",
  "Technicien",
  "Opérateur",
  "Manutentionnaire",
  "Conducteur",
  "Gardien",
];

interface EmployeeManagementProps {
  isManager: boolean;
}

export const EmployeeManagement = ({ isManager }: EmployeeManagementProps) => {
  const { data: employees = [], isLoading } = useEmployees();
  const { createEmployee, updateEmployee, deleteEmployee } = useEmployeeMutations();

  // États
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Formulaire
  const [formData, setFormData] = useState<EmployeeFormData>({
    full_name: "",
    email: "",
    phone: "",
    position: "",
    employee_type: "permanent",
    employee_number: "",
    hire_date: "",
    salary: "",
    is_active: true,
  });

  // Filtrage
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (emp.phone?.includes(searchTerm) ?? false) ||
      (emp.employee_number?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesType = filterType === "all" || emp.employee_type === filterType;

    return matchesSearch && matchesType;
  });

  // Handlers
  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      position: "",
      employee_type: "permanent",
      employee_number: "",
      hire_date: "",
      salary: "",
      is_active: true,
    });
  };

  const handleCreate = async () => {
    if (!formData.full_name.trim()) return;
    
    await createEmployee.mutateAsync(formData);
    resetForm();
    setIsCreateDialogOpen(false);
  };

  const handleUpdate = async () => {
    if (!selectedEmployee || !formData.full_name.trim()) return;
    
    await updateEmployee.mutateAsync({
      id: selectedEmployee.id,
      ...formData,
    });
    setIsEditDialogOpen(false);
    setSelectedEmployee(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    
    await deleteEmployee.mutateAsync(selectedEmployee.id);
    setIsDeleteDialogOpen(false);
    setSelectedEmployee(null);
  };

  const openEditDialog = (employee: any) => {
    setSelectedEmployee(employee);
    setFormData({
      full_name: employee.full_name,
      email: employee.email || "",
      phone: employee.phone || "",
      position: employee.position || "",
      employee_type: employee.employee_type || "permanent",
      employee_number: employee.employee_number || "",
      hire_date: employee.hire_date || "",
      salary: employee.salary || "",
      is_active: employee.is_active ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (employee: any) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "permanent":
        return "bg-primary/20 text-primary";
      case "saisonnier":
        return "bg-accent/20 text-accent-foreground";
      case "journalier":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Stats
  const totalEmployees = employees.length;
  const permanentCount = employees.filter((e) => e.employee_type === "permanent").length;
  const saisonnierCount = employees.filter((e) => e.employee_type === "saisonnier").length;
  const journalierCount = employees.filter((e) => e.employee_type === "journalier").length;

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEmployees}</p>
                <p className="text-sm text-muted-foreground">Total employés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{permanentCount}</p>
                <p className="text-sm text-muted-foreground">Permanents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Users className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{saisonnierCount}</p>
                <p className="text-sm text-muted-foreground">Saisonniers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{journalierCount}</p>
                <p className="text-sm text-muted-foreground">Journaliers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Liste des employés
          </CardTitle>
          {isManager && (
            <Button
              onClick={() => {
                resetForm();
                setIsCreateDialogOpen(true);
              }}
              className="gap-2 bg-gradient-to-r from-primary to-accent"
            >
              <UserPlus className="h-4 w-4" />
              Nouvel employé
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Type d'employé" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {EMPLOYEE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredEmployees.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden lg:table-cell">Date d'embauche</TableHead>
                    {isManager && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{employee.full_name}</p>
                          {employee.employee_number && (
                            <p className="text-xs text-muted-foreground">
                              #{employee.employee_number}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          {employee.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {employee.email}
                            </div>
                          )}
                          {employee.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {employee.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{employee.position || "-"}</TableCell>
                      <TableCell>
                        <Badge className={getTypeBadgeVariant(employee.employee_type || "permanent")}>
                          {EMPLOYEE_TYPES.find((t) => t.value === employee.employee_type)?.label ||
                            employee.employee_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {employee.hire_date
                          ? format(new Date(employee.hire_date), "d MMM yyyy", { locale: fr })
                          : "-"}
                      </TableCell>
                      {isManager && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(employee)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog(employee)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterType !== "all"
                  ? "Aucun employé ne correspond à votre recherche"
                  : "Aucun employé enregistré"}
              </p>
              {isManager && !searchTerm && filterType === "all" && (
                <Button
                  onClick={() => {
                    resetForm();
                    setIsCreateDialogOpen(true);
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Ajouter un employé
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Créer un employé */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel employé</DialogTitle>
            <DialogDescription>
              Ajoutez un nouvel employé qui pourra être affecté à une équipe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nom complet *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ex: Mamadou Diallo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_type">Type</Label>
                <Select
                  value={formData.employee_type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, employee_type: v as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_number">Matricule</Label>
                <Input
                  id="employee_number"
                  value="Auto-généré (EMP####)"
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Poste</Label>
              <Select
                value={formData.position}
                onValueChange={(v) => setFormData({ ...formData, position: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un poste" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+221 77 xxx xx xx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hire_date">Date d'embauche</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salaire (FCFA)</Label>
                <Input
                  id="salary"
                  type="number"
                  min={0}
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createEmployee.isPending || !formData.full_name.trim()}
            >
              {createEmployee.isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Modifier un employé */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'employé</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'employé
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Nom complet *</Label>
              <Input
                id="edit_full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_employee_type">Type</Label>
                <Select
                  value={formData.employee_type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, employee_type: v as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_employee_number">Matricule</Label>
                <Input
                  id="edit_employee_number"
                  value={formData.employee_number}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_position">Poste</Label>
              <Select
                value={formData.position || "none"}
                onValueChange={(v) =>
                  setFormData({ ...formData, position: v === "none" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un poste" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non défini</SelectItem>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Téléphone</Label>
                <Input
                  id="edit_phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_hire_date">Date d'embauche</Label>
                <Input
                  id="edit_hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_salary">Salaire (FCFA)</Label>
                <Input
                  id="edit_salary"
                  type="number"
                  min={0}
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateEmployee.isPending || !formData.full_name.trim()}
            >
              {updateEmployee.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Supprimer un employé */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver l'employé ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'employé "{selectedEmployee?.full_name}" sera désactivé et ne pourra plus être
              affecté à une équipe. Cette action peut être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEmployee.isPending ? "Désactivation..." : "Désactiver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
