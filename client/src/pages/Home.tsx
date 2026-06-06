import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Calendar, TrendingUp } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Dashboard() {
  // Preserve authentication logic from previous version
  const { user, loading, error, isAuthenticated, logout } = useAuth();

  const stats = [
    {
      title: "Agendamentos",
      value: "24",
      change: "+12% este mês",
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Clientes",
      value: "156",
      change: "+8 novos",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Receita",
      value: "R$ 8.450",
      change: "+15% vs mês anterior",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Taxa de Ocupação",
      value: "87%",
      change: "Acima da meta",
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo ao GroomerFlow</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="bg-card rounded-lg p-6 border-2 border-secondary shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-xs text-primary font-semibold">
                  {stat.change}
                </p>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-lg p-6 border-2 border-secondary shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Atividade Recente
          </h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between pb-4 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">
                    Agendamento confirmado
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cliente: João Silva
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded">
                  Hoje
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
