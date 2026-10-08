import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

export function LegalEntityForm({ entity, onClose }: { entity: any; onClose: () => void }) {
  const [form, setForm] = useState({ companyName: "", tradingName: "", taxId: "", city: "", state: "" });
  const utils = trpc.useUtils();
  const save = trpc.workspace.saveLegalEntity.useMutation({
    onSuccess: async () => { await utils.workspace.context.invalidate(); toast.success("Empresa atualizada"); onClose(); },
    onError: error => toast.error(error.message),
  });
  useEffect(() => { if (entity) setForm({ companyName: entity.company_name ?? "", tradingName: entity.trading_name ?? "", taxId: entity.tax_id ?? "", city: entity.city ?? "", state: entity.state ?? "" }); }, [entity]);
  return <Dialog open={!!entity} onOpenChange={open => { if (!open && !save.isPending) onClose(); }}>
    <DialogContent><DialogHeader><DialogTitle>Editar pessoa jurídica</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">Dados da empresa responsável. Esta edição não altera automaticamente os dados das unidades ou das contas de pagamento.</p>
      <form className="space-y-4" onSubmit={event => { event.preventDefault(); save.mutate({ id: entity.id, ...form }); }}>
        {([['companyName', 'Razão social'], ['tradingName', 'Nome fantasia'], ['taxId', 'CNPJ'], ['city', 'Cidade'], ['state', 'UF']] as const).map(([key, label]) => <div key={key}><Label htmlFor={`company-${key}`}>{label}</Label><Input id={`company-${key}`} value={form[key]} required={key === 'companyName'} maxLength={key === 'state' ? 2 : key === 'taxId' ? 18 : 160} disabled={save.isPending} onChange={event => setForm({ ...form, [key]: event.target.value })} /></div>)}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={save.isPending} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar alterações'}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
