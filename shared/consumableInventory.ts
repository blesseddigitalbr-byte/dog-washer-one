export type InventoryMovement = {
  kind: "purchase" | "consumption" | "loss";
  quantity: number;
  unitCostCents?: number;
};
/** Pure preview for internal supplies. Canonical stock is persisted by move_salon_supply. */
export function previewInventoryMovement(balance: number, movement: InventoryMovement) {
  if (!Number.isFinite(balance) || balance < 0) throw new Error("Saldo inválido");
  if (!Number.isFinite(movement.quantity) || movement.quantity <= 0) throw new Error("Quantidade deve ser positiva");
  if (movement.kind === "purchase" && (!Number.isSafeInteger(movement.unitCostCents) || movement.unitCostCents! < 0)) throw new Error("Custo de compra inválido");
  if (!["purchase", "consumption", "loss"].includes(movement.kind)) throw new Error("Movimentação inválida");
  const next = balance + (movement.kind === "purchase" ? movement.quantity : -movement.quantity);
  if (!Number.isFinite(next)) throw new Error("Quantidade fora do limite");
  if (next < 0) throw new Error("Estoque insuficiente");
  const cost = movement.kind === "purchase" ? Math.round(movement.quantity * movement.unitCostCents!) : null;
  if (cost !== null && !Number.isSafeInteger(cost)) throw new Error("Custo fora do limite");
  return { balance: next, purchaseCostCents: cost };
}
