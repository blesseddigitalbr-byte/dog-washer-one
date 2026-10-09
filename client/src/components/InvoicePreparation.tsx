import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ExternalInvoices } from "./ExternalInvoices";

const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export function InvoicePreparation() {
  const [billingDraftId, setBillingDraftId] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const billing = trpc.asaas.billingDrafts.useQuery(undefined, { retry: false });
  const drafts = trpc.asaas.invoiceDrafts.useQuery(undefined, { retry: false });
  const external = trpc.asaas.externalInvoices.useQuery(undefined, { retry: false });
  const exportNote = trpc.asaas.exportInvoice.useMutation({ onSuccess: result => {
    const url = URL.createObjectURL(new Blob([result.csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = result.filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Arquivo baixado. Nenhuma nota emitida ou enviada à contabilidade.");
  }, onError: error => toast.error(error.message) });
  const prepare = trpc.asaas.prepareInvoice.useMutation({ onSuccess: () => { toast.success("Nota preparada, aguardando validação fiscal. Nenhuma NFS-e foi emitida."); drafts.refetch(); setBillingDraftId(""); setServiceDescription(""); setEffectiveDate(""); }, onError: error => toast.error(error.message) });
  const selected = billing.data?.find(row => row.id === billingDraftId);
  return <Card><CardHeader><CardTitle>Notas fiscais do salão</CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="text-sm text-muted-foreground">A contabilidade é responsável pela emissão das notas do salão. O DWO prepara os dados sem emitir, enviar ao escritório ou alterar a cobrança. As notas da escola permanecem em seu fluxo separado.</p>
    <p className="text-xs text-muted-foreground">Emissão direta pelo Asaas pendente de confirmação fiscal e definição do novo processo com a contabilidade.</p>
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border bg-white p-3"><p>Emitir pelo DWO · Asaas</p><p className="text-sm text-muted-foreground">Em preparação. Requer configuração fiscal validada, homologação e controle das notas externas.</p><Button type="button" disabled className="mt-2">Emissão ainda não habilitada</Button></div>
      <div className="rounded-lg border bg-white p-3"><p>Contabilidade emite</p><p className="text-sm text-muted-foreground">Prepare os dados abaixo e exporte cada rascunho em CSV para conferir com o escritório. Download não significa envio nem emissão.</p></div>
    </div>
    <form className="grid gap-3 md:grid-cols-2" onSubmit={event => { event.preventDefault(); prepare.mutate({ billingDraftId, serviceDescription, effectiveDate }); }}>
      <label className="text-sm">Cobrança emitida<select className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={billingDraftId} required onChange={event => { setBillingDraftId(event.target.value); setServiceDescription(billing.data?.find(row => row.id === event.target.value)?.description || ""); }}><option value="">Selecione uma cobrança</option>{billing.data?.filter(row => row.status === "issued" && !drafts.data?.some(note => note.billing_draft_id === row.id) && !external.data?.some(note => note.billing_draft_id === row.id)).map(row => <option key={row.id} value={row.id}>{row.description} · {money(Number(row.amount_cents))}</option>)}</select></label>
      <label className="text-sm">Data fiscal pretendida<Input type="date" value={effectiveDate} required onChange={event => setEffectiveDate(event.target.value)} /></label>
      <label className="text-sm md:col-span-2">Descrição dos serviços<Input value={serviceDescription} minLength={5} maxLength={2000} required onChange={event => setServiceDescription(event.target.value)} /></label>
      {selected && <p className="text-sm">Valor da cobrança: {money(Number(selected.amount_cents))}. Base tributável e competência fiscal ainda dependem de validação.</p>}
      <div className="md:col-span-2 flex gap-2"><Button disabled={!billingDraftId || prepare.isPending || drafts.isLoading || !!drafts.error}>Preparar nota — não emitir</Button><Button type="button" variant="outline" onClick={() => { setBillingDraftId(""); setServiceDescription(""); setEffectiveDate(""); }}>Limpar</Button></div>
    </form>
    {(billing.error || drafts.error || prepare.error) && <p role="alert" className="text-sm text-red-700">{billing.error?.message || drafts.error?.message || prepare.error?.message}</p>}
    {drafts.data?.map(note => <article key={note.id} className="rounded-lg border bg-white p-3"><p>{note.service_description} · {money(Number(note.amount_cents))}</p><p className="text-sm text-muted-foreground">Data pretendida: {note.effective_date} · {note.status === "awaiting_fiscal_validation" ? "Aguardando validação — não emitida pelo DWO" : note.status}</p>{note.status === "awaiting_fiscal_validation" && <Button type="button" variant="outline" className="mt-2" disabled={exportNote.isPending} onClick={() => exportNote.mutate({ id: note.id })}>Exportar para contabilidade</Button>}</article>)}
    {drafts.data && !drafts.data.length && <p className="text-sm">Nenhuma nota preparada.</p>}
    <ExternalInvoices onSaved={() => { drafts.refetch(); external.refetch(); }} />
  </CardContent></Card>;
}
