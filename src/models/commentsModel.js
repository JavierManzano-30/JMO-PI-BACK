import pool from '../db/pool.js';

export function countCommentsByPhotoId(photoId) {
  return pool.query('SELECT COUNT(*)::int AS total FROM comments WHERE photo_id = $1', [photoId]);
}

export function findCommentsByPhotoId(photoId, limit, offset) {
  return pool.query(
    `SELECT
       c.id,
       c.photo_id,
       c.user_id,
       c.content,
       c.created_at,
       c.updated_at,
       json_build_object(
         'id', u.id,
         'username', u.username,
         'display_name', COALESCE(u.display_name, u.username),
         'avatar_url', u.avatar_url
       ) AS user
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.photo_id = $1
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [photoId, limit, offset]
  );
}

export function findPhotoForComments(photoId) {
  return pool.query('SELECT id, community_id, is_deleted FROM photos WHERE id = $1', [photoId]);
}

export function insertComment({ photoId, userId, content }) {
  return pool.query(
    `INSERT INTO comments (photo_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, photo_id, user_id, content, created_at, updated_at`,
    [photoId, userId, content]
  );
}

export function findCommentById(commentId, photoId) {
  return pool.query(
    'SELECT id, photo_id, user_id, content, created_at, updated_at FROM comments WHERE id = $1 AND photo_id = $2',
    [commentId, photoId]
  );
}

export function deleteCommentById(commentId) {
  return pool.query('DELETE FROM comments WHERE id = $1 RETURNING id', [commentId]);
}
