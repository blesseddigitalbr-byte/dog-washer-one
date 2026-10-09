import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function StudentPortfolio({ student, onClose }: { student: { id: string; name: string } | null; onClose: () => void }) {
  const query = trpc.students.portfolio.useQuery({ studentId: student?.id ?? "" }, { enabled: !!student, retry: false });
  const relationName = (value: unknown) => {
    const row = Array.isArray(value) ? value[0] : value;
    return row && typeof row === "object" && "name" in row ? String(row.name) : "Não informado";
  };
  const deliveryLabel: Record<string, string> = { awaiting_mapping: "Aguardando vínculo com aluno, curso e sessão do portal", queued: "Referência aguardando envio", delivered: "Referência entregue ao portal — não confirma presença", needs_review: "Sincronização requer revisão", not_queued: "Referência ainda não preparada" };
  return <Dialog open={!!student} onOpenChange={open => !open && onClose()}><DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Práticas do aluno · {student?.name}</DialogTitle></DialogHeader>
    <p className="text-sm text-muted-foreground">Histórico operacional, sem split ou repasse. O portfólio acadêmico permanece no portal Unidogwasher. Integração ainda não conectada.</p>
    <p className="text-sm">No portal, o aluno registra a presença, identifica o cão e completa protocolos e ocorrências. Só depois o registro fica pendente de avaliação pelo instrutor. Concluir no DWO não confirma presença nem aprovação acadêmica.</p>
    {query.isLoading && <p>Carregando práticas...</p>}
    {query.error && <p role="alert">{query.error.message}</p>}
    {query.data && <><p>{query.data.entries.length} atendimento(s) concluído(s) · {(query.data.plannedPracticeMinutes / 60).toFixed(1)} h de duração prevista</p><p className="text-xs text-muted-foreground">A duração prevista não equivale a horas acadêmicas validadas. Fotos, avaliação e validação de carga horária serão incorporadas à integração.</p>
      {!query.data.entries.length && <p>Nenhuma prática concluída registrada para este aluno.</p>}
      {query.data.entries.map(entry => <article key={entry.id} className="rounded-xl border bg-white p-4 space-y-1"><p>{relationName(entry.service)} · {relationName(entry.pet)}</p><p className="text-sm">{new Date(entry.appointment_date).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p><p className="text-sm text-muted-foreground">Supervisor: {relationName(entry.professional)} · Duração prevista: {entry.duration_minutes} min</p><p className="text-xs text-muted-foreground">Referência única: {entry.id} · {deliveryLabel[entry.syncStatus] || "Estado requer revisão"}</p></article>)}</>}
  </DialogContent></Dialog>;
}
