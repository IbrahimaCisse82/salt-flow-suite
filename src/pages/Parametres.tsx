import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings,
  Bell,
  User,
  Building,
  Shield,
  Database,
} from "lucide-react";

const Parametres = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Paramètres</h1>
            <p className="text-muted-foreground">
              Configurez votre compte et l'application
            </p>
          </div>

          {/* Informations entreprise */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Informations entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Nom de l'entreprise</Label>
                  <Input id="company" defaultValue="Salines du Sénégal" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siret">N° SIRET</Label>
                  <Input id="siret" defaultValue="123 456 789 00012" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input id="address" defaultValue="Zone industrielle, Fatick" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" defaultValue="+221 33 XXX XX XX" />
                </div>
              </div>
              <Button className="bg-gradient-to-r from-primary to-accent">
                Enregistrer les modifications
              </Button>
            </CardContent>
          </Card>

          {/* Compte utilisateur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Compte utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input id="name" defaultValue="Amadou Diallo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="amadou@salines-senegal.sn" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Input id="role" defaultValue="Administrateur" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input id="password" type="password" placeholder="••••••••" />
                </div>
              </div>
              <Button className="bg-gradient-to-r from-primary to-accent">
                Mettre à jour le profil
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertes météorologiques</p>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des notifications sur les conditions météo
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertes de stock</p>
                  <p className="text-sm text-muted-foreground">
                    Notifications quand le stock est faible
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Rapports automatiques</p>
                  <p className="text-sm text-muted-foreground">
                    Recevoir les rapports mensuels par email
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertes production</p>
                  <p className="text-sm text-muted-foreground">
                    Notifications sur les récoltes et production
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Authentification à deux facteurs (2FA)</p>
                  <p className="text-sm text-muted-foreground">
                    Ajouter une couche de sécurité supplémentaire
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Historique des connexions</p>
                  <p className="text-sm text-muted-foreground">
                    Afficher l'historique de vos connexions
                  </p>
                </div>
                <Button variant="outline" size="sm">Voir l'historique</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sessions actives</p>
                  <p className="text-sm text-muted-foreground">
                    Gérer vos sessions actives
                  </p>
                </div>
                <Button variant="outline" size="sm">Gérer</Button>
              </div>
            </CardContent>
          </Card>

          {/* Données */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Gestion des données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Exporter les données</p>
                  <p className="text-sm text-muted-foreground">
                    Télécharger toutes vos données d'exploitation
                  </p>
                </div>
                <Button variant="outline">Exporter</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sauvegarde automatique</p>
                  <p className="text-sm text-muted-foreground">
                    Sauvegardes quotidiennes de vos données
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="font-medium text-destructive">Zone dangereuse</p>
                  <p className="text-sm text-muted-foreground">
                    Supprimer définitivement toutes les données
                  </p>
                </div>
                <Button variant="destructive">Supprimer</Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Parametres;
