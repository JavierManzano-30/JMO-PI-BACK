// Rutas de la API: conectan endpoint, middlewares y controlador.
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendTestEmail } from '../controllers/emailController.js';

const router = Router();

router.post('/test', asyncHandler(sendTestEmail));

export default router;
