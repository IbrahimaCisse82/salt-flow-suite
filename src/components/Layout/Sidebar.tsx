import { memo, useMemo } from "react";
import {
  LayoutDashboard,
  Droplets,
  Calendar,
  Database,
  Package,
  Users,
  CalendarDays,
  TrendingUp,
  Wallet,
  ShoppingCart,
  FileText,
  UserCog,
  Settings,
  Building2,
  Shield,
  BookOpen,
  Receipt,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { hasAccessToPage, UserRole } from "@/utils/permissions";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCampagnes } from "@/hooks/useCampagnes";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/admin" },
  { icon: Building2, label: "Entreprises", href: "/admin/tenants" },
  { icon: Users, label: "Gestion utilisateurs", href: "/admin/users" },
  { icon: Shield, label: "Rôles & Permissions", href: "/admin/roles" },
  { icon: BookOpen, label: "Plan comptable", href: "/admin/chart-of-accounts" },
  { icon: Receipt, label: "Types de dépenses", href: "/admin/expense-types" },
  { icon: Settings, label: "Paramètres", href: "/parametres" },
];

const salinesNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/" },
  { icon: Droplets, label: "Bassins salants", href: "/bassins" },
  { icon: Calendar, label: "Plan de campagne", href: "/campagne" },
  { icon: Database, label: "Production", href: "/production" },
  { icon: Package, label: "Stocks", href: "/stocks" },
  { icon: Users, label: "Équipes", href: "/equipes" },
  { icon: CalendarDays, label: "Congés", href: "/conges" },
  { icon: TrendingUp, label: "Commercial", href: "/commercial" },
  { icon: Wallet, label: "Comptabilité", href: "/comptabilite" },
  { icon: ShoppingCart, label: "Achats", href: "/achats" },
  { icon: FileText, label: "Rapports", href: "/rapports" },
  { icon: UserCog, label: "Utilisateurs", href: "/utilisateurs" },
  { icon: Settings, label: "Paramètres", href: "/parametres" },
];

const SidebarComponent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, toggle } = useSidebar();
  const { profile } = useAuth();
  const { activeCampagne } = useCampagnes();

  // OPTIMIZATION: Memoize computed values to avoid recalculation
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
      {userRole !== 'admin' && isOpen && activeCampagne && (
        <div className="border-t p-4">
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-4">
            <p className="text-sm font-medium mb-1">{activeCampagne.name}</p>
            {activeCampagne.target_production > 0 && (
              <>
                <p className="text-xs text-muted-foreground">
                  {Math.round((Number(activeCampagne.actual_production) / Number(activeCampagne.target_production)) * 100)}% complété
                </p>
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" 
                    style={{ 
                      width: `${Math.min(Math.round((Number(activeCampagne.actual_production) / Number(activeCampagne.target_production)) * 100), 100)}%` 
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export const Sidebar = memo(SidebarComponent);
