const administrative = new Set(["/users", "/settings", "/branding", "/integrations"]);
const management = new Set(["/financial", "/splits", "/team", "/reports", "/services", "/plans", "/products"]);
const operational = new Set(["/", "/schedule", "/appointments", "/schedule-simulator", "/clients", "/packages", "/students", "/units", "/profile"]);
export function canAccessRoute(role: string | null | undefined, path: string): boolean {
  const route = path.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  if (administrative.has(route)) return ["owner", "admin"].includes(role ?? "");
  if (management.has(route)) return ["owner", "admin", "manager"].includes(role ?? "");
  if (operational.has(route)) return ["owner", "admin", "manager", "staff"].includes(role ?? "");
  return false;
}
