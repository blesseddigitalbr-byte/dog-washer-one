import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import SystemPageHeader from "@/components/SystemPageHeader";
import { CreditCard, Mail, MessageCircle, CalendarDays, Bot, Smartphone } from "lucide-react";

const labels: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado · aguardando repasse", received: "Recebido",
  overdue: "Vencido", deleted: "Removido", refunded: "Estornado",
};
const money = (n: unknown) => Number(n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Integrations() {
  const { user } = useAuth();
  const authorized = !!user && ["owner", "admin"].includes(user.role);
  const query = trpc.asaas.overview.useQuery(undefined, { enabled: authorized, retry: false });
  const workspace = trpc.workspace.context.useQuery(undefined, { enabled: authorized });
  const asaasStatus = query.isLoading ? "Consultando cadastro" : query.error ? "Consulta indisponível" : query.data?.accounts.some(a => a.status === "active") ? "Conta ativa no cadastro" : query.data?.accounts.length ? "Conta aguardando ativação" : "Nenhuma conta cadastrada";
  const integrations = [
    { name: "Asaas", icon: CreditCard, description: "Contas por pessoa jurídica, cobranças e eventos. Cadastro ativo não comprova conexão nem homologação produtiva.", status: asaasStatus, detail: query.data?.accounts.some(a => a.environment === "sandbox") ? "Há conta em ambiente de testes (sandbox)." : "Confira o ambiente nos diagnósticos abaixo.", anchor: true },
    { name: "Email transacional", icon: Mail, description: "Convites de atendimento por email. Configuração própria do app, separada da recuperação de senha.", status: "Ativação não verificada", detail: "SMTP e recebimento precisam de validação no servidor." },
    { name: "WhatsApp", icon: MessageCircle, description: "Confirmações, lembretes e atendimento ao cliente por canal autorizado.", status: "Em preparação", detail: "Sem conexão homologada nesta tela." },
    { name: "SMS", icon: Smartphone, description: "Notificações por mensagem de texto conforme preferências do cliente.", status: "Em preparação", detail: "Provedor, autorização e custos ainda precisam de validação." },
    { name: "Agenda do cliente", icon: CalendarDays, description: "Arquivo de compromisso e envio de convite por email. Aceitação ocorre na agenda do cliente.", status: "Convite implementado · envio a validar", detail: "Não há sincronização automática de alterações e cancelamentos." },
    { name: "Atendimento com IA", icon: Bot, description: "Dúvidas sobre serviços e orientação inicial, com encaminhamento para a recepção.", status: "Em preparação", detail: "Sem atendimento autônomo homologado. Ativação depende de regras e limites aprovados." },
  ];
  if (!authorized) return <main className="p-8"><h1 className="text-2xl font-semibold">Integrações</h1><p>Acesso restrito à administração.</p></main>;
  return <main className="mx-auto w-full max-w-[1480px] space-y-6 p-4 sm:p-6">
    <SystemPageHeader title="Integrações" description="Canais e serviços usados pela operação Lux Dog. Veja o que está cadastrado, em preparação ou ainda precisa de homologação."
      organization={workspace.data?.organization?.name} unit={workspace.data?.currentUnit?.name} profile={user.role === "owner" ? "Proprietária" : "Administrador"}
      action={<Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>Atualizar diagnóstico</Button>} />
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Canais e integrações">
      {integrations.map(item => <Card key={item.name} className="gap-4 rounded-2xl border-t-2 border-t-primary/30 shadow-sm">
        <CardHeader><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><item.icon className="h-5 w-5" aria-hidden="true" /></div><CardTitle className="text-base">{item.name}</CardTitle><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p></CardHeader>
        <CardContent className="mt-auto space-y-3"><Badge variant="secondary" className="h-auto whitespace-normal text-left leading-relaxed">{item.status}</Badge><p className="text-xs leading-relaxed text-muted-foreground">{item.detail}</p>{item.anchor && <Button variant="outline" size="sm" asChild><a href="#asaas-diagnostics">Ver diagnóstico Asaas</a></Button>}</CardContent>
      </Card>)}
    </section>
    <section id="asaas-diagnostics" className="scroll-mt-6 space-y-5" aria-label="Diagnóstico financeiro Asaas">
    <div className="flex items-center justify-between gap-4">
      <div><h1 className="text-2xl font-semibold">Configurações financeiras</h1><p className="text-muted-foreground">Contas por CNPJ e diagnóstico da integração Asaas. Credenciais e alterações de regras permanecem restritas ao servidor; este painel não edita regras de split.</p></div>
      <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>Atualizar</Button>
    </div>
    {query.isLoading && <p>Carregando integração...</p>}
    {query.error && <Card><CardContent className="pt-6" role="alert">{query.error.message}</CardContent></Card>}
    {query.data && <>
      <Card><CardHeader><CardTitle className="font-semibold">Contas por CNPJ</CardTitle></CardHeader><CardContent className="space-y-3">
        {!query.data.accounts.length && <p className="text-muted-foreground">Nenhuma conta vinculada. A ativação exige configuração segura no servidor e no Asaas.</p>}
        {query.data.accounts.map(account => <div key={account.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
          <Badge variant="outline">{account.environment === "sandbox" ? "Ambiente de testes" : "Produção"}</Badge>
          <span className={account.status === "active" ? "text-green-700 font-semibold" : "text-muted-foreground"}>{account.status === "active" ? "Ativa" : "Não ativa"}</span>
          <span className="text-xs text-muted-foreground">Conta {account.id}</span>
        </div>)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="font-semibold">Cobranças sincronizadas</CardTitle><p className="text-sm text-muted-foreground">Confirmado não significa saldo disponível. Lista dos 100 registros mais recentes; não é um extrato completo.</p></CardHeader><CardContent>
        {!query.data.payments.length ? <p>Nenhuma cobrança recebida pelo webhook.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="py-3">Cobrança</th><th>Situação</th><th>Valor</th><th>Líquido informado</th><th>Vencimento</th><th>Fatura</th></tr></thead><tbody>
          {query.data.payments.map(payment => <tr key={payment.id} className="border-b"><td className="py-3">{payment.external_id}</td><td className={payment.status === "received" ? "text-green-700 font-semibold" : ""}>{labels[payment.status] ?? payment.status}</td><td>{money(payment.value)}</td><td>{payment.net_value == null ? "—" : money(payment.net_value)}</td><td>{payment.due_date?.split("-").reverse().join("/") ?? "—"}</td><td>{payment.invoice_url && <a className="underline" href={payment.invoice_url} target="_blank" rel="noopener noreferrer">Abrir</a>}</td></tr>)}
        </tbody></table></div>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="font-semibold">Histórico de eventos</CardTitle></CardHeader><CardContent>
        {!query.data.events.length ? <p>Nenhum evento recebido.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-3">Evento</th><th>Cobrança</th><th>Processamento</th><th>Recebido em</th></tr></thead><tbody>
          {query.data.events.map(event => <tr key={event.event_id} className="border-b"><td className="py-3">{event.event_type}</td><td>{event.payment_id}</td><td>{event.processing_status === "processed" ? "Processado" : "Revisão necessária"}</td><td>{new Date(event.created_at).toLocaleString("pt-BR")}</td></tr>)}
        </tbody></table></div>}
      </CardContent></Card>
    </>}
    </section>
  </main>;
}
