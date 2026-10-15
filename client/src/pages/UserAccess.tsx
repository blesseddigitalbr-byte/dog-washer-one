import { useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UserAccountEditor from "@/components/UserAccountEditor";
import SystemPageHeader from "@/components/SystemPageHeader";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, ShieldCheck, UserCheck, UserRound } from "lucide-react";

const roles = { owner: "Proprietária", admin: "Administrador", manager: "Gestão", staff: "Operação", student: "Aluno operacional" };
export default function UserAccess() {
  const { user } = useAuth();
  const authorized = !!user && ["owner", "admin"].includes(user.role);
  const list = trpc.userAccess.list.useQuery(undefined, { enabled: authorized, retry: false });
  const workspace = trpc.workspace.context.useQuery(undefined, { enabled: authorized });
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [profileFilter, setProfileFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"admin" | "manager" | "staff">("staff");
  const [unitIds, setUnitIds] = useState<string[]>([]);
  const [defaultUnitId, setDefaultUnitId] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const create = trpc.userAccess.create.useMutation({
    onSuccess: async () => {
      setPassword(""); setShowPassword(false); setName(""); setEmail(""); setVerifiedEmail(false);
      setShowCreate(false);
      toast.success("Usuário cadastrado com os acessos selecionados");
      await utils.userAccess.list.invalidate();
    }, onError: error => { setPassword(""); toast.error(error.message); },
  });
  if (!authorized) return <main className="p-8"><h1 className="text-2xl font-semibold">Usuários e acessos</h1><p className="mt-4">Acesso restrito à administração.</p></main>;
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!verifiedEmail || create.isPending) return;
    create.mutate({ name, email, password, role, unitIds, defaultUnitId, verifiedEmail: true });
  }
  const people = list.data ?? [];
  const visible = people.filter(person => {
    const text = (person.full_name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const term = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    return text.includes(term) && (profileFilter === "all" || person.role === profileFilter)
      && (statusFilter === "all" || person.active === (statusFilter === "active"));
  });
  const stats = [
    { label: "Administração", value: people.filter(p => ["owner", "admin"].includes(p.role)).length, help: "Proprietária e administradores", icon: ShieldCheck },
    { label: "Gestão", value: people.filter(p => p.role === "manager").length, help: "Gestão operacional e financeira", icon: UserCheck },
    { label: "Operação", value: people.filter(p => p.role === "staff").length, help: "Recepção e atendimento", icon: UserRound },
    { label: "Acessos ativos", value: people.filter(p => p.active).length, help: "Entre os usuários desta consulta", icon: Users },
  ];
  return <main className="mx-auto w-full max-w-[1480px] space-y-6 p-4 sm:p-6">
    <SystemPageHeader title="Usuários e acessos" description="Logins individuais, perfis e unidades da organização. Cadastro de profissional não cria login automaticamente."
      organization={workspace.data?.organization?.name} unit={workspace.data?.currentUnit?.name}
      profile={roles[user.role as keyof typeof roles] ?? user.role}
      action={<Button type="button" aria-expanded={showCreate} aria-controls="create-user-form" onClick={() => { setShowCreate(value => !value); setPassword(""); setShowPassword(false); }}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />{showCreate ? "Fechar cadastro" : "Adicionar usuário"}</Button>} />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo dos usuários">
      {stats.map(item => <section key={item.label} className="rounded-2xl border border-t-2 border-t-primary/60 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2"><h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</h2><item.icon className="h-4 w-4 text-primary" aria-hidden="true" /></div>
        <p className="mt-3 text-3xl font-semibold">{list.isLoading || list.error ? "—" : item.value}</p><p className="mt-2 text-xs text-muted-foreground">{item.help}</p>
      </section>)}
    </div>
    {showCreate && <form id="create-user-form" onSubmit={submit} className="rounded-xl border bg-white p-6 space-y-4">
      <h2 className="text-lg font-semibold">Cadastrar usuário</h2>
      <label className="block">Nome<Input value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={120} /></label>
      <label className="block">Email<Input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="off" /></label>
      <label className="block" htmlFor="initial-password">Senha inicial</label>
      <div className="flex items-center gap-2"><Input id="initial-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={12} maxLength={128} autoComplete="new-password" /><Button type="button" variant="outline" aria-controls="initial-password" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? "Ocultar senha" : "Mostrar senha"}</Button></div>
      <p className="text-sm text-muted-foreground">Pelo menos 12 caracteres. Compartilhe somente por canal privado seguro. Não enviamos convite automático; a senha não é exibida nem salva no cadastro do DWO.</p>
      <label className="block">Perfil<select className="block w-full rounded-md border p-2" value={role} onChange={e => setRole(e.target.value as typeof role)}><option value="staff">Operação — sem gestão financeira ou cadastro de usuários</option><option value="manager">Gestão — inclui financeiro e reversões; sem cadastro de usuários</option>{user?.role === "owner" && <option value="admin">Administrador — inclui gestão e cadastro de operação/gestão</option>}</select></label>
      <fieldset className="space-y-2"><legend className="font-medium">Unidades autorizadas</legend>{workspace.data?.units.map(unit => <label key={unit.id} className="flex gap-2 items-center"><input type="checkbox" checked={unitIds.includes(unit.id)} onChange={e => {
        const next = e.target.checked ? [...unitIds, unit.id] : unitIds.filter(id => id !== unit.id);
        setUnitIds(next); if (!next.includes(defaultUnitId)) setDefaultUnitId(next[0] ?? "");
      }} />{unit.name}</label>)}</fieldset>
      <label className="block">Unidade inicial<select required className="block w-full rounded-md border p-2" value={defaultUnitId} onChange={e => setDefaultUnitId(e.target.value)}><option value="">Selecione</option>{workspace.data?.units.filter(unit => unitIds.includes(unit.id)).map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
      <label className="flex gap-2 items-start"><input type="checkbox" checked={verifiedEmail} onChange={e => setVerifiedEmail(e.target.checked)} />Conferi a identidade e o email do usuário e autorizo os acessos selecionados.</label>
      <Button type="submit" disabled={create.isPending || !verifiedEmail || !unitIds.length}>{create.isPending ? "Cadastrando..." : "Cadastrar usuário"}</Button>
    </form>}
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b p-5 sm:p-6">
        <div><h2 className="text-lg font-semibold">Usuários da organização</h2><p className="mt-1 text-sm text-muted-foreground">{list.isLoading ? "Carregando usuários..." : list.error ? "Consulta indisponível" : `${visible.length} de ${people.length} usuários nesta consulta`}</p></div>
        <div className="flex w-full flex-wrap gap-3 lg:w-auto">
          <div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input aria-label="Buscar usuário por nome" placeholder="Buscar por nome..." className="pl-9" value={search} onChange={event => setSearch(event.target.value)} /></div>
          <select aria-label="Filtrar por perfil" className="rounded-md border bg-background p-2 text-sm" value={profileFilter} onChange={event => setProfileFilter(event.target.value)}><option value="all">Todos os perfis</option>{Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select aria-label="Filtrar por situação" className="rounded-md border bg-background p-2 text-sm" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">Todas as situações</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select>
        </div>
      </div>
      {list.error ? <p className="p-6 text-sm text-destructive" role="alert">{list.error.message}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><caption className="sr-only">Usuários e perfis da organização atual</caption>
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Usuário", "Perfil", "Situação", "Unidade atual", "Ações"].map(label => <th key={label} scope="col" className="px-5 py-3">{label}</th>)}</tr></thead>
        <tbody className="divide-y">{visible.map(person => <tr key={person.id} className="hover:bg-primary/[0.03]">
          <td className="px-5 py-4 font-medium"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">{(person.full_name || "?").slice(0, 1).toUpperCase()}</span>{person.full_name || "Sem nome"}{person.id === user.id && <Badge variant="outline">Você</Badge>}</div></td>
          <td className="px-5 py-4"><Badge variant="secondary">{roles[person.role as keyof typeof roles] ?? person.role}</Badge></td>
          <td className="px-5 py-4"><Badge variant={person.active ? "outline" : "secondary"}>{person.active ? "Ativo" : "Inativo"}</Badge></td>
          <td className="px-5 py-4 text-muted-foreground">{workspace.data?.units.find(unit => unit.id === person.unit_id)?.name || "Não informada nesta consulta"}</td>
          <td className="px-5 py-4">{person.id !== user.id && ["staff", "manager", ...(user.role === "owner" ? ["admin"] : [])].includes(person.role) ? <Button type="button" variant="outline" size="sm" aria-label={`Editar / recuperar senha de ${person.full_name || "usuário"}`} onClick={() => setEditingId(person.id)}>Editar / recuperar senha</Button> : <span className="text-xs text-muted-foreground">Conta protegida</span>}</td>
        </tr>)}</tbody></table>
        {!list.isLoading && !visible.length && <p className="p-8 text-center text-sm text-muted-foreground">Nenhum usuário encontrado para estes filtros.</p>}
      </div>}
      <p className="border-t px-5 py-4 text-xs text-muted-foreground">Consulta limitada a 200 usuários. Unidade atual não representa todas as unidades autorizadas. Último acesso não é coletado nesta tela. Edição disponível: email e recuperação de senha; perfil, exclusão e desativação não são alterados aqui.</p>
    </section>
    {editingId && <section className="rounded-2xl border bg-card p-5 sm:p-6" aria-label="Edição de conta"><UserAccountEditor key={editingId} id={editingId} close={() => setEditingId(null)} /></section>}
  </main>;
}
