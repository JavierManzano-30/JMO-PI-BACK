// Loader de arranque: configura una parte de la app al iniciar.
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';
import config from '../config.js';
import apiRoutes from '../routes/index.js';
import { errorHandler } from '../middleware/errorHandler.js';

export default (app) => {
  const openapiPath = path.resolve(process.cwd(), 'docs', 'api', 'openapi.yaml');
  let openapiDoc = null;

  try {
    const fileContent = fs.readFileSync(openapiPath, 'utf8');
    openapiDoc = yaml.load(fileContent);
  } catch {
    openapiDoc = null;
  }

  app.use(
    cors({
      origin: config.cors.origins && config.cors.origins.length > 0 ? config.cors.origins : true,
      credentials: config.cors.credentials,
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: config.http.bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.http.bodyLimit }));
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/v1/health', (_req, res) => {
    res.json({ ok: true });
  });

  if (openapiDoc) {
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
