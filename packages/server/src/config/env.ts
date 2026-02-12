import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env from package/server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverRoot = join(__dirname, "../..");
dotenv.config({ path: join(serverRoot, ".env") });

// Typed configuration object
export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  logLevel: process.env.LOG_LEVEL || "info",
  version: process.env.VERSION || "0.0.0",
} as const;

// Validate required environment variables
// (none required in phase 1, but structure is ready)
const requiredEnvVars: string[] = [];

const missingVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(", ")}`
  );
}
