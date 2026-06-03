// Controlador: recibe la peticion HTTP, valida entradas y construye la respuesta.
import pool from '../db/pool.js';
import { createError } from '../utils/errors.js';
import { buildMeta, parsePagination } from '../utils/pagination.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isSameDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isSameDate ? date : null;
}

function validateWeeklyContestRange(startDateValue, endDateValue) {
  const startDate = parseDateOnly(startDateValue);
  const endDate = parseDateOnly(endDateValue);

  if (!startDate || !endDate) {
    throw createError(400, 'VALIDATION_ERROR', 'Fechas inválidas', []);
  }

  const durationDays = Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);
  if (startDate.getUTCDay() !== 1 || endDate.getUTCDay() !== 0 || durationDays !== 6) {
    throw createError(
      400,
      'VALIDATION_ERROR',
      'Los concursos deben empezar en lunes y terminar el domingo de la misma semana',
      []
    );
  }
}

function parseFilterInt(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    throw createError(400, 'VALIDATION_ERROR', `${label} inválido`, []);
  }
  return parsed;
}

function resolveThemeState(query) {
  const state = query.state || query.theme_state;
  if (state === undefined || state === '' || state === 'all') return null;
  if (['active', 'closed', 'future'].includes(state)) return state;
  throw createError(400, 'VALIDATION_ERROR', 'Estado de concurso inválido', []);
}

export async function listThemes(req, res) {
  const { page, limit, offset } = parsePagination(req.query);
  const filters = [];
  const values = [];
  let index = 1;

  const addFilter = (condition, value) => {
    filters.push(condition.replace('?', `$${index}`));
    values.push(value);
    index += 1;
  };

  const themeState = resolveThemeState(req.query);
  if (themeState === 'active') {
    filters.push('t.is_active = true AND t.start_date <= CURRENT_DATE AND t.end_date >= CURRENT_DATE');
  } else if (themeState === 'closed') {
    filters.push('(t.is_active = false OR t.end_date < CURRENT_DATE)');
  } else if (themeState === 'future') {
    filters.push('t.is_active = true AND t.start_date > CURRENT_DATE');
  } else if (req.query.is_active !== undefined) {
    const isActive = req.query.is_active === 'true' || req.query.is_active === true;
    if (isActive) {
      filters.push('t.is_active = true AND t.start_date <= CURRENT_DATE AND t.end_date >= CURRENT_DATE');
    } else {
      filters.push('(t.is_active = false OR t.start_date > CURRENT_DATE OR t.end_date < CURRENT_DATE)');
    }
  }
  if (req.query.community_id) {
    addFilter('t.community_id = ?', parseFilterInt(req.query.community_id, 'community_id'));
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM themes t
     LEFT JOIN communities c ON c.id = t.community_id
     ${whereClause}`,
    values
  );

  const total = countResult.rows[0]?.total || 0;
  const orderBy = themeState === 'future'
    ? 't.start_date ASC, t.created_at DESC'
    : 't.start_date DESC, t.created_at DESC';

  const listResult = await pool.query(
    `SELECT
       t.id,
       t.title,
       t.description,
       t.start_date,
       t.end_date,
       (t.is_active = true AND t.start_date <= CURRENT_DATE AND t.end_date >= CURRENT_DATE) AS is_active,
       t.created_at,
       t.community_id,
       c.name AS community_name
     FROM themes t
     LEFT JOIN communities c ON c.id = t.community_id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT $${index} OFFSET $${index + 1}`,
    [...values, limit, offset]
  );

  res.json({
    data: listResult.rows,
    meta: buildMeta(total, page, limit),
  });
}

export async function createTheme(req, res) {
  const { title, description, start_date, end_date, is_active, community_id } = req.body || {};

  if (!title || title.length < 1 || title.length > 150) {
    throw createError(400, 'VALIDATION_ERROR', 'Título inválido', []);
  }

  validateWeeklyContestRange(start_date, end_date);

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

  const shouldBeActive = is_active !== undefined ? Boolean(is_active) : true;
  if (shouldBeActive) {
    const weeklyCount = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM themes
       WHERE is_active = true
         AND start_date = $1
         AND end_date = $2`,
      [start_date, end_date]
    );

    if ((weeklyCount.rows[0]?.total || 0) >= 2) {
      throw createError(409, 'WEEKLY_CONTEST_LIMIT', 'Ya existen dos concursos activos para esa semana', []);
    }
  }

  const insertResult = await pool.query(
    `INSERT INTO themes (community_id, title, description, start_date, end_date, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, description, start_date, end_date, is_active, created_at`,
    [communityId, title, description || null, start_date, end_date, shouldBeActive]
  );

  res.status(201).json(insertResult.rows[0]);
}

export async function getThemeById(req, res) {
  const themeId = Number.parseInt(req.params.id, 10);
  if (!themeId || themeId < 1 || Number.isNaN(themeId)) {
    throw createError(400, 'VALIDATION_ERROR', 'ID inválido', []);
  }

  const result = await pool.query(
    `SELECT
       id,
       title,
       description,
       start_date,
       end_date,
       (is_active = true AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE) AS is_active,
       created_at
     FROM themes
     WHERE id = $1`,
    [themeId]
  );

  if (result.rowCount === 0) {
    throw createError(404, 'THEME_NOT_FOUND', 'Tema no encontrado', []);
  }

  res.json(result.rows[0]);
}
