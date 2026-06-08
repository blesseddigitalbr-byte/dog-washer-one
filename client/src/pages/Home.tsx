import { Button } from "@/components/ui/button";
import { BarChart3, Users, Calendar, TrendingUp, Package, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

export default function Dashboard() {
  // Fetch packages data
  const { data: packages = [] } = trpc.packages.list.useQuery();

  // Calculate package statistics
  const packageStats = useMemo(() => {
    const active = packages.filter((p: any) => p.status === "active");
    const totalBaths = active.reduce((sum: number, p: any) => sum + (p.total_baths || 0), 0);
    const totalGroomings = active.reduce((sum: number, p: any) => sum + (p.total_groomings || 0), 0);
    const lowBalance = active.filter((p: any) => 
      (p.total_baths - (p.baths_used || 0)) <= 1 || 
      (p.total_groomings - (p.groomings_used || 0)) <= 1
    );

    return {
      activeCount: active.length,
      totalBaths,
      totalGroomings,
      lowBalance: lowBalance.length,
      packages: active,
    };
  }, [packages]);

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
          <h1 className="text-4xl font-bold text-foreground mb-2">Painel de Controle</h1>
          <p className="text-muted-foreground text-sm">Acompanhe o desempenho do seu negócio em tempo real</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-accent"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                </div>
                <p className="text-xs text-accent font-semibold">
                  {stat.change}
                </p>
              </div>
            );
          })}
        </div>

        {/* Pacotes Ativos - Widget */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-accent mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Package className="w-6 h-6 text-accent" />
              Pacotes Ativos
            </h2>
            <span className="text-sm font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">
              {packageStats.activeCount} ativo{packageStats.activeCount !== 1 ? 's' : ''}
            </span>
          </div>

          {packageStats.activeCount > 0 ? (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-600 font-semibold mb-1">BANHOS DISPONÍVEIS</p>
                  <p className="text-2xl font-bold text-blue-900">{packageStats.totalBaths}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-xs text-green-600 font-semibold mb-1">TOSAS DISPONÍVEIS</p>
                  <p className="text-2xl font-bold text-green-900">{packageStats.totalGroomings}</p>
                </div>
                <div className={`rounded-lg p-4 border ${packageStats.lowBalance > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-xs font-semibold mb-1 ${packageStats.lowBalance > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    SALDO BAIXO
                  </p>
                  <p className={`text-2xl font-bold ${packageStats.lowBalance > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                    {packageStats.lowBalance}
                  </p>
                </div>
              </div>

              {/* Packages List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {packageStats.packages.map((pkg: any) => {
                  const bathsRemaining = pkg.total_baths - (pkg.baths_used || 0);
                  const groomingsRemaining = pkg.total_groomings - (pkg.groomings_used || 0);
                  const isLowBalance = bathsRemaining <= 1 || groomingsRemaining <= 1;

                  return (
                    <div
                      key={pkg.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isLowBalance
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{pkg.name}</p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            🛁 {bathsRemaining}/{pkg.total_baths} banhos
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ✂️ {groomingsRemaining}/{pkg.total_groomings} tosas
                          </span>
                        </div>
                      </div>
                      {isLowBalance && (
                        <AlertCircle className="w-5 h-5 text-red-500 ml-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground">Nenhum pacote ativo no momento</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-accent">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Atividade Recente
          </h2>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-accent/5 rounded-lg border-l-4 border-l-accent"
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
