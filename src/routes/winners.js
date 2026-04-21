import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listWinners } from '../controllers/winnersController.js';

const router = Router();

router.get('/', asyncHandler(listWinners));

export default router;
