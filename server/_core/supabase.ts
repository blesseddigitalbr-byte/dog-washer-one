import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AsyncLocalStorage } from "node:async_hooks";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY must be configured on the server",
  );
}

/** Server-only client. Never expose the service-role key to the browser. */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const requestClient = new AsyncLocalStorage<SupabaseClient>();

function createRequestClient(accessToken: string) {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Runs a protected operation with a Supabase client bound to the user's JWT.
 * This makes Postgres RLS, rather than application convention, the final
 * boundary between organizations.
 */
export function withTenantSupabase<T>(
  accessToken: string,
  operation: () => Promise<T>,
): Promise<T> {
  return requestClient.run(createRequestClient(accessToken), operation);
}

/**
 * Compatibility facade for the existing repositories. It deliberately has no
 * service-role fallback: business queries outside an authenticated request fail.
 */
export const supabase = new Proxy(supabaseAdmin, {
  get(_target, property) {
    const client = requestClient.getStore();
    if (!client) {
      throw new Error("Tenant Supabase client is unavailable outside a protected request");
    }

    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as SupabaseClient;

/**
 * Test Supabase connection
 * Returns connection status and database info
 */
export async function testSupabaseConnection() {
  try {
    const { data, error, count } = await supabaseAdmin
      .from("clientes")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return {
      connected: true,
      timestamp: new Date().toISOString(),
      record_count: count,
    };
  } catch (error) {
    console.error("Connection error:", error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
}
