import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { Loader2 } from "lucide-react";
import { usePageTracking } from "./hooks/usePageTracking";

// Lazy load toutes les pages pour améliorer le temps de chargement initial
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const CGU = lazy(() => import("./pages/CGU"));
const Bassins = lazy(() => import("./pages/Bassins"));
const Campagne = lazy(() => import("./pages/Campagne"));
const Production = lazy(() => import("./pages/Production"));
const Stocks = lazy(() => import("./pages/Stocks"));
const Equipes = lazy(() => import("./pages/Equipes"));
const Conges = lazy(() => import("./pages/Conges"));
const Commercial = lazy(() => import("./pages/Commercial"));
const Rapports = lazy(() => import("./pages/Rapports"));
const Parametres = lazy(() => import("./pages/Parametres"));
const Comptabilite = lazy(() => import("./pages/Comptabilite"));
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
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Composant de loading pour Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Component to track page views
const PageTracker = () => {
  usePageTracking();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SidebarProvider>
        <TooltipProvider>
          <PageTracker />
          <Toaster />
          <Sonner />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/install" element={<Install />} />
              <Route path="/cgu" element={<CGU />} />
              <Route path="/admin/setup" element={<AdminSetup />} />
              <Route path="/" element={<RoleProtectedRoute><Index /></RoleProtectedRoute>} />
              <Route path="/bassins" element={<RoleProtectedRoute><Bassins /></RoleProtectedRoute>} />
              <Route path="/campagne" element={<RoleProtectedRoute><Campagne /></RoleProtectedRoute>} />
              <Route path="/production" element={<RoleProtectedRoute><Production /></RoleProtectedRoute>} />
              <Route path="/stocks" element={<RoleProtectedRoute><Stocks /></RoleProtectedRoute>} />
              <Route path="/equipes" element={<RoleProtectedRoute><Equipes /></RoleProtectedRoute>} />
              <Route path="/conges" element={<RoleProtectedRoute><Conges /></RoleProtectedRoute>} />
              <Route path="/commercial" element={<RoleProtectedRoute><Commercial /></RoleProtectedRoute>} />
              <Route path="/rapports" element={<RoleProtectedRoute><Rapports /></RoleProtectedRoute>} />
              <Route path="/parametres" element={<RoleProtectedRoute><Parametres /></RoleProtectedRoute>} />
              <Route path="/comptabilite" element={<RoleProtectedRoute><Comptabilite /></RoleProtectedRoute>} />
              <Route path="/achats" element={<RoleProtectedRoute><Achats /></RoleProtectedRoute>} />
              <Route path="/utilisateurs" element={<RoleProtectedRoute><GestionUtilisateurs /></RoleProtectedRoute>} />
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </TooltipProvider>
      </SidebarProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
