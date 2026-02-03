import pool from '../db/pool.js';
import { createError } from '../utils/errors.js';
import { buildMeta, parsePagination } from '../utils/pagination.js';

export async function listCommunities(req, res) {
  const { page, limit, offset } = parsePagination(req.query);

  const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM communities');
  const total = countResult.rows[0]?.total || 0;

  const listResult = await pool.query(
    `SELECT id, code, name, created_at
     FROM communities
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  res.json({
    data: listResult.rows,
    meta: buildMeta(total, page, limit),
  });
}

export async function getCommunityById(req, res) {
  const communityId = Number.parseInt(req.params.id, 10);
  if (!communityId || communityId < 1 || Number.isNaN(communityId)) {
    throw createError(400, 'VALIDATION_ERROR', 'ID inválido', []);
  }

  const result = await pool.query(
    'SELECT id, code, name, created_at FROM communities WHERE id = $1',
    [communityId]
  );

  if (result.rowCount === 0) {
    throw createError(404, 'COMMUNITY_NOT_FOUND', 'Comunidad no encontrada', []);
  }

  res.json(result.rows[0]);
}
