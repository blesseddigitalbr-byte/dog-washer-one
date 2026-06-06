import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const SUPABASE_URL = "https://cdfjjhbczgyyogocioro.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
}

// Initialize Supabase client with service_role key (backend only)
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

/**
 * Test Supabase connection
 * Returns connection status and database info
 */
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("users").select("count", { count: "exact", head: true });

    if (error) {
      throw error;
    }

    // Get database version via raw SQL
    const { data: versionData, error: versionError } = await supabase.rpc("get_database_version", {});

    if (versionError) {
      throw versionError;
    }

    return {
      connected: true,
      timestamp: new Date().toISOString(),
      database_version: versionData?.version || "unknown",
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
}
