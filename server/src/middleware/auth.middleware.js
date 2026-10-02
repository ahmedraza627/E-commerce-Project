import config from '../config/env.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';

const extractToken = (req) => {
  // 1) HTTP-only cookie (browser flow — token is invisible to JS)
  if (req.cookies?.[config.cookies.accessName]) {
    return req.cookies[config.cookies.accessName];
  }
  // 2) Authorization header (mobile apps, Postman, service clients)
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
};

/** Requires a valid access token; attaches the fresh user doc to req.user. */
export const protect = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized('Not authenticated — please log in');

    const payload = verifyAccessToken(token);
    if (!payload?.sub) throw ApiError.unauthorized('Invalid or expired session');

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) throw ApiError.unauthorized('Account no longer active');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Same as protect but tolerant of missing tokens (guest browsing).
 * Attaches req.user when a valid token exists.
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    const payload = token ? verifyAccessToken(token) : null;
    if (payload?.sub) {
      const user = await User.findById(payload.sub);
      if (user?.isActive) req.user = user;
    }
    next();
  } catch {
    next(); // guests pass through without a user
  }
};

/** Role gate — use after protect: router.get('/admin-only', protect, authorize('admin'), handler) */
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Requires role: ${roles.join(' or ')}`));
  }
  next();
};
