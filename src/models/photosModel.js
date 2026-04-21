// Modelo de datos: aqui viven las consultas SQL contra PostgreSQL.
import pool from '../db/pool.js';

export function countPhotos(whereClause, values) {
  return pool.query(`SELECT COUNT(*)::int AS total FROM photos ${whereClause}`, values);
}

export function findPhotos(whereClause, orderBy, values, limit, offset, placeholderIndex, currentUserId = null) {
  return pool.query(
    `SELECT
       p.id,
       p.user_id,
       p.theme_id,
       p.community_id,
       p.category_id,
       p.title,
       p.description,
       p.image_url,
       p.thumb_url,
       p.is_moderated,
       p.is_deleted,
       p.created_at,
       u.username,
       COALESCE(u.display_name, u.username) AS user_display_name,
       c.name AS community_name,
       cat.name AS category_name,
       (SELECT COUNT(*)::int FROM votes v WHERE v.photo_id = p.id) AS votes_count,
       CASE
         WHEN $${placeholderIndex}::int IS NULL THEN false
         ELSE EXISTS (
           SELECT 1
           FROM votes uv
           WHERE uv.photo_id = p.id AND uv.user_id = $${placeholderIndex}
         )
       END AS has_user_voted
     FROM photos p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN communities c ON c.id = p.community_id
     LEFT JOIN categories cat ON cat.id = p.category_id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT $${placeholderIndex + 1} OFFSET $${placeholderIndex + 2}`,
    [...values, currentUserId, limit, offset]
  );
}

export function findThemeById(id) {
  return pool.query('SELECT id, community_id, is_active FROM themes WHERE id = $1', [id]);
}

export function findActivePhotoByUserAndTheme(userId, themeId) {
  return pool.query('SELECT id FROM photos WHERE user_id = $1 AND theme_id = $2 AND is_deleted = false', [userId, themeId]);
}

export function findCategoryById(id) {
  return pool.query('SELECT id FROM categories WHERE id = $1', [id]);
}

export function insertPhoto({
  userId,
  themeId,
  communityId,
  categoryId,
  title,
  description,
  imageUrl,
  thumbUrl,
}) {
  return pool.query(
    `INSERT INTO photos (user_id, theme_id, community_id, category_id, title, description, image_url, thumb_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, user_id, theme_id, community_id, category_id, title, description, image_url, thumb_url, is_moderated, is_deleted, created_at`,
    [userId, themeId, communityId, categoryId, title, description, imageUrl, thumbUrl]
  );
}

export function findPhotoWithDetailsById(photoId, userId) {
  return pool.query(
    `SELECT
       p.id,
       p.user_id,
       p.theme_id,
       p.community_id,
       p.category_id,
       p.title,
       p.description,
       p.image_url,
       p.thumb_url,
       p.is_moderated,
       p.is_deleted,
       p.created_at,
       json_build_object(
         'id', u.id,
         'username', u.username,
         'email', u.email,
         'display_name', u.display_name,
         'avatar_url', u.avatar_url,
         'role', u.role,
         'community_id', u.community_id,
         'created_at', u.created_at,
         'updated_at', u.updated_at
       ) AS user,
       json_build_object(
         'id', t.id,
         'title', t.title,
         'description', t.description,
         'start_date', t.start_date,
         'end_date', t.end_date,
         'is_active', t.is_active,
         'created_at', t.created_at
       ) AS theme,
       CASE
         WHEN c.id IS NULL THEN NULL
         ELSE json_build_object('id', c.id, 'slug', c.slug, 'name', c.name)
       END AS category,
       (SELECT COUNT(*)::int FROM votes v WHERE v.photo_id = p.id) AS votes_count,
       CASE
         WHEN $2::int IS NULL THEN false
         ELSE EXISTS (
           SELECT 1 FROM votes v WHERE v.photo_id = p.id AND v.user_id = $2
         )
       END AS has_user_voted
     FROM photos p
     JOIN users u ON u.id = p.user_id
     JOIN themes t ON t.id = p.theme_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1 AND p.is_deleted = false`,
    [photoId, userId]
  );
}

