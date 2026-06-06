import { Button } from "@/components/ui/button";
import { BarChart3, Users, Calendar, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Agendamentos",
      value: "24",
      change: "+12% este mês",
      icon: Calendar,
    },
    {
      title: "Clientes",
      value: "156",
      change: "+8 novos",
      icon: Users,
    },
    {
      title: "Receita",
      value: "R$ 8.450",
      change: "+15% vs mês anterior",
      icon: TrendingUp,
    },
    {
      title: "Taxa de Ocupação",
      value: "87%",
      change: "Acima da meta",
      icon: BarChart3,
    },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Bem-vindo ao GroomerFlow</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-accent"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                </div>
                <p className="text-xs text-accent font-medium">
                  {stat.change}
                </p>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Atividade Recente
          </h2>
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-4 border-b border-accent/5 last:border-b-0 border-l-4 border-l-accent pl-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    Agendamento confirmado
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cliente: João Silva
                  </p>
                </div>
                <span className="text-xs font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">
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
