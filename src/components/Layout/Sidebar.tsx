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
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/" },
  { icon: Droplets, label: "Bassins salants", href: "/bassins" },
  { icon: Calendar, label: "Plan de campagne", href: "/campagne" },
  { icon: Database, label: "Production", href: "/production" },
  { icon: Package, label: "Stocks", href: "/stocks" },
  { icon: Users, label: "Équipes", href: "/equipes" },
  { icon: TrendingUp, label: "Commercial", href: "/commercial" },
  { icon: Wallet, label: "Comptabilité", href: "/comptabilite" },
  { icon: FileText, label: "Rapports", href: "/rapports" },
  { icon: Settings, label: "Paramètres", href: "/parametres" },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card sticky top-0 h-screen overflow-y-auto">
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                isActive && "bg-secondary/80"
              )}
              onClick={() => navigate(item.href)}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Button>
          );
        })}
      </nav>
      
      <div className="border-t p-4">
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-4">
          <p className="text-sm font-medium mb-1">Campagne 2025</p>
          <p className="text-xs text-muted-foreground">85% complété</p>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-[85%] bg-gradient-to-r from-primary to-accent rounded-full" />
          </div>
        </div>
      </div>
    </aside>
  );
};
