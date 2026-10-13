import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let live = true;
    const { data } = supabase.auth.onAuthStateChange((event, session) => { if (live && session && event === "PASSWORD_RECOVERY") setReady(true); });
    supabase.auth.getSession().then(({ data }) => { if (live) setReady(!!data.session); });
    return () => { live = false; data.subscription.unsubscribe(); };
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready || pending) return;
    if (password !== confirmation) { setMessage("As senhas precisam ser iguais."); return; }
    setPending(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setMessage("Não foi possível atualizar. Confira os requisitos de senha ou solicite um novo link."); return; }
      setPassword(""); setConfirmation(""); setReady(false);
      await supabase.auth.signOut();
      setMessage("Senha atualizada. Volte ao login e entre com a nova senha.");
    } catch { setMessage("Falha de conexão. Tente novamente."); }
    finally { setPending(false); }
  }
  return <main className="min-h-screen flex items-center justify-center bg-purple-50 p-6"><form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-6 space-y-4">
    <h1 className="text-xl font-semibold">Definir nova senha</h1>
    {!ready && <p>Abra o link válido recebido por email para continuar.</p>}
    {ready && <><label className="block">Nova senha<Input type={visible ? "text" : "password"} autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label className="block">Confirmar senha<Input type={visible ? "text" : "password"} autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
      <Button type="button" variant="outline" aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? "Ocultar senha" : "Mostrar senha"}</Button>
      <p className="text-sm">Use pelo menos 12 caracteres.</p><Button disabled={pending} type="submit">{pending ? "Salvando..." : "Salvar nova senha"}</Button></>}
    {message && <p role="status">{message}</p>}<a href="/" className="block underline">Voltar ao login</a>
  </form></main>;
}
