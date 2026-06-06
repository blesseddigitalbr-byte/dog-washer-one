import { Calendar, Clock, User, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SchedulePage() {
  // Dados de exemplo
  const upcomingAppointments = [
    {
      id: 1,
      clientName: "João Silva",
      petName: "Max",
      service: "Banho e Tosa",
      date: "2026-06-06",
      time: "10:00",
      status: "confirmado",
    },
    {
      id: 2,
      clientName: "Maria Santos",
      petName: "Bella",
      service: "Tosa Higiênica",
      date: "2026-06-06",
      time: "14:00",
      status: "pendente",
    },
    {
      id: 3,
      clientName: "Carlos Oliveira",
      petName: "Rex",
      service: "Banho",
      date: "2026-06-07",
      time: "09:00",
      status: "confirmado",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "bg-green-100 text-green-800";
      case "pendente":
        return "bg-yellow-100 text-yellow-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie todos os agendamentos de seus clientes</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            + Novo Agendamento
          </Button>
          <Button variant="outline">Filtrar</Button>
        </div>

        {/* Calendar Section */}
        <Card className="mb-6 p-6 border-accent/30">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold text-foreground">Calendário</h2>
          </div>
          <div className="bg-muted/20 rounded-lg p-8 text-center text-muted-foreground">
            <p>Calendário visual será implementado aqui</p>
          </div>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="border-accent/30">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Próximos Agendamentos</h2>
          </div>
          <div className="divide-y divide-border">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-muted/20 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Client Info */}
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-semibold text-foreground">{appointment.clientName}</p>
                      <p className="text-sm text-muted-foreground">Pet: {appointment.petName}</p>
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Serviço</p>
                      <p className="font-semibold text-foreground">{appointment.service}</p>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data e Hora</p>
                      <p className="font-semibold text-foreground">
                        {new Date(appointment.date).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-sm text-muted-foreground">{appointment.time}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-start gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline">
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    Cancelar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
