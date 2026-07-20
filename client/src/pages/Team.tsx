import { useMemo, useState } from "react";
import { BriefcaseBusiness, Edit2, Mail, Phone, Plus, Search, Trash2, Users2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const emptyForm = {
  name: "", email: "", phone: "", cpf: "", specialization: "",
  roleTitle: "", hireDate: "", commissionPercent: "0", notes: "", status: "active",
};

const statusLabel: Record<string, string> = {
  active: "Ativo", inactive: "Inativo", vacation: "Em férias",
};

export default function Team() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const utils = trpc.useUtils();
  const { data: professionals = [], isLoading } = trpc.professionals.list.useQuery();
  const create = trpc.professionals.create.useMutation();
  const update = trpc.professionals.update.useMutation();
  const remove = trpc.professionals.delete.useMutation();

  const filtered = useMemo(() => professionals.filter((item: any) =>
    [item.name, item.specialization, item.role_title, item.email]
      .some((value) => String(value || "").toLowerCase().includes(search.toLowerCase())),
  ), [professionals, search]);

  const showForm = (professional?: any) => {
    setEditing(professional ?? null);
    setForm(professional ? {
      name: professional.name ?? "",
      email: professional.email ?? "",
      phone: professional.phone ?? "",
      cpf: professional.cpf ?? "",
      specialization: professional.specialization ?? "",
      roleTitle: professional.role_title ?? "",
      hireDate: professional.hire_date ?? "",
      commissionPercent: String(professional.commission_percent ?? 0),
      notes: professional.notes ?? "",
      status: professional.status ?? "active",
    } : emptyForm);
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("Informe o nome do profissional");
    const payload = {
      ...form,
      email: form.email || undefined,
      commissionPercent: Number(form.commissionPercent || 0),
      status: form.status as "active" | "inactive" | "vacation",
    };
    try {
      if (editing) await update.mutateAsync({ id: editing.id, ...payload });
      else await create.mutateAsync(payload);
      await utils.professionals.list.invalidate();
      toast.success(editing ? "Profissional atualizado" : "Profissional cadastrado");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar");
    }
  };

  const deactivate = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync({ id: deleteId });
      await utils.professionals.list.invalidate();
      toast.success("Profissional inativado; o histórico foi preservado");
      setDeleteId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível inativar");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#C9A24E]">Gestão de pessoas</p>
          <h1 className="mt-2 text-3xl font-bold">Equipe</h1>
          <p className="mt-2 text-muted-foreground">Profissionais disponíveis para atendimento na unidade atual.</p>
        </div>
        <Button onClick={() => showForm()}><Plus className="mr-2 h-4 w-4" />Novo profissional</Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Profissionais", professionals.length],
          ["Ativos", professionals.filter((p: any) => p.is_active).length],
          ["Ausentes/Inativos", professionals.filter((p: any) => !p.is_active).length],
        ].map(([label, value]) => (
          <Card key={String(label)} className="border-l-4 border-l-[#C9A24E]">
            <CardContent className="flex items-center justify-between p-5">
              <div><p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>
              <Users2 className="h-7 w-7 text-[#C9A24E]/45" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome, função ou especialidade..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? <p className="py-12 text-center text-muted-foreground">Carregando equipe...</p> :
        filtered.length === 0 ? (
          <Card><CardContent className="py-14 text-center text-muted-foreground">Nenhum profissional encontrado.</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((professional: any) => (
              <article key={professional.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge variant={professional.is_active ? "default" : "secondary"}>{statusLabel[professional.status] ?? professional.status}</Badge>
                    <h2 className="mt-3 truncate text-lg font-bold">{professional.name}</h2>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><BriefcaseBusiness className="h-4 w-4" />{professional.role_title || professional.specialization || "Profissional"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" aria-label="Editar profissional" onClick={() => showForm(professional)}><Edit2 className="h-4 w-4" /></Button>
                    {professional.is_active && <Button variant="outline" size="icon" aria-label="Inativar profissional" onClick={() => setDeleteId(professional.id)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                </div>
                <div className="mt-5 space-y-2 border-t pt-4 text-sm text-muted-foreground">
                  {professional.specialization && <p><strong className="text-foreground">Especialidade:</strong> {professional.specialization}</p>}
                  {professional.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{professional.phone}</p>}
                  {professional.email && <p className="flex items-center gap-2 break-all"><Mail className="h-4 w-4" />{professional.email}</p>}
                </div>
              </article>
            ))}
          </div>
        )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar profissional" : "Novo profissional"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Nome completo *</Label><Input value={form.name} onChange={(e) => setForm({...form, name:e.target.value})} required /></div>
            <div><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({...form, cpf:e.target.value})} /></div>
            <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone:e.target.value})} /></div>
            <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email:e.target.value})} /></div>
            <div><Label>Função</Label><Input placeholder="Ex.: Groomer" value={form.roleTitle} onChange={(e) => setForm({...form, roleTitle:e.target.value})} /></div>
            <div><Label>Especialidade</Label><Input placeholder="Ex.: Tosa bebê" value={form.specialization} onChange={(e) => setForm({...form, specialization:e.target.value})} /></div>
            <div><Label>Data de admissão</Label><Input type="date" value={form.hireDate} onChange={(e) => setForm({...form, hireDate:e.target.value})} /></div>
            <div><Label>Comissão (%)</Label><Input type="number" min="0" max="100" step=".01" value={form.commissionPercent} onChange={(e) => setForm({...form, commissionPercent:e.target.value})} /></div>
            <div><Label>Status</Label><Select value={form.status} onValueChange={(status) => setForm({...form,status})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="vacation">Em férias</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent></Select></div>
            <div className="sm:col-span-2"><Label>Observações</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({...form, notes:e.target.value})} /></div>
            <div className="flex justify-end gap-3 sm:col-span-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? "Salvando..." : "Salvar profissional"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(value) => !value && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Inativar profissional?</AlertDialogTitle><AlertDialogDescription>O profissional deixará de aparecer em novos agendamentos, mas todo o histórico será preservado.</AlertDialogDescription></AlertDialogHeader><div className="flex justify-end gap-3"><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={deactivate}>Inativar</AlertDialogAction></div></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
