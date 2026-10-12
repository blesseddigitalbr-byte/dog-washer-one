import { Button } from "@/components/ui/button";

export function SimulationConfirmButton({ items, confirmed, pending, onConfirm }: {
  items: { status: string }[];
  confirmed: boolean;
  pending: boolean;
  onConfirm: (includeWarnings: boolean) => void;
}) {
  const warnings = items.some(item => item.status === "warning");
  const eligible = items.some(item => item.status === "valid" || item.status === "warning");
  return <form onSubmit={event => {
    event.preventDefault();
    if (confirmed || pending || !eligible) return;
    const includeWarnings = new FormData(event.currentTarget).get("includeWarnings") === "on";
    if (!includeWarnings && !items.some(item => item.status === "valid")) return;
    onConfirm(includeWarnings);
  }} className="space-y-3">
    {warnings && !confirmed && <label className="flex items-start gap-2 text-sm text-foreground">
      <input name="includeWarnings" type="checkbox" disabled={pending} className="mt-1 h-4 w-4 accent-primary" />
      Revisei os avisos e quero incluir também essas datas.
    </label>}
    <Button type="submit" disabled={confirmed || pending || !eligible} className="w-full">
      {confirmed ? "Agenda já incluída" : pending ? "Confirmando…" : "Incluir na agenda oficial"}
    </Button>
    {warnings && !confirmed && <p className="text-xs text-muted-foreground">Sem marcar a opção, somente as datas válidas serão incluídas.</p>}
  </form>;
}
