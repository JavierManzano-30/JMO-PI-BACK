import { Router } from 'express';
import pool from '../db/pool.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const result = await pool.query('SELECT id, slug, name FROM categories ORDER BY name ASC');
    res.json({ data: result.rows });
  })
);

export default router;
