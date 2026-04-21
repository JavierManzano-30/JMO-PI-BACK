// Controlador: recibe la peticion HTTP, valida entradas y construye la respuesta.
import pool from '../db/pool.js';
import { createError } from '../utils/errors.js';
import { emitVoteChanged } from '../realtime/socket.js';

export async function createVote(req, res) {
  const { photo_id } = req.body || {};
  const photoId = Number.parseInt(photo_id, 10);

  if (!photoId || photoId < 1 || Number.isNaN(photoId)) {
    throw createError(400, 'VALIDATION_ERROR', 'photo_id inválido', []);
  }

  const photoResult = await pool.query(
    'SELECT id, community_id FROM photos WHERE id = $1 AND is_deleted = false',
    [photoId]
  );

  if (photoResult.rowCount === 0) {
    throw createError(404, 'PHOTO_NOT_FOUND', 'La foto no existe o fue eliminada', []);
  }

  const existingVote = await pool.query(
    'SELECT id FROM votes WHERE photo_id = $1 AND user_id = $2',
    [photoId, req.user.id]
  );

  if (existingVote.rowCount > 0) {
    throw createError(400, 'ALREADY_VOTED', 'Ya has votado esta foto', []);
  }

  const insertResult = await pool.query(
    `INSERT INTO votes (photo_id, user_id)
     VALUES ($1, $2)
     RETURNING id, photo_id, user_id, created_at`,
    [photoId, req.user.id]
  );

  const voteCountResult = await pool.query(
    'SELECT COUNT(*)::int AS total_votes FROM votes WHERE photo_id = $1',
    [photoId]
  );

  emitVoteChanged({
    photo_id: photoId,
    community_id: photoResult.rows[0].community_id,
    total_votes: voteCountResult.rows[0]?.total_votes || 0,
    action: 'created',
  });

  res.status(201).json(insertResult.rows[0]);
}

export async function deleteVote(req, res) {
  const { photo_id } = req.body || {};
  const photoId = Number.parseInt(photo_id, 10);

  if (!photoId || photoId < 1 || Number.isNaN(photoId)) {
    throw createError(400, 'VALIDATION_ERROR', 'photo_id inválido', []);
  }

  const deleteResult = await pool.query(
    'DELETE FROM votes WHERE photo_id = $1 AND user_id = $2',
    [photoId, req.user.id]
  );

  if (deleteResult.rowCount === 0) {
    throw createError(404, 'VOTE_NOT_FOUND', 'Voto no encontrado', []);
  }

  const photoResult = await pool.query(
    'SELECT id, community_id FROM photos WHERE id = $1 AND is_deleted = false',
    [photoId]
  );
  const voteCountResult = await pool.query(
    'SELECT COUNT(*)::int AS total_votes FROM votes WHERE photo_id = $1',
    [photoId]
  );

  emitVoteChanged({
    photo_id: photoId,
    community_id: photoResult.rows[0]?.community_id || null,
    total_votes: voteCountResult.rows[0]?.total_votes || 0,
    action: 'deleted',
  });

  res.status(204).send();
}
