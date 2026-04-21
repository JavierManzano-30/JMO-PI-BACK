import { createError } from '../utils/errors.js';
import { buildMeta, parsePagination } from '../utils/pagination.js';
import {
  countCommentsByPhotoId,
  deleteCommentById,
  findCommentById,
  findCommentsByPhotoId,
  findPhotoForComments,
  insertComment,
} from '../models/commentsModel.js';
import { emitCommentCreated, emitCommentDeleted } from '../realtime/socket.js';

function parsePhotoId(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    throw createError(400, 'VALIDATION_ERROR', 'ID de foto inválido', []);
  }
  return parsed;
}

function parseCommentId(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    throw createError(400, 'VALIDATION_ERROR', 'ID de comentario inválido', []);
  }
  return parsed;
}

function mapComment(row, currentUser) {
  return {
    id: row.id,
    photo_id: row.photo_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
    user: row.user,
    can_delete: Boolean(currentUser && (currentUser.id === row.user_id || currentUser.role === 'admin')),
  };
}

export async function listPhotoComments(req, res) {
  const photoId = parsePhotoId(req.params.id);
  const { page, limit, offset } = parsePagination(req.query);

  const photoResult = await findPhotoForComments(photoId);
  if (photoResult.rowCount === 0 || photoResult.rows[0].is_deleted) {
    throw createError(404, 'PHOTO_NOT_FOUND', 'La foto no existe o fue eliminada', []);
  }

  const countResult = await countCommentsByPhotoId(photoId);
  const listResult = await findCommentsByPhotoId(photoId, limit, offset);
  const total = countResult.rows[0]?.total || 0;

  res.json({
    data: listResult.rows.map((row) => mapComment(row, req.user || null)),
    meta: buildMeta(total, page, limit),
  });
}

export async function createPhotoComment(req, res) {
  const photoId = parsePhotoId(req.params.id);
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

  if (!content || content.length > 1000) {
    throw createError(400, 'VALIDATION_ERROR', 'El comentario debe tener entre 1 y 1000 caracteres', []);
  }

  const photoResult = await findPhotoForComments(photoId);
  if (photoResult.rowCount === 0 || photoResult.rows[0].is_deleted) {
    throw createError(404, 'PHOTO_NOT_FOUND', 'La foto no existe o fue eliminada', []);
  }

  const created = await insertComment({
    photoId,
    userId: req.user.id,
    content,
  });

  const payload = {
    ...created.rows[0],
    user: {
      id: req.user.id,
      username: req.user.username,
      display_name: req.user.display_name || req.user.username,
      avatar_url: req.user.avatar_url || null,
    },
    can_delete: true,
  };

  emitCommentCreated({
    photo_id: photoId,
    community_id: photoResult.rows[0].community_id,
    comment: payload,
  });

  res.status(201).json(payload);
}

export async function deletePhotoComment(req, res) {
  const photoId = parsePhotoId(req.params.id);
  const commentId = parseCommentId(req.params.commentId);

  const photoResult = await findPhotoForComments(photoId);
  if (photoResult.rowCount === 0 || photoResult.rows[0].is_deleted) {
    throw createError(404, 'PHOTO_NOT_FOUND', 'La foto no existe o fue eliminada', []);
  }

  const commentResult = await findCommentById(commentId, photoId);
  if (commentResult.rowCount === 0) {
    throw createError(404, 'COMMENT_NOT_FOUND', 'Comentario no encontrado', []);
  }

  const comment = commentResult.rows[0];
  const canDelete = req.user.id === comment.user_id || req.user.role === 'admin';
  if (!canDelete) {
    throw createError(403, 'FORBIDDEN', 'No tienes permiso para eliminar este comentario', []);
  }

  await deleteCommentById(commentId);

  emitCommentDeleted({
    photo_id: photoId,
    community_id: photoResult.rows[0].community_id,
    comment_id: commentId,
  });

  res.status(204).send();
}
