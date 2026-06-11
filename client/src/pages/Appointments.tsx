import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AppointmentForm } from "@/components/AppointmentForm";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, Calendar, List } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

type ViewType = "calendar" | "week" | "day" | "agenda";

const STATUS_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  pending: { bg: "bg-gray-100", text: "text-gray-800", badge: "bg-gray-500" },
  confirmed: { bg: "bg-blue-100", text: "text-blue-800", badge: "bg-blue-500" },
  in_progress: { bg: "bg-yellow-100", text: "text-yellow-800", badge: "bg-yellow-500" },
  completed: { bg: "bg-green-100", text: "text-green-800", badge: "bg-green-500" },
  cancelled: { bg: "bg-red-100", text: "text-red-800", badge: "bg-red-500" },
  no_show: { bg: "bg-red-200", text: "text-red-900", badge: "bg-red-600" },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em Andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não Compareceu",
};

export default function Appointments() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("calendar");
  const [showForm, setShowForm] = useState(false);

  // Fetch appointments
  const { data: appointments = [] } = trpc.appointments.list.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: services = [] } = trpc.services.list.useQuery();

  // Create pet map for quick lookup
  const petMap = useMemo(() => {
    const map = new Map<string, any>();
    clients.forEach((client: any) => {
      (client.pets || []).forEach((pet: any) => {
        map.set(pet.id, { ...pet, clientName: client.name });
      });
    });
    return map;
  }, [clients]);

  // Get days for calendar view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 0 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
  });

  // Get week days for week view
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get hours for timeline (07:00 às 22:00)
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);

  // Filter appointments by date
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    appointments.forEach((apt: any) => {
      const date = new Date(apt.appointmentDate);
      const key = format(date, "yyyy-MM-dd");
      if (!map.has(key)) {
        map.set(key, []);
      }
      const pet = petMap.get(apt.petId);
      map.get(key)!.push({
        ...apt,
        petName: pet?.name || apt.petId,
        clientName: pet?.clientName || "Cliente",
        serviceName: services.find((s: any) => s.id === apt.serviceId)?.name || "Serviço",
      });
    });
    return map;
  }, [appointments, petMap, services]);

  const handlePrevious = () => {
    if (viewType === "calendar") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    } else {
      setCurrentDate(addDays(currentDate, -7));
    }
  };

  const handleNext = () => {
    if (viewType === "calendar") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Render calendar view
  const renderCalendar = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
          <div key={day} className="text-center font-semibold text-sm py-2 text-teal-700">
            {day}
          </div>
        ))}
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayAppointments = appointmentsByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={dateKey}
              className={`min-h-24 p-2 border rounded-lg ${
                isCurrentMonth ? "bg-white" : "bg-gray-50"
              } ${isSameDay(day, new Date()) ? "border-teal-500 border-2" : "border-gray-200"}`}
            >
              <div className="font-semibold text-sm mb-1">{format(day, "d")}</div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 2).map((apt: any) => (
                  <div
                    key={apt.id}
                    className={`text-xs p-1 rounded truncate ${
                      STATUS_COLORS[apt.status]?.bg
                    }`}
                    title={`${apt.petName} (${apt.clientName})`}
                  >
                    {apt.petName}
                  </div>
                ))}
                {dayAppointments.length > 2 && (
                  <div className="text-xs text-gray-500">+{dayAppointments.length - 2}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render week view
  const renderWeek = () => (
    <div className="space-y-4 overflow-x-auto">
      <div className="grid gap-2" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
        <div className="font-semibold text-sm"></div>
        {weekDays.map((day) => (
          <div key={format(day, "yyyy-MM-dd")} className="text-center">
            <div className="text-xs text-gray-600">{format(day, "EEE", { locale: ptBR })}</div>
            <div className="font-semibold text-sm">{format(day, "dd")}</div>
          </div>
        ))}

        {hours.map((hour) => (
          <div key={`hour-${hour}`}>
            <div className="text-xs text-gray-600 text-right pr-2">{String(hour).padStart(2, "0")}:00</div>
            {weekDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayAppointments = appointmentsByDate.get(dateKey) || [];
              const hourAppointments = dayAppointments.filter((apt: any) => {
                const aptHour = new Date(apt.appointmentDate).getHours();
                return aptHour === hour;
              });

              return (
                <div
                  key={`${dateKey}-${hour}`}
                  className="border border-gray-200 min-h-12 p-1"
                >
                  {hourAppointments.map((apt: any) => (
                    <div
                      key={apt.id}
                      className={`text-xs p-1 rounded mb-1 ${STATUS_COLORS[apt.status]?.bg}`}
                      title={`${apt.petName} (${apt.clientName})`}
                    >
                      {apt.petName}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  // Render day view
  const renderDay = () => {
    const dateKey = format(currentDate, "yyyy-MM-dd");
    const dayAppointments = appointmentsByDate.get(dateKey) || [];

    return (
      <div className="space-y-4">
        <div className="text-center font-semibold text-lg">
          {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </div>
        <div className="space-y-2">
          {hours.map((hour) => {
            const hourAppointments = dayAppointments.filter((apt: any) => {
              const aptHour = new Date(apt.appointmentDate).getHours();
              return aptHour === hour;
            });

            return (
              <div key={`day-${hour}`} className="flex gap-4">
                <div className="w-16 text-sm font-semibold text-gray-600">
                  {String(hour).padStart(2, "0")}:00
                </div>
                <div className="flex-1 space-y-2">
                  {hourAppointments.length > 0 ? (
                    hourAppointments.map((apt: any) => (
                      <div
                        key={apt.id}
                        className={`p-3 rounded-lg border-l-4 ${STATUS_COLORS[apt.status]?.bg}`}
                        style={{ borderLeftColor: "#8e6e3e" }}
                      >
                        <div className="font-semibold">{apt.petName}</div>
                        <div className="text-sm text-gray-600">{apt.clientName} • {apt.serviceName}</div>
                        <div className="text-xs text-gray-600 mt-1">{apt.notes}</div>
                      </div>
                    ))
                  ) : (
                    <div className="h-12 border border-dashed border-gray-300 rounded"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render agenda view - Agenda Semanal
  const renderAgenda = () => {
    const dayAppointments = appointmentsByDate.get(format(currentDate, "yyyy-MM-dd")) || [];
    const sortedAppointments = [...dayAppointments].sort((a: any, b: any) => {
      const timeA = new Date(a.appointmentDate).getTime();
      const timeB = new Date(b.appointmentDate).getTime();
      return timeA - timeB;
    });

    return (
      <div className="space-y-6">
        {/* Semana */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weekDays.map((day) => (
            <button
              key={format(day, "yyyy-MM-dd")}
              onClick={() => setCurrentDate(day)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
                isSameDay(day, currentDate)
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="text-xs text-gray-600">{format(day, "EEE", { locale: ptBR }).toUpperCase()}</div>
              <div>{format(day, "dd")}</div>
            </button>
          ))}
        </div>

        {/* Agendamentos do dia */}
        <div className="space-y-4">
          {sortedAppointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhum agendamento para este dia
            </div>
          ) : (
            sortedAppointments.map((apt: any) => {
              const aptTime = format(new Date(apt.appointmentDate), "HH:mm");
              return (
                <div key={apt.id} className="flex gap-4">
                  {/* Horário */}
                  <div className="w-20 text-right">
                    <div className="font-semibold text-lg text-gray-800">{aptTime}</div>
                    <div className="text-xs text-gray-500">60 min</div>
                  </div>

                  {/* Card do agendamento */}
                  <div className={`flex-1 p-4 rounded-lg border-l-4 ${STATUS_COLORS[apt.status]?.bg}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{apt.petId}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Banho & Tosa Higiênica • Prof. Letícia
                        </div>
                      </div>
                      <Badge className={STATUS_COLORS[apt.status]?.badge}>
                        {STATUS_LABELS[apt.status]}
                      </Badge>
                    </div>
                    {apt.notes && (
                      <div className="text-sm text-gray-600 mt-2">{apt.notes}</div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">
                        ✎ Editar
                      </Button>
                      {apt.status === "pending" && (
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                          Confirmar Agora
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agendamento</h1>
          <p className="text-gray-600 mt-1">Gerenciamento completo de agendamentos</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
        >
          + Novo Agendamento
        </Button>
      </div>

      {/* Legend */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-wrap gap-3">
        <span className="font-semibold">Legenda:</span>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <Badge key={key} className={STATUS_COLORS[key]?.badge}>
            {label}
          </Badge>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="flex gap-2">
          <Button
            variant={viewType === "calendar" ? "default" : "outline"}
            onClick={() => setViewType("calendar")}
            size="sm"
          >
            <Calendar size={16} className="mr-2" />
            Mês
          </Button>
          <Button
            variant={viewType === "week" ? "default" : "outline"}
            onClick={() => setViewType("week")}
            size="sm"
          >
            Semana
          </Button>
          <Button
            variant={viewType === "day" ? "default" : "outline"}
            onClick={() => setViewType("day")}
            size="sm"
          >
            Dia
          </Button>

        </div>

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Date Display */}
      <div className="text-center font-semibold text-lg text-gray-700">
        {viewType === "calendar"
          ? format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
          : viewType === "week"
          ? `${format(weekStart, "dd 'de' MMM", { locale: ptBR })} - ${format(addDays(weekStart, 6), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`
          : format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        {viewType === "calendar" && renderCalendar()}
        {viewType === "week" && renderWeek()}
        {viewType === "day" && renderDay()}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo agendamento
            </DialogDescription>
          </DialogHeader>
          <AppointmentForm
            onClose={() => setShowForm(false)}
            onSuccess={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
