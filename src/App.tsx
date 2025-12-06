import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SalonProvider } from "@/contexts/SalonContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ClientBooking from "./pages/ClientBooking";
import Index from "./pages/Index";
import Dashboard from "./pages/admin/Dashboard";
import Services from "./pages/admin/Services";
import Professionals from "./pages/admin/Professionals";
import Agenda from "./pages/admin/Agenda";
import Clients from "./pages/admin/Clients";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SalonProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/salon/:salonId" element={<ClientBooking />} />
            <Route path="/booking" element={<Index />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/services" element={<Services />} />
            <Route path="/admin/professionals" element={<Professionals />} />
            <Route path="/admin/agenda" element={<Agenda />} />
            <Route path="/admin/clients" element={<Clients />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SalonProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
