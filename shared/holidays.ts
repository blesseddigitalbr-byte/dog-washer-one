// National fixed dates: Laws 662/1949, 6.802/1980 and 14.759/2023.
// DF 2026 moving dates: DODF 247, 31/12/2025. Public optional days are not included.
const national: Record<string,string> = {
  "01-01":"Confraternização Universal", "04-21":"Tiradentes", "05-01":"Dia do Trabalho",
  "09-07":"Independência do Brasil", "10-12":"Nossa Senhora Aparecida", "11-02":"Finados",
  "11-15":"Proclamação da República", "11-20":"Consciência Negra", "12-25":"Natal",
};
export function holidayName(date: string, state?: string | null): string | null {
  const fixed = national[date.slice(5)];
  if (fixed) return fixed;
  if (state?.toUpperCase() === "DF") {
    if (date.endsWith("-11-30")) return "Dia do Evangélico (DF)";
    if (date === "2026-04-03") return "Paixão de Cristo (DF, calendário 2026)";
    if (date === "2026-06-04") return "Corpus Christi (DF, calendário 2026)";
  }
  return null;
}
export function holidayAlerts(scheduledAt: string, state?: string | null): string[] {
  const timestamp = new Date(scheduledAt);
  const date = new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(timestamp);
  const name = holidayName(date,state);
  if (!name) return [];
  let next = new Date(`${date}T12:00:00Z`);
  do { next.setUTCDate(next.getUTCDate()+1); } while(holidayName(next.toISOString().slice(0,10),state));
  return [`Feriado: ${name}. Sugestão: ${next.toISOString().slice(0,10)} (conferir expediente e disponibilidade).`];
}
