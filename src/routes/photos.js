// Rutas de la API: conectan endpoint, middlewares y controlador.
import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createImageUpload } from '../utils/upload.js';
import { listPhotos, createPhoto, getPhotoById, deletePhoto } from '../controllers/photosController.js';

const router = Router();
const upload = createImageUpload();

router.get('/', asyncHandler(listPhotos));

router.post('/', authenticate, upload.single('image'), asyncHandler(createPhoto));

router.get('/:id', optionalAuth, asyncHandler(getPhotoById));

router.delete('/:id', authenticate, asyncHandler(deletePhoto));

export default router;
