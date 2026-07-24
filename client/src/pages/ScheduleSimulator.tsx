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
  const selectedProfessional = (professionalsQuery.data ?? []).find((item: any) => item.id === professionalId);
  const selectedService = (servicesQuery.data ?? []).find((item: any) => item.id === serviceId);

  useEffect(() => {
    if (selectedPet?.breed && !petType) setPetType(selectedPet.breed);
  }, [selectedPet?.breed, petType]);

  useEffect(() => {
    if (selectedPackage?.expiry_date) setEndDate(selectedPackage.expiry_date);
    if (selectedPackage?.expiry_date) setNextRenewalDate(selectedPackage.expiry_date);
  }, [selectedPackage?.expiry_date]);

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
    <div className="bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-[1520px] space-y-5">
        <header className="rounded-lg border border-[#E6DAAA] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8A62D8]">Agenda sugerida por pet/pacote</p>
          <h1 className="mt-1 text-3xl font-extrabold text-[#07111E]">Simulador de Agenda</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Gere a previsão do ciclo, ajuste tosa/trimming por data e confirme somente depois de revisar.
          </p>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(520px,0.95fr)_minmax(0,1.45fr)]">
          <section className="rounded-lg border bg-white shadow-sm">
            <div className="border-b bg-[#F8F6F1] px-5 py-3">
              <h2 className="text-base font-extrabold text-[#07111E]">Campos da planilha</h2>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2">
              <div>
                <Label>Profissional / executante *</Label>
                <Select value={professionalId} onValueChange={setProfessionalId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{(professionalsQuery.data ?? []).filter((item: any) => item.is_active).map((item: any) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome do tutor *</Label>
                <Select value={clientId} onValueChange={(value) => { setClientId(value); setPetId(""); setClientPackageId(""); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clients.map((client: any) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome do pet *</Label>
                <Select value={petId} onValueChange={(value) => { setPetId(value); setClientPackageId(""); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{pets.map((pet: any) => <SelectItem key={pet.id} value={pet.id}>{pet.name}{selectedClient?.name ? ` (Tutor: ${selectedClient.name.split(/\s+/)[0]})` : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo pet / raça</Label>
                <Input className="mt-1" value={petType} onChange={(event) => setPetType(event.target.value)} placeholder="Ex.: Spitz, Golden, demais raças" />
              </div>
              <div>
                <Label>Plano</Label>
                {appointmentType === "package" ? (
                  <Select value={clientPackageId || "auto"} onValueChange={(value) => setClientPackageId(value === "auto" ? "" : value)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Selecionar automaticamente</SelectItem>
                      {packages.map((item: any) => <SelectItem key={item.id} value={item.id}>{item.plan?.name || item.plan_code || item.code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input className="mt-1" value="Avulso" readOnly />
                )}
              </div>
              <div>
                <Label>Tipo de atendimento</Label>
                <Select value={appointmentType} onValueChange={(value: any) => { setAppointmentType(value); setClientPackageId(""); }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="package">Pacote</SelectItem><SelectItem value="standalone">Avulso</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Serviço padrão *</Label>
                <Select value={serviceId} onValueChange={(value) => { setServiceId(value); const found = (servicesQuery.data ?? []).find((service: any) => service.id === value); if (found?.name) setFinalServiceName(found.name); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{(servicesQuery.data ?? []).map((service: any) => <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de serviço</Label>
                <Select value={serviceMode} onValueChange={(value) => { setServiceMode(value); if (!selectedService?.name) setFinalServiceName(serviceModeLabels[value]); }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(serviceModeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Frequência</Label>
                <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(frequencyLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantidade de atendimentos</Label>
                <Input className="mt-1" type="number" min={1} max={60} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
              </div>
              <div>
                <Label>Quantidade de tosas/trimming</Label>
                <Input className="mt-1" type="number" min={0} max={quantity} value={groomingQuantity} onChange={(event) => setGroomingQuantity(Number(event.target.value))} />
              </div>
              <div>
                <Label>Data ativação/pagamento</Label>
                <Input className="mt-1" type="date" value={paymentActivationDate} onChange={(event) => setPaymentActivationDate(event.target.value)} />
              </div>
              <div>
                <Label>Último atendimento incluso</Label>
                <Input className="mt-1" type="date" value={lastIncludedDate} onChange={(event) => setLastIncludedDate(event.target.value)} />
              </div>
              <div>
                <Label>Próxima renovação/cobrança</Label>
                <Input className="mt-1" type="date" value={nextRenewalDate} onChange={(event) => setNextRenewalDate(event.target.value)} />
              </div>
              <div>
                <Label>Dia padrão da semana</Label>
                <Select value={standardWeekday} onValueChange={setStandardWeekday}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{weekdayLabels.map((label, index) => <SelectItem key={label} value={String(index)}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Regra de recorrência</Label>
                <Select value={recurrenceRuleMode} onValueChange={(value: any) => setRecurrenceRuleMode(value)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="standard_weekday">Usar dia padrão da semana</SelectItem><SelectItem value="exact_interval">Usar intervalo exato</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de referência/base</Label>
                <Input className="mt-1" type="date" value={referenceDate} onChange={(event) => setReferenceDate(event.target.value)} />
              </div>
              <div>
                <Label>Horário padrão</Label>
                <Input className="mt-1" type="time" value={defaultTime} onChange={(event) => setDefaultTime(event.target.value)} />
              </div>
              <div>
                <Label>Início do ciclo de utilização</Label>
                <Input className="mt-1" type="date" value={cycleStartDate} onChange={(event) => setCycleStartDate(event.target.value)} />
              </div>
              <div>
                <Label>Fim do ciclo atual</Label>
                <Input className="mt-1" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Serviço final padrão</Label>
                <Input className="mt-1" value={finalServiceName} onChange={(event) => setFinalServiceName(event.target.value)} placeholder="Ex.: Combo Higiene" />
              </div>
              <div className="md:col-span-2">
                <Label>Observação</Label>
                <Textarea className="mt-1 min-h-20" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
            </div>
            <div className="border-t p-5">
              <Button className="w-full bg-gradient-to-r from-[#36B8D8] to-[#9B5DE5] font-extrabold text-white shadow-sm hover:opacity-95" disabled={simulateMutation.isPending} onClick={simulate}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {simulateMutation.isPending ? "Simulando..." : "Gerar pré-agenda"}
              </Button>
            </div>
          </section>

          <section className="min-w-0 space-y-5">
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <div className="grid gap-4 md:grid-cols-4">
                <div><p className="text-xs font-bold uppercase text-muted-foreground">Tutor</p><p className="mt-1 font-extrabold text-[#07111E]">{selectedClient?.name?.split(/\s+/)[0] || "-"}</p></div>
                <div><p className="text-xs font-bold uppercase text-muted-foreground">Pet / tipo</p><p className="mt-1 font-extrabold text-[#07111E]">{selectedPet ? `${selectedPet.name} / ${petType || selectedPet.breed || "-"}` : "-"}</p></div>
                <div><p className="text-xs font-bold uppercase text-muted-foreground">Plano</p><p className="mt-1 font-extrabold text-[#07111E]">{selectedPackage?.plan_code || selectedPackage?.code || "Avulso"}</p></div>
                <div><p className="text-xs font-bold uppercase text-muted-foreground">Alerta de conferência</p><p className="mt-1 font-extrabold text-emerald-700">{Number(standardWeekday) === new Date(`${referenceDate}T00:00:00-03:00`).getDay() ? "Data base confere" : "Ajustará para o dia padrão"}</p></div>
              </div>
            </div>

            {!simulation ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed bg-white p-8 text-center">
                <CalendarRange className="mb-4 h-12 w-12 text-[#8A62D8]" />
                <h2 className="text-xl font-extrabold text-[#07111E]">A prévia aparecerá aqui</h2>
                <p className="mt-2 max-w-md text-sm font-medium text-muted-foreground">Nenhum atendimento será criado até você revisar e confirmar.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-3">
                  {[["Datas", summary.total], ["Válidas", summary.valid], ["Conflitos", summary.conflicts], ["Tosa/trim", summary.grooming]].map(([label, value]) => (
                    <div key={String(label)} className="rounded-lg border bg-white p-4 shadow-sm">
                      <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
                      <p className="mt-1 text-2xl font-extrabold text-[#07111E]">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                  <div className="border-b bg-[#86C442] px-4 py-3 text-sm font-extrabold text-white">
                    Resumo para enviar e incluir na agenda
                  </div>
                  <div className="hidden grid-cols-[48px_1fr_1fr_1fr_1.1fr_1.2fr_1fr_auto] gap-3 border-b bg-[#F8F6F1] px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#44516A] md:grid">
                    <span>Nº</span><span>Data sugerida</span><span>Dia da semana</span><span>Horário</span><span>Serviço padrão</span><span>Agendar tosa/trimming?</span><span>Serviço final</span><span>Ação</span>
                  </div>
                  <div className="divide-y">
                    {(simulation.items ?? []).sort((a: any, b: any) => a.scheduled_at.localeCompare(b.scheduled_at)).map((item: any, index: number) => (
                      <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[48px_1fr_1fr_1fr_1.1fr_1.2fr_1fr_auto] md:items-center">
                        <span className="font-extrabold text-[#07111E]">{index + 1}</span>
                        <Input aria-label={`Alterar data ${index + 1}`} type="datetime-local" className="h-9 text-xs font-semibold" value={toLocalDateTimeInput(item.scheduled_at)} onChange={(event) => updateItemMutation.mutate({ id: item.id, scheduledAt: new Date(event.target.value).toISOString() })} />
                        <span className="text-sm font-bold capitalize">{format(new Date(item.scheduled_at), "EEEE", { locale: ptBR })}</span>
                        <span className="text-sm font-bold">{format(new Date(item.scheduled_at), "HH:mm")}</span>
                        <span className="text-sm font-semibold">{selectedService?.name || finalServiceName}</span>
                        <label className="flex items-center gap-2 text-sm font-bold">
                          <Checkbox
                            checked={!!item.include_grooming}
                            onCheckedChange={(checked) => updateItemMutation.mutate({ id: item.id, includeGrooming: !!checked })}
                          />
                          {item.include_grooming ? "Sim" : "Não"}
                        </label>
                        <Input className="h-9 text-xs font-semibold" value={item.final_service_name || finalServiceName} onChange={(event) => updateItemMutation.mutate({ id: item.id, finalServiceName: event.target.value })} />
                        <div className="flex items-center justify-end gap-2">
                          {(item.alerts ?? []).length ? <AlertTriangle className="h-4 w-4 text-amber-700" /> : <CheckCircle2 className="h-4 w-4 text-emerald-700" />}
                          <Button variant="outline" size="sm" disabled={item.status === "created"} onClick={() => updateItemMutation.mutate({ id: item.id, ignored: item.status !== "ignored" })}>{item.status === "ignored" ? "Reativar" : "Ignorar"}</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap justify-end gap-3 border-t p-5">
                    <Button variant="outline" onClick={() => { setSimulation(null); setMessage(""); }}>Limpar</Button>
                    <Button className="bg-[#D8B768] font-extrabold text-[#07111E] hover:bg-[#C9A24E]" disabled={confirmMutation.isPending || simulation.status === "confirmed"} onClick={() => confirmMutation.mutate({ id: simulation.id, includeWarnings: true })}>{simulation.status === "confirmed" ? "Incluído na Agenda" : "Confirmar e incluir na Agenda"}</Button>
                  </div>
                </div>

                <div className="rounded-lg border bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-emerald-600" /><h2 className="font-extrabold text-[#07111E]">Mensagem editável para WhatsApp</h2></div>
                    {whatsappUrl && <a className="text-sm font-extrabold text-[#8A62D8] underline" href={whatsappUrl} target="_blank" rel="noreferrer">Gerar link para WhatsApp</a>}
                  </div>
                  <Textarea rows={12} value={message} onChange={(event) => setMessage(event.target.value)} />
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button variant="outline" onClick={copyMessage}><Copy className="mr-2 h-4 w-4" />Copiar</Button>
                    <Button variant="outline" onClick={() => saveMessageMutation.mutate({ id: simulation.id, content: message })}>Registrar no histórico</Button>
                    {whatsappUrl && <Button asChild className="bg-emerald-700 text-white hover:bg-emerald-800"><a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />Abrir WhatsApp</a></Button>}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
