// Rutas de la API: conectan endpoint, middlewares y controlador.
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendTestEmail } from '../controllers/emailController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import config from '../config.js';

const router = Router();

if (config.security.enableEmailTestEndpoint) {
  router.post('/test', authenticate, requireRole('admin'), asyncHandler(sendTestEmail));
}

export default router;
