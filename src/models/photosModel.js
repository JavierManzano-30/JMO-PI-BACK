// Modelo de datos: aqui viven las consultas SQL contra PostgreSQL.
import pool from '../db/pool.js';

export function countPhotos(whereClause, values) {
  return pool.query(`SELECT COUNT(*)::int AS total FROM photos ${whereClause}`, values);
}

export function findPhotos(whereClause, orderBy, values, limit, offset, placeholderIndex) {
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
       (SELECT COUNT(*)::int FROM votes v WHERE v.photo_id = p.id) AS votes_count
     FROM photos p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN communities c ON c.id = p.community_id
     LEFT JOIN categories cat ON cat.id = p.category_id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT $${placeholderIndex} OFFSET $${placeholderIndex + 1}`,
    [...values, limit, offset]
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
