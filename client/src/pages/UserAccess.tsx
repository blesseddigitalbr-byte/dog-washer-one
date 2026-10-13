import { useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UserAccountEditor from "@/components/UserAccountEditor";

const roles = { owner: "Proprietária", admin: "Administrador", manager: "Gestão", staff: "Operação", student: "Aluno operacional" };
export default function UserAccess() {
  const { user } = useAuth();
  const authorized = !!user && ["owner", "admin"].includes(user.role);
  const list = trpc.userAccess.list.useQuery(undefined, { enabled: authorized, retry: false });
  const workspace = trpc.workspace.context.useQuery(undefined, { enabled: authorized });
  const utils = trpc.useUtils();
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
  return <main className="mx-auto max-w-5xl p-6 space-y-6">
    <header><h1 className="text-2xl font-semibold">Usuários e acessos</h1><p className="mt-2 text-muted-foreground">Logins da organização atual. Profissionais da equipe não recebem login automaticamente.</p></header>
    <form onSubmit={submit} className="rounded-xl border bg-white p-6 space-y-4">
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
    </form>
    <section className="rounded-xl border bg-white p-6"><h2 className="text-lg font-semibold mb-4">Usuários cadastrados</h2>{list.isLoading && <p>Carregando...</p>}{list.error && <p role="alert">{list.error.message}</p>}<ul className="divide-y">{list.data?.map(person => <li key={person.id} className="py-3 flex flex-wrap justify-between gap-2"><span>{person.full_name || "Sem nome"}</span><span>{roles[person.role as keyof typeof roles] ?? person.role} · {person.active ? "Ativo" : "Inativo"}</span>{person.id !== user?.id && ["staff", "manager", ...(user?.role === "owner" ? ["admin"] : [])].includes(person.role) && <Button type="button" variant="outline" onClick={() => setEditingId(person.id)}>Editar / recuperar senha</Button>}</li>)}</ul>{editingId && <UserAccountEditor key={editingId} id={editingId} close={() => setEditingId(null)} />}<p className="mt-3 text-xs text-muted-foreground">Até 200 usuários. Edição de email preserva perfil e unidades. Alteração de papéis, desativação e convites serão tratados separadamente.</p></section>
  </main>;
}
