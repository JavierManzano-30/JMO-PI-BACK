import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/pool.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createError } from '../utils/errors.js';
import { signToken } from '../utils/auth.js';

const router = Router();

function mapUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    role: row.role,
    community_id: row.community_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function isValidEmail(email) {
  return typeof email === 'string' && /.+@.+\..+/.test(email);
}

function isValidUsername(username) {
  return typeof username === 'string' && /^[a-zA-Z0-9_]{3,50}$/.test(username);
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { username, email, password, community_id } = req.body || {};

    if (!isValidUsername(username) || !isValidEmail(email) || typeof password !== 'string' || password.length < 8) {
      throw createError(400, 'VALIDATION_ERROR', 'Datos inválidos', []);
    }

    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username;

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [normalizedEmail, normalizedUsername]
    );

    if (existing.rowCount > 0) {
      throw createError(409, 'USER_EXISTS', 'El usuario ya existe', []);
    }

    const communityId = community_id ? Number.parseInt(community_id, 10) : null;
    if (community_id && (Number.isNaN(communityId) || communityId < 1)) {
      throw createError(400, 'VALIDATION_ERROR', 'Comunidad inválida', []);
    }
    if (communityId) {
      const communityCheck = await pool.query('SELECT id FROM communities WHERE id = $1', [communityId]);
      if (communityCheck.rowCount === 0) {
        throw createError(400, 'VALIDATION_ERROR', 'Comunidad inválida', []);
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, community_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, display_name, avatar_url, role, community_id, created_at, updated_at`,
      [normalizedUsername, normalizedEmail, passwordHash, communityId || null]
    );

    const user = mapUser(result.rows[0]);
    const token = signToken(user);

    res.status(201).json({ token, user });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    if (!isValidEmail(email) || typeof password !== 'string' || password.length < 1) {
      throw createError(400, 'VALIDATION_ERROR', 'Datos inválidos', []);
    }

    const normalizedEmail = email.toLowerCase();
    const result = await pool.query(
      'SELECT id, username, email, password_hash, display_name, avatar_url, role, community_id, created_at, updated_at FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rowCount === 0) {
      throw createError(401, 'INVALID_CREDENTIALS', 'Credenciales incorrectas', []);
    }

    const userRow = result.rows[0];
    const matches = await bcrypt.compare(password, userRow.password_hash);

    if (!matches) {
      throw createError(401, 'INVALID_CREDENTIALS', 'Credenciales incorrectas', []);
    }

    const user = mapUser(userRow);
    const token = signToken(user);

    res.status(200).json({ token, user });
  })
);

export default router;
