import { lazy, Suspense, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { usePageTracking } from "./hooks/usePageTracking";
import { useRealtimeNotifications } from "./hooks/useRealtimeNotifications";
import { DashboardSkeleton } from "./components/LoadingSkeletons/DashboardSkeleton";
import { TableSkeleton } from "./components/LoadingSkeletons/TableSkeleton";
import { FormSkeleton } from "./components/LoadingSkeletons/FormSkeleton";

// ── Eager-load critical routes (no lazy for auth & dashboard) ──
import Auth from "./pages/Auth";

// ── Lazy load all other pages ──
const Index = lazy(() => import("./pages/Index"));
const CGU = lazy(() => import("./pages/CGU"));
const Bassins = lazy(() => import("./pages/Bassins"));
const Campagne = lazy(() => import("./pages/Campagne"));
const Production = lazy(() => import("./pages/Production"));
const Stocks = lazy(() => import("./pages/Stocks"));
const Equipes = lazy(() => import("./pages/Equipes"));
const Commercial = lazy(() => import("./pages/Commercial"));
const Rapports = lazy(() => import("./pages/Rapports"));
const Parametres = lazy(() => import("./pages/Parametres"));
const Comptabilite = lazy(() => import("./pages/Comptabilite"));
const ComptaGrandLivre = lazy(() => import("./pages/comptabilite/GrandLivre"));
const ComptaRapprochement = lazy(() => import("./pages/comptabilite/Rapprochement"));
const ComptaOperationsDiverses = lazy(() => import("./pages/comptabilite/OperationsDiverses"));
const ComptaClotureExercice = lazy(() => import("./pages/comptabilite/ClotureExercice"));
const ComptaImmobilisations = lazy(() => import("./pages/comptabilite/Immobilisations"));
const Achats = lazy(() => import("./pages/Achats"));
const GestionUtilisateurs = lazy(() => import("./pages/GestionUtilisateurs"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminTenants = lazy(() => import("./pages/admin/Tenants"));
const AdminRoles = lazy(() => import("./pages/admin/Roles"));
const AdminUserManagement = lazy(() => import("./pages/admin/UserManagement"));
const AdminChartOfAccounts = lazy(() => import("./pages/admin/ChartOfAccounts"));
const AdminExpenseTypes = lazy(() => import("./pages/admin/ExpenseTypes"));
const AdminSetup = lazy(() => import("./pages/admin/Setup"));
const AdminMonitoring = lazy(() => import("./pages/admin/Monitoring"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/EmailTemplates"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Install = lazy(() => import("./pages/Install"));

// ── Route prefetch map for hover-based preloading ──
export const routeImportMap: Record<string, () => Promise<any>> = {
  "/": () => import("./pages/Index"),
  "/bassins": () => import("./pages/Bassins"),
  "/campagne": () => import("./pages/Campagne"),
  "/production": () => import("./pages/Production"),
  "/stocks": () => import("./pages/Stocks"),
  "/equipes": () => import("./pages/Equipes"),
  "/commercial": () => import("./pages/Commercial"),
  "/rapports": () => import("./pages/Rapports"),
  "/parametres": () => import("./pages/Parametres"),
  "/comptabilite": () => import("./pages/Comptabilite"),
  "/comptabilite/grand-livre": () => import("./pages/comptabilite/GrandLivre"),
  "/comptabilite/rapprochement": () => import("./pages/comptabilite/Rapprochement"),
  "/comptabilite/operations-diverses": () => import("./pages/comptabilite/OperationsDiverses"),
  "/comptabilite/cloture": () => import("./pages/comptabilite/ClotureExercice"),
  "/comptabilite/immobilisations": () => import("./pages/comptabilite/Immobilisations"),
  "/achats": () => import("./pages/Achats"),
  "/utilisateurs": () => import("./pages/GestionUtilisateurs"),
  "/admin": () => import("./pages/admin/Dashboard"),
  "/admin/tenants": () => import("./pages/admin/Tenants"),
  "/admin/users": () => import("./pages/admin/UserManagement"),
  "/admin/roles": () => import("./pages/admin/Roles"),
  "/admin/settings": () => import("./pages/admin/Settings"),
  "/admin/monitoring": () => import("./pages/admin/Monitoring"),
  "/admin/audit-logs": () => import("./pages/admin/AuditLogs"),
  "/admin/chart-of-accounts": () => import("./pages/admin/ChartOfAccounts"),
  "/admin/expense-types": () => import("./pages/admin/ExpenseTypes"),
  "/admin/email-templates": () => import("./pages/admin/EmailTemplates"),
};

/** Preload a route's JS chunk on hover/focus */
export const prefetchRoute = (href: string) => {
  const loader = routeImportMap[href];
  if (loader) loader();
};

// Optimized QueryClient with better caching
const queryClient = createQueryClient();

// ── Skeleton fallbacks per route type ──
const DashboardLoader = () => <DashboardSkeleton />;
const TableLoader = () => (
  <div className="p-4 md:p-6">
    <TableSkeleton />
  </div>
);
const FormLoader = () => (
  <div className="p-4 md:p-6">
    <FormSkeleton />
  </div>
);
const MinimalLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

// Component to track page views
const PageTracker = () => {
  usePageTracking();
  return null;
};

// Component for realtime notifications — only runs when authenticated
const RealtimeNotifier = () => {
  useRealtimeNotifications();
  return null;
};

/** Conditionally render auth-only components based on route */
const AuthAwareShell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isPublicRoute = ["/auth", "/cgu", "/install", "/admin/setup"].some(
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SidebarProvider>
        <TooltipProvider>
          <PageTracker />
          <Toaster />
          <Sonner />
          <AuthAwareShell>
            <Routes>
              {/* Public routes — Auth is eagerly loaded for instant login/logout */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/install" element={<Suspense fallback={<MinimalLoader />}><Install /></Suspense>} />
              <Route path="/cgu" element={<Suspense fallback={<MinimalLoader />}><CGU /></Suspense>} />
              <Route path="/admin/setup" element={<Suspense fallback={<MinimalLoader />}><AdminSetup /></Suspense>} />

              {/* Dashboard routes — use DashboardSkeleton */}
              <Route path="/" element={<RoleProtectedRoute><Suspense fallback={<DashboardLoader />}><Index /></Suspense></RoleProtectedRoute>} />
              <Route path="/admin" element={<RoleProtectedRoute><Suspense fallback={<DashboardLoader />}><AdminDashboard /></Suspense></RoleProtectedRoute>} />

              {/* Data-heavy table routes */}
              <Route path="/bassins" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><Bassins /></Suspense></RoleProtectedRoute>} />
              <Route path="/production" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><Production /></Suspense></RoleProtectedRoute>} />
              <Route path="/stocks" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><Stocks /></Suspense></RoleProtectedRoute>} />
              <Route path="/equipes" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><Equipes /></Suspense></RoleProtectedRoute>} />
              <Route path="/commercial" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><Commercial /></Suspense></RoleProtectedRoute>} />
              <Route path="/achats" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><Achats /></Suspense></RoleProtectedRoute>} />
              <Route path="/comptabilite" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><Comptabilite /></Suspense></RoleProtectedRoute>} />
              <Route path="/comptabilite/grand-livre" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><ComptaGrandLivre /></Suspense></RoleProtectedRoute>} />
              <Route path="/comptabilite/rapprochement" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><ComptaRapprochement /></Suspense></RoleProtectedRoute>} />
              <Route path="/comptabilite/operations-diverses" element={<RoleProtectedRoute><Suspense fallback={<FormLoader />}><ComptaOperationsDiverses /></Suspense></RoleProtectedRoute>} />
              <Route path="/comptabilite/cloture" element={<RoleProtectedRoute><Suspense fallback={<FormLoader />}><ComptaClotureExercice /></Suspense></RoleProtectedRoute>} />
              <Route path="/comptabilite/immobilisations" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><ComptaImmobilisations /></Suspense></RoleProtectedRoute>} />
              <Route path="/admin/tenants" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><AdminTenants /></Suspense></RoleProtectedRoute>} />
              <Route path="/admin/users" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><AdminUserManagement /></Suspense></RoleProtectedRoute>} />
              <Route path="/admin/roles" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><AdminRoles /></Suspense></RoleProtectedRoute>} />
              <Route path="/admin/chart-of-accounts" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><AdminChartOfAccounts /></Suspense></RoleProtectedRoute>} />
              <Route path="/admin/expense-types" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><AdminExpenseTypes /></Suspense></RoleProtectedRoute>} />
              <Route path="/admin/monitoring" element={<RoleProtectedRoute><Suspense fallback={<DashboardLoader />}><AdminMonitoring /></Suspense></RoleProtectedRoute>} />
              <Route path="/admin/audit-logs" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><AdminAuditLogs /></Suspense></RoleProtectedRoute>} />
              <Route path="/admin/settings" element={<RoleProtectedRoute><Suspense fallback={<FormLoader />}><AdminSettings /></Suspense></RoleProtectedRoute>} />
              <Route path="/admin/email-templates" element={<RoleProtectedRoute><Suspense fallback={<FormLoader />}><AdminEmailTemplates /></Suspense></RoleProtectedRoute>} />

              {/* Other protected routes */}
              <Route path="/campagne" element={<RoleProtectedRoute><Suspense fallback={<DashboardLoader />}><Campagne /></Suspense></RoleProtectedRoute>} />
              <Route path="/rapports" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><Rapports /></Suspense></RoleProtectedRoute>} />
              <Route path="/parametres" element={<RoleProtectedRoute><Suspense fallback={<FormLoader />}><Parametres /></Suspense></RoleProtectedRoute>} />
              <Route path="/utilisateurs" element={<RoleProtectedRoute><Suspense fallback={<TableLoader />}><GestionUtilisateurs /></Suspense></RoleProtectedRoute>} />
              <Route path="/gestion-utilisateurs" element={<Navigate to="/utilisateurs" replace />} />

              {/* 404 */}
              <Route path="*" element={<Suspense fallback={<MinimalLoader />}><NotFound /></Suspense>} />
            </Routes>
          </AuthAwareShell>
        </TooltipProvider>
      </SidebarProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
