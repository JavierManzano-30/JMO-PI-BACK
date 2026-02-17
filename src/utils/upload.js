// Utilidad compartida: helpers reutilizables para simplificar el codigo.
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createError } from './errors.js';
import config from '../config.js';

export function createImageUpload() {
  const uploadDir = path.resolve(process.cwd(), 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const nonce = randomBytes(12).toString('hex');
      const safeName = `${Date.now()}-${nonce}${ext}`;
      cb(null, safeName);
    },
  });

  return multer({
    storage,
    // Defensive limits to avoid oversized multipart payloads.
    limits: {
      fileSize: config.upload.maxFileSizeBytes,
      files: config.upload.maxFiles,
      fields: config.upload.maxFields,
      fieldSize: config.upload.maxFieldSizeBytes,
      parts: config.upload.maxFields + config.upload.maxFiles,
    },
    fileFilter: (_req, file, cb) => {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
        return cb(createError(400, 'VALIDATION_ERROR', 'Formato de imagen no permitido', []));
      }
      return cb(null, true);
    },
  });
}
