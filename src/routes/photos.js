import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createError } from '../utils/errors.js';
import { listPhotos, createPhoto, getPhotoById, deletePhoto } from '../controllers/photosController.js';

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

router.get('/', asyncHandler(listPhotos));

router.post('/', authenticate, upload.single('image'), asyncHandler(createPhoto));

router.get('/:id', optionalAuth, asyncHandler(getPhotoById));

router.delete('/:id', authenticate, asyncHandler(deletePhoto));

export default router;
