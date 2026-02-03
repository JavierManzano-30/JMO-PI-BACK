import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listThemes, createTheme, getThemeById } from '../controllers/themesController.js';

const router = Router();

router.get('/', asyncHandler(listThemes));

router.post('/', authenticate, requireRole('admin'), asyncHandler(createTheme));

router.get('/:id', asyncHandler(getThemeById));

export default router;
