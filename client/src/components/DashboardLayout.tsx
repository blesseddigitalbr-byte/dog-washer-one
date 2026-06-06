import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
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
  LogOut,
  ChevronDown,
  Menu,
  X,
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
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "OPERACIONAL",
  ]);

  const menuSections: MenuSection[] = [
    {
      title: "OPERACIONAL",
      items: [
        { icon: <LayoutDashboard className="w-5 h-5" />, label: "Painel", path: "/" },
        { icon: <Calendar className="w-5 h-5" />, label: "Agendamento", path: "/schedule", comingSoon: true },
        { icon: <Users className="w-5 h-5" />, label: "Clientes", path: "/clients", comingSoon: true },
        { icon: <Users2 className="w-5 h-5" />, label: "Alunos", path: "/students", comingSoon: true },
      ],
    },
    {
      title: "CATÁLOGO",
      items: [
        { icon: <Scissors className="w-5 h-5" />, label: "Serviços", path: "/services", comingSoon: true },
        { icon: <Package className="w-5 h-5" />, label: "Produtos", path: "/products", comingSoon: true },
        { icon: <Package className="w-5 h-5" />, label: "Planos", path: "/planos", comingSoon: true },
      ],
    },
    {
      title: "GESTÃO",
      items: [
        { icon: <TrendingUp className="w-5 h-5" />, label: "Financeiro", path: "/financial", comingSoon: true },
        { icon: <Users2 className="w-5 h-5" />, label: "Equipe", path: "/team", comingSoon: true },
        { icon: <LayoutDashboard className="w-5 h-5" />, label: "Unidades", path: "/units", comingSoon: true },
        { icon: <BarChart3 className="w-5 h-5" />, label: "Relatórios", path: "/reports", comingSoon: true },
      ],
    },
    {
      title: "SISTEMA",
      items: [
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

  const handleLogout = () => {
    // TODO: Implementar logout
    toast.info("Logout em desenvolvimento");
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
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-sidebar-accent">GroomerFlow</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-sidebar-foreground hover:text-sidebar-accent"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
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
        <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-foreground hover:text-primary"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
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
