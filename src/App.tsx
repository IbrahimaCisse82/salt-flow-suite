import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/bassins" element={<ProtectedRoute><Bassins /></ProtectedRoute>} />
          <Route path="/campagne" element={<ProtectedRoute><Campagne /></ProtectedRoute>} />
          <Route path="/production" element={<ProtectedRoute><Production /></ProtectedRoute>} />
          <Route path="/stocks" element={<ProtectedRoute><Stocks /></ProtectedRoute>} />
          <Route path="/equipes" element={<ProtectedRoute><Equipes /></ProtectedRoute>} />
          <Route path="/commercial" element={<ProtectedRoute><Commercial /></ProtectedRoute>} />
          <Route path="/rapports" element={<ProtectedRoute><Rapports /></ProtectedRoute>} />
          <Route path="/parametres" element={<ProtectedRoute><Parametres /></ProtectedRoute>} />
          <Route path="/comptabilite" element={<ProtectedRoute><Comptabilite /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
