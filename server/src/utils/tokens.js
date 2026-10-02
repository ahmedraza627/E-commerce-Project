import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import config from '../config/env.js';
import { ApiError } from './apiError.js';

const ACCESS_AUDIENCE = 'shopswift:web';

// jti guarantees every signed token is unique even when issued within the same
// second with identical payloads (same iat would otherwise yield byte-identical
// JWTs and collide on the unique tokenHash index during fast rotation).
const jti = () => crypto.randomUUID();

export const signAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role, jti: jti() }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
    audience: ACCESS_AUDIENCE,
    issuer: 'shopswift-api',
  });

export const signRefreshToken = (user) =>
  jwt.sign({ sub: user._id.toString(), jti: jti() }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
    audience: ACCESS_AUDIENCE,
    issuer: 'shopswift-api',
  });

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.accessSecret, {
      audience: ACCESS_AUDIENCE,
      issuer: 'shopswift-api',
    });
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret, {
      audience: ACCESS_AUDIENCE,
      issuer: 'shopswift-api',
    });
  } catch {
    return null;
  }
};

/** Opaque random string stored hashed in DB — lets us revoke a single session. */
export const generateTokenId = () => crypto.randomBytes(32).toString('hex');

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
