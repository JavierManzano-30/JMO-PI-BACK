// Utilidad compartida: helpers reutilizables para simplificar el codigo.
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createError } from './errors.js';
import config from '../config.js';

const ALLOWED_IMAGES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
]);

function normalizeImageMime(mimetype) {
  return mimetype === 'image/jpg' ? 'image/jpeg' : mimetype;
}

export async function cleanupUploadedFile(file) {
  if (!file?.path) return;
  try {
    await fsp.unlink(file.path);
  } catch {
    // Ignore cleanup failures; validation still fails safely.
  }
}

async function detectImageMime(filePath) {
  const handle = await fsp.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const bytes = buffer.subarray(0, bytesRead);

    const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (isJpeg) return 'image/jpeg';

    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const isPng = bytes.length >= pngSignature.length && bytes.subarray(0, pngSignature.length).equals(pngSignature);
    if (isPng) return 'image/png';

    return null;
  } finally {
    await handle.close();
  }
}

export function createImageUpload() {
  const uploadDir = path.resolve(process.cwd(), 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const mimetype = normalizeImageMime(file.mimetype);
      const ext = ALLOWED_IMAGES.get(mimetype) || path.extname(file.originalname).toLowerCase();
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
      const mimetype = normalizeImageMime(file.mimetype);
      const ext = path.extname(file.originalname || '').toLowerCase();

      if (!ALLOWED_IMAGES.has(mimetype) || !['.jpg', '.jpeg', '.png'].includes(ext)) {
        return cb(createError(400, 'VALIDATION_ERROR', 'Formato de imagen no permitido', []));
      }
      return cb(null, true);
    },
  });
}

export async function validateUploadedImage(req, _res, next) {
  if (!req.file) {
    return next();
  }

  try {
    const detectedMime = await detectImageMime(req.file.path);
    const mimetype = normalizeImageMime(req.file.mimetype);

    if (!detectedMime || detectedMime !== mimetype || !ALLOWED_IMAGES.has(detectedMime)) {
      await cleanupUploadedFile(req.file);
      return next(createError(400, 'VALIDATION_ERROR', 'El archivo no es una imagen válida', []));
    }

    req.file.detectedMime = detectedMime;
    return next();
  } catch (error) {
    await cleanupUploadedFile(req.file);
    return next(error);
  }
}

export function buildUploadedFileUrl(req, filename) {
  const safeFilename = path.basename(filename || '');
  if (!safeFilename) {
    throw createError(400, 'VALIDATION_ERROR', 'Archivo inválido', []);
  }

  if (config.app.publicUrl) {
    return `${config.app.publicUrl}/uploads/${safeFilename}`;
  }

  return `${req.protocol}://${req.get('host')}/uploads/${safeFilename}`;
}
