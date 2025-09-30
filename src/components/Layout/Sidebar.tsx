import { 
  LayoutDashboard, 
  Droplets, 
  Calendar, 
  Package, 
  Users, 
  TrendingUp,
  FileText,
  Settings,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/", active: true },
  { icon: Droplets, label: "Bassins salants", href: "/bassins" },
  { icon: Calendar, label: "Plan de campagne", href: "/campagne" },
  { icon: Database, label: "Production", href: "/production" },
  { icon: Package, label: "Stocks", href: "/stocks" },
  { icon: Users, label: "Équipes", href: "/equipes" },
  { icon: TrendingUp, label: "Commercial", href: "/commercial" },
  { icon: FileText, label: "Rapports", href: "/rapports" },
  { icon: Settings, label: "Paramètres", href: "/parametres" },
];

export const Sidebar = () => {
  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={item.active ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              item.active && "bg-secondary/80"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Button>
        ))}
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
