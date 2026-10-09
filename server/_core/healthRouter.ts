import { Router } from "express";

const router = Router();
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// Retire the public privileged diagnostic; never enumerate users here.
router.get("/supabase/api-health", (_req, res) => {
  res.status(410).json({ error: "Diagnostic endpoint unavailable" });
});
router.get("/", (_req, res) => {
  res.json({ service: "DWO", status: "running" });
});
export default router;
