import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import UnitSwitcher from "@/components/UnitSwitcher";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Package,
  TrendingUp,
  Users2,
  BarChart3,
  Zap,
  Settings,
  UserCircle,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  MessagesSquare,
} from "lucide-react";

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  comingSoon?: boolean;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "OPERACIONAL",
    "RELACIONAMENTO",
  ]);

  const menuSections: MenuSection[] = [
    {
      title: "OPERACIONAL",
      items: [
        { icon: <LayoutDashboard className="w-5 h-5" />, label: "Painel", path: "/" },
        { icon: <Calendar className="w-5 h-5" />, label: "Agendamento", path: "/appointments" },
        { icon: <CalendarRange className="w-5 h-5" />, label: "Simulador", path: "/schedule-simulator" },
        { icon: <Users className="w-5 h-5" />, label: "Clientes", path: "/clients" },
        { icon: <Users2 className="w-5 h-5" />, label: "Alunos", path: "/students" },
        { icon: <Package className="w-5 h-5" />, label: "Pacotes", path: "/packages" },
      ],
    },
    {
      title: "RELACIONAMENTO",
      items: [
        { icon: <MessagesSquare className="w-5 h-5" />, label: "CRM e Agentes", path: "/crm" },
      ],
    },
    {
      title: "CATÁLOGO",
      items: [
        { icon: <Scissors className="w-5 h-5" />, label: "Serviços", path: "/services" },
        { icon: <Package className="w-5 h-5" />, label: "Produtos", path: "/products", comingSoon: true },
        { icon: <Package className="w-5 h-5" />, label: "Planos", path: "/plans" },
      ],
    },
    {
      title: "GESTÃO",
      items: [
        { icon: <TrendingUp className="w-5 h-5" />, label: "Financeiro", path: "/financial", comingSoon: true },
        { icon: <Users2 className="w-5 h-5" />, label: "Equipe", path: "/team" },
        { icon: <LayoutDashboard className="w-5 h-5" />, label: "Unidades", path: "/units" },
        { icon: <BarChart3 className="w-5 h-5" />, label: "Relatórios", path: "/reports", comingSoon: true },
      ],
    },
    {
      title: "SISTEMA",
      items: [
        { icon: <UserCircle className="w-5 h-5" />, label: "Meu Perfil", path: "/profile" },
        { icon: <Zap className="w-5 h-5" />, label: "Integrações", path: "/integrations", comingSoon: true },
        { icon: <Settings className="w-5 h-5" />, label: "Configurações", path: "/settings", comingSoon: true },
      ],
    },
  ];

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleMenuClick = (path: string, comingSoon?: boolean) => {
    if (comingSoon) {
      toast.info("Em breve");
      return;
    }
    setLocation(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast.error("Não foi possível encerrar a sessão");
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`fixed md:relative z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 md:w-20"
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border flex flex-col items-center justify-center text-center">
          {sidebarOpen && (
            <div className="flex w-full items-center justify-center py-2">
              <img
                src="/brand/dwo-icon.png"
                alt="DWO"
                className="h-24 w-24 object-contain"
              />
            </div>
          )}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-sidebar-foreground hover:text-sidebar-accent"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Menu Sections */}
        <div className="flex-1 overflow-y-auto py-4">
          {menuSections.map((section) => (
            <div key={section.title} className="px-2 mb-4">
              {/* Section Title */}
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-sidebar-foreground hover:text-sidebar-accent transition-colors"
              >
                {sidebarOpen && section.title}
                {sidebarOpen && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      expandedSections.includes(section.title) ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {/* Menu Items */}
              {expandedSections.includes(section.title) && (
                <div className="space-y-1 mt-2">
                  {section.items.map((item) => (
                    <button
                      key={item.label}
            onClick={() => handleMenuClick(item.path, item.comingSoon)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
                item.comingSoon
                  ? "text-sidebar-foreground/50 cursor-not-allowed"
                  : location === item.path
                  ? "bg-sidebar-accent text-sidebar-primary-foreground font-semibold border-l-4 border-sidebar-accent"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent"
              }`}
              disabled={item.comingSoon}
                    >
                      {item.icon}
                      {sidebarOpen && (
                        <span className="flex-1 text-left">{item.label}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent transition-all"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && "Sair"}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-foreground hover:text-primary"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="min-w-0 flex-1">
            <UnitSwitcher />
          </div>
          <button
            type="button"
            onClick={() => setLocation("/profile")}
            className="flex items-center gap-4 rounded-lg px-2 py-1.5 text-left transition hover:bg-accent/20"
            title="Abrir meu perfil"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {user?.displayName ?? user?.name}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-md">
              <span className="text-sm font-bold text-primary">
                {(user?.displayName ?? user?.name)?.charAt(0).toUpperCase()}
              </span>
            </div>
          </button>
        </div>

        {/* Navigation Buttons */}
        <div className="bg-background px-6 py-3 flex items-center justify-end gap-3">
          <div className="flex items-center gap-2 bg-transparent rounded-lg p-1">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-md hover:bg-accent/20 text-foreground hover:text-accent transition-all duration-200 flex items-center gap-1.5 text-sm font-medium group"
              title="Voltar para página anterior"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <div className="w-px h-6 bg-border" />
            <button
              onClick={() => window.history.forward()}
              className="p-2 rounded-md hover:bg-accent/20 text-foreground hover:text-accent transition-all duration-200 flex items-center gap-1.5 text-sm font-medium group"
              title="Avançar para próxima página"
            >
              <span className="hidden sm:inline">Avançar</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
