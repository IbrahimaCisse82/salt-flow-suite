import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, CheckCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAccountantNotifications, useMarkNotificationAsRead, useUnreadNotificationsCount } from "@/hooks/useAccountantNotifications";

export function AccountantNotificationWidget() {
  const { data: notifications } = useAccountantNotifications();
  const { data: unreadCount } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();

  const handleMarkAsRead = async (id: string) => {
    await markAsRead.mutateAsync(id);
  };

  const unreadNotifications = notifications?.filter(n => !n.is_read) || [];
  const readNotifications = notifications?.filter(n => n.is_read) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications RH
            </CardTitle>
            <CardDescription>Paiements en attente</CardDescription>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-6 px-2">
              {unreadCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {unreadNotifications.length === 0 && readNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune notification
              </div>
            ) : (
              <>
                {unreadNotifications.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Non lues</h4>
                    {unreadNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 border rounded-lg bg-accent/50 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h5 className="font-medium">{notification.title}</h5>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>
                                {format(new Date(notification.created_at), "dd MMM yyyy à HH:mm", {
                                  locale: fr,
                                })}
                              </span>
                              <span className="font-medium text-primary">
                                {notification.amount.toLocaleString()} FCFA
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <CheckCheck className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {readNotifications.length > 0 && (
                  <div className="space-y-2 mt-6">
                    <h4 className="text-sm font-medium text-muted-foreground">Lues</h4>
                    {readNotifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className="p-3 border rounded-lg opacity-60"
                      >
                        <h5 className="font-medium text-sm">{notification.title}</h5>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>
                            {format(new Date(notification.created_at), "dd MMM yyyy", {
                              locale: fr,
                            })}
                          </span>
                          <span>{notification.amount.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
