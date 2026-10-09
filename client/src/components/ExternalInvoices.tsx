import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function ExternalInvoices({ onSaved }: { onSaved: () => void }) {
  const [number, setNumber] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [billingId, setBillingId] = useState("");
  const notes = trpc.asaas.externalInvoices.useQuery(undefined, { retry: false });
  const billing = trpc.asaas.billingDrafts.useQuery(undefined, { retry: false });
  const save = trpc.asaas.registerExternalInvoice.useMutation({ onSuccess: () => {
    toast.success("Nota externa registrada. Nenhuma emissão ou alteração de pagamento realizada.");
    notes.refetch(); onSaved(); setNumber(""); setAccessKey(""); setIssuedDate(""); setAmount(""); setDescription(""); setBillingId("");
  }, onError: error => toast.error(error.message) });
  return <section className="space-y-3 rounded-lg border bg-white p-4">
    <h3>Registrar nota emitida fora do DWO</h3>
    <p className="text-sm text-muted-foreground">Transcreva os dados da nota original. Sem cobrança identificada, o registro fica pendente de vínculo. Este cadastro não valida autenticidade, não importa PDF e não confirma pagamento.</p>
    <form className="grid gap-3 md:grid-cols-2" onSubmit={event => {
      event.preventDefault();
      if (!/^\d+(,\d{1,2})?$/.test(amount)) { toast.error("Informe valor como 250,00, sem separador de milhar"); return; }
      save.mutate({ number, accessKey, issuedDate, amountCents: Math.round(Number(amount.replace(",", ".")) * 100), serviceDescription: description, ...(billingId ? { billingDraftId: billingId } : {}) });
    }}>
      <label className="text-sm">Número da NFS-e<Input required maxLength={50} value={number} onChange={e => setNumber(e.target.value)} /></label>
      <label className="text-sm">Data de emissão<Input required type="date" value={issuedDate} onChange={e => setIssuedDate(e.target.value)} /></label>
      <label className="text-sm md:col-span-2">Chave de acesso — 50 dígitos<Input required inputMode="numeric" pattern="[0-9]{50}" maxLength={50} value={accessKey} onChange={e => setAccessKey(e.target.value)} /></label>
      <label className="text-sm">Valor da nota (R$)<Input required inputMode="decimal" placeholder="250,00" value={amount} onChange={e => setAmount(e.target.value)} /></label>
      <label className="text-sm">Cobrança vinculada (opcional)<select className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={billingId} onChange={e => setBillingId(e.target.value)}><option value="">Não identificada — conferir depois</option>{billing.data?.filter(row => row.status === "issued" && !notes.data?.some(note => note.billing_draft_id === row.id)).map(row => <option key={row.id} value={row.id}>{row.description} · R$ {(Number(row.amount_cents) / 100).toFixed(2)}</option>)}</select></label>
      <label className="text-sm md:col-span-2">Descrição da nota<Input required minLength={5} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} /></label>
      <div className="flex gap-2 md:col-span-2"><Button disabled={save.isPending || notes.isLoading || !!notes.error}>Registrar nota externa</Button><Button type="button" variant="outline" onClick={() => { setNumber(""); setAccessKey(""); setIssuedDate(""); setAmount(""); setDescription(""); setBillingId(""); }}>Cancelar</Button></div>
    </form>
    {(notes.error || save.error) && <p role="alert" className="text-sm text-red-700">{notes.error?.message || save.error?.message}</p>}
    {notes.data?.map(note => <article key={note.id} className="rounded-lg border p-3"><p>NFS-e {note.number} · {note.issued_date} · {(Number(note.amount_cents) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><p className="text-sm">{note.service_description}</p><p className="text-sm text-muted-foreground">Emitida externamente · {note.billing_draft_id ? "Cobrança vinculada — bloqueada nova preparação" : "Cobrança não identificada — conferência pendente"}</p></article>)}
  </section>;
}
