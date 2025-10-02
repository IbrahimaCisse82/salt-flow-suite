import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { useState } from "react";
import { 
  Users,
  Plus,
  UserCheck,
  Calendar,
  TrendingUp,
  Award
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEmployees } from "@/hooks/useEmployees";
import { useDailyWorkers } from "@/hooks/useDailyWorkers";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamAttendanceForm } from "@/components/Payroll/TeamAttendanceForm";
import { AttendanceValidationTable } from "@/components/Payroll/AttendanceValidationTable";


const Equipes = () => {
  const { toast } = useToast();
  const { isOpen } = useSidebar();
  const { profile } = useAuth();
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [isManageTeamDialogOpen, setIsManageTeamDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  // Use custom hooks for data fetching with role-based access
  const { data: employees = [] } = useEmployees();
  const { data: dailyWorkers = [] } = useDailyWorkers();
  const { teams, createTeam, updateTeam, isCreating, isUpdating } = useTeams();

  const userRole = profile?.role;
  const canViewSalary = userRole === 'admin' || userRole === 'gerant' || userRole === 'comptable';

  // Get permanent employees for team leaders
  const permanentEmployees = employees.filter(e => e.employee_type === 'permanent' && e.is_active);

  // Calculate employee statistics
  const employeeStats = {
    totalEmployees: employees.length + dailyWorkers.length,
    permanentCount: employees.filter(e => e.employee_type === 'permanent' && e.is_active).length,
    journalierCount: employees.filter(e => e.employee_type === 'journalier' && e.is_active).length,
    dailyWorkersCount: dailyWorkers.length,
    employees,
    dailyWorkers
  };

  // Fetch salary stats only if user can view salaries
  const { data: salaryStats } = useQuery({
    queryKey: ['salary-stats', canViewSalary],
    enabled: canViewSalary,
    queryFn: async () => {
      if (!canViewSalary) return null;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_type', 'depense')
        .ilike('description', '%Salaire%')
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0])
        .lte('transaction_date', endOfMonth.toISOString().split('T')[0]);

      if (error) throw error;

      const salaryByType = {
        permanent: 0,
        journalier: 0,
        saisonnier: 0
      };

      transactions?.forEach(t => {
        const desc = t.description?.toLowerCase() || '';
        if (desc.includes('permanent')) {
          salaryByType.permanent += Number(t.amount);
        } else if (desc.includes('journalier')) {
          salaryByType.journalier += Number(t.amount);
        } else if (desc.includes('saisonnier')) {
          salaryByType.saisonnier += Number(t.amount);
        }
      });

      return {
        permanent: salaryByType.permanent,
        journalier: salaryByType.journalier,
        saisonnier: salaryByType.saisonnier,
        total: salaryByType.permanent + salaryByType.journalier + salaryByType.saisonnier
      };
    }
  });
  
  const [employeeFormData, setEmployeeFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    employeeType: "",
    salary: "",
    hireDate: "",
    specialization: "",
    notes: ""
  });

  const [teamFormData, setTeamFormData] = useState({
    name: "",
    leader: "",
    sector: "",
    status: "",
    members: ""
  });

  const handleAddEmployee = () => {
    setIsAddEmployeeDialogOpen(true);
  };

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Employé ajouté",
      description: `${employeeFormData.firstName} ${employeeFormData.lastName} a été ajouté avec succès`,
    });
    setIsAddEmployeeDialogOpen(false);
    setEmployeeFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      employeeType: "",
      salary: "",
      hireDate: "",
      specialization: "",
      notes: ""
    });
  };

  const handleManageTeam = (team: any) => {
    setSelectedTeam(team);
    setTeamFormData({
      name: team.name,
      leader: team.leader_id || '',
      sector: team.sector || '',
      status: team.status || 'active',
      members: team.members?.length?.toString() || '0'
    });
    setIsManageTeamDialogOpen(true);
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedTeam) {
        await updateTeam({
          id: selectedTeam.id,
          name: teamFormData.name,
          leader_id: teamFormData.leader || null,
          sector: teamFormData.sector,
          status: teamFormData.status
        });
      } else {
        await createTeam({
          name: teamFormData.name,
          leader_id: teamFormData.leader || undefined,
          sector: teamFormData.sector,
          status: teamFormData.status
        });
      }
      
      setIsManageTeamDialogOpen(false);
      setTeamFormData({
        name: "",
        leader: "",
        sector: "",
        status: "",
        members: ""
      });
    } catch (error) {
      logger.error('Team operation error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className={cn(
          "flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 transition-all duration-300",
          isOpen ? "md:ml-64" : "md:ml-16"
        )}>
          {/* Dialog Ajouter employé */}
          <Dialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto max-w-[95vw]">
              <DialogHeader>
                <DialogTitle>Ajouter un employé</DialogTitle>
                <DialogDescription>
                  Enregistrer un nouveau membre de l'équipe
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={employeeFormData.firstName}
                      onChange={(e) => setEmployeeFormData({...employeeFormData, firstName: e.target.value})}
                      placeholder="Ex: Mohamed"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={employeeFormData.lastName}
                      onChange={(e) => setEmployeeFormData({...employeeFormData, lastName: e.target.value})}
                      placeholder="Ex: Diallo"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={employeeFormData.email}
                      onChange={(e) => setEmployeeFormData({...employeeFormData, email: e.target.value})}
                      placeholder="Ex: mohamed.diallo@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={employeeFormData.phone}
                      onChange={(e) => setEmployeeFormData({...employeeFormData, phone: e.target.value})}
                      placeholder="Ex: +221 77 123 45 67"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Poste</Label>
                  <Input
                    id="position"
                    value={employeeFormData.position}
                    onChange={(e) => setEmployeeFormData({...employeeFormData, position: e.target.value})}
                    placeholder="Ex: Chef saunier"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeType">Type d'employé</Label>
                    <Select 
                      value={employeeFormData.employeeType} 
                      onValueChange={(value) => setEmployeeFormData({...employeeFormData, employeeType: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="journalier">Journalier</SelectItem>
                        <SelectItem value="saisonnier">Saisonnier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Date d'embauche</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={employeeFormData.hireDate}
                      onChange={(e) => setEmployeeFormData({...employeeFormData, hireDate: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {canViewSalary && (
                    <div className="space-y-2">
                      <Label htmlFor="salary">Salaire (FCFA)</Label>
                      <Input
                        id="salary"
                        type="number"
                        value={employeeFormData.salary}
                        onChange={(e) => setEmployeeFormData({...employeeFormData, salary: e.target.value})}
                        placeholder="Ex: 150000"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Spécialisation</Label>
                    <Input
                      id="specialization"
                      value={employeeFormData.specialization}
                      onChange={(e) => setEmployeeFormData({...employeeFormData, specialization: e.target.value})}
                      placeholder="Ex: Gestion bassins"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={employeeFormData.notes}
                    onChange={(e) => setEmployeeFormData({...employeeFormData, notes: e.target.value})}
                    placeholder="Informations complémentaires..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddEmployeeDialogOpen(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent">
                    Ajouter l'employé
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog Gérer équipe */}
          <Dialog open={isManageTeamDialogOpen} onOpenChange={setIsManageTeamDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Gérer l'équipe</DialogTitle>
                <DialogDescription>
                  Modifier les informations de {selectedTeam?.name}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleTeamSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Nom de l'équipe</Label>
                  <Input
                    id="teamName"
                    value={teamFormData.name}
                    onChange={(e) => setTeamFormData({...teamFormData, name: e.target.value})}
                    placeholder="Ex: Équipe Alpha"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamLeader">Chef d'équipe</Label>
                  <Select 
                    value={teamFormData.leader} 
                    onValueChange={(value) => setTeamFormData({...teamFormData, leader: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un chef" />
                    </SelectTrigger>
                    <SelectContent>
                      {permanentEmployees.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.full_name} - {person.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamSector">Secteur</Label>
                  <Input
                    id="teamSector"
                    value={teamFormData.sector}
                    onChange={(e) => setTeamFormData({...teamFormData, sector: e.target.value})}
                    placeholder="Ex: Secteur Nord"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamStatus">Statut</Label>
                    <Select 
                      value={teamFormData.status} 
                      onValueChange={(value) => setTeamFormData({...teamFormData, status: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">En activité</SelectItem>
                        <SelectItem value="repos">Repos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamMembers">Nombre de membres</Label>
                    <Input
                      id="teamMembers"
                      type="number"
                      value={teamFormData.members}
                      onChange={(e) => setTeamFormData({...teamFormData, members: e.target.value})}
                      placeholder="Ex: 12"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsManageTeamDialogOpen(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent">
                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gestion des Équipes</h1>
              <p className="text-muted-foreground">
                Suivi du personnel permanent et des journaliers
              </p>
            </div>
            <Button onClick={handleAddEmployee} className="gap-2 bg-gradient-to-r from-primary to-accent">
              <Plus className="h-4 w-4" />
              Ajouter employé
            </Button>
          </div>

          <Tabs defaultValue="equipes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="equipes">Équipes</TabsTrigger>
              <TabsTrigger value="pointage">Pointage</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
            </TabsList>

            <TabsContent value="equipes" className="space-y-4 mt-6">
              {/* Stats RH */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Total employés</p>
                <p className="text-3xl font-bold">{employeeStats?.totalEmployees || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {employeeStats?.permanentCount || 0} permanents + {employeeStats?.journalierCount || 0} journaliers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">Présents aujourd'hui</p>
                <p className="text-3xl font-bold">{employeeStats?.totalEmployees || 0}</p>
                <p className="text-xs text-green-600 mt-1">100% taux présence</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Calendar className="h-8 w-8 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground">Salaires ce mois</p>
                <p className="text-3xl font-bold">
                  {salaryStats?.total ? `${(salaryStats.total / 1000).toFixed(0)}K` : '0'} FCFA
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Productivité</p>
                <p className="text-3xl font-bold">92%</p>
                <p className="text-xs text-green-600 mt-1">+5% vs. mois dernier</p>
              </CardContent>
            </Card>
          </div>

          {/* Personnel permanent */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Personnel permanent
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permanentEmployees.map((person) => (
                  <div 
                    key={person.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <Avatar className="h-16 w-16 bg-gradient-to-br from-primary to-accent">
                      <AvatarFallback className="text-white font-bold text-lg">
                        {person.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'NA'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{person.full_name}</h3>
                        <Badge variant="outline" className="border-primary text-primary">
                          Actif
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{person.position}</p>
                      <div className="flex gap-4 text-xs">
                        <span className="px-2 py-1 bg-muted rounded">
                          {person.employee_type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {permanentEmployees.length === 0 && (
                  <p className="col-span-2 text-center text-muted-foreground py-8">
                    Aucun employé permanent enregistré
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Équipes de terrain */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Équipes de terrain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teams.map((team, index) => (
                  <div 
                    key={index}
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
                        Chef: {team.leader?.full_name || 'Non assigné'} • {team.sector || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{team.members?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">membres</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Objectif</p>
                      <p className="font-semibold">{team.production_target || 0} T</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Efficacité</p>
                      <p className="font-semibold text-primary">{team.efficiency_rate || 0}%</p>
                    </div>
                    <div className="flex items-end justify-end">
                        <Button onClick={() => handleManageTeam(team)} variant="outline" size="sm">
                          Gérer équipe
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {teams.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune équipe créée
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pointage journalier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-sm md:text-base truncate">Pointage du jour</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-200">
                  <span className="text-sm font-medium text-green-900">Présents</span>
                  <span className="font-bold text-green-900">38 / 42</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 border border-red-200">
                  <span className="text-sm font-medium text-red-900">Absents</span>
                  <span className="font-bold text-red-900">4</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="text-sm font-medium text-blue-900">En congé</span>
                  <span className="font-bold text-blue-900">2</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Salaires ce mois</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Permanents</span>
                  <span className="font-bold">
                    {salaryStats?.permanent ? `${(salaryStats.permanent / 1000).toFixed(0)}K` : '0'} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Journaliers</span>
                  <span className="font-bold">
                    {salaryStats?.journalier ? `${(salaryStats.journalier / 1000).toFixed(0)}K` : '0'} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Saisonniers</span>
                  <span className="font-bold">
                    {salaryStats?.saisonnier ? `${(salaryStats.saisonnier / 1000).toFixed(0)}K` : '0'} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-bold text-lg text-primary">
                    {salaryStats?.total ? `${(salaryStats.total / 1000).toFixed(0)}K` : '0'} FCFA
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          </TabsContent>

          <TabsContent value="pointage" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TeamAttendanceForm />
              <Card>
                <CardHeader>
                  <CardTitle>Instructions de pointage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Comment pointer une équipe ?</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Sélectionnez l'équipe et l'employé</li>
                      <li>Entrez la date de travail</li>
                      <li>Indiquez les heures travaillées</li>
                      <li>Saisissez le taux journalier</li>
                      <li>Le montant sera calculé automatiquement</li>
                    </ol>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Note:</strong> Le pointage doit être validé par un gérant avant que le paiement puisse être effectué par le comptable.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="validation" className="space-y-6 mt-6">
            <AttendanceValidationTable />
          </TabsContent>
        </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Equipes;
