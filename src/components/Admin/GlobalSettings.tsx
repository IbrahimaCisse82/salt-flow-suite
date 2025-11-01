import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Save, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function GlobalSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings' as any)
        .select('*');
      
      if (error) throw error;
      return data as any[];
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('admin_settings' as any)
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Paramètre mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const getSetting = (key: string) => {
    return settings?.find(s => s.setting_key === key)?.setting_value;
  };

  const handleToggle = (key: string, checked: boolean) => {
    updateSettingMutation.mutate({ key, value: checked });
  };

  const handleSave = (key: string, value: any) => {
    updateSettingMutation.mutate({ key, value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configuration Globale
        </h2>
        <p className="text-muted-foreground">Paramètres système et configuration de la plateforme</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>Configuration de base de l'application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de l'Application</Label>
                <Input 
                  defaultValue={getSetting('app_name') || 'SaltERP'}
                  onBlur={(e) => handleSave('app_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mode Maintenance</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={getSetting('maintenance_mode') || false}
                    onCheckedChange={(checked) => handleToggle('maintenance_mode', checked)}
                  />
                  <span className="text-sm text-muted-foreground">
                    Activer le mode maintenance pour tous les utilisateurs
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Message de Maintenance</Label>
                <Textarea 
                  placeholder="L'application est en maintenance..."
                  defaultValue={getSetting('maintenance_message') || ''}
                  onBlur={(e) => handleSave('maintenance_message', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>Activer ou désactiver des fonctionnalités</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'enable_analytics', label: 'Analytics Avancés', desc: 'Activer le module d\'analytics et rapports' },
                { key: 'enable_push_notifications', label: 'Notifications Push', desc: 'Permettre les notifications push' },
                { key: 'enable_multi_tenant', label: 'Multi-Tenant', desc: 'Support de plusieurs organisations' },
                { key: 'enable_api_access', label: 'API Externe', desc: 'Autoriser l\'accès API externe' },
                { key: 'enable_export', label: 'Export de Données', desc: 'Permettre l\'export CSV/Excel' },
              ].map((feature) => (
                <div key={feature.key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{feature.label}</Label>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                  <Switch 
                    checked={getSetting(feature.key) || false}
                    onCheckedChange={(checked) => handleToggle(feature.key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des Notifications</CardTitle>
              <CardDescription>Paramètres de notification système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email d'Expéditeur par Défaut</Label>
                <Input 
                  type="email"
                  defaultValue={getSetting('default_sender_email') || 'noreply@salterp.com'}
                  onBlur={(e) => handleSave('default_sender_email', e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications par Email</Label>
                  <p className="text-sm text-muted-foreground">Envoyer des emails de notification</p>
                </div>
                <Switch 
                  checked={getSetting('email_notifications') || true}
                  onCheckedChange={(checked) => handleToggle('email_notifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Digest Quotidien</Label>
                  <p className="text-sm text-muted-foreground">Résumé quotidien pour les admins</p>
                </div>
                <Switch 
                  checked={getSetting('daily_digest') || false}
                  onCheckedChange={(checked) => handleToggle('daily_digest', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Sécurité</CardTitle>
              <CardDescription>Configuration de la sécurité système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Durée de Session (minutes)</Label>
                <Input 
                  type="number"
                  defaultValue={getSetting('session_timeout') || 60}
                  onBlur={(e) => handleSave('session_timeout', parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Authentification à Deux Facteurs</Label>
                  <p className="text-sm text-muted-foreground">Forcer 2FA pour tous les utilisateurs</p>
                </div>
                <Switch 
                  checked={getSetting('force_2fa') || false}
                  onCheckedChange={(checked) => handleToggle('force_2fa', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Logs d'Audit Étendus</Label>
                  <p className="text-sm text-muted-foreground">Journaliser toutes les actions</p>
                </div>
                <Switch 
                  checked={getSetting('extended_audit_logs') || true}
                  onCheckedChange={(checked) => handleToggle('extended_audit_logs', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label>IPs Autorisées (une par ligne, laisser vide pour tout autoriser)</Label>
                <Textarea 
                  placeholder="192.168.1.1&#10;10.0.0.1"
                  defaultValue={getSetting('allowed_ips') || ''}
                  onBlur={(e) => handleSave('allowed_ips', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
