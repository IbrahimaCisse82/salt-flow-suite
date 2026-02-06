import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, Edit, UserPlus, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Permission = 'full' | 'create' | 'view' | 'none' | 'validate';

interface PermissionItem {
  module: string;
  admin: Permission;
  gerant: Permission;
  commercial: Permission;
  comptable: Permission;
  production: Permission;
}

const permissionsData: PermissionItem[] = [
  { module: "Dashboard", admin: "full", gerant: "full", commercial: "view", comptable: "view", production: "view" },
  { module: "Bassins", admin: "none", gerant: "full", commercial: "none", comptable: "none", production: "view" },
  { module: "Campagnes", admin: "none", gerant: "full", commercial: "none", comptable: "view", production: "view" },
  { module: "Production", admin: "none", gerant: "full", commercial: "none", comptable: "none", production: "create" },
  { module: "Stocks", admin: "none", gerant: "full", commercial: "none", comptable: "none", production: "view" },
  { module: "Équipes", admin: "none", gerant: "full", commercial: "none", comptable: "none", production: "view" },
  { module: "Pointages", admin: "none", gerant: "validate", commercial: "none", comptable: "none", production: "create" },
  
  { module: "Commercial", admin: "none", gerant: "full", commercial: "create", comptable: "none", production: "none" },
  { module: "Clients", admin: "none", gerant: "full", commercial: "create", comptable: "none", production: "none" },
  { module: "Ventes", admin: "none", gerant: "full", commercial: "create", comptable: "view", production: "none" },
  { module: "Comptabilité", admin: "none", gerant: "full", commercial: "none", comptable: "full", production: "none" },
  { module: "Transactions", admin: "none", gerant: "full", commercial: "none", comptable: "create", production: "none" },
  { module: "Paiements", admin: "none", gerant: "validate", commercial: "none", comptable: "full", production: "none" },
  { module: "Rapports", admin: "none", gerant: "full", commercial: "view", comptable: "view", production: "none" },
  { module: "Utilisateurs", admin: "full", gerant: "full", commercial: "none", comptable: "none", production: "none" },
  { module: "Paramètres", admin: "full", gerant: "full", commercial: "view", comptable: "view", production: "view" },
  { module: "Admin", admin: "full", gerant: "none", commercial: "none", comptable: "none", production: "none" },
];

interface SensitiveDataItem {
  dataType: string;
  admin: boolean;
  gerant: boolean;
  commercial: boolean;
  comptable: boolean;
  production: boolean;
}

const sensitiveData: SensitiveDataItem[] = [
  { dataType: "Salaires individuels", admin: true, gerant: true, commercial: false, comptable: false, production: false },
  { dataType: "Contacts personnel", admin: true, gerant: true, commercial: false, comptable: false, production: false },
  { dataType: "Informations clients", admin: true, gerant: true, commercial: true, comptable: false, production: false },
  { dataType: "Données financières", admin: true, gerant: true, commercial: false, comptable: true, production: false },
  { dataType: "Montants pointages", admin: true, gerant: true, commercial: false, comptable: true, production: false },
];

const PermissionIcon = ({ permission }: { permission: Permission }) => {
  switch (permission) {
    case 'full':
      return <Badge variant="default" className="bg-green-600"><Check className="h-3 w-3 mr-1" />CRUD</Badge>;
    case 'create':
      return <Badge variant="default" className="bg-blue-600"><UserPlus className="h-3 w-3 mr-1" />Créer</Badge>;
    case 'view':
      return <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" />Vue</Badge>;
    case 'validate':
      return <Badge variant="default" className="bg-purple-600"><Shield className="h-3 w-3 mr-1" />Valider</Badge>;
    case 'none':
      return <Badge variant="destructive"><X className="h-3 w-3" /></Badge>;
    default:
      return <Badge variant="outline">-</Badge>;
  }
};

const AccessIcon = ({ hasAccess }: { hasAccess: boolean }) => {
  return hasAccess ? (
    <Check className="h-5 w-5 text-green-600 mx-auto" />
  ) : (
    <X className="h-5 w-5 text-red-500 mx-auto" />
  );
};

