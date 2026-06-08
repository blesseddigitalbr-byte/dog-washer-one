import { Router } from "express";
import type { Response } from "express";
import { storagePut } from "../storage";
import { addPetPhoto } from "../db";

const router = Router();

router.post("/upload", async (req: any, res: Response) => {
  try {
    const { file: base64File, fileName, mimeType, petId } = req.body;

    if (!base64File) {
      res.status(400).json({ error: "Nenhum arquivo foi enviado" });
      return;
    }

    if (!petId) {
      res.status(400).json({ error: "petId é obrigatório" });
      return;
    }

    // Validate file type
    if (!mimeType || !mimeType.startsWith("image/")) {
      res.status(400).json({ error: "Apenas arquivos de imagem são permitidos" });
      return;
    }

    // Convert Base64 to Buffer
    const base64Data = base64File.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Validate file size (5MB max)
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: "Arquivo muito grande (máximo 5MB)" });
      return;
    }

    // Upload to S3
    const storageFileName = `pets/${petId}/${Date.now()}-${fileName}`;
    const { url, key } = await storagePut(storageFileName, buffer, mimeType);

    // Save metadata to database
    await addPetPhoto({
      petId,
      url,
      fileName,
      fileSize: buffer.length,
      mimeType,
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
