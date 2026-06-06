import { ChevronLeft, ChevronRight, Plus, MoreVertical, Edit2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date(2024, 9, 24)); // Oct 24, 2024

  // Dados de exemplo
  const appointments = [
    {
      id: 1,
      time: "09:00",
      petName: "Luna",
      petType: "Bento & Tosa Higiênica",
      service: "Grooming Elite",
      status: "confirmado",
      avatar: "🐕",
    },
    {
      id: 2,
      time: "10:30",
      petName: "Thor",
      petType: "Tratamento da Pelagem",
      service: "Nível 2",
      status: "confirmado",
      avatar: "🐕",
    },
    {
      id: 3,
      time: "14:00",
      petName: "Bella",
      petType: "Tosa Criativa",
      service: "Prof. Carla",
      status: "pendente",
      avatar: "🐕",
    },
    {
      id: 4,
      time: "15:30",
      petName: "Max",
      petType: "Banho Completo",
      service: "Grooming Elite",
      status: "confirmado",
      avatar: "🐕",
    },
  ];

  // Gerar semana
  const getWeekDays = (date: Date) => {
    const curr = new Date(date);
    const first = curr.getDate() - curr.getDay();
    const days = [];
    const dayNames = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

    for (let i = 0; i < 7; i++) {
      const day = new Date(curr.setDate(first + i));
      days.push({
        date: day,
        day: day.getDate(),
        name: dayNames[i],
      });
    }
    return days;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "bg-green-100 text-green-700";
      case "pendente":
        return "bg-yellow-100 text-yellow-700";
      case "cancelado":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    }).toUpperCase();
  };

  const weekDays = getWeekDays(selectedDate);
  const monthYear = formatMonthYear(selectedDate);

  return (
    <div className="flex-1 overflow-auto p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2">
              {monthYear}
            </p>
            <h1 className="text-4xl font-bold text-foreground mb-1">Agenda Semanal</h1>
            <p className="text-sm text-muted-foreground capitalize">
              {selectedDate.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Button className="bg-foreground hover:bg-foreground/90 text-background flex items-center gap-2 rounded-full px-6">
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </Button>
        </div>

        {/* Calendar */}
        <Card className="border-accent/20 p-8 mb-8 bg-white/40">
          <div className="flex items-center justify-between">
            <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-foreground hover:text-accent">
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="grid grid-cols-7 gap-3 flex-1 mx-8">
              {weekDays.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day.date)}
                  className={`py-4 px-3 rounded-2xl text-center transition-all font-medium ${
                    day.date.toDateString() === selectedDate.toDateString()
                      ? "bg-accent text-foreground border-3 border-accent/50 shadow-lg scale-105"
                      : "bg-muted/10 text-foreground hover:bg-muted/20 border-2 border-transparent"
                  }`}
                >
                  <div className="text-xs font-bold mb-2 uppercase tracking-wide">{day.name}</div>
                  <div className="text-2xl font-bold">{day.day}</div>
                </button>
              ))}
            </div>

            <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-foreground hover:text-accent">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </Card>

        {/* Appointments List */}
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="border-accent/20 p-6 hover:shadow-xl transition-all hover:border-accent/40 bg-white/40 group">
              <div className="flex items-center gap-6">
                {/* Time */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-accent/15 flex items-center justify-center border-2 border-accent/20 group-hover:bg-accent/20 transition-colors">
                    <span className="text-xl font-bold text-foreground">{appointment.time}</span>
                  </div>
                </div>

                {/* Pet Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{appointment.avatar}</span>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{appointment.petName}</h3>
                      <p className="text-xs text-muted-foreground">{appointment.petType}</p>
                      <p className="text-xs text-muted-foreground font-medium">{appointment.service}</p>
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`px-5 py-2 rounded-full text-sm font-bold capitalize ${
                      appointment.status === "confirmado"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {appointment.status === "confirmado" ? "✓ Confirmado" : "⏳ Pendente"}
                  </span>
                  <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-foreground hover:text-accent opacity-0 group-hover:opacity-100">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-foreground hover:text-accent opacity-0 group-hover:opacity-100">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
