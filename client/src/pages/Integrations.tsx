import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const labels: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado · aguardando repasse", received: "Recebido",
  overdue: "Vencido", deleted: "Removido", refunded: "Estornado",
};
const money = (n: unknown) => Number(n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Integrations() {
  const query = trpc.asaas.overview.useQuery(undefined, { retry: false });
  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div><h1 className="text-2xl font-semibold">Integração Asaas</h1><p className="text-muted-foreground">Cobranças e eventos recebidos, sem expor credenciais.</p></div>
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
  </div>;
}
