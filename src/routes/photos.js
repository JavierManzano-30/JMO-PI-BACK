// Rutas de la API: conectan endpoint, middlewares y controlador.
import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createImageUpload } from '../utils/upload.js';
import {
  listPhotos,
  createPhoto,
  getPhotoById,
  getPhotoRanking,
  deletePhoto,
} from '../controllers/photosController.js';
import {
  createPhotoComment,
  deletePhotoComment,
  listPhotoComments,
} from '../controllers/commentsController.js';

const router = Router();
const upload = createImageUpload();

router.get('/', optionalAuth, asyncHandler(listPhotos));

router.post('/', authenticate, upload.single('image'), asyncHandler(createPhoto));

router.get('/:id/ranking', optionalAuth, asyncHandler(getPhotoRanking));

router.get('/:id', optionalAuth, asyncHandler(getPhotoById));

router.get('/:id/comments', optionalAuth, asyncHandler(listPhotoComments));

router.post('/:id/comments', authenticate, asyncHandler(createPhotoComment));

router.delete('/:id/comments/:commentId', authenticate, asyncHandler(deletePhotoComment));

router.delete('/:id', authenticate, asyncHandler(deletePhoto));

export default router;
