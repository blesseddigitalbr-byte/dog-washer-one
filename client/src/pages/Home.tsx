import { useMemo } from "react";
import { useLocation } from "wouter";
import {
  AlertCircle,
  CalendarDays,
  Cake,
  CircleDollarSign,
  Clock3,
  Package,
  PawPrint,
  Users,
  MessageCircle,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  pending: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  confirmed: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function dateKey(value: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatTime(appointment: any) {
  if (appointment.start_time) return appointment.start_time.slice(0, 5);
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(appointment.appointment_date));
}

function whatsappLink(phone: string | null | undefined, message: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function daysUntilBirthday(birthDate: string) {
  const today = new Date();
  const source = new Date(`${birthDate}T12:00:00`);
  let next = new Date(
    today.getFullYear(),
    source.getMonth(),
    source.getDate(),
    12,
  );
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12,
  );

  if (next < todayStart) {
    next = new Date(
      today.getFullYear() + 1,
      source.getMonth(),
      source.getDate(),
      12,
    );
  }

  return Math.round((next.getTime() - todayStart.getTime()) / 86_400_000);
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const clientsQuery = trpc.clients.list.useQuery();
  const appointmentsQuery = trpc.appointments.list.useQuery();
  const packagesQuery = trpc.packages.list.useQuery();
  const clientPackagesQuery = trpc.clientPackages.list.useQuery();
  const utils = trpc.useUtils();
  const statusMutation = trpc.appointments.setStatus.useMutation({
    onSuccess: async () => {
      await utils.appointments.list.invalidate();
      toast.success("Agenda oficial atualizada");
    },
    onError: (error) => toast.error(error.message),
  });

  const clients = clientsQuery.data ?? [];
  const appointments = appointmentsQuery.data ?? [];
  const packages = packagesQuery.data ?? [];
  const clientPackages = clientPackagesQuery.data ?? [];
  const loading =
    clientsQuery.isLoading ||
    appointmentsQuery.isLoading ||
    packagesQuery.isLoading ||
    clientPackagesQuery.isLoading;

  const dashboard = useMemo(() => {
    const today = dateKey(new Date());
    const pets = clients.flatMap((client: any) =>
      (client.pets ?? []).map((pet: any) => ({
        ...pet,
        tutorName: client.name,
        tutorPhone: client.phone,
      })),
    );
    const todayAppointments = appointments
      .filter(
        (appointment: any) =>
          dateKey(appointment.appointment_date) === today,
      )
      .sort((a: any, b: any) =>
        formatTime(a).localeCompare(formatTime(b)),
      );
    const activeTodayAppointments = todayAppointments.filter(
      (appointment: any) => appointment.status !== "cancelled",
    );
    const expectedValue = activeTodayAppointments.reduce(
      (total: number, appointment: any) =>
        total + Number(appointment.service?.price ?? 0),
      0,
    );
    const birthdays = pets
      .filter((pet: any) => pet.birth_date)
      .map((pet: any) => ({
        ...pet,
        daysUntil: daysUntilBirthday(pet.birth_date),
      }))
      .filter((pet: any) => pet.daysUntil <= 7)
      .sort((a: any, b: any) => a.daysUntil - b.daysUntil)
      .slice(0, 6);
    const incompleteClients = clients
      .map((client: any) => {
        const missing = [
          !client.phone && "telefone",
          !client.email && "e-mail",
          !client.cpf && "CPF",
          (client.pets?.length ?? 0) === 0 && "pet",
        ].filter(Boolean) as string[];
        return { ...client, missing };
      })
      .filter((client: any) => client.missing.length > 0)
      .slice(0, 6);
    const incompletePets = pets
      .map((pet: any) => ({
        ...pet,
        missing: [
          !pet.birth_date && "data de nascimento",
          !pet.sexo && "sexo",
          !pet.breed && "raça",
        ].filter(Boolean) as string[],
      }))
      .filter((pet: any) => pet.missing.length > 0)
      .slice(0, 6);
    const packageRadar = clientPackages
      .map((item: any) => {
        const daysToExpiry = item.expiry_date
          ? Math.ceil((new Date(`${item.expiry_date}T12:00:00`).getTime() - Date.now()) / 86_400_000)
          : null;
        const noBalance =
          Number(item.balance_baths ?? 0) <= 0 &&
          Number(item.balance_groomings ?? 0) <= 0;
        const alert =
          item.status !== "active"
            ? "Ciclo encerrado"
            : noBalance
              ? "Sem saldo"
              : daysToExpiry !== null && daysToExpiry < 0
                ? "Plano vencido"
                : daysToExpiry !== null && daysToExpiry <= 7
                  ? `Vence em ${Math.max(daysToExpiry, 0)} dia(s)`
                  : "Tudo em dia";
        return { ...item, alert };
      })
      .filter((item: any) => item.alert !== "Tudo em dia")
      .slice(0, 6);

    return {
      pets,
      todayAppointments,
      expectedValue,
      birthdays,
      incompleteClients,
      incompletePets,
      packageRadar,
      activePackages: clientPackages.filter(
        (item: any) => item.status === "active",
      ).length,
      confirmedToday: todayAppointments.filter(
        (item: any) =>
          item.status === "confirmed" || item.status === "completed",
      ).length,
    };
  }, [appointments, clients, clientPackages]);

  const queryError =
    clientsQuery.error ||
    appointmentsQuery.error ||
    packagesQuery.error ||
    clientPackagesQuery.error;

  const cards = [
    {
      title: "Clientes",
      value: clients.length,
      detail: "cadastros ativos na unidade",
      icon: Users,
    },
    {
      title: "Pets",
      value: dashboard.pets.length,
      detail: "pets vinculados aos clientes",
      icon: PawPrint,
    },
    {
      title: "Agenda de hoje",
      value: dashboard.todayAppointments.length,
      detail: `${dashboard.confirmedToday} confirmados ou concluídos`,
      icon: CalendarDays,
    },
    {
      title: "Valor previsto hoje",
      value: formatCurrency(dashboard.expectedValue),
      detail: "serviços agendados, exceto cancelados",
      icon: CircleDollarSign,
    },
    {
      title: "Planos ativos",
      value: dashboard.activePackages,
      detail: "ciclos contratados e vigentes",
      icon: Package,
    },
  ];

  return (
    <div className="flex-1 overflow-auto bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A24E]">
              Visão operacional
            </p>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              Painel de controle
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Dados reais dos cadastros e atendimentos da unidade atual.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLocation("/clients")}
              className="rounded-lg border border-[#113A7A] px-4 py-2 text-sm font-semibold text-[#113A7A] transition hover:bg-[#113A7A]/5"
            >
              Cadastrar cliente
            </button>
            <button
              type="button"
              onClick={() => setLocation("/appointments")}
              className="rounded-lg bg-[#113A7A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#07111E]"
            >
              Novo agendamento
            </button>
          </div>
        </div>

        {queryError && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            Não foi possível carregar todos os dados do painel. Atualize a
            página ou tente novamente.
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {card.title}
                  </p>
                  <div className="rounded-lg bg-[#D8B768]/20 p-2 text-[#113A7A]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#07111E]">
                  {loading ? "—" : card.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{card.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#07111E]">
                  Agenda de hoje
                </h2>
                <p className="text-sm text-slate-500">
                  Ordem cronológica dos atendimentos
                </p>
              </div>
              <Clock3 className="h-5 w-5 text-[#C9A24E]" />
            </div>

            {dashboard.todayAppointments.length === 0 ? (
              <EmptyState>
                Nenhum atendimento agendado para hoje.
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-2 py-3">Horário</th>
                      <th className="px-2 py-3">Pet e tutor</th>
                      <th className="px-2 py-3">Serviço</th>
                      <th className="px-2 py-3">Profissional</th>
                      <th className="px-2 py-3">Status</th>
                      <th className="px-2 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.todayAppointments.map((appointment: any) => (
                      <tr
                        key={appointment.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-2 py-3 font-bold text-[#113A7A]">
                          {formatTime(appointment)}
                        </td>
                        <td className="px-2 py-3">
                          <p className="font-semibold text-[#07111E]">
                            {appointment.pet?.name ?? "Pet não informado"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {appointment.client?.nome ?? "Tutor não informado"}
                          </p>
                        </td>
                        <td className="px-2 py-3">
                          {appointment.service?.name ?? "—"}
                        </td>
                        <td className="px-2 py-3">
                          {appointment.professional?.name ?? "A definir"}
                        </td>
                        <td className="px-2 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              STATUS_STYLES[appointment.status] ??
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {STATUS_LABELS[appointment.status] ??
                              appointment.status}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2">
                            {(["pending", "confirmed", "in_progress"] as const).includes(appointment.status) && (
                              <button
                                type="button"
                                disabled={statusMutation.isPending}
                                onClick={() => {
                                  const next = appointment.status === "pending"
                                    ? "confirmed"
                                    : appointment.status === "confirmed"
                                      ? "in_progress"
                                      : "completed";
                                  statusMutation.mutate({ id: appointment.id, status: next });
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#D8B768] px-3 py-1.5 text-xs font-bold text-[#07111E] hover:bg-[#C9A24E]"
                              >
                                {appointment.status === "pending" ? "Confirmar" : appointment.status === "confirmed" ? "Iniciar" : "Concluir"}
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {whatsappLink(
                              appointment.client?.phone,
                              `Olá, ${appointment.client?.nome ?? ""}! Sobre o atendimento de ${appointment.pet?.name ?? "seu pet"} às ${formatTime(appointment)}: ${STATUS_LABELS[appointment.status] ?? appointment.status}.`,
                            ) && (
                              <a
                                href={whatsappLink(
                                  appointment.client?.phone,
                                  `Olá, ${appointment.client?.nome ?? ""}! Sobre o atendimento de ${appointment.pet?.name ?? "seu pet"} às ${formatTime(appointment)}: ${STATUS_LABELS[appointment.status] ?? appointment.status}.`,
                                )!}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-emerald-200 p-1.5 text-emerald-700 hover:bg-emerald-50"
                                title="Abrir WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#07111E]">
                  Próximos aniversários
                </h2>
                <p className="text-sm text-slate-500">Hoje e próximos 7 dias</p>
              </div>
              <Cake className="h-5 w-5 text-[#C9A24E]" />
            </div>

            {dashboard.birthdays.length === 0 ? (
              <EmptyState>
                Nenhum aniversário de pet nos próximos 7 dias.
              </EmptyState>
            ) : (
              <div className="space-y-3">
                {dashboard.birthdays.map((pet: any) => (
                  <div
                    key={pet.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                  >
                    <div>
                      <p className="font-semibold text-[#07111E]">{pet.name}</p>
                      <p className="text-xs text-slate-500">
                        Tutor: {pet.tutorName}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#D8B768]/20 px-2.5 py-1 text-xs font-semibold text-[#113A7A]">
                      {pet.daysUntil === 0
                        ? "Hoje"
                        : pet.daysUntil === 1
                          ? "Amanhã"
                          : `Em ${pet.daysUntil} dias`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#07111E]">Radar de pacotes</h2>
                <p className="text-sm text-slate-500">Vencimento, ciclo e saldo por ID do pacote</p>
              </div>
              <ShieldAlert className="h-5 w-5 text-[#C9A24E]" />
            </div>
            {dashboard.packageRadar.length === 0 ? (
              <EmptyState>Todos os pacotes monitorados estão em dia.</EmptyState>
            ) : (
              <div className="space-y-3">
                {dashboard.packageRadar.map((item: any) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLocation("/packages")}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left transition hover:border-[#C9A24E] hover:bg-[#F8F6F1]"
                  >
                    <div>
                      <p className="font-semibold text-[#07111E]">{item.pet_name ?? item.code}</p>
                      <p className="text-xs text-slate-500">{item.code} · {item.plan_name}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{item.alert}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#07111E]">
                Cadastros que precisam de atenção
              </h2>
              <p className="text-sm text-slate-500">
                Clientes sem dados essenciais ou sem pet vinculado
              </p>
            </div>
            <AlertCircle className="h-5 w-5 text-[#C9A24E]" />
          </div>

          {dashboard.incompleteClients.length === 0 && dashboard.incompletePets.length === 0 ? (
            <EmptyState>
              Todos os clientes possuem os dados essenciais preenchidos.
            </EmptyState>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dashboard.incompleteClients.map((client: any) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setLocation("/clients")}
                  className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#C9A24E] hover:bg-[#F8F6F1]"
                >
                  <p className="font-semibold text-[#07111E]">{client.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Falta: {client.missing.join(", ")}
                  </p>
                </button>
              ))}
              {dashboard.incompletePets.map((pet: any) => (
                <button
                  key={`pet-${pet.id}`}
                  type="button"
                  onClick={() => setLocation("/clients")}
                  className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#C9A24E] hover:bg-[#F8F6F1]"
                >
                  <p className="font-semibold text-[#07111E]">{pet.name} <span className="text-xs font-normal text-slate-500">· pet</span></p>
                  <p className="mt-1 text-xs text-slate-500">Tutor: {pet.tutorName} · Falta: {pet.missing.join(", ")}</p>
                </button>
              ))}
            </div>
          )}
          </section>
        </div>
      </div>
    </div>
  );
}
