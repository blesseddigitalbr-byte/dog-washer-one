import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDays = [
    { day: "SEG", date: 20 },
    { day: "TER", date: 21 },
    { day: "QUA", date: 22 },
    { day: "QUI", date: 23 },
    { day: "SEX", date: 24 },
    { day: "SÁB", date: 25 },
    { day: "DOM", date: 26 },
  ];

  const appointments = [
    {
      id: 1,
      time: "09:00",
      pet: "Luna",
      owner: "Bento & Tosa Higiênica",
      service: "Grooming Elite",
      status: "Confirmado",
    },
    {
      id: 2,
      time: "10:30",
      pet: "Thor",
      owner: "Tratamento da Pelagem",
      service: "Nível 2",
      status: "Confirmado",
    },
    {
      id: 3,
      time: "14:00",
      pet: "Bella",
      owner: "Tosa Criativa",
      service: "Prof. Carla",
      status: "Pendente",
    },
    {
      id: 4,
      time: "15:30",
      pet: "Max",
      owner: "Banho Completo",
      service: "Grooming Elite",
      status: "Confirmado",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Agenda Semanal
            </h1>
            <p className="text-muted-foreground">Sexta-feira, 24 de Outubro 2024</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </Button>
        </div>

        {/* Week Navigation */}
        <Card className="p-6 mb-8 bg-white">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200"
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.setDate(currentDate.getDate() - 7))
                )
              }
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="grid grid-cols-7 gap-4 flex-1 mx-4">
              {weekDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`text-center p-3 rounded-lg transition-all ${
                    idx === 4
                      ? "bg-amber-100 border-2 border-amber-600"
                      : "bg-slate-50 border border-slate-200"
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-600 mb-1">
                    {day.day}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      idx === 4 ? "text-amber-900" : "text-slate-900"
                    }`}
                  >
                    {day.date}
                  </p>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="border-slate-200"
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.setDate(currentDate.getDate() + 7))
                )
              }
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Appointments Timeline */}
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card
              key={appointment.id}
              className="p-6 bg-white hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6 flex-1">
                  <div className="text-center">
                    <div className="bg-amber-100 text-amber-900 font-bold px-4 py-2 rounded-lg w-20">
                      {appointment.time}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      {appointment.pet}
                    </h3>
                    <p className="text-sm text-slate-600 mb-2">
                      {appointment.owner}
                    </p>
                    <p className="text-xs text-slate-500">
                      {appointment.service}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      appointment.status === "Confirmado"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {appointment.status}
                  </span>
                  <Button variant="outline" size="sm" className="border-slate-200">
                    Editar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
