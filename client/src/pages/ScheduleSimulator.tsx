import { useMemo, useState } from "react";
import { AlertTriangle, CalendarRange, CheckCircle2, Copy, MessageCircle, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const frequencyLabels: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  every_21_days: "A cada 21 dias",
  monthly: "Mensal",
  once: "Atendimento único",
};

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
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "every_21_days" | "monthly" | "once">("weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [defaultTime, setDefaultTime] = useState("09:00");
  const [quantity, setQuantity] = useState(4);
  const [notes, setNotes] = useState("");
  const [simulation, setSimulation] = useState<any>(null);
  const [message, setMessage] = useState("");

  const clients = clientsQuery.data ?? [];
  const selectedClient = clients.find((client: any) => client.id === clientId);
  const pets = selectedClient?.pets ?? [];
  const packagesQuery = trpc.clientPackages.byClient.useQuery(
    { clientId },
    { enabled: !!clientId },
  );
  const packages = (packagesQuery.data ?? []).filter((item: any) => !petId || item.pet_id === petId);
  const selectedPackage = packages.find((item: any) => item.id === clientPackageId) || packages[0];
  const selectedPet = pets.find((pet: any) => pet.id === petId);
  const selectedProfessional = (professionalsQuery.data ?? []).find((item: any) => item.id === professionalId);
  const selectedService = (servicesQuery.data ?? []).find((item: any) => item.id === serviceId);

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
    };
  }, [simulation]);

  const simulate = () => {
    if (!clientId || !petId || !serviceId || !professionalId || !startDate || !defaultTime) {
      toast.error("Preencha cliente, pet, serviço, profissional, data e horário");
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
      startDate,
      endDate: endDate || undefined,
      defaultTime,
      quantity,
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
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A24E]">Planejamento operacional</p>
            <h1 className="mt-2 text-3xl font-bold text-[#07111E]">Simulador de Agenda</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Gere uma prévia, revise conflitos e só depois inclua as datas na Agenda oficial. A simulação não consome saldo.</p>
          </div>
          <div className="rounded-xl border border-[#D8B768] bg-[#D8B768]/15 px-4 py-3 text-sm font-semibold text-[#07111E]">
            Prévia ≠ Agenda oficial
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(380px,0.9fr)_minmax(0,1.6fr)]">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2"><CalendarRange className="h-5 w-5 text-[#C9A24E]" /><h2 className="font-bold text-[#07111E]">Parâmetros da pré-agenda</h2></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div><Label>Cliente *</Label><Select value={clientId} onValueChange={(value) => { setClientId(value); setPetId(""); setClientPackageId(""); }}><SelectTrigger className="mt-2"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger><SelectContent>{clients.map((client: any) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Pet *</Label><Select value={petId} onValueChange={(value) => { setPetId(value); setClientPackageId(""); }}><SelectTrigger className="mt-2"><SelectValue placeholder="Selecione o pet" /></SelectTrigger><SelectContent>{pets.map((pet: any) => <SelectItem key={pet.id} value={pet.id}>{pet.name}{pet.breed ? ` / ${pet.breed}` : ""}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Tipo de atendimento *</Label><Select value={appointmentType} onValueChange={(value: any) => { setAppointmentType(value); setClientPackageId(""); }}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="package">Pacote</SelectItem><SelectItem value="standalone">Avulso</SelectItem></SelectContent></Select></div>
              {appointmentType === "package" && <div><Label>Pacote vigente</Label><Select value={clientPackageId || "auto"} onValueChange={(value) => setClientPackageId(value === "auto" ? "" : value)}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">Selecionar automaticamente</SelectItem>{packages.map((item: any) => <SelectItem key={item.id} value={item.id}>{item.code} · saldo {item.balance_baths} banho(s), {item.balance_groomings} tosa(s)</SelectItem>)}</SelectContent></Select><p className="mt-1 text-xs text-muted-foreground">O DWO prioriza o pacote elegível com vencimento mais próximo.</p></div>}
              <div><Label>Serviço *</Label><Select value={serviceId} onValueChange={setServiceId}><SelectTrigger className="mt-2"><SelectValue placeholder="Selecione o serviço" /></SelectTrigger><SelectContent>{(servicesQuery.data ?? []).map((service: any) => <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Profissional *</Label><Select value={professionalId} onValueChange={setProfessionalId}><SelectTrigger className="mt-2"><SelectValue placeholder="Selecione o profissional" /></SelectTrigger><SelectContent>{(professionalsQuery.data ?? []).filter((item: any) => item.is_active).map((item: any) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Frequência *</Label><Select value={frequency} onValueChange={(value: any) => setFrequency(value)}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(frequencyLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Data inicial *</Label><Input type="date" className="mt-2" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div><div><Label>Vencimento</Label><Input type="date" className="mt-2" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Horário *</Label><Input type="time" className="mt-2" value={defaultTime} onChange={(event) => setDefaultTime(event.target.value)} /></div><div><Label>Quantidade *</Label><Input type="number" min={1} max={60} className="mt-2" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></div></div>
              <div><Label>Observações</Label><Textarea className="mt-2" value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
            </div>
            <Button className="mt-5 w-full bg-[#113A7A] text-white hover:bg-[#07111E]" disabled={simulateMutation.isPending} onClick={simulate}><RefreshCw className="mr-2 h-4 w-4" />{simulateMutation.isPending ? "Simulando..." : "Simular datas"}</Button>
            <div className="mt-5 rounded-xl border border-[#D8B768]/50 bg-[#F8F6F1] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8E6E3E]">Resumo operacional</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div><dt className="text-muted-foreground">Tutor</dt><dd className="font-semibold">{selectedClient?.name?.split(/\s+/)[0] || "—"}</dd></div>
                <div><dt className="text-muted-foreground">Pet</dt><dd className="font-semibold">{selectedPet ? `${selectedPet.name} (${selectedPet.breed || "sem raça"})` : "—"}</dd></div>
                <div><dt className="text-muted-foreground">Plano</dt><dd className="font-semibold">{selectedPackage?.plan_code || selectedPackage?.code || "Avulso"}</dd></div>
                <div><dt className="text-muted-foreground">Profissional</dt><dd className="font-semibold">{selectedProfessional?.name || "—"}</dd></div>
                <div><dt className="text-muted-foreground">Serviço padrão</dt><dd className="font-semibold">{selectedService?.name || "—"}</dd></div>
                <div><dt className="text-muted-foreground">Próxima renovação</dt><dd className="font-semibold">{selectedPackage?.expiry_date ? format(new Date(selectedPackage.expiry_date), "dd/MM/yyyy") : "—"}</dd></div>
              </dl>
              <p className="mt-4 border-t pt-3 text-xs text-muted-foreground"><span className="font-semibold text-[#07111E]">Regra:</span> usa a data de referência e soma a frequência; a prévia preserva o mesmo dia da semana quando aplicável.</p>
            </div>
          </section>

          <section className="min-w-0 space-y-5">
            {!simulation ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-8 text-center">
                <CalendarRange className="mb-4 h-12 w-12 text-[#D8B768]" />
                <h2 className="text-xl font-bold text-[#07111E]">A prévia aparecerá aqui</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">Nenhum atendimento será criado até você revisar e confirmar.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {[["Datas", summary.total], ["Válidas", summary.valid], ["Conflitos", summary.conflicts]].map(([label, value]) => <div key={String(label)} className="rounded-xl border bg-white p-4"><p className="text-xs font-bold uppercase text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold text-[#07111E]">{value}</p></div>)}
                </div>
                <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                  <div className="border-b p-5"><h2 className="font-bold text-[#07111E]">Prévia editável</h2><p className="text-sm text-muted-foreground">Conflitos não serão incluídos. Ajuste a data ou ignore o item.</p></div>
                  <div className="hidden grid-cols-[48px_1fr_1fr_1.1fr_1fr_auto] gap-3 border-b bg-[#F8F6F1] px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
                    <span>#</span><span>Data sugerida</span><span>Dia / horário</span><span>Serviço final</span><span>Validação</span><span>Ação</span>
                  </div>
                  <div className="divide-y">
                    {(simulation.items ?? []).sort((a: any, b: any) => a.scheduled_at.localeCompare(b.scheduled_at)).map((item: any, index: number) => (
                      <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[48px_1fr_1fr_1.1fr_1fr_auto] md:items-center">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D8B768]/20 text-sm font-bold text-[#113A7A]">{index + 1}</span>
                        <div><p className="text-sm font-semibold">{format(new Date(item.scheduled_at), "dd/MM/yyyy")}</p><Input aria-label={`Alterar data ${index + 1}`} type="datetime-local" className="mt-1 h-8 text-xs" value={toLocalDateTimeInput(item.scheduled_at)} onChange={(event) => updateItemMutation.mutate({ id: item.id, scheduledAt: new Date(event.target.value).toISOString() })} /></div>
                        <div className="text-sm"><p className="font-semibold capitalize">{format(new Date(item.scheduled_at), "EEEE", { locale: ptBR })}</p><p className="text-muted-foreground">{format(new Date(item.scheduled_at), "HH:mm")}</p></div>
                        <p className="text-sm font-semibold">{selectedService?.name || "Serviço selecionado"}</p>
                        <div>{(item.alerts ?? []).length ? (item.alerts ?? []).map((alert: string) => <p key={alert} className="flex items-center gap-1 text-xs text-amber-700"><AlertTriangle className="h-3.5 w-3.5" />{alert}</p>) : <p className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Disponível</p>}</div>
                        <Button variant="outline" size="sm" disabled={item.status === "created"} onClick={() => updateItemMutation.mutate({ id: item.id, scheduledAt: item.scheduled_at, ignored: item.status !== "ignored" })}>{item.status === "ignored" ? "Reativar" : "Ignorar"}</Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap justify-end gap-3 border-t p-5">
                    <Button variant="outline" onClick={() => { setSimulation(null); setMessage(""); }}>Limpar</Button>
                    <Button className="bg-[#D8B768] font-bold text-[#07111E] hover:bg-[#C9A24E]" disabled={confirmMutation.isPending || simulation.status === "confirmed"} onClick={() => confirmMutation.mutate({ id: simulation.id, includeWarnings: true })}>{simulation.status === "confirmed" ? "Incluído na Agenda" : "Confirmar e incluir na Agenda"}</Button>
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2"><MessageCircle className="h-5 w-5 text-emerald-600" /><h2 className="font-bold text-[#07111E]">Mensagem editável para o cliente</h2></div>
                  <Textarea rows={9} value={message} onChange={(event) => setMessage(event.target.value)} />
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
