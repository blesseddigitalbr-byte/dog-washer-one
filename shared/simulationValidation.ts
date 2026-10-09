type Item = { scheduled_at: string; include_grooming?: boolean; appointment_id?: string | null };
type Package = { status: string; contract_date: string; expiry_date?: string | null; balance_baths: number; balance_groomings: number };
const salonDate = (value: Date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
}).format(value);

/** Revalidation before writing; not a substitute for database concurrency protection. */
export function validateSimulationSelection(items: Item[], durationMinutes: number, pkg?: Package | null) {
  if (!items.length) throw new Error("Selecione ao menos um atendimento");
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) throw new Error("Duração do serviço inválida");
  const dates = items.map(item => {
    if (item.appointment_id) throw new Error("Uma data já foi incluída na agenda; recarregue a simulação");
    const date = new Date(item.scheduled_at);
    if (!Number.isFinite(date.getTime())) throw new Error("Data de atendimento inválida");
    return date;
  }).sort((a, b) => a.getTime() - b.getTime());
  for (let index = 1; index < dates.length; index++) {
    if (dates[index].getTime() < dates[index - 1].getTime() + durationMinutes * 60000)
      throw new Error("Há sobreposição entre as datas da própria simulação");
  }
  if (!pkg) return;
  if (pkg.status !== "active") throw new Error("O pacote não está ativo; revise a contratação");
  for (const date of dates) {
    const day = salonDate(date);
    if (day < pkg.contract_date || (pkg.expiry_date && day > pkg.expiry_date))
      throw new Error("Há atendimento fora da vigência do pacote; ajuste as datas");
  }
  const groomingCount = items.filter(item => item.include_grooming).length;
  if (items.length > Number(pkg.balance_baths) || groomingCount > Number(pkg.balance_groomings))
    throw new Error("As datas selecionadas excedem o saldo de banho ou tosa/trimming do pacote");
}
