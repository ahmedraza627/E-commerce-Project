import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import config from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // ---- Security headers ----
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images on the client origin
    })
  );

  // ---- CORS: credentials enabled so the browser stores our HTTP-only cookies ----
  app.use(
    cors({
      origin: config.clientUrl === '*' ? true : [config.clientUrl],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    })
  );

  // ---- Body parsing & cookies ----
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // ---- Query/payload hardening ----
  app.use(mongoSanitize()); // strips $ and . operators from user input (NoSQL injection)
  app.use(hpp()); // prevents HTTP parameter pollution

  // ---- Performance ----
  app.use(compression());
  if (!config.isTest) app.use(morgan(config.isProd ? 'combined' : 'dev'));

  // ---- Static uploads ----
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // ---- Simple request id for log correlation ----
  app.use((req, res, next) => {
    req.id = Math.random().toString(36).slice(2, 10);
    next();
  });

  // ---- API routes ----
  app.use('/api/v1', routes);

  // ---- Health probe ----
  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  // ---- Errors (keep last) ----
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
