import pool from '../db/pool.js';

export function countWinners(whereClause, values, rankLimit = null, officialOnly = false) {
  const queryValues = [...values];
  let nextPlaceholder = values.length + 1;
  const outerFilters = [];

  if (rankLimit) {
    outerFilters.push(`ranked.rank_position <= $${nextPlaceholder}`);
    queryValues.push(rankLimit);
    nextPlaceholder += 1;
  }

  if (officialOnly) {
    outerFilters.push('ranked.is_official_winner = true');
  }

  const outerWhereClause = outerFilters.length ? `WHERE ${outerFilters.join(' AND ')}` : '';

  return pool.query(
    `WITH ranked AS (
       SELECT
         t.id AS theme_id,
         p.id AS photo_id,
         (w.photo_id = p.id) AS is_official_winner,
         ROW_NUMBER() OVER (
           PARTITION BY t.id
           ORDER BY
             CASE WHEN w.photo_id = p.id THEN 0 ELSE 1 END,
             (SELECT COUNT(*)::int FROM votes v WHERE v.photo_id = p.id) DESC,
             p.created_at ASC
         ) AS rank_position
       FROM themes t
       JOIN photos p ON p.theme_id = t.id AND p.is_deleted = false
       LEFT JOIN winners w ON w.theme_id = t.id
       ${whereClause}
     )
     SELECT COUNT(*)::int AS total FROM ranked
     ${outerWhereClause}`,
    queryValues
  );
}

export function findWinners(whereClause, values, limit, offset, placeholderIndex, rankLimit = null, officialOnly = false) {
  let outerFilterClause = '';
  let limitPlaceholder = placeholderIndex;
  let offsetPlaceholder = placeholderIndex + 1;
  const queryValues = [...values];
  const outerFilters = [];

  if (rankLimit) {
    outerFilters.push(`ranked.rank_position <= $${placeholderIndex}`);
    queryValues.push(rankLimit);
    limitPlaceholder += 1;
    offsetPlaceholder += 1;
  }

  if (officialOnly) {
    outerFilters.push('ranked.is_official_winner = true');
  }

  if (outerFilters.length) {
    outerFilterClause = `WHERE ${outerFilters.join(' AND ')}`;
  }

  return pool.query(
    `SELECT
       ranked.theme_id,
       ranked.theme_title,
       ranked.theme_start_date,
       ranked.theme_end_date,
       ranked.theme_is_active,
       ranked.community_id,
       ranked.community_name,
       ranked.photo_id,
       ranked.photo_title,
       ranked.image_url,
       ranked.thumb_url,
       ranked.user_id,
       ranked.author_display_name,
       ranked.votes_count,
       ranked.rank_position,
       ranked.is_official_winner
     FROM (
       SELECT
         t.id AS theme_id,
         t.title AS theme_title,
         t.start_date AS theme_start_date,
         t.end_date AS theme_end_date,
         (t.is_active = true AND t.start_date <= CURRENT_DATE AND t.end_date >= CURRENT_DATE) AS theme_is_active,
         comm.id AS community_id,
         comm.name AS community_name,
         p.id AS photo_id,
         p.title AS photo_title,
         p.image_url,
         p.thumb_url,
         p.user_id,
         COALESCE(u.display_name, u.username) AS author_display_name,
         (SELECT COUNT(*)::int FROM votes v WHERE v.photo_id = p.id) AS votes_count,
         ROW_NUMBER() OVER (
           PARTITION BY t.id
           ORDER BY
             CASE WHEN w.photo_id = p.id THEN 0 ELSE 1 END,
             (SELECT COUNT(*)::int FROM votes v2 WHERE v2.photo_id = p.id) DESC,
             p.created_at ASC
         ) AS rank_position,
         (w.photo_id = p.id) AS is_official_winner
       FROM themes t
       JOIN photos p ON p.theme_id = t.id AND p.is_deleted = false
       JOIN users u ON u.id = p.user_id
       LEFT JOIN communities comm ON comm.id = t.community_id
       LEFT JOIN winners w ON w.theme_id = t.id
       ${whereClause}
     ) ranked
     ${outerFilterClause}
     ORDER BY ranked.theme_end_date DESC, ranked.rank_position ASC
     LIMIT $${limitPlaceholder} OFFSET $${offsetPlaceholder}`,
    [...queryValues, limit, offset]
  );
}
