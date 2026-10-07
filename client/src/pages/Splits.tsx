import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const money = (v: unknown) => Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const labels: Record<string,string> = { DONE:"Crédito confirmado", PENDING:"Pendente", AWAITING_CREDIT:"Aguardando crédito", CANCELLED:"Cancelado", REFUSED:"Recusado", REFUNDED:"Estornado" };
export default function Splits() {
  const query = trpc.asaas.splits.useQuery(undefined, { retry:false });
  const accounts = trpc.asaas.overview.useQuery(undefined, { retry:false });
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold">Splits e Repasses</h1><p className="text-muted-foreground">Conciliação dos créditos aos parceiros.</p></div><Button variant="outline" disabled={query.isFetching} onClick={() => { query.refetch(); accounts.refetch(); }}>Atualizar registros</Button></div>
    <Card><CardContent className="pt-6 text-sm">Pagamento recebido não comprova repasse. Os dados abaixo são verificações registradas do Asaas, com data e origem da evidência. Atualizar recarrega o banco; não consulta o saldo atual no Asaas. Taxas mensais de condomínio e marketing ainda não estão incluídas.</CardContent></Card>
    {query.isLoading && <p>Carregando repasses...</p>}
    {query.error && <p role="alert">{query.error.message}</p>}
    {query.data?.length === 0 && <p>Nenhum repasse verificado. Não é possível inferir crédito a partir de cobranças recebidas.</p>}
    {query.data?.map(split => {
      const account = accounts.data?.accounts.find(a => a.id === split.account_id);
      return <Card key={split.id}><CardHeader><div className="flex flex-wrap items-center gap-3"><CardTitle>{split.partner_name}</CardTitle><Badge variant="outline">{account ? account.environment === "sandbox" ? "Teste · sem dinheiro real" : "Produção" : "Ambiente não identificado"}</Badge><Badge variant="outline">{labels[split.status] ?? split.status}</Badge></div></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">{[["Cobrança", split.gross_value],["Taxa Asaas", Number(split.gross_value)-Number(split.net_value)],["Líquido da cobrança",split.net_value],["Valor do parceiro",split.partner_value]].map(([label,value]) => <div key={String(label)} className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-semibold">{money(value)}</p></div>)}</div>
        <p className="text-sm">O líquido da cobrança é anterior aos repasses; não representa o saldo disponível do salão.</p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Cobrança</dt><dd className="break-all">{split.payment_id}</dd></div><div><dt className="text-muted-foreground">Split</dt><dd className="break-all">{split.split_id}</dd></div><div><dt className="text-muted-foreground">Carteira do parceiro</dt><dd className="break-all">{split.wallet_id}</dd></div><div><dt className="text-muted-foreground">Verificado em</dt><dd>{new Date(split.verified_at).toLocaleString("pt-BR")}</dd></div></dl><p className="text-sm text-muted-foreground">Evidência: {split.evidence_source}</p>
      </CardContent></Card>;
    })}
  </div>;
}
