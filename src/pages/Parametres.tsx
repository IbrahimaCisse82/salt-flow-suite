import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/utils/permissions";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { 
  Settings,
  Bell,
  User,
  Building,
  Shield,
  Database,
  Loader2,
  Download
} from "lucide-react";

const Parametres = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isOpen } = useSidebar();
  
  // États pour les formulaires
  const [tenantData, setTenantData] = useState({
    name: "",
    manager_name: "",
    contact_email: "",
    address: "",
    contact_phone: "",
    ninea: "",
    rccm: "",
    logo_url: ""
  });

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: ""
  });

  const [notifications, setNotifications] = useState({
    weather: true,
    stock: true,
    reports: true,
    production: false
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    autoBackup: true
  });

  // Récupérer l'utilisateur et le profil
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('role')
        .limit(1)
        .maybeSingle();
      
      if (profile) {
        setProfileData({
          full_name: profile.full_name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          password: ""
        });
      }
      
      return { user, profile: { ...profile, role: roleData?.role } };
    }
  });

  const userRole = currentUser?.profile?.role as UserRole | null;
  const isGerant = userRole === 'gerant';

  // Récupérer les données du tenant
  const { data: tenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.tenant_id) throw new Error('Tenant not found');
      
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single();
      
      if (tenantData) {
        setTenantData({
          name: tenantData.name || "",
          manager_name: tenantData.manager_name || "",
          contact_email: tenantData.contact_email || "",
          address: tenantData.address || "",
          contact_phone: tenantData.contact_phone || "",
          ninea: tenantData.ninea || "",
          rccm: tenantData.rccm || "",
          logo_url: tenantData.logo_url || ""
        });
      }
      
      return tenantData;
    }
  });

  // Mutation pour mettre à jour le tenant
  const updateTenantMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.tenant_id) throw new Error('Tenant not found');
      
      const { error } = await supabase
        .from('tenants')
        .update(tenantData)
        .eq('id', profile.tenant_id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast({
        title: "Succès",
        description: "Les informations de l'entreprise ont été mises à jour",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les informations",
        variant: "destructive"
      });
    }
  });

  // Mutation pour mettre à jour le profil
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Validation des champs
      if (!profileData.full_name || profileData.full_name.trim() === '') {
        throw new Error('Le nom complet est obligatoire');
      }
      
      // Use the secure update function that prevents role escalation
      const { error: profileError } = await supabase.rpc('update_own_profile', {
        user_id: user?.id,
        new_full_name: profileData.full_name.trim(),
        new_phone: profileData.phone || null,
        new_avatar_url: null // Keep existing avatar
      });
      
      if (profileError) {
        console.error('Profile update error:', profileError);
        throw new Error(profileError.message || 'Erreur lors de la mise à jour du profil');
      }

      // Mettre à jour le mot de passe si fourni
      if (profileData.password && profileData.password.length >= 6) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: profileData.password
        });
        if (passwordError) {
          console.error('Password update error:', passwordError);
          throw new Error(passwordError.message || 'Erreur lors de la mise à jour du mot de passe');
        }
      } else if (profileData.password && profileData.password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast({
        title: "Succès",
        description: "Votre profil a été mis à jour",
      });
      setProfileData(prev => ({ ...prev, password: "" }));
    },
    onError: (error: any) => {
      console.error('Update profile mutation error:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de mettre à jour le profil",
        variant: "destructive"
      });
    }
  });

  // Exporter les données
  const handleExportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.tenant_id) throw new Error('Tenant not found');

      // Récupérer toutes les données
      const tables = [
        'bassins', 'campagnes', 'production_records', 'harvests',
        'sales', 'clients', 'stocks', 'warehouses', 'employees',
        'daily_workers', 'transactions', 'accounts'
      ] as const;

      const exportData: Record<string, any> = {};
      
      for (const table of tables) {
        const { data } = await supabase
          .from(table as any)
          .select('*')
          .eq('tenant_id', profile.tenant_id);
        exportData[table] = data;
      }

      // Créer un fichier JSON
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `export-donnees-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Vos données ont été exportées avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAllData = () => {
    toast({
      title: "Attention",
      description: "Cette fonctionnalité nécessite une confirmation supplémentaire",
      variant: "destructive"
    });
  };

  // Fonction pour recadrer et redimensionner l'image
  const cropAndResizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 400; // Taille du logo final
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Cannot get canvas context'));
            return;
          }

          // Calculer le ratio pour le recadrage carré
          const sourceSize = Math.min(img.width, img.height);
          const sourceX = (img.width - sourceSize) / 2;
          const sourceY = (img.height - sourceSize) / 2;

          // Dessiner l'image recadrée et redimensionnée
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceSize, sourceSize,
            0, 0, size, size
          );

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/png', 0.95);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Gérer l'upload du logo
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image valide",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingLogo(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile?.tenant_id) throw new Error('Tenant not found');

      // Recadrer et redimensionner l'image
      const croppedBlob = await cropAndResizeImage(file);

      // Supprimer l'ancien logo s'il existe
      if (tenantData.logo_url) {
        const oldPath = tenantData.logo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('company-logos')
            .remove([oldPath]);
        }
      }

      // Upload le nouveau logo
      const fileName = `${profile.tenant_id}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, croppedBlob, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      // Mettre à jour la base de données
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: publicUrl })
        .eq('id', profile.tenant_id);

      if (updateError) throw updateError;

      setTenantData({ ...tenantData, logo_url: publicUrl });
      // Invalider toutes les queries tenant (incluant celle du Header)
      await queryClient.invalidateQueries({ queryKey: ['tenant'] });
      await queryClient.refetchQueries({ queryKey: ['tenant'] });

      toast({
        title: "Succès",
        description: "Le logo a été mis à jour avec succès"
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'uploader le logo",
        variant: "destructive"
      });
    } finally {
      setIsUploadingLogo(false);
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
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">Paramètres</h1>
            <p className="text-sm sm:text-base text-muted-foreground break-words">
              Configurez votre compte et l'application
            </p>
          </div>

          {/* Informations entreprise */}
          {isGerant && (
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Building className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="truncate">Informations entreprise</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                {/* Section Logo */}
                <div className="space-y-2">
                  <Label>Logo de l'entreprise</Label>
                  <div className="flex items-center gap-4">
                    {tenantData.logo_url && (
                      <div className="h-24 w-24 rounded-lg border-2 border-border overflow-hidden bg-background">
                        <img 
                          src={tenantData.logo_url} 
                          alt="Logo entreprise" 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        L'image sera automatiquement recadrée en format carré (400x400px)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Nom de l'entreprise</Label>
                    <Input 
                      id="company" 
                      value={tenantData.name}
                      onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager-name">Nom du Gérant</Label>
                    <Input 
                      id="manager-name" 
                      value={tenantData.manager_name}
                      onChange={(e) => setTenantData({ ...tenantData, manager_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-company">Email</Label>
                    <Input 
                      id="email-company" 
                      type="email"
                      value={tenantData.contact_email}
                      onChange={(e) => setTenantData({ ...tenantData, contact_email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input 
                      id="address" 
                      value={tenantData.address}
                      onChange={(e) => setTenantData({ ...tenantData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-company">Téléphone</Label>
                    <Input 
                      id="phone-company" 
                      value={tenantData.contact_phone}
                      onChange={(e) => setTenantData({ ...tenantData, contact_phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ninea">NINEA</Label>
                    <Input 
                      id="ninea" 
                      value={tenantData.ninea}
                      onChange={(e) => setTenantData({ ...tenantData, ninea: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rccm">RCCM</Label>
                    <Input 
                      id="rccm" 
                      value={tenantData.rccm}
                      onChange={(e) => setTenantData({ ...tenantData, rccm: e.target.value })}
                    />
                  </div>
                </div>
                <Button 
                  className="bg-gradient-to-r from-primary to-accent"
                  onClick={() => updateTenantMutation.mutate()}
                  disabled={updateTenantMutation.isPending}
                >
                  {updateTenantMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer les modifications"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Compte utilisateur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Compte utilisateur
              </CardTitle>
            </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input 
                    id="name" 
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profileData.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone-user">Téléphone</Label>
                  <Input 
                    id="phone-user" 
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Laisser vide pour ne pas changer"
                    value={profileData.password}
                    onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                  />
                </div>
              </div>
              <Button 
                className="bg-gradient-to-r from-primary to-accent"
                onClick={() => updateProfileMutation.mutate()}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Mise à jour...
                  </>
                ) : (
                  "Mettre à jour le profil"
                )}
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
                <Switch 
                  checked={notifications.weather}
                  onCheckedChange={(checked) => {
                    setNotifications({ ...notifications, weather: checked });
                    toast({
                      title: checked ? "Activé" : "Désactivé",
                      description: `Alertes météorologiques ${checked ? 'activées' : 'désactivées'}`,
                    });
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertes de stock</p>
                  <p className="text-sm text-muted-foreground">
                    Notifications quand le stock est faible
                  </p>
                </div>
                <Switch 
                  checked={notifications.stock}
                  onCheckedChange={(checked) => {
                    setNotifications({ ...notifications, stock: checked });
                    toast({
                      title: checked ? "Activé" : "Désactivé",
                      description: `Alertes de stock ${checked ? 'activées' : 'désactivées'}`,
                    });
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Rapports automatiques</p>
                  <p className="text-sm text-muted-foreground">
                    Recevoir les rapports mensuels par email
                  </p>
                </div>
                <Switch 
                  checked={notifications.reports}
                  onCheckedChange={(checked) => {
                    setNotifications({ ...notifications, reports: checked });
                    toast({
                      title: checked ? "Activé" : "Désactivé",
                      description: `Rapports automatiques ${checked ? 'activés' : 'désactivés'}`,
                    });
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertes production</p>
                  <p className="text-sm text-muted-foreground">
                    Notifications sur les récoltes et production
                  </p>
                </div>
                <Switch 
                  checked={notifications.production}
                  onCheckedChange={(checked) => {
                    setNotifications({ ...notifications, production: checked });
                    toast({
                      title: checked ? "Activé" : "Désactivé",
                      description: `Alertes production ${checked ? 'activées' : 'désactivées'}`,
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="truncate">Sécurité</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Authentification à deux facteurs (2FA)</p>
                  <p className="text-sm text-muted-foreground">
                    Ajouter une couche de sécurité supplémentaire
                  </p>
                </div>
                <Switch 
                  checked={security.twoFactor}
                  onCheckedChange={(checked) => {
                    setSecurity({ ...security, twoFactor: checked });
                    toast({
                      title: checked ? "2FA activé" : "2FA désactivé",
                      description: checked 
                        ? "L'authentification à deux facteurs est maintenant activée" 
                        : "L'authentification à deux facteurs est désactivée",
                    });
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Historique des connexions</p>
                  <p className="text-sm text-muted-foreground">
                    Afficher l'historique de vos connexions
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Historique",
                      description: "Dernière connexion: Aujourd'hui à " + new Date().toLocaleTimeString('fr-FR'),
                    });
                  }}
                >
                  Voir l'historique
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sessions actives</p>
                  <p className="text-sm text-muted-foreground">
                    Gérer vos sessions actives
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Session active",
                      description: "1 session active (appareil actuel)",
                    });
                  }}
                >
                  Gérer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Données */}
          {isGerant && (
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
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={handleExportData}
                  >
                    <Download className="h-4 w-4" />
                    Exporter
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sauvegarde automatique</p>
                    <p className="text-sm text-muted-foreground">
                      Sauvegardes quotidiennes de vos données
                    </p>
                  </div>
                  <Switch 
                    checked={security.autoBackup}
                    onCheckedChange={(checked) => {
                      setSecurity({ ...security, autoBackup: checked });
                      toast({
                        title: checked ? "Activé" : "Désactivé",
                        description: checked 
                          ? "Les sauvegardes automatiques sont activées" 
                          : "Les sauvegardes automatiques sont désactivées",
                      });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <div>
                    <p className="font-medium text-destructive">Zone dangereuse</p>
                    <p className="text-sm text-muted-foreground">
                      Supprimer définitivement toutes les données
                    </p>
                  </div>
                  <Button 
                    variant="destructive"
                    onClick={handleDeleteAllData}
                  >
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default Parametres;
