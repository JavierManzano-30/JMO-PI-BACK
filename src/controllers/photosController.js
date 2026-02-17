// Controlador: recibe la peticion HTTP, valida entradas y construye la respuesta.
import { createError } from '../utils/errors.js';
import { buildMeta, parsePagination } from '../utils/pagination.js';
import { emitPhotoCreated } from '../realtime/socket.js';
import {
  countPhotos,
  findActivePhotoByUserAndTheme,
  findCategoryById,
  findPhotoOwnerById,
  findPhotos,
  findPhotoWithDetailsById,
  findThemeById,
  insertPhoto,
  softDeletePhotoById,
} from '../models/photosModel.js';

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

  const countResult = await countPhotos(whereClause, values);

  const total = countResult.rows[0]?.total || 0;

  const listResult = await findPhotos(whereClause, orderBy, values, limit, offset, index);

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

  const themeResult = await findThemeById(themeId);

  if (themeResult.rowCount === 0) {
    throw createError(404, 'THEME_NOT_FOUND', 'Tema no encontrado', []);
  }

  if (!themeResult.rows[0].is_active) {
    throw createError(400, 'THEME_INACTIVE', 'El tema no está activo', []);
  }

  const existingPhoto = await findActivePhotoByUserAndTheme(req.user.id, themeId);

  if (existingPhoto.rowCount > 0) {
    throw createError(409, 'PHOTO_ALREADY_SUBMITTED', 'Ya has subido una foto para este tema', []);
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  const categoryId = category_id ? Number.parseInt(category_id, 10) : null;
  if (category_id && (Number.isNaN(categoryId) || categoryId < 1)) {
    throw createError(400, 'VALIDATION_ERROR', 'category_id inválido', []);
  }
  if (categoryId) {
    const categoryCheck = await findCategoryById(categoryId);
    if (categoryCheck.rowCount === 0) {
      throw createError(400, 'VALIDATION_ERROR', 'Categoría inválida', []);
    }
  }

  let insertResult;
  try {
    insertResult = await insertPhoto({
      userId: req.user.id,
      themeId,
      communityId: themeResult.rows[0].community_id,
      categoryId,
      title,
      description: description || null,
      imageUrl: fileUrl,
      thumbUrl: fileUrl,
    });
  } catch (error) {
    if (
      error?.code === '23505' &&
      (error?.constraint === 'uq_photos_user_theme' || error?.constraint === 'uq_photos_user_theme_active')
    ) {
      throw createError(409, 'PHOTO_ALREADY_SUBMITTED', 'Ya has subido una foto para este tema', []);
    }
    throw error;
  }

  const createdPhoto = insertResult.rows[0];

  // Notifica en tiempo real al frontend para refrescar el feed sin polling.
  emitPhotoCreated(createdPhoto);

  res.status(201).json(createdPhoto);
}

export async function getPhotoById(req, res) {
  const photoId = Number.parseInt(req.params.id, 10);
  if (!photoId || photoId < 1 || Number.isNaN(photoId)) {
    throw createError(400, 'VALIDATION_ERROR', 'ID inválido', []);
  }

  const userId = req.user ? req.user.id : null;

  const result = await findPhotoWithDetailsById(photoId, userId);

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

  const photoResult = await findPhotoOwnerById(photoId);
  if (photoResult.rowCount === 0) {
    throw createError(404, 'PHOTO_NOT_FOUND', 'La foto no existe o fue eliminada', []);
  }

  if (photoResult.rows[0].user_id !== req.user.id) {
    throw createError(403, 'FORBIDDEN', 'No tienes permiso para eliminar esta foto', []);
  }

  await softDeletePhotoById(photoId);
  res.status(204).send();
}
