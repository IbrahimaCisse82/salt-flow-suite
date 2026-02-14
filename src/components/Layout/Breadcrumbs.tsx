import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href: string;
}

const routeLabels: Record<string, string> = {
  "/": "Tableau de bord",
  "/bassins": "Bassins salants",
  "/campagne": "Plan de campagne",
  "/production": "Production",
  "/stocks": "Stocks",
  "/equipes": "Équipes",
  
  "/commercial": "Commercial",
  "/comptabilite": "Comptabilité",
  "/achats": "Achats",
  "/rapports": "Rapports",
  "/parametres": "Paramètres",
  "/utilisateurs": "Utilisateurs",
  "/admin": "Administration",
  "/admin/tenants": "Entreprises",
  "/admin/users": "Gestion utilisateurs",
  "/admin/roles": "Rôles & Permissions",
  "/admin/chart-of-accounts": "Plan comptable",
  "/admin/expense-types": "Types de dépenses",
  "/admin/monitoring": "Monitoring",
  "/admin/audit-logs": "Logs d'Audit",
  "/admin/settings": "Configuration",
  "/admin/email-templates": "Templates Emails",
  "/comptabilite/grand-livre": "Grand Livre",
  "/comptabilite/rapprochement": "Rapprochement",
  "/comptabilite/operations-diverses": "Opérations Diverses",
  "/comptabilite/cloture": "Clôture d'exercice",
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Ne pas afficher les breadcrumbs sur la page d'accueil
  if (location.pathname === "/" || location.pathname === "/admin") {
    return null;
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Accueil", href: location.pathname.startsWith("/admin") ? "/admin" : "/" }
  ];

  // Construire le chemin progressivement
  let currentPath = "";
  pathnames.forEach((value) => {
    currentPath += `/${value}`;
    const label = routeLabels[currentPath] || value.charAt(0).toUpperCase() + value.slice(1);
    breadcrumbs.push({ label, href: currentPath });
  });

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <div key={crumb.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0" />
            )}
            {index === 0 && (
              <Home className="h-4 w-4 mr-2 flex-shrink-0" />
            )}
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.href}
                className={cn(
                  "hover:text-foreground transition-colors",
                  "truncate max-w-[150px]"
                )}
              >
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};
