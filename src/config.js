// Configuracion central: lee variables de entorno y define valores por defecto.
import dotenv from 'dotenv';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Carga siempre el .env del backend aunque el proceso se lance desde otra carpeta.
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
dotenv.config({ path: path.resolve(currentDirPath, '../.env'), override: true });

// Convierte una variable de entorno en numero con valor por defecto.
function toNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

// Limita un valor numerico dentro de un rango.
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

const isProduction = process.env.NODE_ENV === 'production';
const defaultDevelopmentOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : randomBytes(32).toString('hex'));
if (isProduction && (!jwtSecret || jwtSecret === 'change_me' || jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET seguro es obligatorio en producción');
}

const config = {
  // Configuracion general de la app.
  app: {
    port: toNumber(process.env.PORT, 3000),
    env: process.env.NODE_ENV || 'development',
    publicUrl: (process.env.API_PUBLIC_URL || process.env.APP_PUBLIC_URL || '').replace(/\/+$/, ''),
  },
  // Configuracion de base de datos.
  db: {
    connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/proyecto',
  },
  // Configuracion de JWT para autenticacion.
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  // CORS para permitir o restringir origenes del frontend.
  cors: {
    origins: corsOrigins.length > 0 ? corsOrigins : (isProduction ? [] : defaultDevelopmentOrigins),
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  // Limite maximo para payload JSON/urlencoded.
  http: {
    bodyLimit: process.env.HTTP_BODY_LIMIT || '1mb',
  },
  security: {
    trustProxy: process.env.TRUST_PROXY === 'true',
    enableDocs: process.env.ENABLE_API_DOCS === 'true' || !isProduction,
    enableEmailTestEndpoint: process.env.ENABLE_EMAIL_TEST_ENDPOINT === 'true' && !isProduction,
    rateLimitWindowMs: clamp(toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), 1000, 60 * 60 * 1000),
    rateLimitMax: clamp(toNumber(process.env.RATE_LIMIT_MAX, 300), 1, 10000),
    authRateLimitWindowMs: clamp(toNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), 1000, 60 * 60 * 1000),
    authRateLimitMax: clamp(toNumber(process.env.AUTH_RATE_LIMIT_MAX, 20), 1, 1000),
    mutationRateLimitWindowMs: clamp(toNumber(process.env.MUTATION_RATE_LIMIT_WINDOW_MS, 60 * 1000), 1000, 15 * 60 * 1000),
    mutationRateLimitMax: clamp(toNumber(process.env.MUTATION_RATE_LIMIT_MAX, 60), 1, 1000),
  },
  contests: {
    weeklyAutomationEnabled: process.env.WEEKLY_CONTEST_AUTOMATION_ENABLED !== 'false',
    automationCheckIntervalMs: clamp(
      toNumber(process.env.WEEKLY_CONTEST_CHECK_INTERVAL_MS, 60 * 60 * 1000),
      60 * 1000,
      24 * 60 * 60 * 1000
    ),
  },
  // Limites defensivos para ficheros subidos por multipart/form-data.
  upload: {
    maxFileSizeBytes: clamp(toNumber(process.env.UPLOAD_MAX_FILE_SIZE_BYTES, 5 * 1024 * 1024), 1024, 20 * 1024 * 1024),
    maxFiles: clamp(toNumber(process.env.UPLOAD_MAX_FILES, 1), 1, 5),
    maxFields: clamp(toNumber(process.env.UPLOAD_MAX_FIELDS, 10), 1, 50),
    maxFieldSizeBytes: clamp(toNumber(process.env.UPLOAD_MAX_FIELD_SIZE_BYTES, 64 * 1024), 1024, 1024 * 1024),
  },
  // Configuracion SMTP para envio de correos.
  smtp: {
    host: process.env.SMTP_HOST || '127.0.0.1',
    port: toNumber(process.env.SMTP_PORT, 1025),
    secure: process.env.SMTP_SECURE === 'true',
    allowInsecureLocal: process.env.SMTP_ALLOW_INSECURE_LOCAL === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    service: process.env.SMTP_SERVICE || '',
    from: process.env.SMTP_FROM || 'no-reply@snapnation.local',
  },
};

export default config;
