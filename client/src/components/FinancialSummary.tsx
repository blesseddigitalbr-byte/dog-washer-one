import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
type Row = { id: string; grossCents: number; netCents: number | null; paymentStatus: string };
const money = (v: number) => (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export default function FinancialSummary({ rows, error, loading }: { rows?: Row[]; error?: string; loading: boolean }) {
  const [status, setStatus] = useState("all");
  const groups = [
    { label: "Recebido · bruto", statuses: ["received"], color: "#16a34a" },
    { label: "Confirmado · aguardando disponibilidade", statuses: ["confirmed"], color: "#7c3aed" },
    { label: "Pendente", statuses: ["pending", "awaiting_webhook"], color: "#0284c7" },
    { label: "Vencido", statuses: ["overdue"], color: "#dc2626" },
  ].map(g => ({ ...g, amount: (rows ?? []).filter(r => g.statuses.includes(r.paymentStatus)).reduce((n, r) => n + r.grossCents, 0) }));
  const max = Math.max(1, ...groups.map(g => g.amount));
  const filtered = (rows ?? []).filter(r => status === "all" || r.paymentStatus === status);
  return <section className="space-y-4" aria-label="Indicadores financeiros">
    <p className="text-sm text-muted-foreground">Homologação · unidade ativa · até 100 cobranças emitidas mais recentes. Não é o histórico completo nem o saldo disponível; despesas e fluxo de caixa não estão apurados.</p>
    {error && <p role="alert">{error}</p>}
    <div className="grid gap-3 md:grid-cols-4">{groups.map(g => <Card key={g.label}><CardContent className="p-4"><p>{g.label}</p><p className="text-xl font-semibold">{loading || !rows ? "—" : money(g.amount)}</p></CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle>Distribuição das cobranças por situação</CardTitle></CardHeader><CardContent>{!loading && rows && groups.map(g => <div key={g.label} className="mb-3"><p className="text-sm">{g.label} · {money(g.amount)}</p><div className="h-3 rounded bg-slate-100"><div className="h-3 rounded" style={{ width: `${g.amount / max * 100}%`, backgroundColor: g.color }} /></div></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>Relatório de cobranças conciliadas</CardTitle></CardHeader><CardContent>
      <label>Situação<select className="ml-3 rounded border p-2" value={status} onChange={e => setStatus(e.target.value)}><option value="all">Todas</option>{Array.from(new Set((rows ?? []).map(r => r.paymentStatus))).map(s => <option key={s}>{s}</option>)}</select></label>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="text-left py-3">Registro</th><th>Situação</th><th>Bruto</th><th>Líquido informado</th></tr></thead><tbody>{filtered.map(r => <tr key={r.id} className="border-t"><td className="py-2 break-all">{r.id}</td><td className="text-center">{r.paymentStatus}</td><td className="text-center">{money(r.grossCents)}</td><td className="text-center">{r.netCents === null ? "Não informado" : money(r.netCents)}</td></tr>)}</tbody></table></div>
      {!loading && rows?.length === 0 && <p>Nenhuma cobrança emitida na unidade.</p>}
    </CardContent></Card>
  </section>;
}
