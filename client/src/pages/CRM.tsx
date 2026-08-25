import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Bot,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  MessageCircle,
  PawPrint,
  Plus,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

type Audience = "salon" | "school";
type Stage = "new" | "conversation" | "proposal" | "closed";

type Lead = {
  id: string;
  name: string;
  detail: string;
  audience: Audience;
  stage: Stage;
  nextAction: string;
};

const STORAGE_KEY = "dwo-crm-pilot-v1";

const initialLeads: Lead[] = [
  { id: "lead-1", name: "Contato de banho e tosa", detail: "Pet ainda não informado", audience: "salon", stage: "new", nextAction: "Descobrir raça, porte e serviço" },
  { id: "lead-2", name: "Renovação de pacote", detail: "Cliente recorrente", audience: "salon", stage: "proposal", nextAction: "Confirmar pacote e datas" },
  { id: "lead-3", name: "Interesse no curso", detail: "Turma presencial", audience: "school", stage: "conversation", nextAction: "Entender objetivo e disponibilidade" },
];

const stages: Array<{ id: Stage; label: string }> = [
  { id: "new", label: "Novos" },
  { id: "conversation", label: "Em conversa" },
  { id: "proposal", label: "Proposta" },
  { id: "closed", label: "Fechados" },
];

function loadLeads(): Lead[] {
  if (typeof window === "undefined") return initialLeads;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialLeads;
  } catch {
    return initialLeads;
  }
}

