import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Calendar, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Agendamentos",
      value: "24",
      change: "+12% este mês",
      icon: Calendar,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Clientes",
      value: "156",
      change: "+8 novos",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Receita",
      value: "R$ 8.450",
      change: "+15% vs mês anterior",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Taxa de Ocupação",
      value: "87%",
      change: "Acima da meta",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Bem-vindo ao GroomerFlow</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-shadow border-0 bg-white"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`${stat.color} w-6 h-6`} />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-600 mb-1">
                  {stat.title}
                </h3>
                <p className="text-3xl font-bold text-slate-900 mb-2">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500">{stat.change}</p>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 border-0 bg-white">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Próximos Agendamentos
            </h2>
            <div className="space-y-3">
              {[
                {
                  name: "Luna",
                  time: "09:00",
                  service: "Banho & Tosa",
                  status: "Confirmado",
                },
                {
                  name: "Thor",
                  time: "10:30",
                  service: "Tosa Higiênica",
                  status: "Confirmado",
                },
                {
                  name: "Bella",
                  time: "14:00",
                  service: "Banho & Tosa",
                  status: "Pendente",
                },
              ].map((appointment, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">{appointment.name}</p>
                    <p className="text-sm text-slate-600">
                      {appointment.service}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">
                      {appointment.time}
                    </p>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        appointment.status === "Confirmado"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-0 bg-gradient-to-br from-amber-50 to-amber-100">
            <h2 className="text-xl font-bold text-amber-900 mb-4">
              Dica do Dia
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-amber-800">
                Mantenha seus clientes informados sobre promoções e novos
                serviços através de mensagens personalizadas.
              </p>
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                Saiba Mais
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
