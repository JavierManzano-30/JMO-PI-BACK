// Modelo de datos: aqui viven las consultas SQL contra PostgreSQL.
import pool from '../db/pool.js';

export function countCommunities() {
  return pool.query('SELECT COUNT(*)::int AS total FROM communities');
}

export function findCommunitiesPaginated(limit, offset) {
  return pool.query(
    `SELECT id, code, name, created_at
     FROM communities
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
}

export function findCommunityById(id) {
  return pool.query('SELECT id, code, name, created_at FROM communities WHERE id = $1', [id]);
}
