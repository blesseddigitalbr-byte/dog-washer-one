import { useMemo } from "react";
import { BarChart3, Users, Calendar, TrendingUp, Package } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  // Fetch data
  const { data: packages = [] } = trpc.packages.list.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();

  // Mock data for tables
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

  const modelDogs = [
    { pet: "Lili", tutor: "Jeane", status: "Ativo", sessions: 12 },
    { pet: "T'chala", tutor: "Felipe", status: "Ativo", sessions: 8 },
    { pet: "Mika", tutor: "David", status: "Inativo", sessions: 5 },
  ];

  // Calculate statistics
  const stats = useMemo(() => {
    const activePackages = packages.filter((p: any) => p.status === "active");
    const totalBaths = activePackages.reduce((sum: number, p: any) => sum + (p.total_baths || 0), 0);
    const totalGroomings = activePackages.reduce((sum: number, p: any) => sum + (p.total_groomings || 0), 0);
    const lowBalance = activePackages.filter((p: any) => 
      (p.total_baths - (p.baths_used || 0)) <= 1 || 
      (p.total_groomings - (p.groomings_used || 0)) <= 1
    );
    const totalModelDogs = modelDogs.filter((d) => d.status === "Ativo").length;

    return {
      totalClients: clients.length || 5,
      totalPets: clients.reduce((sum: number, c: any) => sum + (c.pets?.length || 0), 0) || 6,
      totalModelDogs: totalModelDogs || 2,
      activePackages: activePackages.length || 8,
      appointments: 24,
      occupancyRate: 87,
      totalBaths,
      totalGroomings,
      lowBalance: lowBalance.length,
      packages: activePackages,
    };
  }, [packages, clients, modelDogs]);

  const kpisRow1 = [
    { title: "Clientes Totais", value: stats.totalClients, icon: Users, color: "text-blue-600" },
    { title: "Pets Cadastrados", value: stats.totalPets, icon: Package, color: "text-green-600" },
    { title: "Total de Cães Modelo", value: stats.totalModelDogs, icon: Package, color: "text-amber-600" },
  ];

  const kpisRow2 = [
    { title: "Agendamentos Hoje", value: stats.appointments, icon: Calendar, color: "text-orange-600" },
    { title: "Planos Ativos", value: stats.activePackages, icon: Package, color: "text-purple-600" },
    { title: "Taxa de Ocupação", value: `${stats.occupancyRate}%`, icon: BarChart3, color: "text-red-600" },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Painel de Controle</h1>
          <p className="text-muted-foreground text-sm">Acompanhe o desempenho do seu negócio em tempo real</p>
        </div>

        {/* KPIs Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {kpisRow1.map((kpi) => {
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

        {/* KPIs Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {kpisRow2.map((kpi) => {
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

        {/* Tables Row 1 */}
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

        {/* Tables Row 2 */}
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

        {/* Cães Modelo Widget */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-accent">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Package className="w-6 h-6 text-accent" />
              Cães Modelo
            </h2>
            <span className="text-sm font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">
              {modelDogs.filter((d) => d.status === "Ativo").length} ativo{modelDogs.filter((d) => d.status === "Ativo").length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-semibold text-foreground">Pet e Tutor</th>
                  <th className="text-left py-2 px-2 font-semibold text-foreground">Status</th>
                  <th className="text-left py-2 px-2 font-semibold text-foreground">Sessões</th>
                </tr>
              </thead>
              <tbody>
                {modelDogs.map((dog, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2">{dog.pet} ({dog.tutor})</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        dog.status === "Ativo"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {dog.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-semibold">{dog.sessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
