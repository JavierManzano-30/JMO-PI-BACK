import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createError } from '../utils/errors.js';
import { buildMeta, parsePagination } from '../utils/pagination.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const filters = [];
    const values = [];
    let index = 1;

    const addFilter = (condition, value) => {
      filters.push(condition.replace('?', `$${index}`));
      values.push(value);
      index += 1;
    };

    const parseFilterInt = (value, label) => {
      const parsed = Number.parseInt(value, 10);
      if (Number.isNaN(parsed) || parsed < 1) {
        throw createError(400, 'VALIDATION_ERROR', `${label} inválido`, []);
      }
      return parsed;
    };

    if (req.query.is_active !== undefined) {
      const isActive = req.query.is_active === 'true' || req.query.is_active === true;
      addFilter('is_active = ?', isActive);
    }
    if (req.query.community_id) {
      addFilter('community_id = ?', parseFilterInt(req.query.community_id, 'community_id'));
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM themes ${whereClause}`,
      values
    );

    const total = countResult.rows[0]?.total || 0;

    const listResult = await pool.query(
      `SELECT id, title, description, start_date, end_date, is_active, created_at
       FROM themes
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${index} OFFSET $${index + 1}`,
      [...values, limit, offset]
    );

    res.json({
      data: listResult.rows,
      meta: buildMeta(total, page, limit),
    });
  })
);

router.post(
  '/',
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { title, description, start_date, end_date, is_active, community_id } = req.body || {};

    if (!title || title.length < 1 || title.length > 150) {
      throw createError(400, 'VALIDATION_ERROR', 'Título inválido', []);
    }

    if (!start_date || !end_date) {
      throw createError(400, 'VALIDATION_ERROR', 'Fechas inválidas', []);
    }

    const communityId = community_id ? Number.parseInt(community_id, 10) : null;
    if (community_id && (Number.isNaN(communityId) || communityId < 1)) {
      throw createError(400, 'VALIDATION_ERROR', 'community_id inválido', []);
    }
    if (communityId) {
      const communityCheck = await pool.query('SELECT id FROM communities WHERE id = $1', [communityId]);
      if (communityCheck.rowCount === 0) {
        throw createError(400, 'VALIDATION_ERROR', 'Comunidad inválida', []);
      }
    }

    const insertResult = await pool.query(
      `INSERT INTO themes (community_id, title, description, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, description, start_date, end_date, is_active, created_at`,
      [communityId, title, description || null, start_date, end_date, is_active !== undefined ? Boolean(is_active) : true]
    );

    res.status(201).json(insertResult.rows[0]);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const themeId = Number.parseInt(req.params.id, 10);
    if (!themeId || themeId < 1 || Number.isNaN(themeId)) {
      throw createError(400, 'VALIDATION_ERROR', 'ID inválido', []);
    }

    const result = await pool.query(
      'SELECT id, title, description, start_date, end_date, is_active, created_at FROM themes WHERE id = $1',
      [themeId]
    );

    if (result.rowCount === 0) {
      throw createError(404, 'THEME_NOT_FOUND', 'Tema no encontrado', []);
    }

    res.json(result.rows[0]);
  })
);

export default router;
