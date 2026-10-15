import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

export default function SystemPageHeader({ title, description, organization, unit, profile, action }: {
  title: string; description: string; organization?: string; unit?: string; profile: string; action?: ReactNode;
}) {
  return <header className="overflow-hidden rounded-2xl border bg-card shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3 text-xs sm:px-6">
      <span className="font-medium text-primary">Sistema <span className="mx-2 text-muted-foreground">/</span> {title}</span>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground"><span>Organização: {organization || "Não informada"}</span><span>Unidade: {unit || "Não informada"}</span></div>
    </div>
    <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
      <div className="max-w-3xl"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></div>
      {action}
    </div>
    <div className="mx-5 mb-5 flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-3 text-sm sm:mx-6 sm:mb-6">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <p><span className="font-medium">Seu perfil: {profile}.</span> As ações disponíveis respeitam suas permissões. A troca de unidade não amplia seus acessos.</p>
    </div>
  </header>;
}
