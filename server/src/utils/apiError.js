/** Operational error with an HTTP status code — safe to surface to clients. */
export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = 'Not authenticated') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message);
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
  static conflict(message) {
    return new ApiError(409, message);
  }
}

/** Wraps async route handlers so rejections flow into the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/** Uniform success envelope. */
export const ok = (res, { status = 200, message = 'OK', data = null } = {}) =>
  res.status(status).json({ success: true, message, data });