export function findPhotoOwnerById(photoId) {
  return pool.query('SELECT id, user_id FROM photos WHERE id = $1 AND is_deleted = false', [photoId]);
}

export function softDeletePhotoById(photoId) {
  return pool.query('UPDATE photos SET is_deleted = true WHERE id = $1', [photoId]);
}

export function findPhotoRankingContextById(photoId) {
  return pool.query(
    `SELECT
       p.id AS photo_id,
       p.title AS photo_title,
       p.description AS photo_description,
       p.image_url AS photo_image_url,
       p.thumb_url AS photo_thumb_url,
       p.created_at AS photo_created_at,
       p.user_id,
       COALESCE(u.display_name, u.username) AS author_display_name,
       p.community_id,
       comm.name AS community_name,
       t.id AS theme_id,
       t.title AS theme_title,
       t.description AS theme_description,
       t.start_date AS theme_start_date,
       t.end_date AS theme_end_date,
       t.is_active AS theme_is_active,
       (SELECT COUNT(*)::int FROM votes v WHERE v.photo_id = p.id) AS votes_count
     FROM photos p
     JOIN users u ON u.id = p.user_id
     JOIN themes t ON t.id = p.theme_id
     LEFT JOIN communities comm ON comm.id = p.community_id
     WHERE p.id = $1 AND p.is_deleted = false`,
    [photoId]
  );
}

export function findPhotoRankInTheme(photoId, themeId) {
  return pool.query(
    `WITH ranked AS (
       SELECT
         p.id AS photo_id,
         (SELECT COUNT(*)::int FROM votes v WHERE v.photo_id = p.id) AS votes_count,
         ROW_NUMBER() OVER (
           PARTITION BY p.theme_id
           ORDER BY
             CASE WHEN w.photo_id = p.id THEN 0 ELSE 1 END,
             (SELECT COUNT(*)::int FROM votes v2 WHERE v2.photo_id = p.id) DESC,
             p.created_at ASC
         ) AS rank_position,
         (w.photo_id = p.id) AS is_official_winner
       FROM photos p
       LEFT JOIN winners w ON w.theme_id = p.theme_id
       WHERE p.theme_id = $2 AND p.is_deleted = false
     ),
     totals AS (
       SELECT COUNT(*)::int AS total_entries
       FROM photos
       WHERE theme_id = $2 AND is_deleted = false
     )
     SELECT
       ranked.photo_id,
       ranked.votes_count,
       ranked.rank_position,
       ranked.is_official_winner,
       totals.total_entries
     FROM ranked
     CROSS JOIN totals
     WHERE ranked.photo_id = $1`,
    [photoId, themeId]
  );
}

export function findThemeLeaderboard(themeId, limit) {
  return pool.query(
    `SELECT
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
         p.id AS photo_id,
         p.title AS photo_title,
         p.image_url,
         p.thumb_url,
         p.user_id,
         COALESCE(u.display_name, u.username) AS author_display_name,
         (SELECT COUNT(*)::int FROM votes v WHERE v.photo_id = p.id) AS votes_count,
         ROW_NUMBER() OVER (
           PARTITION BY p.theme_id
           ORDER BY
             CASE WHEN w.photo_id = p.id THEN 0 ELSE 1 END,
             (SELECT COUNT(*)::int FROM votes v2 WHERE v2.photo_id = p.id) DESC,
             p.created_at ASC
         ) AS rank_position,
         (w.photo_id = p.id) AS is_official_winner
       FROM photos p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN winners w ON w.theme_id = p.theme_id
       WHERE p.theme_id = $1 AND p.is_deleted = false
     ) ranked
     ORDER BY ranked.rank_position ASC
     LIMIT $2`,
    [themeId, limit]
  );
}
