import { memo, useMemo } from "react";
import { Bell, AlertTriangle, CheckCircle, ShoppingCart, Wallet, Building2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAccountantNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
} from "@/hooks/useAccountantNotifications";
import { useBudgetAlerts } from "@/hooks/useBudgetAlerts";
import { useToast } from "@/hooks/use-toast";

const notificationTypeIcons: Record<string, React.ElementType> = {
  payroll_validated: Wallet,
  payment_required: ShoppingCart,
  budget_alert: AlertTriangle,
  transaction_validated: CheckCircle,
  asset_disposed: Building2,
  default: Bell,
};

const NotificationCenterComponent = () => {
  const { data: notifications = [] } = useAccountantNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsReadMutation = useMarkNotificationAsRead();
  const { criticalAlerts, warningAlerts } = useBudgetAlerts();
  const { toast } = useToast();

  // Combiner les alertes budgétaires avec les notifications DB
  const totalBadgeCount = useMemo(
    () => unreadCount + criticalAlerts.length,
    [unreadCount, criticalAlerts.length]
  );

  const handleNotificationClick = async (id: string, isRead: boolean) => {
    if (!isRead) {
      try {
        await markAsReadMutation.mutateAsync(id);
      } catch (e) {
        console.error("Error marking notification as read:", e);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter((n) => !n.is_read).map((n) => markAsReadMutation.mutateAsync(n.id))
      );
      toast({ title: "Notifications marquées comme lues" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const getIcon = (type: string) => {
    const Icon = notificationTypeIcons[type] || notificationTypeIcons.default;
    return Icon;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {totalBadgeCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-destructive text-[9px] sm:text-[10px] font-bold text-destructive-foreground animate-pulse">
              {totalBadgeCount > 9 ? "9+" : totalBadgeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Budget critical alerts section */}
        {criticalAlerts.length > 0 && (
          <>
            <div className="px-3 py-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Alertes budgétaires critiques
              </p>
            </div>
            {criticalAlerts.slice(0, 3).map((alert) => (
              <DropdownMenuItem key={alert.id} className="flex gap-3 p-3 cursor-pointer">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-destructive">
                    Dépassement: {alert.expense_category}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Phase {alert.phase} — {Math.round(alert.engagement_rate)}% du budget consommé
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Warning budget alerts */}
        {warningAlerts.length > 0 && criticalAlerts.length === 0 && (
          <>
            <div className="px-3 py-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Seuils d'alerte
              </p>
            </div>
            {warningAlerts.slice(0, 2).map((alert) => (
              <DropdownMenuItem key={alert.id} className="flex gap-3 p-3 cursor-pointer">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">
                    {alert.expense_category} — {Math.round(alert.engagement_rate)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Reste: {alert.remaining.toLocaleString()} FCFA
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* DB notifications */}
        <div className="max-h-[350px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((n) => {
              const Icon = getIcon(n.notification_type);
              return (
                <DropdownMenuItem
                  key={n.id}
                  className="flex gap-3 p-3 cursor-pointer"
                  onClick={() => handleNotificationClick(n.id, n.is_read)}
                >
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs font-medium truncate ${
                          !n.is_read ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {new Date(n.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })
          ) : criticalAlerts.length === 0 && warningAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucune notification</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Vous êtes à jour !</p>
            </div>
          ) : null}
        </div>

        {unreadCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary cursor-pointer" onClick={markAllAsRead}>
              Tout marquer comme lu
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const NotificationCenter = memo(NotificationCenterComponent);
