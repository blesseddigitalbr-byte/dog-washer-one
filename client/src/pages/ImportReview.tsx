import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function ReviewRow({row,onSaved}:{row:any;onSaved:()=>void}) {
  const fields=Object.keys(row.original_values??{});
  const [field,setField]=useState(fields[0]??"");
  const [value,setValue]=useState("");
  const [reason,setReason]=useState("");
  const adjust=trpc.importReview.adjust.useMutation({onSuccess:()=>{setReason("");onSaved();toast.success("Ajuste registrado na revisão");},onError:e=>toast.error(e.message)});
  return <section className="rounded-xl border bg-white p-5 space-y-3">
    <h2 className="font-semibold">{row.source_sheet} · Linha {row.source_row} · Revisão {row.version}</h2>
    <p className="text-sm">Origem: {row.source_sha256.slice(0,12)}…</p>
    {!!row.issues?.length&&<div role="status"><h3 className="font-medium">Pendências da origem</h3><ul className="list-disc pl-5">{row.issues.map((issue:any,i:number)=><li key={i}>{typeof issue==="string"?issue:JSON.stringify(issue)}</li>)}</ul></div>}
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="text-left">Campo</th><th className="text-left">Original</th><th className="text-left">Ajustado</th></tr></thead>
      <tbody>{fields.map(f=><tr key={f}><td className="p-2">{f}</td><td className="p-2 break-all">{String(row.original_values[f]??"")}</td><td className="p-2 break-all">{Object.hasOwn(row.adjustments,f)?String(row.adjustments[f]):"—"}</td></tr>)}</tbody></table></div>
    <form className="space-y-3" onSubmit={e=>{e.preventDefault();adjust.mutate({id:row.id,version:row.version,field,value,reason});}}>
      <label className="block">Campo<select className="block border rounded p-2 w-full" value={field} onChange={e=>setField(e.target.value)}>{fields.map(f=><option key={f}>{f}</option>)}</select></label>
      <label className="block">Novo valor<Input value={value} onChange={e=>setValue(e.target.value)} maxLength={2000}/></label>
      <label className="block">Motivo do ajuste<Input value={reason} onChange={e=>setReason(e.target.value)} minLength={10} maxLength={1000} required/></label>
      <Button disabled={!field||reason.trim().length<10||adjust.isPending}>Registrar ajuste</Button>
    </form>
  </section>;
}
export default function ImportReview(){
  const [offset,setOffset]=useState(0);
  const query=trpc.importReview.list.useQuery({offset},{retry:false});
  return <main className="max-w-5xl mx-auto p-6 space-y-5"><h1 className="text-3xl font-semibold">Revisão da importação</h1>
    <p>Os ajustes preservam o original e registram autor, motivo e histórico. Ainda não alteram cadastros, créditos, pagamentos ou cobranças. Pendências precisam ser revalidadas antes da importação definitiva.</p>
    {query.isLoading?<p>Carregando revisão…</p>:query.error?<p role="alert">{query.error.message}</p>:<>
      {!query.data?.total&&<p>Nenhum lote preparado nesta unidade. A importação definitiva permanece bloqueada até validar backup, vínculos e saldos.</p>}
      {query.data?.rows.map(row=><ReviewRow key={`${row.id}-${row.version}`} row={row} onSaved={()=>void query.refetch()}/>)}
      {!!query.data?.total&&<div className="flex gap-3"><Button disabled={!offset} onClick={()=>setOffset(Math.max(0,offset-50))}>Anterior</Button><span>{offset+1}–{Math.min(offset+50,query.data.total)} de {query.data.total}</span><Button disabled={offset+50>=query.data.total} onClick={()=>setOffset(offset+50)}>Próxima</Button></div>}
    </>}
  </main>;
}
