import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listCommunities, getCommunityById } from '../controllers/communitiesController.js';

const router = Router();

router.get('/', asyncHandler(listCommunities));

router.get('/:id', asyncHandler(getCommunityById));

export default router;
