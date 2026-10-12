import "dotenv/config";
import { createServer } from "http";
import { listenConfig } from "./listenConfig";
import { createApiApp } from "./app";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = createApiApp();
  const server = createServer(app);

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const { port, host } = listenConfig(process.env);
  server.on("error", error => {
    console.error("Servidor não pôde iniciar:", error.message);
    process.exitCode = 1;
  });
  server.listen(port, host, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(error => {
  console.error("Falha ao iniciar servidor:", error.message);
  process.exitCode = 1;
});
