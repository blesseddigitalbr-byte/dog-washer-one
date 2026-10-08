import { useState } from "react";
import { Building2, GraduationCap, MapPin, Pencil, Plus, Scissors } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import UnitFormDialog from "@/components/UnitFormDialog";
import { LegalEntityForm } from "@/components/LegalEntityForm";

const MODE_LABELS: Record<string, string> = {
  salon: "Salão",
  school: "Escola",
  hybrid: "Híbrida",
};

const OWNERSHIP_LABELS: Record<string, string> = {
  owned: "Própria",
  licensed: "Licenciada",
  franchised: "Franqueada",
};

function formatTaxId(value?: string | null) {
  if (!value) return "CNPJ não informado";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return value;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

export default function Units() {
  const { user } = useAuth();
  const contextQuery = trpc.workspace.context.useQuery();
  const workspace = contextQuery.data;
  const [unitFormOpen, setUnitFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any | null>(null);
  const [editingEntity, setEditingEntity] = useState<any | null>(null);
  const canManage = user?.role === "owner" || user?.role === "admin";

  if (contextQuery.isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Carregando empresas e unidades...
      </div>
    );
  }

  if (contextQuery.error || !workspace?.organization) {
    return (
      <div className="p-6 text-sm text-red-700">
        Não foi possível carregar a estrutura empresarial.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Estrutura empresarial
            </p>
            <h1 className="text-2xl font-semibold text-foreground">
              Empresas e unidades
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              CNPJs e operações autorizadas para seu usuário no DWO.
            </p>
          </div>
          {canManage && (
            <Button onClick={() => { setEditingUnit(null); setUnitFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova unidade
            </Button>
          )}
        </div>

        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-foreground">
            Pessoas jurídicas
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">Empresas responsáveis pelos dados legais e fiscais. Uma empresa pode ter várias unidades.</p>
          <div className="grid gap-4 lg:grid-cols-2">
            {workspace.legalEntities.map((entity: any) => (
              <article
                key={entity.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {entity.entity_kind === "school"
                        ? "Escola"
                        : entity.entity_kind === "hybrid"
                          ? "Operação híbrida"
                          : "Salão"}
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-foreground">
                      {entity.trading_name ?? entity.company_name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {entity.company_name}
                    </p>
                  </div>
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <p className="font-mono text-sm font-semibold text-primary">
                  {formatTaxId(entity.tax_id)}
                </p>
                {canManage && <Button variant="outline" size="sm" className="mt-4" onClick={() => setEditingEntity(entity)}><Pencil className="mr-2 h-4 w-4" />Editar empresa</Button>}
                {(entity.city || entity.state) && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    {[entity.city, entity.state].filter(Boolean).join(" · ")}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-bold text-foreground">
            Unidades disponíveis
          </h2>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {workspace.units.map((unit: any) => {
              const isCurrent = unit.id === workspace.currentUnit?.id;
              return (
                <article
                  key={unit.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm ${
                    isCurrent
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-slate-200"
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">
                          {unit.name}
                        </h3>
                        {isCurrent && (
                          <span className="rounded-full bg-accent/25 px-2 py-0.5 text-xs font-bold text-primary">
                            Unidade ativa
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {unit.code} ·{" "}
                        {OWNERSHIP_LABELS[unit.ownership_model] ??
                          unit.ownership_model}
                      </p>
                    </div>
                    {unit.operation_mode === "school" ? (
                      <GraduationCap className="h-6 w-6 text-primary" />
                    ) : (
                      <Scissors className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-primary">
                    {MODE_LABELS[unit.operation_mode] ?? unit.operation_mode}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatTaxId(unit.cnpj)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">Empresa vinculada: {workspace.legalEntities.find((entity: any) => entity.id === unit.legal_entity_id)?.trading_name || workspace.legalEntities.find((entity: any) => entity.id === unit.legal_entity_id)?.company_name || "Não vinculada"}</p>
                  {(() => {
                    const company = workspace.legalEntities.find((entity: any) => entity.id === unit.legal_entity_id);
                    const companyTax = (company?.tax_id ?? "").replace(/\D/g, "");
                    const unitTax = (unit.cnpj ?? "").replace(/\D/g, "");
                    return company && unitTax && companyTax !== unitTax ? <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900">{companyTax ? "CNPJ da unidade diferente do CNPJ da empresa vinculada. Confira os cadastros." : "A unidade tem CNPJ, mas a empresa vinculada ainda não. Complete o cadastro da empresa."}</p> : null;
                  })()}
                  {(unit.city || unit.state) && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="h-4 w-4" />
                      {[unit.city, unit.state].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {unit.businessAreas.map((area: any) => (
                      <span
                        key={area.business_area}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                      >
                        {MODE_LABELS[area.business_area] ?? area.business_area}
                        {" · "}
                        {area.cost_center_code}
                      </span>
                    ))}
                  </div>
                  {canManage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-5"
                      onClick={() => {
                        setEditingUnit(unit);
                        setUnitFormOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar unidade
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
      <UnitFormDialog
        open={unitFormOpen}
        onOpenChange={setUnitFormOpen}
        unit={editingUnit}
        legalEntities={workspace.legalEntities}
      />
      <LegalEntityForm entity={editingEntity} onClose={() => setEditingEntity(null)} />
    </div>
  );
}
