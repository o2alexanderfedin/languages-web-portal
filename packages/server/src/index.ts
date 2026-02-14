// CRITICAL: import express-async-errors first to patch Express 4
import "express-async-errors";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRouter from "./routes/health.js";
import uploadRouter from "./routes/upload.js";
import examplesRouter from "./routes/examples.js";
import executeRouter from "./routes/execute.js";
import streamRouter from "./routes/stream.js";
import outputRouter from "./routes/output.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Security and parsing middleware
if (config.nodeEnv === "production") {
  app.use(helmet());
} else {
  // In dev mode, disable CSP so Vite's inline scripts and HMR WebSocket work
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
}
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true }));

// API routes (MUST be before Vite middleware and static files)
app.use("/api", healthRouter);
app.use("/api", uploadRouter);
app.use("/api", examplesRouter);
app.use("/api", executeRouter);
app.use("/api", streamRouter);
app.use("/api", outputRouter);

// Development mode: Vite middleware
if (config.nodeEnv === "development") {
  const { createServer: createViteServer } = await import("vite");
  const clientRoot = path.resolve(__dirname, "../../client");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
    root: clientRoot,
  });
  app.use(vite.middlewares);
  console.log("[dev] Vite middleware enabled");
}

// Production mode: static file serving
if (config.nodeEnv === "production") {
  const clientDistPath = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDistPath));

  // Catch-all route for client-side routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
  console.log("[prod] Serving static files from", clientDistPath);
}

// Error handler MUST be last
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Version: ${config.version}`);
});

// Export for testing
export default app;
