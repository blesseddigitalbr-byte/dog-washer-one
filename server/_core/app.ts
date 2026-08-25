import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";
import healthRouter from "./healthRouter.js";
import { registerUploadRoutes } from "./uploadHandler.js";
import { registerWhatsAppRoutes } from "./whatsapp.js";

export function createApiApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({
    limit: "10mb",
    verify: (req, _res, buffer) => {
      (req as typeof req & { rawBody?: Buffer }).rawBody = buffer;
    },
  }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  registerUploadRoutes(app);
  registerWhatsAppRoutes(app);
  app.use("/api/health", healthRouter);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  return app;
}
