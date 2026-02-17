// Rutas de la API: conectan endpoint, middlewares y controlador.
import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import photoRoutes from './photos.js';
import themeRoutes from './themes.js';
import communityRoutes from './communities.js';
import categoryRoutes from './categories.js';
import voteRoutes from './votes.js';
import emailRoutes from './email.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/photos', photoRoutes);
router.use('/themes', themeRoutes);
router.use('/communities', communityRoutes);
router.use('/categories', categoryRoutes);
router.use('/votes', voteRoutes);
router.use('/email', emailRoutes);

export default router;
