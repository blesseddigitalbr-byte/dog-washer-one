import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { canAccessRoute } from "../../shared/accessPolicy";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Schedule from "./pages/Schedule";
import Appointments from "./pages/Appointments";
import Clients from "./pages/Clients";
import Students from "./pages/Students";
import Services from "./pages/Services";
import { useAuth } from "@/_core/hooks/useAuth";
import { Toaster } from "sonner";
import { PlansPage } from "./pages/PlansPage";
import Packages from "./pages/Packages";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Units from "./pages/Units";
import Team from "./pages/Team";
import ScheduleSimulator from "./pages/ScheduleSimulator";
import Integrations from "./pages/Integrations";
import Splits from "./pages/Splits";
import Financial from "./pages/Financial";
import Branding from "./pages/Branding";
import UserAccess from "./pages/UserAccess";
import ResetPassword from "./pages/ResetPassword";
import ImportReview from "./pages/ImportReview";
import Products from "./pages/Products";
import Purchases from "./pages/Purchases";

function Router() {
  const [location] = useLocation();
  const { user, loading } = useAuth();

  if (window.location.pathname === "/reset-password") return <ResetPassword />;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) return <Login />;

  if (!canAccessRoute(user.role, location)) return <DashboardLayout><main className="p-8" role="alert"><h1 className="text-2xl font-semibold">Acesso bloqueado</h1><p className="mt-3">Seu perfil não permite acessar esta área. Solicite autorização à administração.</p></main></DashboardLayout>;

  return (
    <Switch>
      <Route>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/schedule" component={Schedule} />
            <Route path="/appointments" component={Appointments} />
            <Route path="/schedule-simulator" component={ScheduleSimulator} />
            <Route path="/clients" component={Clients} />
            <Route path="/students" component={Students} />
            <Route path="/services" component={Services} />
            <Route path="/plans" component={PlansPage} />
            <Route path="/packages" component={Packages} />
            <Route path="/profile" component={Profile} />
            <Route path="/units" component={Units} />
            <Route path="/team" component={Team} />
            <Route path="/integrations" component={Integrations} />
            <Route path="/splits" component={Splits} />
            <Route path="/financial" component={Financial} />
            <Route path="/branding" component={Branding} />
            <Route path="/users" component={UserAccess} />
            <Route path="/imports" component={ImportReview} />
            <Route path="/products" component={Products} />
            <Route path="/purchases" component={Purchases} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
