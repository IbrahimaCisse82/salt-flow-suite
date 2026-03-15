import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { MobileBottomNav } from "./components/Layout/MobileBottomNav";
import { Loader2 } from "lucide-react";
import { usePageTracking } from "./hooks/usePageTracking";
import { useRealtimeNotifications } from "./hooks/useRealtimeNotifications";

// Lazy load toutes les pages pour améliorer le temps de chargement initial
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
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

// Optimized QueryClient with better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// Composant de loading léger pour Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

// Component to track page views
const PageTracker = () => {
  usePageTracking();
  return null;
};

// Component for realtime notifications (inside AuthProvider)
const RealtimeNotifier = () => {
  useRealtimeNotifications();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SidebarProvider>
        <TooltipProvider>
          <PageTracker />
          <RealtimeNotifier />
          <Toaster />
          <Sonner />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/install" element={<Install />} />
              <Route path="/cgu" element={<CGU />} />
              <Route path="/admin/setup" element={<AdminSetup />} />

              {/* Protected routes */}
              <Route path="/" element={<RoleProtectedRoute><Index /></RoleProtectedRoute>} />
              <Route path="/bassins" element={<RoleProtectedRoute><Bassins /></RoleProtectedRoute>} />
              <Route path="/campagne" element={<RoleProtectedRoute><Campagne /></RoleProtectedRoute>} />
              <Route path="/production" element={<RoleProtectedRoute><Production /></RoleProtectedRoute>} />
              <Route path="/stocks" element={<RoleProtectedRoute><Stocks /></RoleProtectedRoute>} />
              <Route path="/equipes" element={<RoleProtectedRoute><Equipes /></RoleProtectedRoute>} />
              <Route path="/commercial" element={<RoleProtectedRoute><Commercial /></RoleProtectedRoute>} />
              <Route path="/rapports" element={<RoleProtectedRoute><Rapports /></RoleProtectedRoute>} />
              <Route path="/parametres" element={<RoleProtectedRoute><Parametres /></RoleProtectedRoute>} />
              <Route path="/comptabilite" element={<RoleProtectedRoute><Comptabilite /></RoleProtectedRoute>} />
              <Route path="/comptabilite/grand-livre" element={<RoleProtectedRoute><ComptaGrandLivre /></RoleProtectedRoute>} />
              <Route path="/comptabilite/rapprochement" element={<RoleProtectedRoute><ComptaRapprochement /></RoleProtectedRoute>} />
              <Route path="/comptabilite/operations-diverses" element={<RoleProtectedRoute><ComptaOperationsDiverses /></RoleProtectedRoute>} />
              <Route path="/comptabilite/cloture" element={<RoleProtectedRoute><ComptaClotureExercice /></RoleProtectedRoute>} />
              <Route path="/comptabilite/immobilisations" element={<RoleProtectedRoute><ComptaImmobilisations /></RoleProtectedRoute>} />
              <Route path="/achats" element={<RoleProtectedRoute><Achats /></RoleProtectedRoute>} />
              <Route path="/utilisateurs" element={<RoleProtectedRoute><GestionUtilisateurs /></RoleProtectedRoute>} />
              <Route path="/gestion-utilisateurs" element={<Navigate to="/utilisateurs" replace />} />

              {/* Admin routes */}
              <Route path="/admin" element={<RoleProtectedRoute><AdminDashboard /></RoleProtectedRoute>} />
              <Route path="/admin/tenants" element={<RoleProtectedRoute><AdminTenants /></RoleProtectedRoute>} />
              <Route path="/admin/users" element={<RoleProtectedRoute><AdminUserManagement /></RoleProtectedRoute>} />
              <Route path="/admin/roles" element={<RoleProtectedRoute><AdminRoles /></RoleProtectedRoute>} />
              <Route path="/admin/chart-of-accounts" element={<RoleProtectedRoute><AdminChartOfAccounts /></RoleProtectedRoute>} />
              <Route path="/admin/expense-types" element={<RoleProtectedRoute><AdminExpenseTypes /></RoleProtectedRoute>} />
              <Route path="/admin/monitoring" element={<RoleProtectedRoute><AdminMonitoring /></RoleProtectedRoute>} />
              <Route path="/admin/audit-logs" element={<RoleProtectedRoute><AdminAuditLogs /></RoleProtectedRoute>} />
              <Route path="/admin/settings" element={<RoleProtectedRoute><AdminSettings /></RoleProtectedRoute>} />
              <Route path="/admin/email-templates" element={<RoleProtectedRoute><AdminEmailTemplates /></RoleProtectedRoute>} />

              {/* 404 — affiche la page NotFound au lieu de rediriger silencieusement */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </TooltipProvider>
      </SidebarProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
