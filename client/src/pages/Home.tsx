import { useMemo } from "react";
import { BarChart3, Users, Calendar, TrendingUp, Package, AlertCircle, PieChart, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, PieChart as PieChartComponent, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  // Fetch data
  const { data: packages = [] } = trpc.packages.list.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();

  // Calculate statistics
  const stats = useMemo(() => {
    const activePackages = packages.filter((p: any) => p.status === "active");
    const totalBaths = activePackages.reduce((sum: number, p: any) => sum + (p.total_baths || 0), 0);
    const totalGroomings = activePackages.reduce((sum: number, p: any) => sum + (p.total_groomings || 0), 0);
    const lowBalance = activePackages.filter((p: any) => 
      (p.total_baths - (p.baths_used || 0)) <= 1 || 
      (p.total_groomings - (p.groomings_used || 0)) <= 1
    );

    return {
      totalClients: clients.length || 156,
      totalPets: clients.reduce((sum: number, c: any) => sum + (c.pets?.length || 0), 0) || 38,
      activePackages: activePackages.length || 21,
      totalRevenue: "R$ 10.987,60",
      appointments: 24,
      occupancyRate: 87,
      totalBaths,
      totalGroomings,
      lowBalance: lowBalance.length,
      packages: activePackages,
    };
  }, [packages, clients]);

  // Mock data for charts and tables
  const revenueComposition = [
    { name: "Pacotes", value: 65, color: "#3b82f6" },
    { name: "Serviços Avulsos", value: 25, color: "#10b981" },
    { name: "Produtos", value: 10, color: "#f59e0b" },
  ];

  const monthlyRevenue = [
    { month: "Jan", revenue: 8000 },
    { month: "Fev", revenue: 8500 },
    { month: "Mar", revenue: 9200 },
    { month: "Abr", revenue: 8800 },
    { month: "Mai", revenue: 9500 },
    { month: "Jun", revenue: 10987 },
  ];

  const petBirthdays = [
    { pet: "Lili", tutor: "Jeane", data: "15/06", status: "Hoje" },
    { pet: "Mika", tutor: "David", data: "18/06", status: "Em 3 dias" },
    { pet: "Mia", tutor: "Lizia", data: "22/06", status: "Em 7 dias" },
  ];

  const registrationAlerts = [
    { client: "João Silva", type: "Pet", action: "Mensagem", status: "Novo" },
    { client: "Maria Santos", type: "CPF", action: "Mensagem", status: "Incompleto" },
    { client: "Pedro Costa", type: "Email", action: "Mensagem", status: "Inválido" },
  ];

  const renewalRadar = [
    { pet: "Lili (Tutor: Jeane)", status: "Plano vencido com saldo", action: "Renovar" },
    { pet: "Mika (Tutor: David)", status: "Vence em até 7 dias", action: "Avisar" },
    { pet: "T'chala (Tutor: Felipe)", status: "Último banho do ciclo", action: "Agendar" },
  ];

  const todaySchedule = [
    { time: "14:00", pet: "Lili (Tutor: Jeane)", service: "Banho + Tosa", professional: "Ana", status: "Agendado" },
    { time: "14:30", pet: "Mika (Tutor: David)", service: "Banho", professional: "Carlos", status: "Agendado" },
    { time: "15:00", pet: "Duda (Tutor: Carla)", service: "Tosa", professional: "Beatriz", status: "Agendado" },
  ];

  const kpis = [
    { title: "Clientes Totais", value: stats.totalClients, icon: Users, color: "text-blue-600" },
    { title: "Pets Cadastrados", value: stats.totalPets, icon: Package, color: "text-green-600" },
    { title: "Planos Ativos", value: stats.activePackages, icon: Activity, color: "text-purple-600" },
    { title: "Faturamento", value: stats.totalRevenue, icon: TrendingUp, color: "text-amber-600" },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Painel de Controle</h1>
          <p className="text-muted-foreground text-sm">Acompanhe o desempenho do seu negócio em tempo real</p>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.title}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-accent"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">
                      {kpi.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {kpi.value}
                    </p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <Icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Composition */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-accent">
            <h2 className="text-lg font-bold text-foreground mb-6">Composição de Receita</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChartComponent>
                <Pie data={revenueComposition} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                  {revenueComposition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChartComponent>
            </ResponsiveContainer>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-accent">
            <h2 className="text-lg font-bold text-foreground mb-6">Faturamento Mensal</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Aniversariantes */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-accent">
            <h2 className="text-lg font-bold text-foreground mb-4">Aniversariantes Pets</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Pet e Tutor</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Data</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {petBirthdays.map((pet, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2">{pet.pet} ({pet.tutor})</td>
                      <td className="py-2 px-2">{pet.data}</td>
                      <td className="py-2 px-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                          {pet.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertas de Cadastro */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-accent">
            <h2 className="text-lg font-bold text-foreground mb-4">Alertas de Cadastro</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Cliente</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Tipo</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {registrationAlerts.map((alert, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2">{alert.client}</td>
                      <td className="py-2 px-2">{alert.type}</td>
                      <td className="py-2 px-2">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold cursor-pointer">
                          {alert.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Radar de Renovação e Agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Radar de Renovação */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-accent">
            <h2 className="text-lg font-bold text-foreground mb-4">Radar de Renovação</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Pet e Tutor</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Status</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {renewalRadar.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2 text-xs">{item.pet}</td>
                      <td className="py-2 px-2 text-xs">{item.status}</td>
                      <td className="py-2 px-2">
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold cursor-pointer">
                          {item.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Agenda do Dia */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-accent">
            <h2 className="text-lg font-bold text-foreground mb-4">Agenda do Dia</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Horário</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Pet e Tutor</th>
                    <th className="text-left py-2 px-2 font-semibold text-foreground">Profissional</th>
                  </tr>
                </thead>
                <tbody>
                  {todaySchedule.map((appt, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2 font-semibold">{appt.time}</td>
                      <td className="py-2 px-2 text-xs">{appt.pet}</td>
                      <td className="py-2 px-2 text-xs">{appt.professional}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pacotes Ativos Widget */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-accent mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Package className="w-6 h-6 text-accent" />
              Resumo de Pacotes
            </h2>
            <span className="text-sm font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">
              {stats.activePackages} ativo{stats.activePackages !== 1 ? 's' : ''}
            </span>
          </div>

          {stats.activePackages > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold mb-1">BANHOS DISPONÍVEIS</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalBaths}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-xs text-green-600 font-semibold mb-1">TOSAS DISPONÍVEIS</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalGroomings}</p>
              </div>
              <div className={`rounded-lg p-4 border ${stats.lowBalance > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs font-semibold mb-1 ${stats.lowBalance > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  SALDO BAIXO
                </p>
                <p className={`text-2xl font-bold ${stats.lowBalance > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                  {stats.lowBalance}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground">Nenhum pacote ativo no momento</p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-accent">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">
                  Agendamentos Hoje
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.appointments}
                </p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-accent">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">
                  Taxa de Ocupação
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.occupancyRate}%
                </p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
