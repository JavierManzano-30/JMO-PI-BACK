import { createError } from '../utils/errors.js';
import { buildMeta, parsePagination } from '../utils/pagination.js';
import { countWinners, findWinners } from '../models/winnersModel.js';

function parseFilterInt(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    throw createError(400, 'VALIDATION_ERROR', `${label} inválido`, []);
  }
  return parsed;
}

function parseBooleanFlag(value) {
  return value === true || value === 'true';
}

function resolveThemeState(query) {
  const explicitState = query.theme_state ? String(query.theme_state).toLowerCase() : '';

  if (explicitState) {
    if (!['active', 'closed', 'all'].includes(explicitState)) {
      throw createError(400, 'VALIDATION_ERROR', 'theme_state inválido', []);
    }
    return explicitState;
  }

  // Compatibilidad con el parámetro histórico include_active.
  if (parseBooleanFlag(query.include_active)) {
    return 'all';
  }

  return 'closed';
}

export async function listWinners(req, res) {
  const { page, limit, offset } = parsePagination(req.query);
  const filters = [];
  const values = [];
  let index = 1;

  const addFilter = (condition, value) => {
    filters.push(condition.replace('?', `$${index}`));
    values.push(value);
    index += 1;
  };

  if (req.query.theme_id) {
    addFilter('t.id = ?', parseFilterInt(req.query.theme_id, 'theme_id'));
  }

  if (req.query.community_id) {
    addFilter('t.community_id = ?', parseFilterInt(req.query.community_id, 'community_id'));
  }

  const themeState = resolveThemeState(req.query);
  if (themeState === 'active') {
    filters.push('t.is_active = true AND t.start_date <= CURRENT_DATE AND t.end_date >= CURRENT_DATE');
  }
  if (themeState === 'closed') {
    filters.push('(t.is_active = false OR t.end_date < CURRENT_DATE)');
  }

  const officialOnly = parseBooleanFlag(req.query.official_only);

  let rankLimit = null;
  if (req.query.rank_limit !== undefined) {
    rankLimit = parseFilterInt(req.query.rank_limit, 'rank_limit');
    if (rankLimit > 20) {
      throw createError(400, 'VALIDATION_ERROR', 'rank_limit inválido', []);
    }
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

  const countResult = await countWinners(whereClause, values, rankLimit, officialOnly);
  const total = countResult.rows[0]?.total || 0;

  const listResult = await findWinners(whereClause, values, limit, offset, index, rankLimit, officialOnly);

  res.json({
    data: listResult.rows,
    meta: {
      ...buildMeta(total, page, limit),
      theme_state: themeState,
      official_only: officialOnly,
      rank_limit: rankLimit,
    },
  });
}
