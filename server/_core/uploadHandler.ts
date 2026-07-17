import { Router, type Request, type Response } from "express";
import { authenticateRequest } from "./context.js";
import { supabase, supabaseAdmin, withTenantSupabase } from "./supabase.js";

const router = Router();
const BUCKET = "pet-photos";

router.post("/upload", async (req: Request, res: Response) => {
  try {
    const authentication = await authenticateRequest(req);
    if (!authentication) {
      res.status(401).json({ error: "Sessão inválida ou expirada" });
      return;
    }
    const { user } = authentication;

    const { file, fileName, mimeType, petId } = req.body;
    if (!file || !petId) {
      res.status(400).json({ error: "Arquivo e petId são obrigatórios" });
      return;
    }
    if (!mimeType || !["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      res.status(400).json({ error: "Use uma imagem JPG, PNG ou WebP" });
      return;
    }

    const petExists = await withTenantSupabase(authentication.accessToken, async () => {
      const { data, error } = await supabase
        .from("pets")
        .select("id")
        .eq("id", petId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    });
    if (!petExists) {
      res.status(404).json({ error: "Pet não encontrado nesta organização" });
      return;
    }

    const base64Data = String(file).replace(/^data:image\/[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: "A imagem deve ter no máximo 5 MB" });
      return;
    }

    const safeName = String(fileName || "photo")
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .slice(-100);
    const tenant = user.organizationId ?? `user-${user.id}`;
    const key = `${tenant}/pets/${petId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(key, buffer, { contentType: mimeType, upsert: false });
    if (uploadError) throw uploadError;

    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(key, 60 * 10);
    if (signedError) throw signedError;

    res.json({ url: signed.signedUrl, key, success: true });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Erro ao armazenar a foto" });
  }
});

export function registerUploadRoutes(app: { use: Function }) {
  app.use("/api", router);
}
