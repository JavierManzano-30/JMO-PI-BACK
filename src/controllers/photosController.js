import pool from '../db/pool.js';
import { createError } from '../utils/errors.js';
import { buildMeta, parsePagination } from '../utils/pagination.js';

export async function listPhotos(req, res) {
  const { page, limit, offset } = parsePagination(req.query);
  const filters = ['is_deleted = false'];
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

  if (req.query.community_id) {
    addFilter('community_id = ?', parseFilterInt(req.query.community_id, 'community_id'));
  }
  if (req.query.theme_id) {
    addFilter('theme_id = ?', parseFilterInt(req.query.theme_id, 'theme_id'));
  }
  if (req.query.category_id) {
    addFilter('category_id = ?', parseFilterInt(req.query.category_id, 'category_id'));
  }
  if (req.query.user_id) {
    addFilter('user_id = ?', parseFilterInt(req.query.user_id, 'user_id'));
  }

  let orderBy = 'p.created_at DESC';
  if (req.query.sort) {
    const [fieldRaw, dirRaw] = String(req.query.sort).split(':');
    const field = fieldRaw ? fieldRaw.trim() : '';
    const direction = dirRaw ? dirRaw.trim().toLowerCase() : 'desc';
    const sortFields = {
      created_at: 'p.created_at',
      votes: 'votes_count',
      votes_count: 'votes_count',
    };

    if (!sortFields[field] || !['asc', 'desc'].includes(direction)) {
      throw createError(400, 'VALIDATION_ERROR', 'sort inválido', []);
    }

    orderBy = `${sortFields[field]} ${direction.toUpperCase()}`;
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM photos ${whereClause}`,
    values
  );

  const total = countResult.rows[0]?.total || 0;

  const listResult = await pool.query(
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
     LIMIT $${index} OFFSET $${index + 1}`,
    [...values, limit, offset]
  );

  res.json({
    data: listResult.rows,
    meta: buildMeta(total, page, limit),
  });
}

export async function createPhoto(req, res) {
  const { title, description, theme_id, category_id } = req.body || {};

  if (!title || title.length < 1 || title.length > 150) {
    throw createError(400, 'VALIDATION_ERROR', 'Título inválido', []);
  }

  const themeId = Number.parseInt(theme_id, 10);
  if (!themeId || themeId < 1 || Number.isNaN(themeId)) {
    throw createError(400, 'VALIDATION_ERROR', 'theme_id inválido', []);
  }

  if (!req.file) {
    throw createError(400, 'VALIDATION_ERROR', 'Archivo de imagen requerido', []);
  }

  const themeResult = await pool.query(
    'SELECT id, community_id, is_active FROM themes WHERE id = $1',
    [themeId]
  );

  if (themeResult.rowCount === 0) {
    throw createError(404, 'THEME_NOT_FOUND', 'Tema no encontrado', []);
  }

  if (!themeResult.rows[0].is_active) {
    throw createError(400, 'THEME_INACTIVE', 'El tema no está activo', []);
  }

  const existingPhoto = await pool.query(
    'SELECT id FROM photos WHERE user_id = $1 AND theme_id = $2 AND is_deleted = false',
    [req.user.id, themeId]
  );

  if (existingPhoto.rowCount > 0) {
    throw createError(409, 'PHOTO_ALREADY_SUBMITTED', 'Ya has subido una foto para este tema', []);
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  const categoryId = category_id ? Number.parseInt(category_id, 10) : null;
  if (category_id && (Number.isNaN(categoryId) || categoryId < 1)) {
    throw createError(400, 'VALIDATION_ERROR', 'category_id inválido', []);
  }
  if (categoryId) {
    const categoryCheck = await pool.query('SELECT id FROM categories WHERE id = $1', [categoryId]);
    if (categoryCheck.rowCount === 0) {
      throw createError(400, 'VALIDATION_ERROR', 'Categoría inválida', []);
    }
  }

  const insertResult = await pool.query(
    `INSERT INTO photos (user_id, theme_id, community_id, category_id, title, description, image_url, thumb_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, user_id, theme_id, community_id, category_id, title, description, image_url, thumb_url, is_moderated, is_deleted, created_at`,
    [
      req.user.id,
      themeId,
      themeResult.rows[0].community_id,
      categoryId,
      title,
      description || null,
      fileUrl,
      fileUrl,
    ]
  );

  res.status(201).json(insertResult.rows[0]);
}

export async function getPhotoById(req, res) {
  const photoId = Number.parseInt(req.params.id, 10);
  if (!photoId || photoId < 1 || Number.isNaN(photoId)) {
    throw createError(400, 'VALIDATION_ERROR', 'ID inválido', []);
  }

  const userId = req.user ? req.user.id : null;

  const result = await pool.query(
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

  if (result.rowCount === 0) {
    throw createError(404, 'PHOTO_NOT_FOUND', 'La foto no existe o fue eliminada', []);
  }

  res.json(result.rows[0]);
}

export async function deletePhoto(req, res) {
  const photoId = Number.parseInt(req.params.id, 10);
  if (!photoId || photoId < 1 || Number.isNaN(photoId)) {
    throw createError(400, 'VALIDATION_ERROR', 'ID inválido', []);
  }

  const photoResult = await pool.query('SELECT id, user_id FROM photos WHERE id = $1 AND is_deleted = false', [photoId]);
  if (photoResult.rowCount === 0) {
    throw createError(404, 'PHOTO_NOT_FOUND', 'La foto no existe o fue eliminada', []);
  }

  if (photoResult.rows[0].user_id !== req.user.id) {
    throw createError(403, 'FORBIDDEN', 'No tienes permiso para eliminar esta foto', []);
  }

  await pool.query('UPDATE photos SET is_deleted = true WHERE id = $1', [photoId]);
  res.status(204).send();
}
