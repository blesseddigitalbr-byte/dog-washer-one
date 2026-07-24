import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { AlertTriangle, ChevronLeft, ChevronRight, Calendar, List } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type ViewType = "calendar" | "week" | "day" | "agenda";

const STATUS_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  pending: { bg: "bg-gray-100", text: "text-gray-800", badge: "bg-gray-600 text-white" },
  confirmed: { bg: "bg-blue-100", text: "text-blue-800", badge: "bg-blue-700 text-white" },
  in_progress: { bg: "bg-yellow-100", text: "text-yellow-800", badge: "bg-[#C9A24E] text-[#07111E]" },
  completed: { bg: "bg-green-100", text: "text-green-800", badge: "bg-green-700 text-white" },
  cancelled: { bg: "bg-red-100", text: "text-red-800", badge: "bg-red-700 text-white" },
  no_show: { bg: "bg-red-200", text: "text-red-900", badge: "bg-red-800 text-white" },
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
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [completionCandidate, setCompletionCandidate] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch appointments
  const { data: appointments = [] } = trpc.appointments.list.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: services = [] } = trpc.services.list.useQuery();
  const utils = trpc.useUtils();
  const statusMutation = trpc.appointments.setStatus.useMutation({
    onSuccess: async () => {
      await utils.appointments.list.invalidate();
      toast.success("Status atualizado");
    },
    onError: (error) => toast.error(error.message),
  });

  const advanceStatus = (appointment: any) => {
    const nextStatus: Record<string, "confirmed" | "in_progress" | "completed"> = {
      pending: "confirmed",
      confirmed: "in_progress",
      in_progress: "completed",
    };
    const status = nextStatus[appointment.status];
    if (status === "completed") {
      setCompletionCandidate(appointment);
      return;
    }
    if (status) statusMutation.mutate({ id: appointment.id, status });
  };

  const confirmCompletion = () => {
    if (!completionCandidate) return;
    statusMutation.mutate({ id: completionCandidate.id, status: "completed" });
    setCompletionCandidate(null);
  };

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

  // Filter appointments by status and date
  const filteredAppointments = appointments.filter((apt: any) => {
    if (statusFilter === "all") return true;
    return apt.status === statusFilter;
  });

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    filteredAppointments.forEach((apt: any) => {
      // Validar se appointmentDate existe e é válido
      if (!apt.appointmentDate) return;
      
      const date = new Date(apt.appointmentDate);
      // Verificar se a data é válida
      if (isNaN(date.getTime())) return;
      
      const key = format(date, "yyyy-MM-dd");
      if (!map.has(key)) {
        map.set(key, []);
      }
      const pet = petMap.get(apt.petId || apt.pet_id);
      const service = services.find((s: any) => s.id === (apt.serviceId || apt.service_id));
      map.get(key)!.push({
        ...apt,
        petName: apt.petName || apt.pet?.name || pet?.name || "Pet não informado",
        clientName: apt.clientName || apt.client?.nome || apt.client?.name || pet?.clientName || "Cliente não informado",
        serviceName: apt.serviceName || apt.service?.name || service?.name || "Serviço não informado",
        professionalName: apt.professionalName || apt.professional?.name || "Profissional não informado",
      });
    });
    return map;
  }, [filteredAppointments, petMap, services]);

  const handlePrevious = () => {
    if (viewType === "calendar") {
      setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() - 1));
    } else if (viewType === "week") {
      setCurrentDate((date) => addDays(date, -7));
    } else {
      setCurrentDate((date) => addDays(date, -1));
    }
  };

  const openAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowForm(true);
  };

  const handleNext = () => {
    if (viewType === "calendar") {
      setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() + 1));
    } else if (viewType === "week") {
      setCurrentDate((date) => addDays(date, 7));
    } else {
      setCurrentDate((date) => addDays(date, 1));
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
                    role="button"
                    tabIndex={0}
                    onClick={() => openAppointment(apt)}
                    onKeyDown={(event) => event.key === "Enter" && openAppointment(apt)}
                    className={`cursor-pointer text-xs p-1 rounded truncate transition hover:ring-2 hover:ring-[#D8B768] ${
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
                if (!apt.appointmentDate) return false;
                const date = new Date(apt.appointmentDate);
                if (isNaN(date.getTime())) return false;
                const aptHour = date.getHours();
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
                      role="button"
                      tabIndex={0}
                      onClick={() => openAppointment(apt)}
                      onKeyDown={(event) => event.key === "Enter" && openAppointment(apt)}
                      className={`cursor-pointer text-xs p-1 rounded mb-1 transition hover:ring-2 hover:ring-[#D8B768] ${STATUS_COLORS[apt.status]?.bg}`}
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
              if (!apt.appointmentDate) return false;
              const date = new Date(apt.appointmentDate);
              if (isNaN(date.getTime())) return false;
              const aptHour = date.getHours();
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
                        role="button"
                        tabIndex={0}
                        onClick={() => openAppointment(apt)}
                        onKeyDown={(event) => event.key === "Enter" && openAppointment(apt)}
                        className={`cursor-pointer p-3 rounded-lg border-l-4 transition hover:ring-2 hover:ring-[#D8B768] ${STATUS_COLORS[apt.status]?.bg}`}
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
    const sortedAppointments = [...dayAppointments]
      .filter((apt: any) => {
        if (!apt.appointmentDate) return false;
        const date = new Date(apt.appointmentDate);
        return !isNaN(date.getTime());
      })
      .sort((a: any, b: any) => {
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
              if (!apt.appointmentDate) return null;
              const date = new Date(apt.appointmentDate);
              if (isNaN(date.getTime())) return null;
              const aptTime = format(date, "HH:mm");
              return (
                <div key={apt.id} className="flex gap-4">
                  {/* Horário */}
                  <div className="w-20 text-right">
                    <div className="font-semibold text-lg text-gray-800">{aptTime}</div>
                    <div className="text-xs text-gray-500">60 min</div>
                  </div>

                  {/* Card do agendamento */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openAppointment(apt)}
                    onKeyDown={(event) => event.key === "Enter" && openAppointment(apt)}
                    className={`flex-1 cursor-pointer p-4 rounded-lg border-l-4 transition hover:ring-2 hover:ring-[#D8B768] ${STATUS_COLORS[apt.status]?.bg}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{apt.petName}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {apt.serviceName} • Prof. {apt.professionalName}
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
                      {["pending", "confirmed", "in_progress"].includes(apt.status) && (
                        <Button
                          size="sm"
                          className="bg-[#113A7A] hover:bg-[#07111E] text-white"
                          disabled={statusMutation.isPending}
                          onClick={(event) => { event.stopPropagation(); advanceStatus(apt); }}
                        >
                          {apt.status === "pending"
                            ? "Confirmar"
                            : apt.status === "confirmed"
                              ? "Iniciar atendimento"
                              : "Concluir atendimento"}
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
          onClick={() => { setSelectedAppointment(null); setShowForm(true); }}
          className="bg-[#113A7A] text-white hover:bg-[#07111E] font-bold"
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
                ? "bg-[#D8B768] text-[#07111E] border-[#C9A24E] shadow-sm"
                : "bg-white text-foreground border-border hover:border-[#C9A24E] hover:shadow-sm"
            }`}
          >
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
              statusFilter === f.id
                ? "bg-[#07111E]/10 text-[#07111E]"
                : "bg-[#D8B768]/20 text-[#113A7A]"
            }`}>
              {f.icon}
            </span>
            {f.label}
          </button>
        ))}
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
            variant="outline"
            className={viewType === "calendar" ? "bg-[#D8B768] text-[#07111E] border-[#C9A24E]" : ""}
            onClick={() => setViewType("calendar")}
            size="sm"
          >
            <Calendar size={16} className="mr-2" />
            Mês
          </Button>
          <Button
            variant="outline"
            className={viewType === "week" ? "bg-[#D8B768] text-[#07111E] border-[#C9A24E]" : ""}
            onClick={() => setViewType("week")}
            size="sm"
          >
            Semana
          </Button>
          <Button
            variant="outline"
            className={viewType === "day" ? "bg-[#D8B768] text-[#07111E] border-[#C9A24E]" : ""}
            onClick={() => setViewType("day")}
            size="sm"
          >
            Dia
          </Button>
          <Button
            variant="outline"
            className={viewType === "agenda" ? "bg-[#D8B768] text-[#07111E] border-[#C9A24E]" : ""}
            onClick={() => setViewType("agenda")}
            size="sm"
          >
            <List size={16} className="mr-2" />
            Agenda
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
        {viewType === "agenda" && renderAgenda()}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) setSelectedAppointment(null);
      }}>
        <DialogContent className="flex max-h-[90vh] w-[min(96vw,1120px)] max-w-none flex-col overflow-hidden rounded-2xl p-7 sm:max-w-none">
          <DialogHeader>
            <DialogTitle>{selectedAppointment ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
            <DialogDescription>
              {selectedAppointment ? "Atualize dados, profissional, horário ou situação do atendimento." : "Preencha os dados para criar um novo agendamento."}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto pr-2">
            <AppointmentForm
              key={selectedAppointment?.id || "new-appointment"}
              onClose={() => setShowForm(false)}
              onSuccess={() => setShowForm(false)}
              appointment={selectedAppointment}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!completionCandidate} onOpenChange={(open) => !open && setCompletionCandidate(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl border-0 p-0 shadow-2xl">
          <div className="p-7 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#D8B768] text-[#07111E]">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <AlertDialogHeader className="mt-4">
              <AlertDialogTitle className="text-center text-xl font-extrabold text-[#07111E]">
                Confirmar finalização
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-sm font-medium leading-6 text-[#44516A]">
                Ao marcar como Concluído/Check, este atendimento poderá consumir saldo do pacote vinculado e será registrado no histórico de visitas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-6 flex justify-center gap-3">
              <AlertDialogCancel className="mt-0 font-bold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmCompletion}
                className="bg-[#113A7A] font-extrabold text-white hover:bg-[#07111E]"
              >
                Confirmar
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
