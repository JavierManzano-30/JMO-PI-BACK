// Configuracion central: lee variables de entorno y define valores por defecto.
import 'dotenv/config';
import { randomBytes } from 'node:crypto';

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
  : null;

const config = {
  // Configuracion general de la app.
  app: {
    port: toNumber(process.env.PORT, 3000),
  },
  // Configuracion de base de datos.
  db: {
    connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/proyecto',
  },
  // Configuracion de JWT para autenticacion.
  jwt: {
    secret: process.env.JWT_SECRET || randomBytes(32).toString('hex'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  // CORS para permitir o restringir origenes del frontend.
  cors: {
    origins: corsOrigins,
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  // Limite maximo para payload JSON/urlencoded.
  http: {
    bodyLimit: process.env.HTTP_BODY_LIMIT || '1mb',
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
