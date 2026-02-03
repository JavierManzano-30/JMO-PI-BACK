import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createVote, deleteVote } from '../controllers/votesController.js';

const router = Router();

router.post('/', authenticate, asyncHandler(createVote));

router.delete('/', authenticate, asyncHandler(deleteVote));

export default router;
