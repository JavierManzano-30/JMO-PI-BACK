// Modelo de datos: aqui viven las consultas SQL contra PostgreSQL.
import pool from '../db/pool.js';

export function findUserProfileById(id) {
  return pool.query(
    'SELECT id, username, email, display_name, avatar_url, role, community_id, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
}

export function updateUserProfileById(id, { displayName, avatarUrl }) {
  const updates = [];
  const values = [];
  let index = 1;

  if (displayName !== undefined) {
    updates.push(`display_name = $${index}`);
    values.push(displayName || null);
    index += 1;
  }

  if (avatarUrl !== undefined) {
    updates.push(`avatar_url = $${index}`);
    values.push(avatarUrl);
    index += 1;
  }

  values.push(id);
  return pool.query(
    `UPDATE users
     SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${index}
     RETURNING id, username, email, display_name, avatar_url, role, community_id, created_at, updated_at`,
    values
  );
}

export function deleteUserById(id) {
  return pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
}
