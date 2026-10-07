import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { parseBrlCents } from "../../../shared/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const selectClass = "h-10 w-full rounded-md border bg-background px-3 text-sm";

export default function Financial() {
  const params = new URLSearchParams(window.location.search);
  const [origin, setOrigin] = useState<"standalone" | "appointment" | "package">(params.has("appointment") ? "appointment" : params.has("package") ? "package" : "standalone");
  const [originId, setOriginId] = useState(params.get("appointment") ?? params.get("package") ?? "");
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billingType, setBillingType] = useState<"PIX" | "BOLETO" | "CREDIT_CARD">("PIX");
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const options = trpc.asaas.billingOptions.useQuery(undefined, { retry: false });
  const drafts = trpc.asaas.billingDrafts.useQuery(undefined, { retry: false });
  const selectedOrigin = origin === "appointment" ? options.data?.appointments.find(a => a.id === originId) : origin === "package" ? options.data?.packages.find(p => p.id === originId) : undefined;
  const actualClient = selectedOrigin?.client_id ?? clientId;
  useEffect(() => {
    if (origin === "package" && selectedOrigin && "price" in selectedOrigin) {
      setAmount(Number(selectedOrigin.price).toFixed(2).replace(".", ","));
      setDescription(`Pacote ${selectedOrigin.code}`);
    } else if (origin === "appointment" && selectedOrigin && "appointment_date" in selectedOrigin) {
      setDescription(`Atendimento ${new Date(selectedOrigin.appointment_date).toLocaleDateString("pt-BR")}`);
    }
  }, [origin, selectedOrigin]);
  const save = trpc.asaas.saveBillingDraft.useMutation({
    onSuccess: () => { toast.success("Rascunho salvo. Nenhuma cobrança foi emitida no Asaas."); drafts.refetch(); setRequestId(crypto.randomUUID()); setAmount(""); setDescription(""); setDueDate(""); },
    onError: error => toast.error(error.message),
  });
  const submit = () => {
    const amountCents = parseBrlCents(amount);
    if (!amountCents || !actualClient || !dueDate || !description.trim() || (origin !== "standalone" && !selectedOrigin)) {
      toast.error("Preencha cliente/origem, valor em reais, vencimento e descrição."); return;
    }
    save.mutate({ id: requestId, origin, originId: origin === "standalone" ? undefined : originId, clientId: actualClient, amountCents, billingType, dueDate, description });
  };
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold">Financeiro do salão</h1><p className="text-muted-foreground">Preparação de cobranças vinculadas a clientes, atendimentos e pacotes.</p></div>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">Nesta etapa, o formulário salva rascunhos no DWO. A emissão no Asaas ainda não está habilitada. Salvar não confirma pagamento, não consome sessões e não gera repasse.</div>
    {options.error && <p role="alert">{options.error.message}</p>}
    <Card><CardHeader><CardTitle>Preparar cobrança</CardTitle></CardHeader><CardContent>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={event => { event.preventDefault(); submit(); }}>
        <label className="space-y-2"><span>Origem</span><select className={selectClass} value={origin} disabled={save.isPending} onChange={event => { setOrigin(event.target.value as typeof origin); setOriginId(""); }}>
          <option value="standalone">Cobrança avulsa</option><option value="appointment">Atendimento</option><option value="package">Pacote contratado</option>
        </select></label>
        {origin === "standalone" ? <label className="space-y-2"><span>Cliente</span><select className={selectClass} value={clientId} onChange={event => setClientId(event.target.value)}><option value="">Selecione</option>{options.data?.clients.map(client => <option key={client.id} value={client.id}>{client.nome}</option>)}</select></label>
          : <label className="space-y-2"><span>{origin === "appointment" ? "Atendimento" : "Pacote"}</span><select className={selectClass} value={originId} onChange={event => {
            setOriginId(event.target.value);
            if (origin === "package") { const pack = options.data?.packages.find(p => p.id === event.target.value); if (pack) { setAmount(Number(pack.price).toFixed(2).replace(".", ",")); setDescription(`Pacote ${pack.code}`); } }
          }}><option value="">Selecione</option>{origin === "appointment" ? options.data?.appointments.map(a => <option key={a.id} value={a.id}>{new Date(a.appointment_date).toLocaleString("pt-BR")} · {options.data?.clients.find(c => c.id === a.client_id)?.nome ?? "Cliente"}</option>) : options.data?.packages.map(p => <option key={p.id} value={p.id}>{p.code} · {options.data?.clients.find(c => c.id === p.client_id)?.nome ?? "Cliente"}</option>)}</select></label>}
        {selectedOrigin && <p className="text-sm md:col-span-2">Cliente vinculado: <strong>{options.data?.clients.find(c => c.id === actualClient)?.nome ?? "Não localizado"}</strong></p>}
        <label className="space-y-2"><span>Valor (R$)</span><Input inputMode="decimal" placeholder="100,00" value={amount} onChange={event => setAmount(event.target.value)} required /></label>
        <label className="space-y-2"><span>Vencimento</span><Input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} required /></label>
        <label className="space-y-2"><span>Forma de pagamento</span><select className={selectClass} value={billingType} onChange={event => setBillingType(event.target.value as typeof billingType)}><option value="PIX">Pix</option><option value="BOLETO">Boleto</option><option value="CREDIT_CARD">Cartão via fatura segura</option></select></label>
        <label className="space-y-2"><span>Descrição</span><Input value={description} maxLength={500} onChange={event => setDescription(event.target.value)} required /></label>
        <div className="md:col-span-2"><Button type="submit" disabled={save.isPending || options.isLoading || !!options.error}>{save.isPending ? "Salvando..." : "Salvar rascunho"}</Button></div>
      </form>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Rascunhos salvos</CardTitle></CardHeader><CardContent>
      {drafts.isLoading && <p>Carregando...</p>}{drafts.error && <p role="alert">{drafts.error.message}</p>}
      {drafts.data && !drafts.data.length && <p>Nenhum rascunho salvo.</p>}
      {!!drafts.data?.length && <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="py-3">Cliente / descrição</th><th>Origem</th><th>Valor</th><th>Vencimento</th><th>Situação</th></tr></thead><tbody>{drafts.data.map(draft => <tr key={draft.id} className="border-b"><td className="py-3">{options.data?.clients.find(c => c.id === draft.client_id)?.nome ?? "Cliente"}<p className="text-muted-foreground">{draft.description}</p></td><td>{draft.appointment_id ? "Atendimento" : draft.client_package_id ? "Pacote" : "Avulsa"}</td><td>{money(Number(draft.amount_cents))}</td><td>{draft.due_date.split("-").reverse().join("/")}</td><td>{draft.status === "draft" ? "Rascunho · não emitido" : draft.status}</td></tr>)}</tbody></table></div>}
    </CardContent></Card>
    <Button variant="outline" asChild><a href="/splits">Ver splits e repasses</a></Button>
  </div>;
}
