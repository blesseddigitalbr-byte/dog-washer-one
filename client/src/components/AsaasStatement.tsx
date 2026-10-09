import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const money = (value: number) => (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const localDay = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
export function AsaasStatement() {
  const [startDate, setStartDate] = useState(() => localDay(new Date(Date.now() - 7 * 86400000)));
  const [finishDate, setFinishDate] = useState(() => localDay(new Date()));
  const [selection, setSelection] = useState({ startDate, finishDate, offset: 0 });
  const query = trpc.asaas.sandboxStatement.useQuery(selection, { retry: false, refetchOnWindowFocus: false });
  const invalid = !startDate || !finishDate || startDate > finishDate || Date.parse(finishDate) - Date.parse(startDate) > 93 * 86400000;
  const matches: Record<string, string> = { unlinked: "Sem cobrança DWO vinculada nesta unidade", linked_not_verified: "Origem vinculada — valor/taxa ainda não conciliado", receipt_amount_matched: "Recebimento confere com valor da cobrança", amount_mismatch: "Valor divergente — revisão necessária" };
  return <Card><CardHeader><CardTitle>Saldo e extrato Asaas · sandbox</CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="text-sm text-muted-foreground">Consulta direta, sem saques ou transferências. Valores fictícios da conta de teste da empresa; não representam o caixa real do salão. Recebimentos e tarifas são lançamentos separados.</p>
    <div className="flex flex-wrap items-end gap-3"><label className="text-sm">De<Input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></label><label className="text-sm">Até<Input type="date" value={finishDate} onChange={event => setFinishDate(event.target.value)} /></label><Button variant="outline" disabled={invalid || query.isFetching} onClick={() => { if (selection.startDate === startDate && selection.finishDate === finishDate && selection.offset === 0) query.refetch(); else setSelection({ startDate, finishDate, offset: 0 }); }}>Consultar extrato</Button></div>
    {invalid && <p role="alert" className="text-sm text-red-700">Informe um período válido de até 93 dias.</p>}
    {query.isFetching && <p>Consultando Asaas...</p>}
    {query.error && <p role="alert" className="text-red-700">{query.error.message}</p>}
    {query.data && !query.isFetching && !query.error && <><p>Saldo atual da conta: {money(query.data.balanceCents)}</p><p className="text-sm text-muted-foreground">Conferido em {new Date(query.data.checkedAt).toLocaleString("pt-BR")}. O saldo atual não é o saldo de fechamento do período filtrado.</p>
      <p className="text-sm">Nesta página: entradas {money(query.data.pageCreditsCents)} · saídas {money(query.data.pageDebitsCents)}. Estes valores não são faturamento nem totais do período completo.</p>
      <p className="text-sm">Conferência automática desta página: {query.data.entries.filter(entry => entry.match === "receipt_amount_matched").length} recebimento(s) com valor correspondente · {query.data.entries.filter(entry => entry.match === "amount_mismatch").length} divergência(s) de valor · {query.data.entries.filter(entry => entry.match === "unlinked").length} lançamento(s) sem vínculo nesta unidade.</p>
      <p className="text-xs text-muted-foreground">Valor correspondente não comprova serviço realizado nem repasse. Tarifas, transferências e lançamentos sem vínculo permanecem para conciliação específica.</p>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="py-2">Data</th><th>Movimentação</th><th>Valor</th><th>Origem / conferência</th></tr></thead><tbody>{query.data.entries.map(entry => <tr key={entry.id} className="border-b"><td className="py-3 whitespace-nowrap">{entry.date}</td><td>{entry.description || entry.type}<p className="text-xs text-muted-foreground">{entry.type} · {entry.id}</p></td><td className="whitespace-nowrap">{money(entry.valueCents)}</td><td className="text-xs">{entry.paymentId || entry.transferId || "Sem vínculo identificado"}<p>{matches[entry.match]}</p></td></tr>)}</tbody></table></div>
      {!query.data.entries.length && <p>Nenhuma movimentação nesta página/período.</p>}
      <div className="flex items-center gap-3"><Button variant="outline" disabled={selection.offset === 0} onClick={() => setSelection(previous => ({ ...previous, offset: Math.max(0, previous.offset - 100) }))}>Anterior</Button><span className="text-sm">Página {Math.floor(selection.offset / 100) + 1}</span><Button variant="outline" disabled={!query.data.hasMore} onClick={() => setSelection(previous => ({ ...previous, offset: previous.offset + 100 }))}>Próxima</Button></div>
    </>}
  </CardContent></Card>;
}
