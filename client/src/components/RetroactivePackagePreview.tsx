import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const reasons: Record<string, string> = {
  invalid_date: "Data inválida", identity_mismatch: "Tutor, pet ou unidade divergentes",
  not_completed: "Não concluído ou baixa revertida", already_allocated: "Já vinculado — exige revisão auditada",
  outside_coverage: "Fora da cobertura proposta", invalid_consumption: "Consumo inválido",
  insufficient_balance: "Saldo insuficiente para todos os serviços",
};
export function RetroactivePackagePreview({ contract }: { contract: any }) {
  const [start, setStart] = useState(contract.contract_date);
  const [requestedStart, setRequestedStart] = useState<string | null>(null);
  const query = trpc.clientPackages.retroactivePreview.useQuery(
    { id: contract.id, coverageStart: requestedStart || contract.contract_date },
    { enabled: Boolean(requestedStart), retry: false },
  );
  return <section className="space-y-3 rounded-xl border p-5 text-sm">
    <h3 className="font-medium">Atendimentos anteriores à contratação</h3>
    <p className="text-muted-foreground">Confira serviços que poderão ser cobertos por este contrato. Esta prévia não desconta saldo, não altera pagamentos e não transfere consumos anteriores.</p>
    <div className="flex flex-wrap items-end gap-3">
      <label className="space-y-1">Início da cobertura proposta
        <Input type="date" value={start} max={contract.contract_date} onChange={e => { setStart(e.target.value); setRequestedStart(null); }} />
      </label>
      <Button variant="outline" disabled={!start || start > contract.contract_date || query.isFetching || contract.status !== "active"}
        onClick={() => { if (requestedStart === start) void query.refetch(); else setRequestedStart(start); }}>
        {query.isFetching ? "Conferindo…" : "Conferir atendimentos"}
      </Button>
    </div>
    {query.error && <p role="alert" className="text-destructive">{query.error.message}</p>}
    {requestedStart && query.data && !query.isFetching && <>
      <p>Saldo após a proposta: {query.data.remainingBaths} banhos e {query.data.remainingGroomings} tosas.</p>
      {query.data.allocations.length === 0 ? <p>Nenhum atendimento concluído encontrado nesse período.</p>
        : <ul className="max-h-64 space-y-2 overflow-auto" aria-label="Resultado da conferência">
          {query.data.allocations.map(a => {
            const visit = query.data.visits.find(v => v.id === a.visitId);
            return <li key={a.visitId} className="rounded-lg border p-3">
              <span>{visit?.date.split("-").reverse().join("/")} · 1 banho{visit?.groomings ? " + 1 tosa do pacote" : ""}</span>
              <p className={a.eligible ? "text-primary" : "text-muted-foreground"}>{a.eligible ? "Elegível na prévia — aguardando confirmação" : reasons[a.reason || ""] || "Revisão necessária"}</p>
            </li>;
          })}
        </ul>}
      <p className="text-muted-foreground">Confirmação indisponível até homologação da gravação transacional. Tosas pagas por fora precisam ser identificadas separadamente.</p>
    </>}
  </section>;
}
