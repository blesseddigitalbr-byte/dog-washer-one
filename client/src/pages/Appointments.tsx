import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { AppointmentForm } from "@/components/AppointmentForm";
import { toast } from "sonner";

const statusConfig = {
  pending: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    label: "Agendado",
    badge: "bg-amber-500",
  },
  confirmed: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "Confirmado",
    badge: "bg-blue-500",
  },
  in_progress: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    label: "Em Andamento",
    badge: "bg-purple-500",
  },
  completed: {
    bg: "bg-green-100",
    text: "text-green-700",
    label: "Concluído",
    badge: "bg-green-500",
  },
  cancelled: {
    bg: "bg-red-100",
    text: "text-red-700",
    label: "Cancelado",
    badge: "bg-red-500",
  },
};

type ViewType = "calendar" | "agenda";
type FilterType = "day" | "week" | "month";

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("calendar");
  const [filterType, setFilterType] = useState<FilterType>("month");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: appointments = [], refetch } = trpc.appointments.list.useQuery();
  const deleteMutation = trpc.appointments.delete.useMutation();

  // Filtrar agendamentos por data
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt: any) => {
      const aptDate = new Date(apt.appointmentDate);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Gerar dias do mês
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const monthYear = selectedDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este agendamento?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Agendamento deletado!");
      await refetch();
    } catch (error) {
      toast.error("Erro ao deletar agendamento");
    }
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const daysInMonth = getDaysInMonth(selectedDate);
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

  return (
    <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2">
              {monthYear.toUpperCase()}
            </p>
            <h1 className="text-4xl font-bold text-foreground">Agendamento</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerenciamento completo de agendamentos
            </p>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold uppercase tracking-wide flex items-center gap-2 rounded-full px-8 h-12 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Novo Agendamento
          </Button>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl p-4 mb-8 shadow-sm border border-border flex flex-wrap gap-4">
          <p className="text-xs font-bold text-muted-foreground uppercase">Legenda:</p>
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${config.badge}`}></div>
              <span className="text-xs font-medium text-foreground">{config.label}</span>
            </div>
          ))}
        </div>

        {/* View Selector */}
        <div className="mb-8 flex gap-3">
          <button
            onClick={() => setViewType("calendar")}
            className={`px-6 py-2 rounded-full font-bold uppercase tracking-wide transition-all text-sm ${
              viewType === "calendar"
                ? "bg-accent text-accent-foreground shadow-md"
                : "bg-white text-foreground border border-border hover:border-accent"
            }`}
          >
            Calendário
          </button>
          <button
            onClick={() => setViewType("agenda")}
            className={`px-6 py-2 rounded-full font-bold uppercase tracking-wide transition-all text-sm ${
              viewType === "agenda"
                ? "bg-accent text-accent-foreground shadow-md"
                : "bg-white text-foreground border border-border hover:border-accent"
            }`}
          >
            Lista
          </button>
        </div>

        {/* Calendar View */}
        {viewType === "calendar" && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-border">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-foreground hover:text-accent"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold text-foreground capitalize">
                {monthYear}
              </h2>

              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-foreground hover:text-accent"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center font-bold text-sm text-muted-foreground uppercase tracking-wide py-3"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {daysInMonth.map((day, idx) => {
                const dayAppointments = day ? getAppointmentsForDate(day) : [];
                const isToday =
                  day &&
                  day.toDateString() === new Date().toDateString();
                const isSelected =
                  day &&
                  day.toDateString() === selectedDate.toDateString();

                return (
                  <div
                    key={idx}
                    onClick={() => day && setSelectedDate(day)}
                    className={`min-h-24 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                      day
                        ? isSelected
                          ? "border-accent bg-accent/5"
                          : isToday
                          ? "border-accent/50 bg-accent/5"
                          : "border-border hover:border-accent/50"
                        : "bg-slate-50 border-transparent"
                    }`}
                  >
                    {day && (
                      <>
                        <div
                          className={`text-sm font-bold mb-1 ${
                            isToday
                              ? "text-accent"
                              : "text-foreground"
                          }`}
                        >
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 2).map((apt: any) => (
                            <div
                              key={apt.id}
                              className={`text-xs px-2 py-1 rounded font-medium truncate ${
                                statusConfig[apt.status as keyof typeof statusConfig]?.bg
                              } ${
                                statusConfig[apt.status as keyof typeof statusConfig]?.text
                              }`}
                            >
                              {apt.startTime}
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div className="text-xs text-muted-foreground px-2 font-medium">
                              +{dayAppointments.length - 2} mais
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Agenda View */}
        {viewType === "agenda" && (
          <div className="space-y-4">
            {getAppointmentsForDate(selectedDate).length > 0 ? (
              getAppointmentsForDate(selectedDate).map((apt: any) => (
                <div
                  key={apt.id}
                  className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${
                    statusConfig[apt.status as keyof typeof statusConfig]?.bg
                  } border-l-accent`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`text-sm font-bold px-3 py-1 rounded-full ${
                            statusConfig[apt.status as keyof typeof statusConfig]?.badge
                          } text-white`}
                        >
                          {statusConfig[apt.status as keyof typeof statusConfig]?.label}
                        </span>
                        <span className="text-lg font-bold text-foreground">
                          {apt.startTime}
                        </span>
                      </div>
                      <p className="text-foreground font-medium">
                        {apt.petName || "Pet"} - {apt.clientName || "Cliente"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {apt.serviceName || "Serviço"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAppointment(apt.id)}
                      className="text-red-500 hover:text-red-700 font-bold text-sm uppercase"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-border text-center">
                <p className="text-muted-foreground text-lg">
                  Nenhum agendamento para {selectedDate.toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal do Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Novo Agendamento</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Preencha os dados para criar um novo agendamento
            </p>
          </DialogHeader>
          <AppointmentForm
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              refetch();
              setIsFormOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
