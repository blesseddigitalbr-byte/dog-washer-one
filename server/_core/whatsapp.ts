import type { Express, Request, Response } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { authenticateRequest } from "./context.js";

function getConfig() {
  return {
    graphApiVersion: process.env.WHATSAPP_GRAPH_API_VERSION ?? "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
    appSecret: process.env.WHATSAPP_APP_SECRET ?? "",
    allowedRecipients: (process.env.WHATSAPP_TEST_RECIPIENTS ?? "")
      .split(",")
      .map(normalizePhone)
      .filter(Boolean),
    testMode: process.env.WHATSAPP_TEST_MODE !== "false",
  };
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string, appSecret: string) {
  if (!signature || !appSecret) return false;
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);
}

export function registerWhatsAppRoutes(app: Express) {
  app.get("/api/whatsapp/status", (_req, res) => {
    const config = getConfig();
    res.json({
      configured: Boolean(config.graphApiVersion && config.accessToken && config.phoneNumberId && config.verifyToken && config.appSecret && config.allowedRecipients.length),
      webhookConfigured: Boolean(config.verifyToken),
      phoneConfigured: Boolean(config.phoneNumberId),
      testMode: config.testMode,
    });
  });

  app.get("/api/whatsapp/webhook", (req: Request, res: Response) => {
    const config = getConfig();
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === config.verifyToken && challenge) {
      return res.status(200).send(String(challenge));
    }

    return res.sendStatus(403);
  });

  app.post("/api/whatsapp/webhook", (req: Request, res: Response) => {
    const config = getConfig();
    const signature = req.header("x-hub-signature-256") ?? "";
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!config.appSecret || !rawBody) return res.sendStatus(503);
    if (!verifyWebhookSignature(rawBody, signature, config.appSecret)) {
      return res.sendStatus(401);
    }
    // A Meta exige resposta rápida. A persistência das conversas será ligada ao
    // Supabase na próxima etapa; não registramos conteúdo sensível nos logs.
    const hasWhatsAppEvent = req.body?.object === "whatsapp_business_account";
    if (!hasWhatsAppEvent) return res.sendStatus(404);
    return res.sendStatus(200);
  });

  app.post("/api/whatsapp/send-test", async (req: Request, res: Response) => {
    const config = getConfig();
    const authentication = await authenticateRequest(req);
    if (!authentication) return res.sendStatus(401);
    if (!["owner", "admin", "manager"].includes(authentication.user.role)) {
      return res.sendStatus(403);
    }
    if (!config.testMode) {
      return res.status(403).json({ error: "O envio de teste está desativado." });
    }

    const to = normalizePhone(String(req.body?.to ?? ""));
    const body = String(req.body?.body ?? "").trim();
    if (!/^\d{12,15}$/.test(to) || !body || body.length > 1000) {
      return res.status(400).json({ error: "Número ou mensagem de teste inválidos." });
    }
    if (!config.allowedRecipients.includes(to)) {
      return res.status(403).json({ error: "Número não autorizado para o piloto." });
    }
    if (!config.graphApiVersion || !config.accessToken || !config.phoneNumberId) {
      return res.status(503).json({ error: "Credenciais da Meta ainda não configuradas." });
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "text",
            text: { preview_url: false, body },
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: "A Meta recusou o envio.", details: result });
      }
      return res.json({ ok: true, messageId: result?.messages?.[0]?.id ?? null });
    } catch {
      return res.status(502).json({ error: "Não foi possível conectar à Meta." });
    }
  });
}