export const RolePermissionsMatrix = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Matrice des Rôles et Permissions
        </h1>
        <p className="text-muted-foreground mt-2">
          Vue complète des accès par rôle utilisateur
        </p>
      </div>

      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="modules">Modules & Fonctionnalités</TabsTrigger>
          <TabsTrigger value="sensitive">Données Sensibles</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissions par Module</CardTitle>
              <CardDescription>
                Détails des droits d'accès pour chaque module de l'application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Module</TableHead>
                      <TableHead className="text-center font-bold">Admin</TableHead>
                      <TableHead className="text-center font-bold">Gérant</TableHead>
                      <TableHead className="text-center font-bold">Commercial</TableHead>
                      <TableHead className="text-center font-bold">Comptable</TableHead>
                      <TableHead className="text-center font-bold">Production</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissionsData.map((item) => (
                      <TableRow key={item.module}>
                        <TableCell className="font-medium">{item.module}</TableCell>
                        <TableCell className="text-center">
                          <PermissionIcon permission={item.admin} />
                        </TableCell>
                        <TableCell className="text-center">
                          <PermissionIcon permission={item.gerant} />
                        </TableCell>
                        <TableCell className="text-center">
                          <PermissionIcon permission={item.commercial} />
                        </TableCell>
                        <TableCell className="text-center">
                          <PermissionIcon permission={item.comptable} />
                        </TableCell>
                        <TableCell className="text-center">
                          <PermissionIcon permission={item.production} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-3">Légende</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-600"><Check className="h-3 w-3" /></Badge>
                    <span className="text-sm">CRUD complet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-blue-600"><UserPlus className="h-3 w-3" /></Badge>
                    <span className="text-sm">Création uniquement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary"><Eye className="h-3 w-3" /></Badge>
                    <span className="text-sm">Lecture seule</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-purple-600"><Shield className="h-3 w-3" /></Badge>
                    <span className="text-sm">Validation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive"><X className="h-3 w-3" /></Badge>
                    <span className="text-sm">Pas d'accès</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sensitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accès aux Données Sensibles</CardTitle>
              <CardDescription>
                Droits d'accès aux informations confidentielles par rôle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Type de Données</TableHead>
                    <TableHead className="text-center font-bold">Admin</TableHead>
                    <TableHead className="text-center font-bold">Gérant</TableHead>
                    <TableHead className="text-center font-bold">Commercial</TableHead>
                    <TableHead className="text-center font-bold">Comptable</TableHead>
                    <TableHead className="text-center font-bold">Production</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sensitiveData.map((item) => (
                    <TableRow key={item.dataType}>
                      <TableCell className="font-medium">{item.dataType}</TableCell>
                      <TableCell className="text-center">
                        <AccessIcon hasAccess={item.admin} />
                      </TableCell>
                      <TableCell className="text-center">
                        <AccessIcon hasAccess={item.gerant} />
                      </TableCell>
                      <TableCell className="text-center">
                        <AccessIcon hasAccess={item.commercial} />
                      </TableCell>
                      <TableCell className="text-center">
                        <AccessIcon hasAccess={item.comptable} />
                      </TableCell>
                      <TableCell className="text-center">
                        <AccessIcon hasAccess={item.production} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  🔒 Sécurité des Données
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  L'accès aux données sensibles est strictement contrôlé par des politiques RLS (Row Level Security) 
                  au niveau de la base de données. Aucune modification des permissions ne peut être effectuée depuis 
                  le frontend sans autorisation appropriée.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Pages Accessibles par Rôle</CardTitle>
          <CardDescription>Routes et URLs disponibles selon le rôle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Admin
              </h3>
              <ul className="space-y-1 text-sm">
                <li className="text-muted-foreground">• /admin</li>
                <li className="text-muted-foreground">• /admin/tenants</li>
                <li className="text-muted-foreground">• /admin/chart-of-accounts</li>
                <li className="text-muted-foreground">• /admin/expense-types</li>
                <li className="text-muted-foreground">• /admin/roles</li>
                <li className="text-muted-foreground">• /parametres</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Gérant
              </h3>
              <ul className="space-y-1 text-sm">
                <li className="text-muted-foreground">• / (Dashboard)</li>
                <li className="text-muted-foreground">• /bassins</li>
                <li className="text-muted-foreground">• /campagne</li>
                <li className="text-muted-foreground">• /production</li>
                <li className="text-muted-foreground">• /stocks</li>
                <li className="text-muted-foreground">• /equipes</li>
                <li className="text-muted-foreground">• /commercial</li>
                <li className="text-muted-foreground">• /comptabilite</li>
                <li className="text-muted-foreground">• /rapports</li>
                <li className="text-muted-foreground">• /utilisateurs</li>
                <li className="text-muted-foreground">• /parametres</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Commercial
              </h3>
              <ul className="space-y-1 text-sm">
                <li className="text-muted-foreground">• / (Dashboard)</li>
                <li className="text-muted-foreground">• /commercial</li>
                <li className="text-muted-foreground">• /rapports</li>
                <li className="text-muted-foreground">• /parametres</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Edit className="h-5 w-5 text-indigo-600" />
                Comptable
              </h3>
              <ul className="space-y-1 text-sm">
                <li className="text-muted-foreground">• / (Dashboard)</li>
                <li className="text-muted-foreground">• /comptabilite</li>
                <li className="text-muted-foreground">• /campagne</li>
                <li className="text-muted-foreground">• /rapports</li>
                <li className="text-muted-foreground">• /parametres</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Eye className="h-5 w-5 text-orange-600" />
                Production
              </h3>
              <ul className="space-y-1 text-sm">
                <li className="text-muted-foreground">• / (Dashboard)</li>
                <li className="text-muted-foreground">• /bassins</li>
                <li className="text-muted-foreground">• /campagne</li>
                <li className="text-muted-foreground">• /production</li>
                <li className="text-muted-foreground">• /stocks</li>
                <li className="text-muted-foreground">• /equipes</li>
                
                <li className="text-muted-foreground">• /parametres</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};