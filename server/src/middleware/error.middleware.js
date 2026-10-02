import multer from 'multer';
import config from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

/** 404 for unknown API routes. */
export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Central error handler — the single place responses are shaped for failures.
 * Operational ApiErrors go out with their status; anything else is logged and
 * masked as a 500 so internal details never leak to clients.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let error = err;

  // Mongoose: malformed ObjectId
  if (err.name === 'CastError') error = ApiError.badRequest(`Invalid ${err.path}`);
  // Mongoose: duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    error = ApiError.conflict(`${field} is already in use`);
  }
  // Mongoose: schema validation
  if (err.name === 'ValidationError') {
    error = ApiError.badRequest('Validation failed', Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })));
  }
  // Multer: file too large
  if (err instanceof multer.MulterError) {
    error = ApiError.badRequest(`Upload error: ${err.message}`);
  }
  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    error = ApiError.badRequest('Malformed JSON body');
  }

  const isOperational = error.isOperational === true;
  const statusCode = error.statusCode ?? 500;

  if (!isOperational) {
    // Log unexpected errors with stack for debugging
    console.error(`[unhandled] ${req.method} ${req.originalUrl}\n`, error);
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational || !config.isProd ? error.message : 'Internal server error',
    ...(error.details && { details: error.details }),
    ...(!isOperational && config.isProd && { requestId: req.id }),
  });
}
