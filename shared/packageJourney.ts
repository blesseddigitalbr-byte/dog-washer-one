type JourneyPackage = {
  id: string; client_id: string; pet_id: string; unit_id: string;
  contract_date: string; expiry_date?: string | null; operational_status: string;
  balance_baths: number; balance_groomings: number;
};
/** Presentation only: preserves original contract status and financial records. */
export function packageJourney<T extends JourneyPackage>(packages: T[], today: string) {
  return packages.map(pkg => {
    const successor = ["expired", "consumed"].includes(pkg.operational_status)
      ? packages.find(next => next.id !== pkg.id && next.unit_id === pkg.unit_id
        && next.client_id === pkg.client_id && next.pet_id === pkg.pet_id
        && next.contract_date >= pkg.contract_date && next.contract_date <= today
        && ["active", "expiring"].includes(next.operational_status)
        && (!next.expiry_date || next.expiry_date >= today)
        && Number(next.balance_baths) + Number(next.balance_groomings) > 0)
      : undefined;
    return { ...pkg, archived_after_replacement: Boolean(successor), replacement_package_id: successor?.id ?? null };
  });
}
