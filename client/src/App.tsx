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
import { useAuth } from "@/_core/hooks/useAuth";
import { Toaster } from "sonner";

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Switch>
      <Route>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/schedule" component={Schedule} />
            <Route path="/appointments" component={Appointments} />
            <Route path="/clients" component={Clients} />
            <Route path="/students" component={Students} />
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
