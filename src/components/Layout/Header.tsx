import { memo, useMemo, useState } from "react";
import { Menu, User, LogOut, Building2, ChevronDown, X } from "lucide-react";
import { OfflineSyncIndicator } from "@/components/OfflineSyncIndicator";
import { Button } from "@/components/ui/button";
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
import saltLogo from "@/assets/salt-logo.png";
import { NotificationCenter } from "@/components/Notifications/NotificationCenter";
import { adminMobileNavItems, salinesNavItems, type NavItem } from "@/config/navigation";
import { prefetchRoute } from "@/App";

const HeaderComponent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, tenant } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileItems, setExpandedMobileItems] = useState<string[]>([]);
  const { toggle: toggleSidebar, isOpen: sidebarOpen } = useSidebar();

  // OPTIMIZATION: Memoize computed values
  const userRole = useMemo(() => 
    (profile?.role as UserRole) ?? null,
    [profile?.role]
  );

  const navItems = useMemo(() => 
    userRole === 'admin' ? adminMobileNavItems : salinesNavItems,
    [userRole]
  );

  const visibleNavItems = useMemo(() => 
    navItems.filter(item => hasAccessToPage(userRole, item.href)),
    [navItems, userRole]
  );

  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
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
          
          <NotificationCenter />
          
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
                      onMouseEnter={() => prefetchRoute(item.href)}
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
