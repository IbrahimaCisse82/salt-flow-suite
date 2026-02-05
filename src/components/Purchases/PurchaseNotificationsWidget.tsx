 import { Bell, CheckCircle, Clock, AlertCircle, CreditCard } from "lucide-react";
 import { format } from "date-fns";
 import { fr } from "date-fns/locale";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { usePurchaseNotifications, PurchaseNotification } from "@/hooks/usePurchaseNotifications";
 import { cn } from "@/lib/utils";
 
 const NOTIFICATION_CONFIG: Record<string, { icon: any; color: string }> = {
   approval_request: { icon: Clock, color: "text-yellow-500" },
   advance_request: { icon: CreditCard, color: "text-blue-500" },
   order_approved: { icon: CheckCircle, color: "text-green-500" },
   order_rejected: { icon: AlertCircle, color: "text-red-500" },
   order_modified: { icon: AlertCircle, color: "text-amber-500" },
   refund_required: { icon: CreditCard, color: "text-orange-500" },
   additional_payment: { icon: CreditCard, color: "text-purple-500" },
 };
 
 interface Props {
   onAction?: (notification: PurchaseNotification) => void;
 }
 
 export function PurchaseNotificationsWidget({ onAction }: Props) {
   const { notifications, unreadCount, isLoading, markAsRead } = usePurchaseNotifications();
 
   if (isLoading) {
     return (
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-lg flex items-center gap-2">
             <Bell className="h-5 w-5" />
             Notifications Achats
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="text-center py-4 text-muted-foreground">Chargement...</div>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader className="pb-3">
         <CardTitle className="text-lg flex items-center gap-2">
           <Bell className="h-5 w-5" />
           Notifications Achats
           {unreadCount > 0 && (
             <Badge variant="destructive" className="ml-auto">{unreadCount}</Badge>
           )}
         </CardTitle>
       </CardHeader>
       <CardContent className="p-0">
         {notifications.length === 0 ? (
           <div className="text-center py-6 text-muted-foreground px-4">
             Aucune notification en attente
           </div>
         ) : (
           <ScrollArea className="h-[300px]">
             <div className="divide-y">
               {notifications.map((notif) => {
                 const config = NOTIFICATION_CONFIG[notif.notification_type] || { icon: Bell, color: "text-muted-foreground" };
                 const Icon = config.icon;
                 
                 return (
                   <div
                     key={notif.id}
                     className={cn(
                       "p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                       !notif.is_read && "bg-primary/5"
                     )}
                     onClick={() => {
                       if (!notif.is_read) markAsRead.mutate(notif.id);
                       onAction?.(notif);
                     }}
                   >
                     <div className="flex items-start gap-3">
                       <Icon className={cn("h-5 w-5 mt-0.5", config.color)} />
                       <div className="flex-1 min-w-0">
                         <p className="font-medium text-sm truncate">{notif.title}</p>
                         <p className="text-xs text-muted-foreground line-clamp-2">
                           {notif.message}
                         </p>
                         <div className="flex items-center gap-2 mt-1">
                           <span className="text-xs text-muted-foreground">
                             {format(new Date(notif.created_at), "dd MMM HH:mm", { locale: fr })}
                           </span>
                           {notif.amount && (
                             <Badge variant="outline" className="text-xs">
                               {notif.amount.toLocaleString()} FCFA
                             </Badge>
                           )}
                         </div>
                       </div>
                       {!notif.is_read && (
                         <div className="h-2 w-2 rounded-full bg-primary" />
                       )}
                     </div>
                   </div>
                 );
               })}
             </div>
           </ScrollArea>
         )}
       </CardContent>
     </Card>
   );
 }