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
  Building2,
  BookOpen,
  PanelLeft,
  PanelLeftClose
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hasAccessToPage, UserRole } from "@/utils/permissions";
import { useSidebar } from "@/contexts/SidebarContext";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/admin" },
  { icon: Building2, label: "Entreprises", href: "/admin/tenants" },
  { icon: BookOpen, label: "Plan comptable", href: "/admin/chart-of-accounts" },
  { icon: Settings, label: "Paramètres", href: "/parametres" },
];

const salinesNavItems: NavItem[] = [
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

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, toggle } = useSidebar();

  // Récupérer le rôle de l'utilisateur actuel
  const { data: userRole } = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('role')
        .limit(1)
        .maybeSingle();
      
      return roleData?.role as UserRole || null;
    }
  });

  // Choisir les items de navigation selon le rôle
  const navItems = userRole === 'admin' ? adminNavItems : salinesNavItems;
  
  // Filtrer les items de navigation selon les permissions du rôle
  const visibleNavItems = navItems.filter(item => 
    hasAccessToPage(userRole || null, item.href)
  );

  return (
    <aside className={cn(
      "hidden md:flex flex-col border-r bg-card fixed left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto z-40 transition-all duration-300",
      isOpen ? "w-64" : "w-16"
    )}>
      <nav className="flex-1 space-y-1 p-2">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full gap-3",
                isActive && "bg-secondary/80",
                isOpen ? "justify-start" : "justify-center px-0"
              )}
              onClick={() => navigate(item.href)}
              title={!isOpen ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>
      
      {/* Bouton toggle au-dessus de la ligne */}
      <div className="p-2 flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          title={isOpen ? "Réduire" : "Agrandir"}
        >
          {isOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeft className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {/* Afficher le widget campagne uniquement pour les non-admins et en mode ouvert */}
      {userRole !== 'admin' && isOpen && (
        <div className="border-t p-4">
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-4">
            <p className="text-sm font-medium mb-1">Campagne 2025</p>
            <p className="text-xs text-muted-foreground">85% complété</p>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-[85%] bg-gradient-to-r from-primary to-accent rounded-full" />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
