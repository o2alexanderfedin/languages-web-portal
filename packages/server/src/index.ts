// CRITICAL: import express-async-errors first to patch Express 4
import "express-async-errors";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRouter from "./routes/health.js";

const app = express();

// Security and parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", healthRouter);

// Development mode placeholder
if (config.nodeEnv === "development") {
  console.log("[dev] Vite middleware will be added in Plan 02");
}

// Production mode placeholder
if (config.nodeEnv === "production") {
  // Static file serving will be added in Plan 02
}

// Error handler MUST be last
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Version: ${config.version}`);
});

// Export for testing
export default app;
