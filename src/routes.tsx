import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute';
import { Loader2 } from 'lucide-react';

// Eager loading for critical routes
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';

// Lazy loading for secondary routes
const Bassins = lazy(() => import('@/pages/Bassins'));
const Production = lazy(() => import('@/pages/Production'));
const Campagne = lazy(() => import('@/pages/Campagne'));
const Commercial = lazy(() => import('@/pages/Commercial'));
const Equipes = lazy(() => import('@/pages/Equipes'));

const Achats = lazy(() => import('@/pages/Achats'));
const Stocks = lazy(() => import('@/pages/Stocks'));
const Comptabilite = lazy(() => import('@/pages/Comptabilite'));
const ComptaGrandLivre = lazy(() => import('@/pages/comptabilite/GrandLivre'));
const ComptaRapprochement = lazy(() => import('@/pages/comptabilite/Rapprochement'));
const ComptaOperationsDiverses = lazy(() => import('@/pages/comptabilite/OperationsDiverses'));
const ComptaClotureExercice = lazy(() => import('@/pages/comptabilite/ClotureExercice'));
const Rapports = lazy(() => import('@/pages/Rapports'));
const Parametres = lazy(() => import('@/pages/Parametres'));
const CGU = lazy(() => import('@/pages/CGU'));
const Install = lazy(() => import('@/pages/Install'));
const GestionUtilisateurs = lazy(() => import('@/pages/GestionUtilisateurs'));

// Admin routes
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminTenants = lazy(() => import('@/pages/admin/Tenants'));
const AdminUserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const AdminRoles = lazy(() => import('@/pages/admin/Roles'));
const AdminSettings = lazy(() => import('@/pages/admin/Settings'));
const AdminMonitoring = lazy(() => import('@/pages/admin/Monitoring'));
const AdminAuditLogs = lazy(() => import('@/pages/admin/AuditLogs'));
const AdminSetup = lazy(() => import('@/pages/admin/Setup'));
const AdminEmailTemplates = lazy(() => import('@/pages/admin/EmailTemplates'));
const AdminChartOfAccounts = lazy(() => import('@/pages/admin/ChartOfAccounts'));
const AdminExpenseTypes = lazy(() => import('@/pages/admin/ExpenseTypes'));

// Loading fallback component — léger pour éviter le flash blanc
const LoadingFallback = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/cgu" element={<CGU />} />
        <Route path="/install" element={<Install />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <Index />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />

        {/* Tenant routes */}
        <Route
          path="/bassins"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <Bassins />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/production"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <Production />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/campagne"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <Campagne />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/commercial"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <Commercial />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipes"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <Equipes />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/achats"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <Achats />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stocks"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <Stocks />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/comptabilite"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <Comptabilite />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/comptabilite/grand-livre"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <ComptaGrandLivre />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/comptabilite/rapprochement"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <ComptaRapprochement />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/comptabilite/operations-diverses"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <ComptaOperationsDiverses />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/comptabilite/cloture"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <ComptaClotureExercice />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rapports"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <Rapports />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parametres"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <Parametres />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-utilisateurs"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <GestionUtilisateurs />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <AdminDashboard />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tenants"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <AdminTenants />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <AdminUserManagement />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <AdminRoles />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <AdminSettings />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/monitoring"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <AdminMonitoring />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <AdminAuditLogs />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/setup"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <AdminSetup />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/email-templates"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <AdminEmailTemplates />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/chart-of-accounts"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <AdminChartOfAccounts />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/expense-types"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute>
                <AdminExpenseTypes />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};
