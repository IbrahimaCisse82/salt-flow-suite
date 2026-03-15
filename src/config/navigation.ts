import {
  LayoutDashboard,
  Droplets,
  Calendar,
  Database,
  Package,
  Users,
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
  Activity,
  Mail,
  BookOpenCheck,
  Landmark,
  FilePlus2,
  Lock,
} from "lucide-react";

export interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  children?: NavItem[];
}

export const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/admin" },
  { icon: Building2, label: "Entreprises", href: "/admin/tenants" },
  { icon: Users, label: "Gestion utilisateurs", href: "/admin/users" },
  { icon: Shield, label: "Rôles & Permissions", href: "/admin/roles" },
  { icon: BookOpen, label: "Plan comptable", href: "/admin/chart-of-accounts" },
  { icon: Receipt, label: "Types de dépenses", href: "/admin/expense-types" },
  { icon: Activity, label: "Monitoring", href: "/admin/monitoring" },
  { icon: FileText, label: "Logs d'Audit", href: "/admin/audit-logs" },
  { icon: Settings, label: "Configuration", href: "/admin/settings" },
  { icon: Mail, label: "Templates Emails", href: "/admin/email-templates" },
];

export const salinesNavItems: NavItem[] = [
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

/** Subset of admin nav items for the mobile header drawer */
export const adminMobileNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/admin" },
  { icon: Building2, label: "Entreprises", href: "/admin/tenants" },
  { icon: BookOpen, label: "Plan comptable", href: "/admin/chart-of-accounts" },
  { icon: Settings, label: "Paramètres", href: "/parametres" },
];
