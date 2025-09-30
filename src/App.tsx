import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Bassins from "./pages/Bassins";
import Campagne from "./pages/Campagne";
import Production from "./pages/Production";
import Stocks from "./pages/Stocks";
import Equipes from "./pages/Equipes";
import Commercial from "./pages/Commercial";
import Rapports from "./pages/Rapports";
import Parametres from "./pages/Parametres";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/bassins" element={<Bassins />} />
          <Route path="/campagne" element={<Campagne />} />
          <Route path="/production" element={<Production />} />
          <Route path="/stocks" element={<Stocks />} />
          <Route path="/equipes" element={<Equipes />} />
          <Route path="/commercial" element={<Commercial />} />
          <Route path="/rapports" element={<Rapports />} />
          <Route path="/parametres" element={<Parametres />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
