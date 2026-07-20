import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: any | null;
  legalEntities: any[];
};

const emptyForm = {
  name: "",
  code: "",
  legalEntityId: "",
  cnpj: "",
  razaoSocial: "",
  city: "",
  state: "",
  operationMode: "salon" as "salon" | "school" | "hybrid",
  ownershipModel: "owned" as "owned" | "licensed" | "franchised",
};

export default function UnitFormDialog({
  open,
  onOpenChange,
  unit,
  legalEntities,
}: Props) {
  const [form, setForm] = useState(emptyForm);
  const utils = trpc.useUtils();
  const saveUnit = trpc.workspace.saveUnit.useMutation({
    onSuccess: async () => {
      await utils.workspace.context.invalidate();
      toast.success(unit ? "Unidade atualizada" : "Unidade criada");
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (!open) return;
    setForm(unit ? {
      name: unit.name ?? "",
      code: unit.code ?? "",
      legalEntityId: unit.legal_entity_id ?? "",
      cnpj: unit.cnpj ?? "",
      razaoSocial: unit.razao_social ?? "",
      city: unit.city ?? "",
      state: unit.state ?? "",
      operationMode: unit.operation_mode ?? "salon",
      ownershipModel: unit.ownership_model ?? "owned",
    } : emptyForm);
  }, [open, unit]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    saveUnit.mutate({
      id: unit?.id,
      ...form,
      legalEntityId: form.legalEntityId || undefined,
      cnpj: form.cnpj || undefined,
      razaoSocial: form.razaoSocial || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{unit ? "Editar unidade" : "Nova unidade"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="unit-name">Nome *</Label>
            <Input id="unit-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="unit-code">Código *</Label>
            <Input id="unit-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </div>
          <div className="sm:col-span-2">
            <Label>Pessoa jurídica</Label>
            <Select value={form.legalEntityId || "none"} onValueChange={(value) => setForm({ ...form, legalEntityId: value === "none" ? "" : value })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não vinculada</SelectItem>
                {legalEntities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.trading_name ?? entity.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="unit-razao">Razão social</Label>
            <Input id="unit-razao" value={form.razaoSocial} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="unit-cnpj">CNPJ</Label>
            <Input id="unit-cnpj" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
          </div>
          <div>
            <Label>Operação</Label>
            <Select value={form.operationMode} onValueChange={(value: typeof form.operationMode) => setForm({ ...form, operationMode: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="salon">Salão</SelectItem>
                <SelectItem value="school">Escola</SelectItem>
                <SelectItem value="hybrid">Híbrida</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Modelo</Label>
            <Select value={form.ownershipModel} onValueChange={(value: typeof form.ownershipModel) => setForm({ ...form, ownershipModel: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="owned">Própria</SelectItem>
                <SelectItem value="licensed">Licenciada</SelectItem>
                <SelectItem value="franchised">Franqueada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="unit-city">Cidade</Label>
            <Input id="unit-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="unit-state">UF</Label>
            <Input id="unit-state" maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
          </div>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saveUnit.isPending}>
              {saveUnit.isPending ? "Salvando..." : "Salvar unidade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
