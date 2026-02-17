// Utilidad compartida: helpers reutilizables para simplificar el codigo.
import { createError } from './errors.js';

export function parsePagination(query) {
  const hasPage = query.page !== undefined;
  const hasLimit = query.limit !== undefined;
  const pageValue = Number.parseInt(query.page, 10);
  const limitValue = Number.parseInt(query.limit, 10);

  if (hasPage && (Number.isNaN(pageValue) || pageValue < 1)) {
    throw createError(400, 'VALIDATION_ERROR', 'page inválido', []);
  }
  if (hasLimit && (Number.isNaN(limitValue) || limitValue < 1)) {
    throw createError(400, 'VALIDATION_ERROR', 'limit inválido', []);
  }

  const safePage = hasPage ? pageValue : 1;
  const safeLimit = hasLimit ? Math.min(limitValue, 100) : 10;
  const offset = (safePage - 1) * safeLimit;

  return {
    page: safePage,
    limit: safeLimit,
    offset,
  };
}

export function buildMeta(total, page, limit) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    total_pages: totalPages,
  };
}
