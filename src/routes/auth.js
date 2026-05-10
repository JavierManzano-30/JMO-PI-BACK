// Rutas de la API: conectan endpoint, middlewares y controlador.
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { register, login } from '../controllers/authController.js';
import { authRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', authRateLimiter, asyncHandler(register));
router.post('/login', authRateLimiter, asyncHandler(login));

export default router;
