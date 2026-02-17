// Controlador: recibe la peticion HTTP, valida entradas y construye la respuesta.
import bcrypt from 'bcryptjs';
import { createError } from '../utils/errors.js';
import { signToken } from '../utils/auth.js';
import {
  findCommunityById,
  findUserByEmailOrUsername,
  findUserForLoginByEmail,
  insertUser,
} from '../models/authModel.js';

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
  if (typeof email !== 'string') {
    return false;
  }

  const value = email.trim();

  if (value.length < 6 || value.length > 254 || value.includes(' ')) {
    return false;
  }

  const atIndex = value.indexOf('@');
  if (atIndex <= 0 || atIndex !== value.lastIndexOf('@') || atIndex === value.length - 1) {
    return false;
  }

  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);

  if (local.length < 1 || local.length > 64 || domain.length < 3 || domain.length > 253) {
    return false;
  }

  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return false;
  }

  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return false;
  }

  const isAscii = (str) => [...str].every((char) => char.charCodeAt(0) <= 127);
  if (!isAscii(local) || !isAscii(domain)) {
    return false;
  }

  const validLocalChars = new Set(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!#$%&'*+/=?^_`{|}~-"
  );
  for (const char of local) {
    if (!validLocalChars.has(char)) {
      return false;
    }
  }

  const labels = domain.split('.');
  if (labels.length < 2) {
    return false;
  }

  for (const label of labels) {
    if (label.length < 1 || label.length > 63) {
      return false;
    }

    if (!/^[A-Za-z0-9-]+$/.test(label)) {
      return false;
    }

    if (label.startsWith('-') || label.endsWith('-')) {
      return false;
    }
  }

  const tld = labels[labels.length - 1];
  return tld.length >= 2;
}

function isValidUsername(username) {
  return typeof username === 'string' && /^[a-zA-Z0-9_]{3,50}$/.test(username);
}

export async function register(req, res) {
  const { username, email, password, community_id } = req.body || {};

  if (!isValidUsername(username) || !isValidEmail(email) || typeof password !== 'string' || password.length < 8) {
    throw createError(400, 'VALIDATION_ERROR', 'Datos inválidos', []);
  }

  const normalizedEmail = email.toLowerCase();
  const normalizedUsername = username;

  const existing = await findUserByEmailOrUsername(normalizedEmail, normalizedUsername);

  if (existing.rowCount > 0) {
    throw createError(409, 'USER_EXISTS', 'El usuario ya existe', []);
  }

  const communityId = community_id ? Number.parseInt(community_id, 10) : null;
  if (community_id && (Number.isNaN(communityId) || communityId < 1)) {
    throw createError(400, 'VALIDATION_ERROR', 'Comunidad inválida', []);
  }
  if (communityId) {
    const communityCheck = await findCommunityById(communityId);
    if (communityCheck.rowCount === 0) {
      throw createError(400, 'VALIDATION_ERROR', 'Comunidad inválida', []);
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await insertUser({
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    communityId,
  });

  const user = mapUser(result.rows[0]);
  const token = signToken(user);

  res.status(201).json({ token, user });
}

export async function login(req, res) {
  const { email, password } = req.body || {};

  if (!isValidEmail(email) || typeof password !== 'string' || password.length < 1) {
    throw createError(400, 'VALIDATION_ERROR', 'Datos inválidos', []);
  }

  const normalizedEmail = email.toLowerCase();
  const result = await findUserForLoginByEmail(normalizedEmail);

  if (result.rowCount === 0) {
    throw createError(401, 'AUTH_REQUIRED', 'Credenciales incorrectas', []);
  }

  const userRow = result.rows[0];
  const matches = await bcrypt.compare(password, userRow.password_hash);

  if (!matches) {
    throw createError(401, 'AUTH_REQUIRED', 'Credenciales incorrectas', []);
  }

  const user = mapUser(userRow);
  const token = signToken(user);

  res.status(200).json({ token, user });
}
