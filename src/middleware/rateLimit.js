import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import config from '../config.js';

function keyGenerator(req) {
  return ipKeyGenerator(req.ip);
}

export const generalRateLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    code: 'RATE_LIMITED',
    message: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.',
    details: [],
  },
});

export const authRateLimiter = rateLimit({
  windowMs: config.security.authRateLimitWindowMs,
  max: config.security.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    code: 'RATE_LIMITED',
    message: 'Demasiados intentos. Inténtalo de nuevo más tarde.',
    details: [],
  },
});

export const mutationRateLimiter = rateLimit({
  windowMs: config.security.mutationRateLimitWindowMs,
  max: config.security.mutationRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS',
  message: {
    code: 'RATE_LIMITED',
    message: 'Demasiadas acciones. Inténtalo de nuevo más tarde.',
    details: [],
  },
});
