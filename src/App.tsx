import { lazy, Suspense, ReactNode, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/queryConfig";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { MobileBottomNav } from "./components/Layout/MobileBottomNav";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { usePageTracking } from "./hooks/usePageTracking";
import { useRealtimeNotifications } from "./hooks/useRealtimeNotifications";
import { DashboardSkeleton } from "./components/LoadingSkeletons/DashboardSkeleton";
import { TableSkeleton } from "./components/LoadingSkeletons/TableSkeleton";
import { FormSkeleton } from "./components/LoadingSkeletons/FormSkeleton";

// ── Eager-load critical route ──
import Auth from "./pages/Auth";

// ── Route definitions (single source of truth) ──
type FallbackType = "dashboard" | "table" | "form" | "minimal";

interface RouteConfig {
  path: string;
  load: () => Promise<{ default: React.ComponentType }>;
  fallback: FallbackType;
  isPublic?: boolean;
}

const routes: RouteConfig[] = [
  // Public routes
  { path: "/install", load: () => import("./pages/Install"), fallback: "minimal", isPublic: true },
  { path: "/cgu", load: () => import("./pages/CGU"), fallback: "minimal", isPublic: true },
  { path: "/admin/setup", load: () => import("./pages/admin/Setup"), fallback: "minimal", isPublic: true },

  // Dashboard routes
  { path: "/", load: () => import("./pages/Index"), fallback: "dashboard" },
  { path: "/admin", load: () => import("./pages/admin/Dashboard"), fallback: "dashboard" },
  { path: "/campagne", load: () => import("./pages/Campagne"), fallback: "dashboard" },
  { path: "/admin/monitoring", load: () => import("./pages/admin/Monitoring"), fallback: "dashboard" },

  // Table routes
  { path: "/bassins", load: () => import("./pages/Bassins"), fallback: "table" },
  { path: "/production", load: () => import("./pages/Production"), fallback: "table" },
  { path: "/stocks", load: () => import("./pages/Stocks"), fallback: "table" },
  { path: "/equipes", load: () => import("./pages/Equipes"), fallback: "table" },
  { path: "/commercial", load: () => import("./pages/Commercial"), fallback: "table" },
  { path: "/achats", load: () => import("./pages/Achats"), fallback: "table" },
  { path: "/comptabilite", load: () => import("./pages/Comptabilite"), fallback: "table" },
  { path: "/comptabilite/grand-livre", load: () => import("./pages/comptabilite/GrandLivre"), fallback: "table" },
  { path: "/comptabilite/rapprochement", load: () => import("./pages/comptabilite/Rapprochement"), fallback: "table" },
  { path: "/comptabilite/immobilisations", load: () => import("./pages/comptabilite/Immobilisations"), fallback: "table" },
  { path: "/rapports", load: () => import("./pages/Rapports"), fallback: "table" },
  { path: "/utilisateurs", load: () => import("./pages/GestionUtilisateurs"), fallback: "table" },
  { path: "/admin/tenants", load: () => import("./pages/admin/Tenants"), fallback: "table" },
  { path: "/admin/users", load: () => import("./pages/admin/UserManagement"), fallback: "table" },
  { path: "/admin/roles", load: () => import("./pages/admin/Roles"), fallback: "table" },
  { path: "/admin/chart-of-accounts", load: () => import("./pages/admin/ChartOfAccounts"), fallback: "table" },
  { path: "/admin/expense-types", load: () => import("./pages/admin/ExpenseTypes"), fallback: "table" },
  { path: "/admin/audit-logs", load: () => import("./pages/admin/AuditLogs"), fallback: "table" },

  // Form routes
  { path: "/comptabilite/operations-diverses", load: () => import("./pages/comptabilite/OperationsDiverses"), fallback: "form" },
  { path: "/comptabilite/cloture", load: () => import("./pages/comptabilite/ClotureExercice"), fallback: "form" },
  { path: "/parametres", load: () => import("./pages/Parametres"), fallback: "form" },
  { path: "/admin/settings", load: () => import("./pages/admin/Settings"), fallback: "form" },
  { path: "/admin/email-templates", load: () => import("./pages/admin/EmailTemplates"), fallback: "form" },
];

const NotFound = lazy(() => import("./pages/NotFound"));

// ── Route prefetch map (generated from routes config) ──
export const routeImportMap: Record<string, () => Promise<any>> = Object.fromEntries(
  routes.map((r) => [r.path, r.load])
);

/** Preload a route's JS chunk on hover/focus */
export const prefetchRoute = (href: string) => {
  routeImportMap[href]?.();
};

// Singleton QueryClient
const queryClient = createQueryClient();

// ── Fallback components ──
const fallbackMap: Record<FallbackType, ReactNode> = {
  dashboard: <DashboardSkeleton />,
  table: <div className="p-4 md:p-6"><TableSkeleton /></div>,
  form: <div className="p-4 md:p-6"><FormSkeleton /></div>,
  minimal: <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>,
};

// ── Lazy component cache to avoid re-creating on each render ──
const lazyCache = new Map<string, React.LazyExoticComponent<React.ComponentType>>();

const getLazyComponent = (path: string, load: () => Promise<{ default: React.ComponentType }>) => {
  if (!lazyCache.has(path)) {
    lazyCache.set(path, lazy(load));
  }
  return lazyCache.get(path)!;
};

// Component to track page views
const PageTracker = () => {
  usePageTracking();
  return null;
};

// Component for realtime notifications
const RealtimeNotifier = () => {
  useRealtimeNotifications();
  return null;
};

const PUBLIC_ROUTE_PREFIXES = ["/auth", "/cgu", "/install", "/admin/setup"];

/** Conditionally render auth-only components based on route */
const AuthAwareShell = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const isPublicRoute = PUBLIC_ROUTE_PREFIXES.some(
    (r) => location.pathname === r || location.pathname.startsWith(r + "/")
  );

  return (
    <>
      {!isPublicRoute && <RealtimeNotifier />}
      {!isPublicRoute && <MobileBottomNav />}
      {children}
    </>
  );
};

const App = () => {
  const renderedRoutes = useMemo(
    () =>
      routes.map(({ path, load, fallback, isPublic }) => {
        const LazyPage = getLazyComponent(path, load);
        const element = (
          <Suspense fallback={fallbackMap[fallback]}>
            <LazyPage />
          </Suspense>
        );

        return (
          <Route
            key={path}
            path={path}
            element={
              isPublic ? (
                element
              ) : (
                <RoleProtectedRoute>
                  <ErrorBoundary>{element}</ErrorBoundary>
                </RoleProtectedRoute>
              )
            }
          />
        );
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <TooltipProvider>
            <PageTracker />
            <Toaster />
            <Sonner />
            <AuthAwareShell>
              <Routes>
                {/* Auth — eagerly loaded */}
                <Route path="/auth" element={<Auth />} />

                {/* All configured routes */}
                {renderedRoutes}

                {/* Redirects */}
                <Route path="/gestion-utilisateurs" element={<Navigate to="/utilisateurs" replace />} />

                {/* 404 */}
                <Route path="*" element={<Suspense fallback={fallbackMap.minimal}><NotFound /></Suspense>} />
              </Routes>
            </AuthAwareShell>
          </TooltipProvider>
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
