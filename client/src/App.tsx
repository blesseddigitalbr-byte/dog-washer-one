import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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
import CRM from "./pages/CRM";

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) return <Login />;

  return (
    <Switch>
      <Route>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/schedule" component={Schedule} />
            <Route path="/appointments" component={Appointments} />
            <Route path="/schedule-simulator" component={ScheduleSimulator} />
            <Route path="/crm" component={CRM} />
            <Route path="/clients" component={Clients} />
            <Route path="/students" component={Students} />
            <Route path="/services" component={Services} />
            <Route path="/plans" component={PlansPage} />
            <Route path="/packages" component={Packages} />
            <Route path="/profile" component={Profile} />
            <Route path="/units" component={Units} />
            <Route path="/team" component={Team} />
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
