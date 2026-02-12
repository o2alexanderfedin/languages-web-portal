import { Router } from "express";
import type { HealthResponse } from "@repo/shared";
import { config } from "../config/env.js";

const router = Router();

/**
 * Health check endpoint
 * GET /api/health
 */
router.get("/health", (req, res) => {
  const healthResponse: HealthResponse = {
    status: "ok",
    timestamp: Date.now(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: config.version,
  };

  res.json(healthResponse);
});

export default router;
