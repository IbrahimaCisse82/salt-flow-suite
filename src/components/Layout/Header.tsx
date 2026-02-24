import { memo, useMemo, useState } from "react";
import { Waves, Menu, Bell, User, LogOut, Building2, PanelLeft, PanelLeftClose, ChevronDown } from "lucide-react";
import { OfflineSyncIndicator } from "@/components/OfflineSyncIndicator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAuth } from "@/contexts/AuthContext";
import { hasAccessToPage, UserRole } from "@/utils/permissions";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  LayoutDashboard,
  Droplets,
  Calendar,
  Package,
  Users,
  TrendingUp,
  FileText,
  Settings,
  Database,
  Wallet,
  UserCog,
  Building2 as BuildingIcon,
  BookOpen,
  BookOpenCheck,
  Landmark,
  FilePlus2,
  Lock,
  ShoppingCart,
  X
} from "lucide-react";
import saltLogo from "@/assets/salt-logo.png";
import { 
  useAccountantNotifications, 
  useUnreadNotificationsCount,
  useMarkNotificationAsRead 
} from "@/hooks/useAccountantNotifications";

const adminNavItems: MobileNavItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/admin" },
  { icon: BuildingIcon, label: "Entreprises", href: "/admin/tenants" },
  { icon: BookOpen, label: "Plan comptable", href: "/admin/chart-of-accounts" },
  { icon: Settings, label: "Paramètres", href: "/parametres" },
];

interface MobileNavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  children?: MobileNavItem[];
}

const salinesNavItems: MobileNavItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/" },
  { icon: Droplets, label: "Bassins salants", href: "/bassins" },
  { icon: Calendar, label: "Plan de campagne", href: "/campagne" },
  { icon: Database, label: "Production", href: "/production" },
  { icon: Package, label: "Stocks", href: "/stocks" },
  { icon: Users, label: "Équipes", href: "/equipes" },
  { icon: TrendingUp, label: "Commercial", href: "/commercial" },
  { icon: Wallet, label: "Comptabilité", href: "/comptabilite", children: [
    { icon: BookOpenCheck, label: "Grand Livre", href: "/comptabilite/grand-livre" },
    { icon: Landmark, label: "Rapprochement", href: "/comptabilite/rapprochement" },
    { icon: FilePlus2, label: "Opérations Diverses", href: "/comptabilite/operations-diverses" },
    { icon: Lock, label: "Clôture exercice", href: "/comptabilite/cloture" },
    { icon: Building2, label: "Immobilisations", href: "/comptabilite/immobilisations" },
  ]},
  { icon: ShoppingCart, label: "Achats", href: "/achats" },
  { icon: FileText, label: "Rapports", href: "/rapports" },
  { icon: UserCog, label: "Utilisateurs", href: "/utilisateurs" },
  { icon: Settings, label: "Paramètres", href: "/parametres" },
];

const HeaderComponent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, tenant } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileItems, setExpandedMobileItems] = useState<string[]>([]);
  const { toggle: toggleSidebar, isOpen: sidebarOpen } = useSidebar();
  
  // Utiliser les vraies notifications de la base de données
  const { data: accountantNotifications = [] } = useAccountantNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsReadMutation = useMarkNotificationAsRead();

  // OPTIMIZATION: Memoize computed values
  const userRole = useMemo(() => 
    (profile?.role as UserRole) ?? null,
    [profile?.role]
  );

  const navItems = useMemo(() => 
    userRole === 'admin' ? adminNavItems : salinesNavItems,
    [userRole]
  );

  const visibleNavItems = useMemo(() => 
    navItems.filter(item => hasAccessToPage(userRole, item.href)),
    [navItems, userRole]
  );

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        accountantNotifications
          .filter(n => !n.is_read)
          .map(n => markAsReadMutation.mutateAsync(n.id))
      );
      toast({
        title: "Notifications marquées comme lues",
        description: "Toutes les notifications ont été lues",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer les notifications comme lues",
        variant: "destructive"
      });
    }
  };

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      try {
        await markAsReadMutation.mutateAsync(notificationId);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      // Déconnexion de Supabase en PREMIER (avant de clear le storage)
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Ensuite seulement, vider le cache et le storage
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
      
      // Navigation fluide vers /auth avec reset de l'historique
      navigate("/auth", { replace: true });
    } catch (error) {
      logger.error("Logout error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-2 sm:px-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="rounded-lg bg-gradient-to-br from-primary to-primary-glow p-1.5 sm:p-2 flex-shrink-0">
              <img src={saltLogo} alt="G-Suite Sel Logo" className="h-5 w-5 sm:h-6 sm:w-6 object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
                G-Suite Sel
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">Gestion Saline</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-4">
          <OfflineSyncIndicator />
          
          {profile && (
            <div className="hidden md:flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-lg bg-muted/50 min-w-0 max-w-[200px]">
              {tenant?.logo_url ? (
                <img src={tenant.logo_url} alt="Logo entreprise" className="h-6 w-6 sm:h-8 sm:w-8 rounded object-contain flex-shrink-0" />
              ) : (
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex flex-col min-w-0">
                {tenant?.name && (
                  <span className="text-xs font-medium text-foreground truncate">{tenant.name}</span>
                )}
                {profile.full_name && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{profile.full_name}</span>
                )}
              </div>
            </div>
          )}
          
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 sm:w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[400px] overflow-y-auto">
                {accountantNotifications.length > 0 ? (
                  accountantNotifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex gap-3 p-3 cursor-pointer"
                      onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                    >
                      <div className="flex-shrink-0">
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs sm:text-sm font-medium truncate ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground break-words">
                          {notification.message}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucune notification</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Vous êtes à jour !</p>
                  </div>
                )}
              </div>
              {unreadCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-center text-primary cursor-pointer"
                    onClick={markAllAsRead}
                  >
                    Tout marquer comme lu
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/parametres")}>
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DrawerContent>
          <DrawerHeader className="border-b">
            <div className="flex items-center justify-between">
              <DrawerTitle>Menu</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="p-4 space-y-1 max-h-[70vh] overflow-y-auto">
            {visibleNavItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMobileItems.includes(item.href);
              return (
                <div key={item.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3"
                    onClick={() => {
                      if (hasChildren) {
                        setExpandedMobileItems(prev =>
                          prev.includes(item.href) ? prev.filter(h => h !== item.href) : [...prev, item.href]
                        );
                      }
                      navigate(item.href);
                      if (!hasChildren) setMobileMenuOpen(false);
                    }}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {hasChildren && (
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </Button>
                  {hasChildren && isExpanded && (
                    <div className="ml-6 mt-1 space-y-1 border-l-2 border-primary/20 pl-2">
                      {item.children!.map((child) => (
                        <Button
                          key={child.href}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2 text-sm"
                          onClick={() => {
                            navigate(child.href);
                            setMobileMenuOpen(false);
                          }}
                        >
                          <child.icon className="h-4 w-4" />
                          <span>{child.label}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </header>
  );
};

export const Header = memo(HeaderComponent);