export default function CRM() {
  const [, setLocation] = useLocation();
  const [audience, setAudience] = useState<Audience>("salon");
  const [leads, setLeads] = useState<Lead[]>(loadLeads);
  const [newLead, setNewLead] = useState("");
  const [whatsAppStatus, setWhatsAppStatus] = useState<{ configured: boolean; testMode: boolean } | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Olá! Esta é uma mensagem de teste supervisionado do Dog Washer One.");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetch("/api/whatsapp/status")
      .then((response) => response.json())
      .then(setWhatsAppStatus)
      .catch(() => setWhatsAppStatus({ configured: false, testMode: true }));
  }, []);

  const sendWhatsAppTest = async () => {
    setSendingTest(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) throw new Error("Sessão expirada. Entre novamente no DWO.");
      const response = await fetch("/api/whatsapp/send-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ to: testPhone, body: testMessage }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Falha no envio");
      toast.success("Mensagem aceita pela Meta", { description: result.messageId ?? undefined });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no envio de teste");
    } finally {
      setSendingTest(false);
    }
  };

  const filteredLeads = useMemo(
    () => leads.filter((lead) => lead.audience === audience),
    [audience, leads],
  );

  const persist = (next: Lead[]) => {
    setLeads(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addLead = () => {
    const name = newLead.trim();
    if (!name) return;
    persist([
      ...leads,
      {
        id: crypto.randomUUID(),
        name,
        detail: audience === "salon" ? "Novo contato do salão" : "Novo contato da escola",
        audience,
        stage: "new",
        nextAction: "Iniciar atendimento",
      },
    ]);
    setNewLead("");
    toast.success("Oportunidade adicionada ao CRM");
  };

  const moveLead = (id: string, direction: -1 | 1) => {
    const current = leads.find((lead) => lead.id === id);
    if (!current) return;
    const currentIndex = stages.findIndex((stage) => stage.id === current.stage);
    const nextStage = stages[currentIndex + direction];
    if (!nextStage) return;
    persist(leads.map((lead) => lead.id === id ? { ...lead, stage: nextStage.id } : lead));
    toast.success(`Movido para ${nextStage.label}`);
  };

  const moveLeadToStage = (id: string, stage: Stage) => {
    const current = leads.find((lead) => lead.id === id);
    if (!current || current.stage === stage) return;
    persist(leads.map((lead) => lead.id === id ? { ...lead, stage } : lead));
    toast.success(`Movido para ${stages.find((item) => item.id === stage)?.label}`);
  };

  const startBooking = (lead: Lead) => {
    if (lead.audience === "salon" && lead.stage === "closed") {
      setLocation("/schedule-simulator");
      return;
    }
    setLocation("/appointments");
  };

  return (
    <div className="min-h-full bg-[#F6F3EC] p-4 text-[#07111E] md:p-7">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="overflow-hidden rounded-2xl bg-[#07111E] text-white shadow-lg">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#D8B768]">
                <Sparkles className="h-4 w-4" /> Relacionamento inteligente
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">CRM Salão–Escola</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold text-white/70">
                Conduza cada conversa até o fechamento e transforme a venda em agendamento sem duplicar clientes, pets ou pacotes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="bg-[#D8B768] font-black text-[#07111E] hover:bg-[#E7CD8A]" onClick={() => setLocation("/appointments")}>
                <CalendarPlus className="mr-2 h-4 w-4" /> Novo agendamento
              </Button>
              <Button variant="outline" className="border-white/20 bg-white/5 font-black text-white hover:bg-white/10 hover:text-white" onClick={() => setLocation("/schedule-simulator")}>
                Simular pacote
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-blue-50 p-3 text-blue-700"><MessageCircle /></div><div><p className="text-xs font-bold uppercase text-muted-foreground">Oportunidades abertas</p><p className="text-2xl font-black">{leads.filter((lead) => lead.stage !== "closed").length}</p></div></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><UserRoundCheck /></div><div><p className="text-xs font-bold uppercase text-muted-foreground">Fechamentos</p><p className="text-2xl font-black">{leads.filter((lead) => lead.stage === "closed").length}</p></div></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-amber-50 p-3 text-amber-700"><ShieldCheck /></div><div><p className="text-xs font-bold uppercase text-muted-foreground">Modo dos agentes</p><p className="text-lg font-black">Supervisionado</p></div></CardContent></Card>
        </div>

        <Tabs defaultValue="pipeline" className="space-y-5">
          <TabsList className="h-auto bg-white p-1 shadow-sm">
            <TabsTrigger value="pipeline" className="px-5 py-2.5 font-bold">Pipeline</TabsTrigger>
            <TabsTrigger value="agents" className="px-5 py-2.5 font-bold">Agentes</TabsTrigger>
            <TabsTrigger value="booking" className="px-5 py-2.5 font-bold">Teste de agendamento</TabsTrigger>
            <TabsTrigger value="whatsapp" className="px-5 py-2.5 font-bold">WhatsApp oficial</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-4">
            <div className="flex flex-col justify-between gap-3 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center">
              <div className="flex gap-2">
                <Button variant={audience === "salon" ? "default" : "outline"} onClick={() => setAudience("salon")}><PawPrint className="mr-2 h-4 w-4" /> Salão</Button>
                <Button variant={audience === "school" ? "default" : "outline"} onClick={() => setAudience("school")}><GraduationCap className="mr-2 h-4 w-4" /> Escola</Button>
              </div>
              <div className="flex w-full gap-2 md:max-w-md">
                <Input value={newLead} onChange={(event) => setNewLead(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addLead()} placeholder="Nome do novo contato" />
                <Button onClick={addLead}><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
              </div>
            </div>

            <div className="grid gap-4 overflow-x-auto pb-3 lg:grid-cols-4">
              {stages.map((stage) => (
                <section
                  key={stage.id}
                  className="min-h-[420px] min-w-[260px] rounded-xl bg-[#ECE8DF] p-3"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    moveLeadToStage(event.dataTransfer.getData("text/dwo-lead-id"), stage.id);
                  }}
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h2 className="text-xs font-black uppercase tracking-wide text-[#44516A]">{stage.label}</h2>
                    <Badge variant="secondary">{filteredLeads.filter((lead) => lead.stage === stage.id).length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {filteredLeads.filter((lead) => lead.stage === stage.id).map((lead) => (
                      <Card
                        key={lead.id}
                        className="cursor-grab border-0 shadow-sm active:cursor-grabbing"
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData("text/dwo-lead-id", lead.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2"><p className="font-black">{lead.name}</p><Badge className={lead.audience === "salon" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>{lead.audience === "salon" ? "Salão" : "Escola"}</Badge></div>
                          <p className="mt-1 text-xs font-semibold text-muted-foreground">{lead.detail}</p>
                          <div className="mt-3 rounded-lg bg-[#F8F6F1] p-2.5 text-xs font-semibold"><span className="font-black">Próxima ação:</span> {lead.nextAction}</div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <Button size="sm" variant="ghost" disabled={stage.id === "new"} onClick={() => moveLead(lead.id, -1)}>Voltar</Button>
                            {stage.id === "closed" ? (
                              <Button size="sm" onClick={() => startBooking(lead)}><CalendarPlus className="mr-1 h-4 w-4" /> Agendar</Button>
                            ) : (
                              <Button size="sm" onClick={() => moveLead(lead.id, 1)}>Avançar <ChevronRight className="ml-1 h-4 w-4" /></Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="agents">
            <div className="grid gap-5 lg:grid-cols-2">
              {[
                { name: "Agente Salão", icon: PawPrint, description: "Qualifica o atendimento, identifica pet e serviço, oferece pacotes e prepara o agendamento.", actions: ["Responder com aprovação", "Sugerir horários", "Reativar clientes"] },
                { name: "Agente Escola", icon: GraduationCap, description: "Atende interessados, identifica objetivo profissional, recomenda turmas e conduz até a matrícula.", actions: ["Responder com aprovação", "Qualificar o lead", "Retomar propostas"] },
              ].map((agent) => (
                <Card key={agent.name} className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center gap-4"><div className="rounded-xl bg-[#07111E] p-3 text-[#D8B768]"><agent.icon /></div><div><CardTitle>{agent.name}</CardTitle><Badge className="mt-2 bg-amber-100 text-amber-800">Treinamento supervisionado</Badge></div></CardHeader>
                  <CardContent><p className="text-sm font-semibold text-muted-foreground">{agent.description}</p><div className="mt-5 space-y-2">{agent.actions.map((action) => <div key={action} className="flex items-center gap-2 rounded-lg bg-[#F8F6F1] p-3 text-sm font-bold"><CheckCircle2 className="h-4 w-4 text-emerald-700" /> {action}</div>)}</div><Button className="mt-5 w-full" variant="outline" onClick={() => toast.info("O treinamento do agente será conectado após validarmos o fluxo do CRM.")}><Bot className="mr-2 h-4 w-4" /> Ver regras do agente</Button></CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="booking">
            <Card className="border-0 shadow-sm">
              <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
                <div>
                  <Badge className="bg-emerald-100 text-emerald-800">Fluxo real do DWO</Badge>
                  <h2 className="mt-3 text-2xl font-black">Teste o fechamento até a agenda</h2>
                  <p className="mt-2 max-w-2xl text-sm font-semibold text-muted-foreground">Use um cliente de teste. Para serviço avulso, abra o agendamento. Para pacote fechado, gere primeiro a pré-agenda, revise todas as datas e somente então inclua na agenda oficial.</p>
                  <ol className="mt-6 space-y-3 text-sm font-bold">
                    <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#07111E] text-white">1</span> Confirme cliente e pet cadastrados.</li>
                    <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#07111E] text-white">2</span> Escolha avulso ou pacote recorrente.</li>
                    <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#07111E] text-white">3</span> Revise profissional, serviço, datas e horários.</li>
                    <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#07111E] text-white">4</span> Confirme e confira o resultado na agenda.</li>
                  </ol>
                </div>
                <div className="rounded-xl bg-[#07111E] p-5 text-white">
                  <h3 className="font-black text-[#D8B768]">Escolha o teste</h3>
                  <Button className="mt-4 w-full bg-white font-black text-[#07111E] hover:bg-white/90" onClick={() => setLocation("/appointments")}><CalendarPlus className="mr-2 h-4 w-4" /> Atendimento avulso</Button>
                  <Button className="mt-3 w-full bg-[#D8B768] font-black text-[#07111E] hover:bg-[#E7CD8A]" onClick={() => setLocation("/schedule-simulator")}><Sparkles className="mr-2 h-4 w-4" /> Pacote recorrente</Button>
                  <p className="mt-4 text-xs font-semibold leading-relaxed text-white/60">Nenhum envio de WhatsApp é automático nesta fase. A criação na agenda continua exigindo confirmação explícita.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp">
            <Card className="border-0 shadow-sm">
              <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_380px]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={whatsAppStatus?.configured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                      <Wifi className="mr-1 h-3.5 w-3.5" /> {whatsAppStatus?.configured ? "Meta conectada" : "Aguardando credenciais da Meta"}
                    </Badge>
                    <Badge variant="outline">Modo supervisionado</Badge>
                  </div>
                  <h2 className="mt-4 text-2xl font-black">Conexão oficial WhatsApp Cloud API</h2>
                  <p className="mt-2 max-w-2xl text-sm font-semibold text-muted-foreground">O token fica somente no servidor. O CRM recebe o webhook oficial e o primeiro envio é limitado a um teste manual, sem campanhas automáticas.</p>
                  <ol className="mt-6 space-y-3 text-sm font-bold">
                    <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#07111E] text-white">1</span> Criar ou selecionar o portfólio empresarial e a conta WhatsApp Business na Meta.</li>
                    <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#07111E] text-white">2</span> Cadastrar primeiro um número de teste e autorizar os destinatários internos.</li>
                    <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#07111E] text-white">3</span> Configurar o webhook <code className="rounded bg-slate-100 px-1">/api/whatsapp/webhook</code> e assinar o evento de mensagens.</li>
                    <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#07111E] text-white">4</span> Enviar para Meriely ou Flávio, confirmar recebimento e só então testar entrada e resposta.</li>
                  </ol>
                </div>
                <div className="rounded-xl bg-[#07111E] p-5 text-white">
                  <h3 className="font-black text-[#D8B768]">Envio interno de teste</h3>
                  <label className="mt-4 block text-xs font-bold text-white/70">Número com DDI e DDD</label>
                  <Input className="mt-1 border-white/20 bg-white text-[#07111E]" value={testPhone} onChange={(event) => setTestPhone(event.target.value)} placeholder="5561999999999" />
                  <label className="mt-4 block text-xs font-bold text-white/70">Mensagem</label>
                  <textarea className="mt-1 min-h-28 w-full rounded-md border border-white/20 bg-white p-3 text-sm font-semibold text-[#07111E]" value={testMessage} onChange={(event) => setTestMessage(event.target.value)} />
                  <Button className="mt-4 w-full bg-[#D8B768] font-black text-[#07111E] hover:bg-[#E7CD8A]" disabled={!whatsAppStatus?.configured || sendingTest} onClick={sendWhatsAppTest}>
                    <MessageCircle className="mr-2 h-4 w-4" /> {sendingTest ? "Enviando..." : "Enviar teste autorizado"}
                  </Button>
                  <p className="mt-3 text-xs font-semibold leading-relaxed text-white/60">O botão permanece bloqueado até as credenciais serem configuradas no ambiente seguro da publicação.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
