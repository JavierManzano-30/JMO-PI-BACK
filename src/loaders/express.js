// Loader de arranque: configura una parte de la app al iniciar.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';
import config from '../config.js';
import apiRoutes from '../routes/index.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { generalRateLimiter, mutationRateLimiter } from '../middleware/rateLimit.js';

function validateCorsOrigin(origin, callback) {
  if (!origin) {
    return callback(null, true);
  }

  if (config.cors.origins.includes('*')) {
    return callback(null, true);
  }

  if (config.cors.origins.includes(origin)) {
    return callback(null, true);
  }

  return callback(null, false);
}

const apiContentSecurityPolicy = {
  directives: {
    defaultSrc: ["'none'"],
    baseUri: ["'none'"],
    frameAncestors: ["'none'"],
    imgSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    upgradeInsecureRequests: [],
  },
};

export default (app) => {
  const openapiPath = path.resolve(process.cwd(), 'docs', 'api', 'openapi.yaml');
  let openapiDoc = null;

  try {
    const fileContent = fs.readFileSync(openapiPath, 'utf8');
    openapiDoc = yaml.load(fileContent);
  } catch {
    openapiDoc = null;
  }

  if (config.security.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.disable('x-powered-by');
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: config.security.enableDocs ? false : apiContentSecurityPolicy,
  }));

  app.use(
    cors({
      origin: validateCorsOrigin,
      credentials: config.cors.credentials,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      maxAge: 600,
    })
  );

  app.use(express.json({ limit: config.http.bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.http.bodyLimit }));
  app.use(generalRateLimiter);
  app.use(mutationRateLimiter);
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads'), {
    fallthrough: false,
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/v1/health', (_req, res) => {
    res.json({ ok: true });
  });

  if (openapiDoc && config.security.enableDocs) {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
    app.get('/openapi.json', (_req, res) => {
      res.json(openapiDoc);
    });
  }

  app.use('/api/v1', apiRoutes);

  app.use((_req, res) => {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Recurso no encontrado',
      details: [],
    });
  });

  app.use(errorHandler);
};
