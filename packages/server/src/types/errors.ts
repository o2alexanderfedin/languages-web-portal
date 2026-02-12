/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string,
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * User error - represents errors caused by user input (4xx)
 * Always operational (recoverable)
 */
export class UserError extends AppError {
  constructor(message: string, statusCode: number = 400, details?: Record<string, unknown>) {
    super(statusCode, message, true, details);
    Object.setPrototypeOf(this, UserError.prototype);
  }
}

/**
 * System error - represents internal server errors (5xx)
 * Always non-operational (requires investigation)
 */
export class SystemError extends AppError {
  constructor(message: string, statusCode: number = 500) {
    super(statusCode, message, false);
    Object.setPrototypeOf(this, SystemError.prototype);
  }
}

/**
 * Not found error - resource not found (404)
 */
export class NotFoundError extends UserError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Validation error - invalid input data (422)
 */
export class ValidationError extends UserError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 422, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
