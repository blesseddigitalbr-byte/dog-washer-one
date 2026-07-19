import { Building2, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const MODE_LABELS: Record<string, string> = {
  salon: "Salão",
  school: "Escola",
  hybrid: "Híbrida",
};

export default function UnitSwitcher() {
  const utils = trpc.useUtils();
  const contextQuery = trpc.workspace.context.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const switchUnit = trpc.workspace.switchUnit.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.workspace.context.invalidate(),
        utils.auth.me.invalidate(),
      ]);
      toast.success("Unidade alterada");
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || "Não foi possível alterar a unidade");
    },
  });

  const workspace = contextQuery.data;
  const units = workspace?.units ?? [];
  const currentUnit = workspace?.currentUnit;

  if (contextQuery.isLoading) {
    return (
      <div className="hidden min-w-56 animate-pulse rounded-xl bg-slate-100 px-4 py-3 md:block">
        <div className="mb-2 h-3 w-24 rounded bg-slate-200" />
        <div className="h-4 w-36 rounded bg-slate-200" />
      </div>
    );
  }

  if (!workspace?.organization || !currentUnit) return null;

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="hidden rounded-lg bg-[#D8B768]/20 p-2 text-[#113A7A] sm:block">
        <Building2 className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {workspace.organization.trading_name ?? workspace.organization.name}
        </p>
        <div className="relative flex items-center">
          <select
            aria-label="Unidade ativa"
            value={currentUnit.id}
            disabled={units.length < 2 || switchUnit.isPending}
            onChange={(event) => {
              if (event.target.value !== currentUnit.id) {
                switchUnit.mutate({ unitId: event.target.value });
              }
            }}
            className="max-w-52 appearance-none truncate bg-transparent pr-7 text-sm font-bold text-[#07111E] outline-none disabled:cursor-default"
          >
            {units.map((unit: any) => (
              <option key={unit.id} value={unit.id}>
                {unit.name} · {MODE_LABELS[unit.operation_mode] ?? unit.operation_mode}
              </option>
            ))}
          </select>
          {units.length > 1 && (
            <ChevronsUpDown className="pointer-events-none absolute right-0 h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>
    </div>
  );
}
