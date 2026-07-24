import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarRange, CheckCircle2, Copy, MessageCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const frequencyLabels: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  every_21_days: "A cada 21 dias",
  monthly: "Mensal",
  once: "Atendimento único",
};

const weekdayLabels = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const serviceModeLabels: Record<string, string> = {
  bath: "Banho",
  bath_hygiene: "Combo Higiene",
  grooming: "Tosa",
  trimming: "Trimming",
  custom: "Personalizado",
};

const fieldClass = "mt-1 rounded-none border-0 border-b border-[#C9D0DA] bg-transparent px-0 shadow-none focus:ring-0 focus-visible:ring-0";
const labelClass = "text-[11px] font-black uppercase tracking-wide text-[#44516A]";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function addMonths(dateValue: string, months: number) {
  const date = new Date(`${dateValue}T00:00:00-03:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00-03:00`).toLocaleDateString("pt-BR");
}

function firstName(name?: string) {
  return name?.trim().split(/\s+/)[0] || "-";
}

function packageNumber(item: any, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = Number(item?.[key]);
    if (Number.isFinite(value) && value >= 0) return value;
  }
  return fallback;
}

export default function ScheduleSimulator() {
  const clientsQuery = trpc.clients.list.useQuery();
  const servicesQuery = trpc.services.list.useQuery();
  const professionalsQuery = trpc.professionals.list.useQuery();
  const utils = trpc.useUtils();

  const [clientId, setClientId] = useState("");
  const [petId, setPetId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [appointmentType, setAppointmentType] = useState<"package" | "standalone">("package");
  const [clientPackageId, setClientPackageId] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "every_21_days" | "monthly" | "once">("biweekly");
  const [quantity, setQuantity] = useState(4);
  const [groomingQuantity, setGroomingQuantity] = useState(0);
  const [groomingIntervalWeeks, setGroomingIntervalWeeks] = useState(8);
  const [paymentActivationDate, setPaymentActivationDate] = useState(todayDate());
  const [lastIncludedDate, setLastIncludedDate] = useState("");
  const [nextRenewalDate, setNextRenewalDate] = useState(addMonths(todayDate(), 1));
  const [standardWeekday, setStandardWeekday] = useState(String(new Date().getDay()));
  const [recurrenceRuleMode, setRecurrenceRuleMode] = useState<"standard_weekday" | "exact_interval">("standard_weekday");
  const [referenceDate, setReferenceDate] = useState(todayDate());
  const [defaultTime, setDefaultTime] = useState("09:00");
  const [cycleStartDate, setCycleStartDate] = useState(todayDate());
  const [endDate, setEndDate] = useState(addMonths(todayDate(), 1));
  const [petType, setPetType] = useState("");
  const [serviceMode, setServiceMode] = useState("bath_hygiene");
  const [finalServiceName, setFinalServiceName] = useState("Combo Higiene");
  const [notes, setNotes] = useState("");
  const [simulation, setSimulation] = useState<any>(null);
  const [message, setMessage] = useState("");

  const clients = clientsQuery.data ?? [];
  const selectedClient = clients.find((client: any) => client.id === clientId);
  const pets = selectedClient?.pets ?? [];
  const selectedPet = pets.find((pet: any) => pet.id === petId);
  const packagesQuery = trpc.clientPackages.byClient.useQuery({ clientId }, { enabled: !!clientId });
  const packages = (packagesQuery.data ?? []).filter((item: any) => !petId || item.pet_id === petId);
  const selectedPackage = packages.find((item: any) => item.id === clientPackageId) || packages[0];
  const selectedService = (servicesQuery.data ?? []).find((item: any) => item.id === serviceId);
  const activeServices = (servicesQuery.data ?? []).filter((item: any) => !item.status || item.status === "active");

  useEffect(() => {
    if (selectedPet?.breed && !petType) setPetType(selectedPet.breed);
  }, [selectedPet?.breed, petType]);

  useEffect(() => {
    if (selectedPackage?.expiry_date) {
      setEndDate(selectedPackage.expiry_date);
      setNextRenewalDate(selectedPackage.expiry_date);
    }
    if (!selectedPackage) return;

    const contractedBaths = packageNumber(selectedPackage, ["contracted_baths", "total_baths", "balance_baths"], quantity);
    const contractedGroomings = packageNumber(selectedPackage, ["contracted_groomings", "total_groomings", "balance_groomings"], groomingQuantity);

    if (contractedBaths > 0) setQuantity(contractedBaths);
    setGroomingQuantity(contractedGroomings);
    if (selectedPackage.frequency && selectedPackage.frequency !== "custom") {
      setFrequency(selectedPackage.frequency);
    }
  }, [
    selectedPackage?.id,
    selectedPackage?.expiry_date,
    selectedPackage?.contracted_baths,
    selectedPackage?.contracted_groomings,
    selectedPackage?.total_baths,
    selectedPackage?.total_groomings,
    selectedPackage?.balance_baths,
    selectedPackage?.balance_groomings,
    selectedPackage?.frequency,
  ]);

  useEffect(() => {
    if (serviceId || activeServices.length === 0) return;
    const preferredService =
      activeServices.find((service: any) => String(service.name ?? "").toLowerCase().includes("combo higiene")) ||
      activeServices.find((service: any) => String(service.name ?? "").toLowerCase().includes("banho")) ||
      activeServices[0];

    if (preferredService?.id) {
      setServiceId(preferredService.id);
      if (preferredService.name) setFinalServiceName(preferredService.name);
    }
  }, [activeServices, serviceId]);

  useEffect(() => {
    if (selectedService?.name && finalServiceName === serviceModeLabels[serviceMode]) {
      setFinalServiceName(selectedService.name);
    }
  }, [selectedService?.name, finalServiceName, serviceMode]);

  const simulateMutation = trpc.scheduleSimulator.simulate.useMutation({
    onSuccess: (data) => {
      setSimulation(data);
      setMessage(data.message_text ?? "");
      toast.success("Pré-agenda gerada. Revise antes de confirmar.");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateItemMutation = trpc.scheduleSimulator.updateItem.useMutation({
    onSuccess: async () => {
      if (!simulation?.id) return;
      const refreshed = await utils.scheduleSimulator.get.fetch({ id: simulation.id });
      setSimulation(refreshed);
    },
    onError: (error) => toast.error(error.message),
  });

  const confirmMutation = trpc.scheduleSimulator.confirm.useMutation({
    onSuccess: async (data) => {
      toast.success(`${data.created} atendimento(s) incluído(s) na Agenda oficial`);
      await utils.appointments.list.invalidate();
      const refreshed = await utils.scheduleSimulator.get.fetch({ id: simulation.id });
      setSimulation(refreshed);
    },
    onError: (error) => toast.error(error.message),
  });

  const saveMessageMutation = trpc.scheduleSimulator.saveMessage.useMutation({
    onSuccess: () => toast.success("Mensagem registrada no histórico"),
    onError: (error) => toast.error(error.message),
  });

  const summary = useMemo(() => {
    const items = simulation?.items ?? [];
    return {
      total: items.length,
      valid: items.filter((item: any) => item.status === "valid" || item.status === "warning").length,
      conflicts: items.filter((item: any) => item.status === "conflict").length,
      grooming: items.filter((item: any) => item.include_grooming).length,
    };
  }, [simulation]);

  const baseDateMatchesWeekday = Number(standardWeekday) === new Date(`${referenceDate}T00:00:00-03:00`).getDay();

  const simulate = () => {
    if (!clientId || !petId || !serviceId || !professionalId || !referenceDate || !defaultTime) {
      toast.error("Preencha tutor, pet, serviço, profissional, data de referência e horário");
      return;
    }

    simulateMutation.mutate({
      clientId,
      petId,
      serviceId,
      professionalId,
      appointmentType,
      clientPackageId: clientPackageId && clientPackageId !== "none" ? clientPackageId : undefined,
      frequency,
      startDate: cycleStartDate || referenceDate,
      endDate: endDate || undefined,
      defaultTime,
      quantity,
      petType: petType || undefined,
      serviceMode,
      groomingQuantity,
      groomingIntervalWeeks,
      paymentActivationDate: paymentActivationDate || undefined,
      lastIncludedDate: lastIncludedDate || undefined,
      nextRenewalDate: nextRenewalDate || undefined,
      standardWeekday: Number(standardWeekday),
      recurrenceRuleMode,
      referenceDate,
      cycleStartDate: cycleStartDate || undefined,
      finalServiceName: finalServiceName || selectedService?.name || undefined,
      notes: notes || undefined,
    });
  };

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message);
    toast.success("Mensagem copiada");
  };

  const phone = (selectedClient?.phone ?? "").replace(/\D/g, "");
  const whatsappUrl = phone ? `https://wa.me/${phone.startsWith("55") ? phone : `55${phone}`}?text=${encodeURIComponent(message)}` : null;

  return (
    <div className="min-h-screen bg-[#F8F6F1] p-4 sm:p-6">
      <div className="mx-auto max-w-[1480px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C9A24E]">Simulador de Agenda</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-[#07111E]">Agenda sugerida por pet/pacote</h1>
            <p className="mt-1 max-w-3xl text-sm font-semibold text-[#44516A]">
              Monte o ciclo sugerido antes de criar os atendimentos oficiais. O saldo do pacote só baixa quando o atendimento é finalizado.
            </p>
          </div>
          <Button className="bg-[#07111E] text-white hover:bg-[#113A7A]">Novo pet</Button>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-6">
            <section className="overflow-hidden rounded-xl border border-[#E7DEC8] bg-white shadow-sm">
              <div className="border-b border-[#E7DEC8] px-7 py-5">
                <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-[#07111E]">
                  <span className="text-[#C9A24E]">☷</span>
                  Configuração do Plano
                </h2>
              </div>
              <div className="grid gap-x-8 gap-y-5 p-7 md:grid-cols-2">
                <div>
                  <Label className={labelClass}>Profissional / executante *</Label>
                  <Select value={professionalId} onValueChange={setProfessionalId}>
                    <SelectTrigger className={fieldClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{(professionalsQuery.data ?? []).filter((item: any) => item.is_active).map((item: any) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>Nome do tutor *</Label>
                  <Select value={clientId} onValueChange={(value) => { setClientId(value); setPetId(""); setClientPackageId(""); }}>
                    <SelectTrigger className={fieldClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{clients.map((client: any) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>Nome do pet *</Label>
                  <Select value={petId} onValueChange={(value) => { setPetId(value); setClientPackageId(""); }}>
                    <SelectTrigger className={fieldClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{pets.map((pet: any) => <SelectItem key={pet.id} value={pet.id}>{pet.name}{selectedClient?.name ? ` (Tutor: ${firstName(selectedClient.name)})` : ""}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>Tipo pet / raça</Label>
                  <Input className={fieldClass} value={petType} onChange={(event) => setPetType(event.target.value)} placeholder="Ex.: Spitz, Golden, demais raças" />
                </div>
                <div>
                  <Label className={labelClass}>Plano contratado</Label>
                  {appointmentType === "package" ? (
                    <Select value={clientPackageId || "auto"} onValueChange={(value) => setClientPackageId(value === "auto" ? "" : value)}>
                      <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Selecionar automaticamente</SelectItem>
                        {packages.map((item: any) => <SelectItem key={item.id} value={item.id}>{item.plan?.name || item.plan_code || item.code}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input className={fieldClass} value="Avulso" readOnly />
                  )}
                </div>
                <div>
                  <Label className={labelClass}>Quantidade de atendimentos</Label>
                  <Input className={fieldClass} type="number" min={1} max={60} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
                </div>
                <div>
                  <Label className={labelClass}>Quantidade de tosas/trimming</Label>
                  <Input className={fieldClass} type="number" min={0} max={quantity} value={groomingQuantity} onChange={(event) => setGroomingQuantity(Number(event.target.value))} />
                </div>
                <div>
                  <Label className={labelClass}>Frequência</Label>
                  <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                    <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(frequencyLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>Próxima renovação</Label>
                  <Input className={fieldClass} type="date" value={nextRenewalDate} onChange={(event) => setNextRenewalDate(event.target.value)} />
                </div>
                <div>
                  <Label className={labelClass}>Tipo de atendimento</Label>
                  <Select value={appointmentType} onValueChange={(value: any) => { setAppointmentType(value); setClientPackageId(""); }}>
                    <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="package">Pacote</SelectItem><SelectItem value="standalone">Avulso</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>Serviço padrão *</Label>
                  <Select value={serviceId} onValueChange={(value) => { setServiceId(value); const found = (servicesQuery.data ?? []).find((service: any) => service.id === value); if (found?.name) setFinalServiceName(found.name); }}>
                    <SelectTrigger className={fieldClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{(servicesQuery.data ?? []).map((service: any) => <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>Tipo de serviço</Label>
                  <Select value={serviceMode} onValueChange={(value) => { setServiceMode(value); if (!selectedService?.name) setFinalServiceName(serviceModeLabels[value]); }}>
                    <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(serviceModeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>Intervalo tosa/trimming</Label>
                  <Select value={String(groomingIntervalWeeks)} onValueChange={(value) => setGroomingIntervalWeeks(Number(value))}>
                    <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">A cada 7 semanas</SelectItem>
                      <SelectItem value="8">A cada 8 semanas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-[#E7DEC8] bg-white shadow-sm">
              <div className="border-b border-[#E7DEC8] px-7 py-5">
                <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-[#07111E]">
                  <CalendarRange className="h-5 w-5 text-[#C9A24E]" />
                  Regras de Recorrência
                </h2>
              </div>
              <div className="grid gap-x-8 gap-y-5 p-7 md:grid-cols-3">
                <div>
                  <Label className={labelClass}>Data de ativação</Label>
                  <Input className={fieldClass} type="date" value={paymentActivationDate} onChange={(event) => setPaymentActivationDate(event.target.value)} />
                </div>
                <div>
                  <Label className={labelClass}>Regra de recorrência</Label>
                  <Select value={recurrenceRuleMode} onValueChange={(value: any) => setRecurrenceRuleMode(value)}>
                    <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="standard_weekday">Usar dia padrão da semana</SelectItem><SelectItem value="exact_interval">Usar intervalo exato</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>Horário padrão</Label>
                  <Input className={fieldClass} type="time" value={defaultTime} onChange={(event) => setDefaultTime(event.target.value)} />
                </div>
                <div>
                  <Label className={labelClass}>Último atendimento incluso</Label>
                  <Input className={fieldClass} type="date" value={lastIncludedDate} onChange={(event) => setLastIncludedDate(event.target.value)} />
                </div>
                <div>
                  <Label className={labelClass}>Dia padrão da semana</Label>
                  <Select value={standardWeekday} onValueChange={setStandardWeekday}>
                    <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
                    <SelectContent>{weekdayLabels.map((label, index) => <SelectItem key={label} value={String(index)}>{label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>Data de referência/base</Label>
                  <Input className={fieldClass} type="date" value={referenceDate} onChange={(event) => setReferenceDate(event.target.value)} />
                </div>
                <div>
                  <Label className={labelClass}>Início do ciclo de utilização</Label>
                  <Input className={fieldClass} type="date" value={cycleStartDate} onChange={(event) => setCycleStartDate(event.target.value)} />
                </div>
                <div>
                  <Label className={labelClass}>Fim do ciclo atual</Label>
                  <Input className={fieldClass} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                </div>
                <div>
                  <Label className={labelClass}>Serviço final padrão</Label>
                  <Input className={fieldClass} value={finalServiceName} onChange={(event) => setFinalServiceName(event.target.value)} placeholder="Ex.: Combo Higiene" />
                </div>
                <div className="md:col-span-3">
                  <div className="rounded-lg border border-[#F1D7A1] bg-[#FFF7E8] p-4 text-sm font-semibold text-[#6B4D12]">
                    {baseDateMatchesWeekday
                      ? `A data base confere com o dia padrão da semana (${weekdayLabels[Number(standardWeekday)]}). O sistema sugere agendamentos automáticos baseados nessa preferência.`
                      : `A data base será ajustada para o dia padrão da semana (${weekdayLabels[Number(standardWeekday)]}). O sistema encontra a próxima data compatível.`}
                  </div>
                </div>
                <div className="md:col-span-3">
                  <Label className={labelClass}>Observação</Label>
                  <Textarea className="mt-1 min-h-20 border-[#E7DEC8] bg-[#FFFEFB]" value={notes} onChange={(event) => setNotes(event.target.value)} />
                </div>
              </div>
            </section>

            {!simulation ? (
              <section className="flex min-h-[330px] flex-col items-center justify-center rounded-xl border border-dashed border-[#D8B768] bg-white p-8 text-center shadow-sm">
                <CalendarRange className="mb-4 h-12 w-12 text-[#C9A24E]" />
                <h2 className="text-xl font-black text-[#07111E]">A prévia aparecerá aqui</h2>
                <p className="mt-2 max-w-md text-sm font-semibold text-[#44516A]">Nenhum atendimento será criado até você revisar e confirmar.</p>
                <Button className="mt-6 bg-[#113A7A] font-black text-white hover:bg-[#07111E]" disabled={simulateMutation.isPending} onClick={simulate}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {simulateMutation.isPending ? "Simulando..." : "Gerar pré-agenda"}
                </Button>
              </section>
            ) : (
              <section className="overflow-hidden rounded-xl border border-[#E7DEC8] bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7DEC8] px-7 py-5">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-[#07111E]">Agenda Sugerida (Ciclo Atual)</h2>
                    <p className="mt-1 text-xs font-bold text-[#44516A]">
                      Edite data/hora, marque tosa/trimming e ajuste o serviço final antes de incluir na agenda oficial.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-black uppercase">
                    <span className="rounded-full bg-[#F8F6F1] px-3 py-1 text-[#07111E]">{summary.total} datas</span>
                    <span className="rounded-full bg-[#EAF7EF] px-3 py-1 text-emerald-700">{summary.valid} válidas</span>
                    <span className="rounded-full bg-[#FFF7E8] px-3 py-1 text-[#8A640D]">{summary.grooming} tosa/trim</span>
                  </div>
                </div>
                <div className="hidden grid-cols-[70px_1.2fr_1fr_0.8fr_1.1fr_1.2fr_1.2fr_auto] gap-3 border-b border-[#E7DEC8] bg-[#F2EFE7] px-7 py-3 text-[11px] font-black uppercase tracking-wide text-[#44516A] md:grid">
                  <span>Sessão</span><span>Data sugerida</span><span>Dia</span><span>Horário</span><span>Serviço padrão</span><span>Tosa/trimming?</span><span>Serviço final</span><span>Ação</span>
                </div>
                <div className="divide-y">
                  {(simulation.items ?? []).sort((a: any, b: any) => a.scheduled_at.localeCompare(b.scheduled_at)).map((item: any, index: number) => (
                    <div key={item.id} className="grid gap-3 px-7 py-4 md:grid-cols-[70px_1.2fr_1fr_0.8fr_1.1fr_1.2fr_1.2fr_auto] md:items-center">
                      <span className="text-sm font-black text-[#07111E]">{String(index + 1).padStart(2, "0")}</span>
                      <Input aria-label={`Alterar data ${index + 1}`} type="datetime-local" className="h-9 border-[#E7DEC8] text-xs font-bold" value={toLocalDateTimeInput(item.scheduled_at)} onChange={(event) => updateItemMutation.mutate({ id: item.id, scheduledAt: new Date(event.target.value).toISOString() })} />
                      <span className="text-sm font-bold capitalize text-[#44516A]">{format(new Date(item.scheduled_at), "EEEE", { locale: ptBR })}</span>
                      <span className="text-sm font-black text-[#07111E]">{format(new Date(item.scheduled_at), "HH:mm")}</span>
                      <span className="rounded-full bg-[#EEF1F4] px-3 py-1 text-center text-[11px] font-black uppercase text-[#44516A]">{selectedService?.name || finalServiceName}</span>
                      <label className="flex items-center gap-2 text-sm font-bold">
                        <Checkbox
                          checked={!!item.include_grooming}
                          onCheckedChange={(checked) => updateItemMutation.mutate({ id: item.id, includeGrooming: !!checked })}
                        />
                        {item.include_grooming ? "Sim" : "Não"}
                      </label>
                      <Input className="h-9 border-[#E7DEC8] text-xs font-bold" value={item.final_service_name || finalServiceName} onChange={(event) => updateItemMutation.mutate({ id: item.id, finalServiceName: event.target.value })} />
                      <div className="flex items-center justify-end gap-2">
                        {(item.alerts ?? []).length ? <AlertTriangle className="h-4 w-4 text-amber-700" /> : <CheckCircle2 className="h-4 w-4 text-emerald-700" />}
                        <Button variant="outline" size="sm" disabled={item.status === "created"} onClick={() => updateItemMutation.mutate({ id: item.id, ignored: item.status !== "ignored" })}>{item.status === "ignored" ? "Reativar" : "Ignorar"}</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap justify-end gap-3 border-t p-5">
                  <Button variant="outline" onClick={() => { setSimulation(null); setMessage(""); }}>Limpar</Button>
                  <Button className="bg-[#07111E] font-black text-white hover:bg-[#113A7A]" disabled={confirmMutation.isPending || simulation.status === "confirmed"} onClick={() => confirmMutation.mutate({ id: simulation.id, includeWarnings: true })}>{simulation.status === "confirmed" ? "Incluído na Agenda" : "Incluir na Agenda Oficial"}</Button>
                </div>
              </section>
            )}
          </main>

          <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
            <section className="rounded-xl bg-[#07111E] p-6 text-white shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#D8B768]">
                <AlertTriangle className="h-4 w-4" />
                Regras de lógica
              </h2>
              <div className="mt-5 space-y-4 border-t border-white/10 pt-5 text-xs font-semibold leading-relaxed text-white/80">
                <p><span className="font-black text-[#D8B768]">Regra:</span> usar data de referência. O cronograma começa exatamente na data informada e soma a frequência contratada.</p>
                <p><span className="font-black text-[#D8B768]">Regra:</span> usar dia padrão da semana. O cronograma encontra a próxima data daquele dia, a partir da referência base.</p>
                <p><span className="font-black text-[#D8B768]">Tosa/Trimming:</span> quando existir no pacote, o serviço entra no ciclo conforme intervalo configurado de 7 ou 8 semanas.</p>
              </div>
            </section>

            <section className="rounded-xl border border-[#E7DEC8] bg-[#E6E1D8] p-5 shadow-sm">
              <h2 className="text-lg font-black text-[#07111E]">Resumo para Envio</h2>
              <p className="mt-1 text-xs font-bold text-[#44516A]">
                Texto editável antes de copiar, enviar pelo WhatsApp ou registrar no histórico.
              </p>
              <Textarea
                className="mt-4 min-h-[420px] resize-y border-0 bg-white text-xs font-semibold leading-relaxed text-[#44516A] shadow-sm focus-visible:ring-[#C9A24E]"
                placeholder="Gere a pré-agenda para visualizar e editar o texto de confirmação do ciclo."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <div className="mt-4 space-y-3">
                <Button className="w-full bg-emerald-600 font-black text-white hover:bg-emerald-700" disabled={!message} onClick={copyMessage}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar mensagem
                </Button>
                {whatsappUrl && (
                  <Button asChild className="w-full bg-emerald-700 font-black text-white hover:bg-emerald-800">
                    <a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />Enviar via WhatsApp</a>
                  </Button>
                )}
                <Button className="w-full bg-[#07111E] font-black text-white hover:bg-[#113A7A]" disabled={!simulation || confirmMutation.isPending || simulation?.status === "confirmed"} onClick={() => simulation && confirmMutation.mutate({ id: simulation.id, includeWarnings: true })}>
                  {simulation?.status === "confirmed" ? "Agenda já incluída" : "Incluir na agenda oficial"}
                </Button>
                {simulation && (
                  <Button variant="outline" className="w-full bg-white font-black" onClick={() => saveMessageMutation.mutate({ id: simulation.id, content: message })}>
                    Registrar no histórico
                  </Button>
                )}
                {!simulation && (
                  <Button className="w-full bg-[#113A7A] font-black text-white hover:bg-[#07111E]" disabled={simulateMutation.isPending} onClick={simulate}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {simulateMutation.isPending ? "Simulando..." : "Gerar pré-agenda"}
                  </Button>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl bg-[#07111E] shadow-sm">
              <div className="h-32 bg-gradient-to-br from-[#113A7A] via-[#07111E] to-[#C9A24E]" />
              <div className="p-4">
                <p className="text-[11px] font-black uppercase tracking-wide text-[#D8B768]">Dica da especialista</p>
                <p className="mt-1 text-sm font-semibold text-white">Sessões quinzenais ajudam a manter o ciclo e facilitam a previsão da agenda.</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
