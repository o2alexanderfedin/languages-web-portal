import type { Request, Response, NextFunction } from "express";
import { AppError } from "../types/errors.js";
import type { ApiError } from "@repo/shared";

/**
 * Express error handling middleware (INFRA-04)
 * Distinguishes user errors (4xx, operational) from system errors (5xx, non-operational)
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle known application errors
  if (err instanceof AppError) {
    const errorType = err.isOperational ? "user_error" : "system_error";
    const logLevel = err.isOperational ? "warn" : "error";
    
    // Log the error
    console[logLevel](`[${errorType}] ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      details: err.details,
    });

    const apiError: ApiError = {
      type: errorType,
      message: err.message,
      ...(err.details && { details: err.details }),
    };

    res.status(err.statusCode).json({ error: apiError });
    return;
  }

  // Handle unknown errors (treat as system errors)
  console.error("[system_error] Unexpected error occurred:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const apiError: ApiError = {
    type: "system_error",
    message: "An unexpected error occurred",
  };

  res.status(500).json({ error: apiError });
}
