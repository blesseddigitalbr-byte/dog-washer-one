import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function UserAccountEditor({ id, close }: { id: string; close: () => void }) {
  const details = trpc.userAccess.details.useQuery({ id }, { retry: false });
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (details.data) setEmail(details.data.email); }, [details.data]);
  const update = trpc.userAccess.updateEmail.useMutation({ onSuccess: async () => { setSaved(true); setVerified(false); await details.refetch(); toast.success("Email atualizado; perfil e unidades preservados"); }, onError: e => toast.error(e.message) });
  const reset = trpc.userAccess.resetPassword.useMutation({ onSuccess: () => toast.success("Solicitação aceita. Confira a caixa de entrada e o spam; a entrega depende do serviço de email."), onError: e => toast.error(e.message) });
  const pending = update.isPending || reset.isPending;
  return <section className="rounded-lg border p-4 space-y-3" aria-label="Editar conta">
    <h3 className="font-medium">Editar email e recuperar senha</h3>
    {details.error && <p role="alert">{details.error.message}</p>}
    {details.data && <>
      <label className="block">Email correto<Input type="email" value={email} onChange={e => { setEmail(e.target.value); setSaved(false); setVerified(false); }} /></label>
      <label className="flex gap-2"><input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} />Conferi a identidade e a titularidade deste email.</label>
      <Button type="button" disabled={!verified || pending || !email} onClick={() => update.mutate({ id, email, verifiedEmail: true })}>Salvar email</Button>
      <p className="text-sm">O link será enviado ao email salvo. Nenhuma senha atual é consultada ou reenviada.</p>
      <Button type="button" variant="outline" disabled={pending || email !== details.data.email} onClick={() => { if (window.confirm(`Enviar link de recuperação para ${details.data.email}?`)) reset.mutate({ id, confirmed: true }); }}>Enviar link de recuperação</Button>
      {saved && <p role="status">Email salvo.</p>}
    </>}
    <Button type="button" variant="ghost" onClick={close}>Fechar edição</Button>
  </section>;
}
