import { Router } from "express";
import type { Request, Response } from "express";
import { storagePut } from "../storage";
import { addPetPhoto } from "../db";

const router = Router();

router.post("/upload", async (req: any, res: Response) => {
  try {
    // Get file from FormData
    const files = req.files as any;
    if (!files || !files.file) {
      res.status(400).json({ error: "Nenhum arquivo foi enviado" });
      return;
    }

    const file = files.file[0];
    const petId = req.body.petId;

    if (!petId) {
      res.status(400).json({ error: "petId é obrigatório" });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      res.status(400).json({ error: "Arquivo muito grande (máximo 5MB)" });
      return;
    }

    // Validate file type
    if (!file.mimetype.startsWith("image/")) {
      res.status(400).json({ error: "Apenas arquivos de imagem são permitidos" });
      return;
    }

    // Upload to S3
    const fileName = `pets/${petId}/${Date.now()}-${file.originalname}`;
    const { url, key } = await storagePut(fileName, file.buffer, file.mimetype);

    // Save metadata to database
    await addPetPhoto({
      petId,
      url,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    res.json({ url, key });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Erro ao fazer upload da foto",
    });
  }
});

export function registerUploadRoutes(app: any) {
  app.use("/api", router);
}
