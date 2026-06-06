import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";

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
      isVip: false,
    },
    {
      id: 2,
      time: "10:30",
      petName: "Thor",
      petType: "Tratamento da Pelagem",
      service: "Nível 2",
      status: "confirmado",
      avatar: "🐕",
      isVip: false,
    },
    {
      id: 3,
      time: "14:00",
      petName: "Bella",
      petType: "Tosa Criativa",
      service: "Prof. Carla",
      status: "pendente",
      avatar: "🐕",
      isVip: false,
    },
    {
      id: 4,
      time: "15:30",
      petName: "Max",
      petType: "Banho Completo",
      service: "Grooming Elite",
      status: "confirmado",
      avatar: "🐕",
      isVip: true,
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
        <div className="bg-white rounded-xl p-4 mb-8 shadow-sm">
          <div className="flex items-center justify-between">
            <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-foreground hover:text-accent">
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-7 gap-2 flex-1 mx-4">
              {weekDays.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day.date)}
                  className={`py-2 px-2 rounded-lg text-center transition-all font-medium text-sm ${
                    day.date.toDateString() === selectedDate.toDateString()
                      ? "bg-accent text-foreground shadow-md"
                      : "bg-accent/5 text-foreground hover:bg-accent/10"
                  }`}
                >
                  <div className="text-xs font-bold uppercase tracking-wide">{day.name}</div>
                  <div className="text-lg font-bold">{day.day}</div>
                </button>
              ))}
            </div>

            <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-foreground hover:text-accent">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white p-4 hover:bg-accent/5 transition-all duration-200 group flex items-center justify-between border-l-4 border-l-accent rounded-lg shadow-sm">
              {/* Left side - Pet info */}
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center text-2xl flex-shrink-0">
                  {appointment.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-base">{appointment.petName}</h3>
                  <p className="text-xs text-muted-foreground">
                    {appointment.petType} • <span className="text-accent font-medium">{appointment.service}</span>
                  </p>
                </div>
              </div>

              {/* Right side - Time and VIP badge */}
              <div className="flex items-center gap-6 flex-shrink-0">
                <span className="text-lg font-bold text-foreground">{appointment.time}</span>
                {appointment.isVip && (
                  <span className="bg-foreground text-background px-4 py-2 rounded-full text-xs font-bold">
                    VIP
                  </span>
                )}
                <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-foreground hover:text-accent opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
