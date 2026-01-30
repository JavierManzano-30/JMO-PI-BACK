export function parsePagination(query) {
  const page = Number.parseInt(query.page, 10) || 1;
  const limit = Number.parseInt(query.limit, 10) || 10;
  const safePage = page < 1 ? 1 : page;
  const safeLimit = limit < 1 ? 10 : Math.min(limit, 100);
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
