import { memo, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { hasAccessToPage, UserRole } from "@/utils/permissions";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Droplets,
  Database,
  TrendingUp,
  Settings,
  Shield,
  Building2,
  Users,
} from "lucide-react";

interface BottomNavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const salinesBottomNav: BottomNavItem[] = [
  { icon: LayoutDashboard, label: "Accueil", href: "/" },
  { icon: Droplets, label: "Bassins", href: "/bassins" },
  { icon: Database, label: "Production", href: "/production" },
  { icon: TrendingUp, label: "Commercial", href: "/commercial" },
  { icon: Settings, label: "Plus", href: "/parametres" },
];

const adminBottomNav: BottomNavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Building2, label: "Tenants", href: "/admin/tenants" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Shield, label: "Rôles", href: "/admin/roles" },
  { icon: Settings, label: "Config", href: "/admin/settings" },
];

const MobileBottomNavComponent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const userRole = (profile?.role as UserRole) ?? null;
  const items = useMemo(
    () => (userRole === "admin" ? adminBottomNav : salinesBottomNav).filter((item) => hasAccessToPage(userRole, item.href)),
    [userRole]
  );

  if (!profile) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-bottom">
      <div className="flex items-center justify-around h-14 px-1">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const MobileBottomNav = memo(MobileBottomNavComponent);
