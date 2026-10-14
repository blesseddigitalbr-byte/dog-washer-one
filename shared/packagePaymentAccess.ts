export function canManagePackagePayments(role: string | null | undefined) {
  return ["owner", "admin", "manager"].includes(role ?? "");
}
export const packagePaymentFields = ["payment_status", "payment_date", "payment_method"] as const;
export function packageForRole<T extends Record<string, any>>(record: T, role: string | null | undefined): T {
  const result = { ...record };
  if (!canManagePackagePayments(role)) for (const field of packagePaymentFields) delete result[field];
  return result;
}
