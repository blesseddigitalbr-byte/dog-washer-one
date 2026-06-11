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
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

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

  // Filter appointments by status
  const filteredAppointments = appointments.filter((apt: any) => {
    if (statusFilter === "all") return true;
    return apt.status === statusFilter;
  });

  // Get appointments for selected date
  const selectedDateKey = format(currentDate, "yyyy-MM-dd");
  const dayAppointments = useMemo(() => {
    const appointments: any[] = [];
    filteredAppointments.forEach((apt: any) => {
      if (!apt.appointmentDate) return;
      
      const date = new Date(apt.appointmentDate);
      if (isNaN(date.getTime())) return;
      
      const key = format(date, "yyyy-MM-dd");
      if (key === selectedDateKey) {
        const pet = petMap.get(apt.pet_id);
        appointments.push({
          ...apt,
          petName: pet?.name || apt.pet_id,
          clientName: pet?.clientName || "Cliente",
          serviceName: services.find((s: any) => s.id === apt.service_id)?.name || "Serviço",
          time: format(date, "HH:mm"),
        });
      }
    });
    return appointments.sort((a: any, b: any) => a.time.localeCompare(b.time));
  }, [filteredAppointments, petMap, services, selectedDateKey]);

  const handlePrevious = () => {
    setCurrentDate(addDays(currentDate, -1));
  };

  const handleNext = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-gray-600 mt-1">Visualize e gerencie seus agendamentos</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-secondary hover:bg-secondary/90 text-foreground font-bold"
        >
          + Novo Agendamento
        </Button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-3 flex-wrap">
        {[
          { id: "all", label: "Todos", icon: "∞" },
          { id: "pending", label: "Agendado", icon: "⏳" },
          { id: "confirmed", label: "Confirmado", icon: "✓" },
          { id: "in_progress", label: "Em Andamento", icon: "▶" },
          { id: "completed", label: "Concluído", icon: "✔" },
          { id: "cancelled", label: "Cancelado", icon: "✕" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all flex items-center gap-2 border ${
              statusFilter === f.id
                ? "bg-secondary text-foreground border-secondary shadow-sm"
                : "bg-white text-foreground border-border hover:border-secondary/30 hover:shadow-sm"
            }`}
          >
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
              statusFilter === f.id
                ? "bg-foreground/20 text-foreground"
                : "bg-secondary/10 text-secondary"
            }`}>
              {f.icon}
            </span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Date Navigation */}
      <div className="flex gap-2 items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
        <Button variant="outline" size="sm" onClick={handlePrevious}>
          <ChevronLeft size={16} />
        </Button>

        <div className="text-center flex-1">
          <h2 className="font-semibold text-lg text-foreground">
            {format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        {dayAppointments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhum agendamento para este dia</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dayAppointments.map((apt: any) => (
              <div
                key={apt.id}
                className={`p-4 rounded-lg border-l-4 ${STATUS_COLORS[apt.status]?.bg}`}
                style={{ borderLeftColor: "#8e6e3e" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-foreground">{apt.time}</span>
                      <div>
                        <p className="font-semibold text-foreground">{apt.petName}</p>
                        <p className="text-sm text-gray-600">{apt.clientName} • {apt.serviceName}</p>
                      </div>
                    </div>
                    {apt.notes && (
                      <p className="text-sm text-gray-600 mt-2">{apt.notes}</p>
                    )}
                  </div>
                  <Badge className={STATUS_COLORS[apt.status]?.badge}>
                    {STATUS_LABELS[apt.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
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
