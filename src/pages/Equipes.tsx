import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useState } from "react";
import { 
  Users,
  Plus,
  UserCheck,
  Calendar,
  TrendingUp,
  Award
} from "lucide-react";

const permanents = [
  {
    name: "Mohamed Diallo",
    role: "Chef d'exploitation",
    initials: "MD",
    experience: "15 ans",
    status: "actif",
    performance: 95,
    specialite: "Gestion bassins"
  },
  {
    name: "Fatou Sène",
    role: "Contremaître",
    initials: "FS",
    experience: "8 ans",
    status: "actif",
    performance: 92,
    specialite: "Contrôle qualité"
  },
  {
    name: "Ibrahima Ndiaye",
    role: "Chef saunier",
    initials: "IN",
    experience: "12 ans",
    status: "actif",
    performance: 98,
    specialite: "Production"
  },
  {
    name: "Aminata Ba",
    role: "Responsable stock",
    initials: "AB",
    experience: "6 ans",
    status: "actif",
    performance: 90,
    specialite: "Logistique"
  },
];

const teams = [
  {
    name: "Équipe Alpha",
    leader: "Mohamed Diallo",
    members: 12,
    sector: "Secteur Nord",
    status: "active",
    production: "125 tonnes",
    efficiency: 94
  },
  {
    name: "Équipe Beta",
    leader: "Fatou Sène",
    members: 10,
    sector: "Secteur Sud",
    status: "active",
    production: "98 tonnes",
    efficiency: 89
  },
  {
    name: "Équipe Gamma",
    leader: "Ibrahima Ndiaye",
    members: 8,
    sector: "Secteur Est",
    status: "repos",
    production: "87 tonnes",
    efficiency: 91
  },
];

const Equipes = () => {
  const { toast } = useToast();
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [isManageTeamDialogOpen, setIsManageTeamDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  
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
    console.log("New employee submitted:", employeeFormData);
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
      leader: team.leader,
      sector: team.sector,
      status: team.status,
      members: team.members.toString()
    });
    setIsManageTeamDialogOpen(true);
  };

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Team updated:", teamFormData);
    toast({
      title: "Équipe mise à jour",
      description: `${teamFormData.name} a été mise à jour avec succès`,
    });
    setIsManageTeamDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6 md:ml-64">
          {/* Dialog Ajouter employé */}
          <Dialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                        <SelectItem value="temporaire">Temporaire</SelectItem>
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
                      {permanents.map((person) => (
                        <SelectItem key={person.name} value={person.name}>
                          {person.name} - {person.role}
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

          {/* Stats RH */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Total employés</p>
                <p className="text-3xl font-bold">42</p>
                <p className="text-xs text-muted-foreground mt-1">4 permanents + 38 journaliers</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">Présents aujourd'hui</p>
                <p className="text-3xl font-bold">38</p>
                <p className="text-xs text-green-600 mt-1">90% taux présence</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Calendar className="h-8 w-8 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground">Heures ce mois</p>
                <p className="text-3xl font-bold">4,280</p>
                <p className="text-xs text-muted-foreground mt-1">Mars 2025</p>
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
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permanents.map((person, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <Avatar className="h-16 w-16 bg-gradient-to-br from-primary to-accent">
                      <AvatarFallback className="text-white font-bold text-lg">
                        {person.initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{person.name}</h3>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {person.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{person.role}</p>
                      <div className="flex gap-4 text-xs">
                        <span className="text-muted-foreground">
                          📚 {person.experience}
                        </span>
                        <span className="text-muted-foreground">
                          🎯 {person.specialite}
                        </span>
                        <span className="text-primary font-medium">
                          ⭐ {person.performance}%
                        </span>
                      </div>
                    </div>

                    <Button variant="outline" size="sm">
                      Voir profil
                    </Button>
                  </div>
                ))}
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
                          Chef: {team.leader} • {team.sector}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{team.members}</p>
                        <p className="text-xs text-muted-foreground">membres</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Production</p>
                        <p className="font-semibold">{team.production}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Efficacité</p>
                        <p className="font-semibold text-primary">{team.efficiency}%</p>
                      </div>
                      <div className="flex items-end justify-end">
                        <Button onClick={() => handleManageTeam(team)} variant="outline" size="sm">
                          Gérer équipe
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pointage journalier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pointage du jour</CardTitle>
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
                  <span className="font-bold">8,400 FCFA</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Journaliers</span>
                  <span className="font-bold">12,650 FCFA</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-bold text-lg text-primary">21,050 FCFA</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Equipes;
