import { memo, useMemo, useState } from "react";
import {
  PanelLeft,
  PanelLeftClose,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { hasAccessToPage, UserRole } from "@/utils/permissions";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCampagnes } from "@/hooks/useCampagnes";
import { adminNavItems, salinesNavItems, type NavItem } from "@/config/navigation";
import { prefetchRoute } from "@/App";

const SidebarComponent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, toggle } = useSidebar();
  const { profile } = useAuth();
  const { activeCampagne } = useCampagnes();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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

  // Auto-expand parent if a child route is active
  const isChildActive = (item: NavItem) => 
    item.children?.some(child => location.pathname === child.href) ?? false;

  const toggleExpand = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  const isExpanded = (item: NavItem) => 
    expandedItems.includes(item.href) || isChildActive(item);

  return (
    <aside className={cn(
      "hidden md:flex flex-col border-r bg-card fixed left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto z-40 transition-all duration-300 shadow-sm",
      isOpen ? "w-64" : "w-16"
    )}>
      <nav className="flex-1 space-y-0.5 p-2">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const hasChildren = item.children && item.children.length > 0;
          const expanded = hasChildren && isExpanded(item);

          return (
            <div key={item.href}>
              <Button
                variant={isActive || isChildActive(item) ? "secondary" : "ghost"}
                className={cn(
                  "w-full gap-3 transition-all duration-200",
                  (isActive || isChildActive(item)) && "bg-secondary/80 font-semibold border-l-2 border-l-primary rounded-l-none",
                  !(isActive || isChildActive(item)) && "hover:translate-x-0.5",
                  isOpen ? "justify-start" : "justify-center px-0"
                )}
                onMouseEnter={() => prefetchRoute(item.href)}
                onFocus={() => prefetchRoute(item.href)}
                onClick={() => {
                  if (hasChildren && isOpen) {
                    toggleExpand(item.href);
                  }
                  navigate(item.href);
                }}
                title={!isOpen ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {isOpen && <span className="flex-1 text-left">{item.label}</span>}
                {isOpen && hasChildren && (
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    expanded && "rotate-180"
                  )} />
                )}
              </Button>

              {/* Sub-items */}
              {isOpen && hasChildren && expanded && (
                <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-primary/20 pl-2 animate-fade-in">
                  {item.children!.map((child) => {
                    const isChildRouteActive = location.pathname === child.href;
                    return (
                      <Button
                        key={child.href}
                        variant={isChildRouteActive ? "secondary" : "ghost"}
                        size="sm"
                        onMouseEnter={() => prefetchRoute(child.href)}
                        onFocus={() => prefetchRoute(child.href)}
                        className={cn(
                          "w-full justify-start gap-2 text-sm transition-all duration-200",
                          isChildRouteActive && "bg-secondary/80 font-medium",
                          !isChildRouteActive && "hover:translate-x-0.5"
                        )}
                        onClick={() => navigate(child.href)}
                      >
                        <child.icon className="h-4 w-4 flex-shrink-0" />
                        <span>{child.label}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
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
            <p className="text-sm font-medium mb-1">{activeCampagne.name} {activeCampagne.year}</p>
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
