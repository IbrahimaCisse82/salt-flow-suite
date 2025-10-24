import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useNotificationHistory, useTestNotification } from '@/hooks/useNotificationHistory';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const NotificationHistoryWidget = () => {
  const { data: notifications = [], isLoading } = useNotificationHistory();
  const testNotification = useTestNotification();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      sent: 'default',
      failed: 'destructive',
      pending: 'secondary',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status === 'sent' ? 'Envoyée' : status === 'failed' ? 'Échec' : 'En attente'}
      </Badge>
    );
  };

  const getNotificationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'leave_approved': 'Congé approuvé',
      'leave_rejected': 'Congé refusé',
      'attendance_validated': 'Pointage validé',
      'attendance_reminder': 'Rappel de validation',
      'payroll_payment': 'Paiement RH',
      'test': 'Test',
      'general': 'Général',
    };
    return types[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Historique des notifications
            </CardTitle>
            <CardDescription>
              Liste des notifications push envoyées récemment
            </CardDescription>
          </div>
          <Button
            onClick={() => testNotification.mutate()}
            disabled={testNotification.isPending}
            size="sm"
            variant="outline"
          >
            <Send className="h-4 w-4 mr-2" />
            Tester
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune notification envoyée pour le moment</p>
            <p className="text-sm mt-2">
              Cliquez sur "Tester" pour envoyer une notification de test
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {getStatusIcon(notification.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-sm">
                            {notification.title}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {getNotificationTypeLabel(notification.notification_type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 break-words">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(notification.sent_at), 'PPp', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(notification.status)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
