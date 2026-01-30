import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createError } from '../utils/errors.js';

const router = Router();
const uploadDir = path.resolve(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
      return cb(createError(400, 'VALIDATION_ERROR', 'Formato de imagen no permitido', []));
    }
    return cb(null, true);
  },
});

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      'SELECT id, username, email, display_name, avatar_url, role, community_id, created_at, updated_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rowCount === 0) {
      throw createError(404, 'USER_NOT_FOUND', 'Usuario no encontrado', []);
    }

    res.json(result.rows[0]);
  })
);

router.patch(
  '/me',
  authenticate,
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    const { display_name } = req.body || {};
    const updates = [];
    const values = [];
    let index = 1;

    if (display_name !== undefined) {
      if (typeof display_name !== 'string' || display_name.length > 100) {
        throw createError(400, 'VALIDATION_ERROR', 'display_name inválido', []);
      }
      updates.push(`display_name = $${index}`);
      values.push(display_name || null);
      index += 1;
    }

    if (req.file) {
      const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      updates.push(`avatar_url = $${index}`);
      values.push(avatarUrl);
      index += 1;
    }

    if (updates.length === 0) {
      throw createError(400, 'VALIDATION_ERROR', 'No hay cambios para aplicar', []);
    }

    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE users
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${index}
       RETURNING id, username, email, display_name, avatar_url, role, community_id, created_at, updated_at`,
      values
    );

    res.json(result.rows[0]);
  })
);

export default router;
