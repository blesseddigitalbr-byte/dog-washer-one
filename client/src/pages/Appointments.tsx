import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, MoreVertical, Edit2, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AppointmentForm } from "@/components/AppointmentForm";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE = 10;

const statusConfig = {
  pending: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    label: "Pendente",
  },
  confirmed: {
    bg: "bg-green-100",
    text: "text-green-700",
    label: "Confirmado",
  },
  in_progress: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "Em Progresso",
  },
  completed: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    label: "Concluído",
  },
  cancelled: {
    bg: "bg-red-100",
    text: "text-red-700",
    label: "Cancelado",
  },
};

type FilterType = "day" | "week" | "month";

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [filterType, setFilterType] = useState<FilterType>("week");

  // Fetch appointments
  const { data: appointments = [], refetch } = trpc.appointments.list.useQuery();
  const deleteMutation = trpc.appointments.delete.useMutation();

  // Filter appointments based on selected filter type
  const getFilteredAppointments = () => {
    const now = new Date(selectedDate);
    now.setHours(0, 0, 0, 0);

    if (filterType === "day") {
      // Apenas o dia selecionado
      const nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + 1);

      return appointments.filter((apt: any) => {
        const aptDate = new Date(apt.appointment_date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= now && aptDate < nextDay;
      });
    } else if (filterType === "week") {
      // Semana inteira (segunda a domingo)
      const curr = new Date(now);
      const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1);
      const weekStart = new Date(curr.setDate(first));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      return appointments.filter((apt: any) => {
        const aptDate = new Date(apt.appointment_date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= weekStart && aptDate < weekEnd;
      });
    } else {
      // Mês inteiro
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      return appointments.filter((apt: any) => {
        const aptDate = new Date(apt.appointment_date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= monthStart && aptDate < monthEnd;
      });
    }
  };

  const filteredAppointments = getFilteredAppointments();

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

  // Week days
  const getWeekDays = (date: Date) => {
    const curr = new Date(date);
    const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1);
    const days = [];
    const dayNames = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

    for (let i = 0; i < 7; i++) {
      const day = new Date(curr.setDate(first + i));
      days.push({
        date: new Date(day),
        day: day.getDate(),
        name: dayNames[i],
      });
    }
    return days;
  };

  const weekDays = getWeekDays(selectedDate);
  const monthYear = selectedDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  }).toUpperCase();

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este agendamento?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Agendamento deletado com sucesso!");
      await refetch();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Erro ao deletar agendamento");
    }
  };

  const handleEditAppointment = (apt: any) => {
    setSelectedAppointment(apt);
    setIsFormOpen(true);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    if (filterType === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setSelectedDate(newDate);
    setCurrentPage(1);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    if (filterType === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setSelectedDate(newDate);
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 overflow-auto p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2">
              {monthYear}
            </p>
            <h1 className="text-4xl font-bold text-foreground mb-1">Agendamento</h1>
            <p className="text-sm text-muted-foreground capitalize">
              {filterType === "day"
                ? selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                  })
                : filterType === "week"
                ? `Semana de ${weekDays[0].day} a ${weekDays[6].day}`
                : `Mês de ${monthYear}`}
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedAppointment(null);
              setIsFormOpen(true);
            }}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold uppercase tracking-wide flex items-center gap-2 rounded-2xl px-6"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </Button>
        </div>

        {/* Filter Buttons */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => {
              setFilterType("day");
              setCurrentPage(1);
            }}
            className={`px-6 py-2 rounded-2xl font-bold uppercase tracking-wide transition-all ${
              filterType === "day"
                ? "bg-accent text-accent-foreground shadow-md"
                : "bg-white text-foreground border border-border hover:border-accent"
            }`}
          >
            Dia
          </button>
          <button
            onClick={() => {
              setFilterType("week");
              setCurrentPage(1);
            }}
            className={`px-6 py-2 rounded-2xl font-bold uppercase tracking-wide transition-all ${
              filterType === "week"
                ? "bg-accent text-accent-foreground shadow-md"
                : "bg-white text-foreground border border-border hover:border-accent"
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => {
              setFilterType("month");
              setCurrentPage(1);
            }}
            className={`px-6 py-2 rounded-2xl font-bold uppercase tracking-wide transition-all ${
              filterType === "month"
                ? "bg-accent text-accent-foreground shadow-md"
                : "bg-white text-foreground border border-border hover:border-accent"
            }`}
          >
            Mês
          </button>
        </div>

        {/* Calendar - Week Selector (only show for day/week view) */}
        {filterType !== "month" && (
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border-l-4 border-l-accent">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-foreground hover:text-accent"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-7 gap-2 flex-1">
                {weekDays.map((day, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDate(day.date);
                      setCurrentPage(1);
                    }}
                    className={`py-3 px-2 rounded-2xl text-center transition-all font-medium text-sm ${
                      day.date.toDateString() === selectedDate.toDateString()
                        ? "bg-accent text-accent-foreground shadow-md ring-2 ring-accent/30"
                        : "bg-white text-foreground border border-border hover:border-accent"
                    }`}
                  >
                    <div className="text-xs font-bold uppercase tracking-wide">{day.name}</div>
                    <div className="text-lg font-bold">{day.day}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-foreground hover:text-accent"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Month Navigation (only for month view) */}
        {filterType === "month" && (
          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-foreground hover:text-accent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-bold text-foreground">{monthYear}</span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-foreground hover:text-accent"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Appointments Timeline */}
        {paginatedAppointments.length > 0 ? (
          <div className="space-y-4">
            {paginatedAppointments.map((appointment: any, index: number) => {
              const status = appointment.status || "pending";
              const statusInfo = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

              return (
                <div key={appointment.id} className="flex gap-4">
                  {/* Timeline line */}
                  {index !== paginatedAppointments.length - 1 && (
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-accent" />
                      <div className="w-1 bg-accent/20 flex-1 rounded-full" style={{ minHeight: "80px" }} />
                    </div>
                  )}
                  {index === paginatedAppointments.length - 1 && (
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-accent" />
                    </div>
                  )}

                  {/* Appointment Card */}
                  <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-l-accent group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-foreground">
                            {appointment.pet?.name || "Pet"}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {appointment.pet?.breed} • {appointment.service?.name}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-foreground hover:text-accent opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleEditAppointment(appointment)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteAppointment(appointment.id)}
                            className="flex items-center gap-2 cursor-pointer text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Horário
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {formatTime(appointment.appointment_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Duração
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {appointment.duration_minutes || "N/A"} min
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Cliente
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {appointment.client?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Profissional
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {appointment.professional?.name || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {appointment.notes && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          Observações
                        </p>
                        <p className="text-sm text-foreground">{appointment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm border-l-4 border-l-accent flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Nenhum agendamento</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Não há agendamentos para o período selecionado
            </p>
            <Button
              onClick={() => {
                setSelectedAppointment(null);
                setIsFormOpen(true);
              }}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold uppercase tracking-wide rounded-2xl"
            >
              Criar Agendamento
            </Button>
          </div>
        )}

        {/* Pagination */}
        {filteredAppointments.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>📅 {filteredAppointments.length} agendamentos encontrados</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Itens por página: <span className="font-semibold">{ITEMS_PER_PAGE}</span>
              </span>
              <span className="text-sm text-muted-foreground">
                {startIndex + 1}-{Math.min(endIndex, filteredAppointments.length)} de{" "}
                {filteredAppointments.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-accent/20 text-foreground hover:text-accent transition-all duration-200 flex items-center gap-1.5 text-sm font-medium group disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-accent/20 text-foreground hover:text-accent transition-all duration-200 flex items-center gap-1.5 text-sm font-medium group disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Próxima página"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Appointment Form Modal */}
      {isFormOpen && (
        <AppointmentForm
          appointmentId={selectedAppointment?.id}
          onSuccess={() => {
            setIsFormOpen(false);
            setSelectedAppointment(null);
            refetch();
          }}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedAppointment(null);
          }}
        />
      )}
    </div>
  );
}
