/** Managed hosting must listen on the assigned port, never silently switch it. */
export function listenConfig(env: Record<string, string | undefined>) {
  const raw = env.PORT ?? "3000";
  if (!/^\d+$/.test(raw)) throw new Error("PORT deve ser um inteiro válido");
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT fora do intervalo permitido");
  return { port, host: "0.0.0.0" };
}
