import { Router } from "express";
import { supabase } from "./supabase";

const router = Router();

// Mask project reference in response (show first 8 and last 4 chars)
function maskProjectRef(ref: string): string {
  if (!ref || ref.length < 8) return "***";
  return `${ref.substring(0, 8)}***${ref.substring(ref.length - 4)}`;
}

// GET /health - Basic health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// GET /supabase/api-health - Supabase API connection health check
// Tests service_role authentication via @supabase/supabase-js SDK
router.get("/supabase/api-health", async (req, res) => {
  try {
    // Simple test: list users (requires service_role key)
    // This validates that:
    // 1. SUPABASE_SERVICE_ROLE_KEY is set and valid
    // 2. Connection to Supabase API works
    // 3. Authentication is successful
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      throw new Error(error.message || "Failed to authenticate with Supabase");
    }

    // Success response (no credentials exposed)
    res.json({
      connected: true,
      project_ref: maskProjectRef("cdfjjhbczgyyogocioro"),
      connection_type: "Supabase API (service_role)",
      auth_method: "JWT (service_role)",
      database: "postgres",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Error response (no credentials or sensitive info exposed)
    res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

// GET / - Root health check
router.get("/", (req, res) => {
  res.json({
    service: "GroomerFlow Backend",
    status: "running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      supabase_api_health: "/supabase/api-health",
    },
  });
});

export default router;
