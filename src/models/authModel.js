// Modelo de datos: aqui viven las consultas SQL contra PostgreSQL.
import pool from '../db/pool.js';

export function findUserByEmailOrUsername(email, username) {
  return pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
}

export function findCommunityById(id) {
  return pool.query('SELECT id FROM communities WHERE id = $1', [id]);
}

export function insertUser({ username, email, passwordHash, communityId }) {
  return pool.query(
    `INSERT INTO users (username, email, password_hash, community_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, email, display_name, avatar_url, role, community_id, created_at, updated_at`,
    [username, email, passwordHash, communityId || null]
  );
}

export function findUserForLoginByEmail(email) {
  return pool.query(
    `SELECT id, username, email, password_hash, display_name, avatar_url, role, community_id, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [email]
  );
}
