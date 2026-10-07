import { z } from "zod";
const color = z.string().regex(/^#[0-9a-f]{6}$/i, "Use uma cor hexadecimal, como #7C3AED");
export const brandingSchema = z.object({
  display_name: z.string().trim().min(2).max(80),
  signature: z.enum(["by", "network"]),
  primary_color: color,
  secondary_color: color,
  background_color: color,
});
export const neutralBrand = { display_name: "DWO", signature: "by" as const, primary_color: "#7C3AED", secondary_color: "#0891B2", background_color: "#F3EEFA" };
export function brandSignature(signature: "by" | "network") {
  return signature === "network" ? "Um salão Dog Washer" : "by Dog Washer";
}
export const commercialModules = [
  { id: "salon", name: "Operação do salão", description: "Clientes, pets, agenda e serviços" },
  { id: "packages", name: "Planos e pacotes", description: "Contratos, ciclos e créditos" },
  { id: "finance", name: "Financeiro", description: "Cobranças e conciliação" },
  { id: "partners", name: "Parceiros e repasses", description: "Profissionais, regras e fechamento" },
  { id: "fiscal", name: "Fiscal", description: "Emissão e conciliação de notas" },
  { id: "school", name: "Escola", description: "Alunos, cursos e produtos digitais — última etapa" },
] as const;
