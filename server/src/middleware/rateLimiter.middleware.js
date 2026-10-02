import rateLimit from 'express-rate-limit';
import config from '../config/env.js';

/** Global API limiter — generous, protects against scraping/abuse. */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimits.api.windowMs,
  max: config.rateLimits.api.max,
  standardHeaders: true, // Return-RateLimit-* headers
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — please slow down' },
});

/** Tight limiter for credential endpoints — blunts brute-force attacks. */
export const authLimiter = rateLimit({
  windowMs: config.rateLimits.auth.windowMs,
  max: config.rateLimits.auth.max,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failures
  message: { success: false, message: 'Too many attempts — try again in 15 minutes' },
});
