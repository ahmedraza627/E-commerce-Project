import config from '../config/env.js';
import { User } from '../models/user.model.js';
import { RefreshToken } from '../models/refreshToken.model.js';
import { ApiError, asyncHandler, ok } from '../utils/apiError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../utils/tokens.js';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies.js';

/**
 * Issues a new token pair, persists the hashed refresh token as a session
 * record, and sets both tokens as HTTP-only cookies.
 */
async function issueSession(res, user, req) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    expiresAt: new Date(Date.now() + config.cookies.maxAgeMs),
  });

  setAuthCookies(res, { accessToken, refreshToken });
  return { accessToken, refreshToken };
}

// POST /api/v1/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (await User.findByEmail(email)) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({ name, email, password });
  await issueSession(res, user, req);

  ok(res, { status: 201, message: 'Account created successfully', data: { user } });
});

// POST /api/v1/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findByEmail(email).select('+password +lastLoginAt');
  // Same generic message for unknown email and wrong password — no account enumeration.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated');
  }

  user.lastLoginAt = new Date();
  await user.save();

  await issueSession(res, user, req);
  ok(res, { message: 'Logged in successfully', data: { user } });
});

// POST /api/v1/auth/refresh — rotates the refresh token on every use
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[config.cookies.refreshName];
  if (!token) throw ApiError.unauthorized('No refresh token provided');

  const payload = verifyRefreshToken(token);
  if (!payload?.sub) {
    clearAuthCookies(res);
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const stored = await RefreshToken.findOne({ tokenHash: hashToken(token) });
  if (!stored?.isActive()) {
    // Replay of an already-rotated token ⇒ possible theft: kill the whole family.
    if (stored?.replacedByTokenHash) {
      await RefreshToken.updateMany(
        { user: stored.user, revokedAt: null },
        { revokedAt: new Date() },
      );
    }
    clearAuthCookies(res);
    throw ApiError.unauthorized('Session expired — please log in again');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    clearAuthCookies(res);
    throw ApiError.unauthorized('Account no longer active');
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  stored.revokedAt = new Date();
  stored.replacedByTokenHash = hashToken(refreshToken);
  await stored.save();
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    expiresAt: new Date(Date.now() + config.cookies.maxAgeMs),
  });

  setAuthCookies(res, { accessToken, refreshToken });
  ok(res, { message: 'Token refreshed', data: { user } });
});

// POST /api/v1/auth/logout — revokes the current session only
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[config.cookies.refreshName];
  if (token) {
    const payload = verifyRefreshToken(token);
    if (payload?.sub) {
      await RefreshToken.updateOne(
        { tokenHash: hashToken(token), user: payload.sub, revokedAt: null },
        { revokedAt: new Date() },
      );
    }
  }
  clearAuthCookies(res);
  ok(res, { message: 'Logged out' });
});

// POST /api/v1/auth/logout-all — revokes every active session for the user
export const logoutAllDevices = asyncHandler(async (req, res) => {
  await RefreshToken.updateMany(
    { user: req.user._id, revokedAt: null },
    { revokedAt: new Date() },
  );
  clearAuthCookies(res);
  ok(res, { message: 'Logged out on all devices' });
});

// GET /api/v1/auth/me
export const me = asyncHandler(async (req, res) => {
  ok(res, { message: 'Current user', data: { user: req.user } });
});
