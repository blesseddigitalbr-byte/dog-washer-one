import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { brandingSchema, neutralBrand, brandSignature, commercialModules } from "../../../shared/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Branding() {
  const query = trpc.branding.current.useQuery(undefined, { retry: false });
  const [form, setForm] = useState<Omit<typeof neutralBrand, "signature"> & { signature: "by" | "network" }>(neutralBrand);
  useEffect(() => { if (query.data) setForm(query.data); }, [query.data]);
  const utils = trpc.useUtils();
  const save = trpc.branding.save.useMutation({ onSuccess: () => { utils.branding.current.invalidate(); toast.success("Marca atualizada para sua empresa"); }, onError: error => toast.error(error.message) });
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">Marca e módulos</h1><p className="text-muted-foreground">Identidade da sua empresa, com tecnologia Dog Washer One.</p></div>
    {query.error && <p role="alert">{query.error.message}</p>}
    <Card><CardHeader><CardTitle>Personalização por empresa</CardTitle></CardHeader><CardContent>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={event => { event.preventDefault(); const parsed = brandingSchema.safeParse(form); if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; } save.mutate(parsed.data); }}>
        <label>Nome da marca<Input value={form.display_name} maxLength={80} onChange={event => setForm({ ...form, display_name: event.target.value })} /></label>
        <label>Assinatura<select className="h-10 w-full rounded-md border px-3" value={form.signature} onChange={event => setForm({ ...form, signature: event.target.value as "by" | "network" })}><option value="by">by Dog Washer</option><option value="network">Um salão Dog Washer</option></select></label>
        {([['primary_color','Cor principal'],['secondary_color','Cor de apoio'],['background_color','Fundo']] as const).map(([key,label]) => <label key={key}>{label}<div className="flex gap-2"><input aria-label={`${label} seletor`} type="color" value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} /><Input aria-label={label} value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} /></div></label>)}
        <div className="rounded-xl border p-5" style={{ background: form.background_color }}><p className="text-xl font-bold" style={{ color: form.primary_color }}>{form.display_name}</p><p style={{ color: form.secondary_color }}>{brandSignature(form.signature)}</p></div>
        <div className="md:col-span-2"><Button disabled={save.isPending || query.isLoading || !!query.error}>Salvar marca</Button></div>
      </form>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Estrutura comercial por módulos</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-muted-foreground">Catálogo de organização do produto. Não representa módulos contratados ou funcionalidades prontas; o controle de licenças será implementado no servidor.</p><div className="grid gap-3 md:grid-cols-3">{commercialModules.map(module => <div key={module.id} className="rounded-xl border p-4"><h2 className="font-semibold">{module.name}</h2><p className="text-sm text-muted-foreground">{module.description}</p></div>)}</div></CardContent></Card>
    <p className="text-sm text-muted-foreground">A marca não altera o CNPJ emissor, as contas Asaas, as carteiras dos parceiros ou as regras de repasse.</p>
  </div>;
}
