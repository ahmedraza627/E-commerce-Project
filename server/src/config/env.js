import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Always load server/.env relative to this file, regardless of process.cwd()
// (e.g. `node server/src/server.js` from the repo root still finds its config)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const nodeEnv = process.env.NODE_ENV ?? 'development';

const config = Object.freeze({
  nodeEnv,
  isProd: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT) || 5000, // empty/invalid PORT falls back to 5000

  mongoUri: required('MONGO_URI'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  },

  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',

  cookies: {
    // Refresh token rides in an HTTP-only cookie the browser never exposes to JS
    refreshName: 'refreshToken',
    accessName: 'accessToken',
    httpOnly: true,
    secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : nodeEnv === 'production',
    sameSite: process.env.COOKIE_SAME_SITE ?? (nodeEnv === 'production' ? 'none' : 'lax'),
    path: '/',
    maxAgeMs: (() => {
      const raw = process.env.JWT_REFRESH_EXPIRES ?? '7d';
      const match = /^(\d+)([dhm])$/.exec(raw);
      if (!match) return 7 * 24 * 60 * 60 * 1000;
      const [, num, unit] = match;
      const factor = { d: 86400000, h: 3600000, m: 60000 }[unit];
      return Number(num) * factor;
    })(),
  },

  rateLimits: {
    auth: { windowMs: 15 * 60 * 1000, max: 20 },
    api: { windowMs: 60 * 1000, max: 300 },
  },
});

export default config;
