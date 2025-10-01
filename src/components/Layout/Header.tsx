import { Waves, Menu, Bell, User, LogOut, CheckCircle2, AlertCircle, Building2, PanelLeft, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
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
  X
} from "lucide-react";
import saltLogo from "@/assets/salt-logo.png";

const mockNotifications = [
  {
    id: 1,
    type: "success",
    title: "Production enregistrée",
    message: "125 tonnes de sel gros ajoutées au stock",
    time: "Il y a 2h",
    read: false
  },
  {
    id: 2,
    type: "warning",
    title: "Vente en attente",
    message: "Commande client #1234 nécessite validation",
    time: "Il y a 5h",
    read: false
  },
  {
    id: 3,
    type: "info",
    title: "Rapport disponible",
    message: "Rapport mensuel de mars prêt à télécharger",
    time: "Hier",
    read: true
  }
];

const adminNavItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/admin" },
  { icon: BuildingIcon, label: "Entreprises", href: "/admin/tenants" },
  { icon: BookOpen, label: "Plan comptable", href: "/admin/chart-of-accounts" },
  { icon: Settings, label: "Paramètres", href: "/parametres" },
];

const salinesNavItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/" },
  { icon: Droplets, label: "Bassins salants", href: "/bassins" },
  { icon: Calendar, label: "Plan de campagne", href: "/campagne" },
  { icon: Database, label: "Production", href: "/production" },
  { icon: Package, label: "Stocks", href: "/stocks" },
  { icon: Users, label: "Équipes", href: "/equipes" },
  { icon: TrendingUp, label: "Commercial", href: "/commercial" },
  { icon: Wallet, label: "Comptabilité", href: "/comptabilite" },
  { icon: FileText, label: "Rapports", href: "/rapports" },
  { icon: UserCog, label: "Utilisateurs", href: "/utilisateurs" },
  { icon: Settings, label: "Paramètres", href: "/parametres" },
];

export const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, tenant } = useAuth();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toggle: toggleSidebar, isOpen: sidebarOpen } = useSidebar();

  const { data: userRole } = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      return profile?.role as UserRole;
    }
  });

  const navItems = userRole === 'admin' ? adminNavItems : salinesNavItems;
  const visibleNavItems = navItems.filter(item => 
    hasAccessToPage(userRole || null, item.href)
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast({
      title: "Notifications marquées comme lues",
      description: "Toutes les notifications ont été lues",
    });
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
      
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
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
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex gap-3 p-3 cursor-pointer"
                      onClick={() => {
                        const updatedNotifications = notifications.map(n =>
                          n.id === notification.id ? { ...n, read: true } : n
                        );
                        setNotifications(updatedNotifications);
                      }}
                    >
                      <div className="flex-shrink-0">
                        {notification.type === "success" ? (
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        ) : notification.type === "warning" ? (
                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                        ) : (
                          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs sm:text-sm font-medium truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground break-words">
                          {notification.message}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {notification.time}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Aucune notification
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
          <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
            {visibleNavItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => {
                  navigate(item.href);
                  setMobileMenuOpen(false);
                }}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </header>
  );
};
