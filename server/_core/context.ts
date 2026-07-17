import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { supabaseAdmin } from "./supabase.js";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  displayName: string | null;
  phone: string | null;
  role: "owner" | "admin" | "manager" | "staff" | "student";
  organizationId: string | null;
  unitId: string | null;
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: CurrentUser | null;
  accessToken: string | null;
};

export async function authenticateRequest(
  req: CreateExpressContextOptions["req"],
): Promise<{ user: CurrentUser; accessToken: string } | null> {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user?.email) return null;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("full_name, display_name, phone, role, organization_id, unit_id, active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile?.active) return null;

  return {
    accessToken: token,
    user: {
      id: data.user.id,
      email: data.user.email,
      name: profile.full_name ?? data.user.user_metadata?.full_name ?? null,
      displayName:
        profile.display_name ??
        data.user.user_metadata?.display_name ??
        profile.full_name ??
        null,
      phone: profile.phone ?? null,
      role: profile.role,
      organizationId: profile.organization_id,
      unitId: profile.unit_id,
    },
  };
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: CurrentUser | null = null;
  let accessToken: string | null = null;

  try {
    const authentication = await authenticateRequest(opts.req);
    user = authentication?.user ?? null;
    accessToken = authentication?.accessToken ?? null;
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    accessToken,
  };
}
