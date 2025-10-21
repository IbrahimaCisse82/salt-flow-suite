import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationSubscribed,
  requestNotificationPermission
} from "@/utils/pushNotifications";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const PushNotificationSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
    checkPermissionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    const subscribed = await isPushNotificationSubscribed();
    setIsSubscribed(subscribed);
  };

  const checkPermissionStatus = () => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
  };

  const handleToggleNotifications = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      if (isSubscribed) {
        // Se désabonner
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          setIsSubscribed(false);
          toast({
            title: "Notifications désactivées",
            description: "Vous ne recevrez plus de notifications push",
          });
        } else {
          toast({
            title: "Erreur",
            description: "Impossible de désactiver les notifications",
            variant: "destructive",
          });
        }
      } else {
        // S'abonner
        const success = await subscribeToPushNotifications(user.id);
        if (success) {
          setIsSubscribed(true);
          checkPermissionStatus();
          toast({
            title: "Notifications activées",
            description: "Vous recevrez désormais des notifications push",
          });
        } else {
          toast({
            title: "Erreur",
            description: "Impossible d'activer les notifications. Vérifiez les permissions de votre navigateur.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      checkPermissionStatus();
      if (granted) {
        toast({
          title: "Permission accordée",
          description: "Vous pouvez maintenant activer les notifications",
        });
      } else {
        toast({
          title: "Permission refusée",
          description: "Vous devez autoriser les notifications dans les paramètres de votre navigateur",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!('Notification' in window)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications Push
          </CardTitle>
          <CardDescription>
            Les notifications push ne sont pas supportées par votre navigateur
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications Push
        </CardTitle>
        <CardDescription>
          Recevez des notifications sur votre appareil même quand l'application est fermée
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {permissionState === 'default' && (
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Pour recevoir des notifications, vous devez d'abord autoriser les notifications pour ce site.
            </p>
            <Button 
              onClick={handleRequestPermission} 
              disabled={loading}
              variant="outline"
            >
              Autoriser les notifications
            </Button>
          </div>
        )}

        {permissionState === 'denied' && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              Les notifications sont bloquées. Veuillez les autoriser dans les paramètres de votre navigateur.
            </p>
          </div>
        )}

        {permissionState === 'granted' && (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications" className="text-base">
                Notifications push
              </Label>
              <p className="text-sm text-muted-foreground">
                {isSubscribed
                  ? "Les notifications sont activées"
                  : "Les notifications sont désactivées"}
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={isSubscribed}
              onCheckedChange={handleToggleNotifications}
              disabled={loading}
            />
          </div>
        )}

        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium">Types de notifications :</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Pointages validés nécessitant un paiement</li>
            <li>Nouvelles tâches comptables</li>
            <li>Alertes de production</li>
            <li>Mises à jour importantes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
