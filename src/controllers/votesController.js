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
    `SELECT
       p.id,
       p.community_id,
       (t.is_active = true AND t.start_date <= CURRENT_DATE AND t.end_date >= CURRENT_DATE) AS can_vote
     FROM photos p
     JOIN themes t ON t.id = p.theme_id
     WHERE p.id = $1 AND p.is_deleted = false`,
    [photoId]
  );

  if (photoResult.rowCount === 0) {
    throw createError(404, 'PHOTO_NOT_FOUND', 'La foto no existe o fue eliminada', []);
  }

  if (!photoResult.rows[0].can_vote) {
    throw createError(400, 'VOTING_CLOSED', 'La votación de este concurso no está activa', []);
  }

  const existingVote = await pool.query(
    'SELECT id FROM votes WHERE photo_id = $1 AND user_id = $2',
    [photoId, req.user.id]
  );

  if (existingVote.rowCount > 0) {
    throw createError(400, 'ALREADY_VOTED', 'Ya has votado esta foto', []);
  }

  let insertResult;
  try {
    insertResult = await pool.query(
      `INSERT INTO votes (photo_id, user_id)
       VALUES ($1, $2)
       RETURNING id, photo_id, user_id, created_at`,
      [photoId, req.user.id]
    );
  } catch (error) {
    if (error?.code === '23505' && error?.constraint === 'uq_votes_user_photo') {
      throw createError(400, 'ALREADY_VOTED', 'Ya has votado esta foto', []);
    }
    throw error;
  }

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
