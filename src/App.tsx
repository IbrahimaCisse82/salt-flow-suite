import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Bassins from "./pages/Bassins";
import Campagne from "./pages/Campagne";
import Production from "./pages/Production";
import Stocks from "./pages/Stocks";
import Equipes from "./pages/Equipes";
import Commercial from "./pages/Commercial";
import Rapports from "./pages/Rapports";
import Parametres from "./pages/Parametres";
import Comptabilite from "./pages/Comptabilite";
import GestionUtilisateurs from "./pages/GestionUtilisateurs";
import AdminTenants from "./pages/admin/Tenants";
import AdminChartOfAccounts from "./pages/admin/ChartOfAccounts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
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
          <Route path="/utilisateurs" element={<RoleProtectedRoute><GestionUtilisateurs /></RoleProtectedRoute>} />
          <Route path="/admin/tenants" element={<RoleProtectedRoute><AdminTenants /></RoleProtectedRoute>} />
          <Route path="/admin/chart-of-accounts" element={<RoleProtectedRoute><AdminChartOfAccounts /></RoleProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
