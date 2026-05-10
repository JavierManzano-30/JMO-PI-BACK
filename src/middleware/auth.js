// Middleware de Express: intercepta peticiones para aplicar reglas comunes.
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { createError } from '../utils/errors.js';
import config from '../config.js';

const supabaseAuthClient = config.supabase.url && config.supabase.key
  ? createClient(config.supabase.url, config.supabase.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  : null;

let authModelPromise = null;

function getAuthModel() {
  authModelPromise ||= import('../models/authModel.js');
  return authModelPromise;
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+([A-Za-z0-9._~+/-]+=*)$/);
  return match ? match[1] : null;
}

function parsePositiveInt(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number(value);
  }
  return null;
}

function normalizeUsername(value, fallback) {
  const rawValue = typeof value === 'string' && value.trim() ? value : fallback;
  const normalized = String(rawValue || `user_${Date.now()}`)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);

  return normalized || `user_${Date.now().toString().slice(-6)}`;
}

function usernameWithSuffix(base, suffix) {
  const safeSuffix = String(suffix || Date.now()).replace(/[^a-z0-9]/gi, '').slice(-8).toLowerCase();
  const head = base.slice(0, Math.max(1, 50 - safeSuffix.length - 1));
  return `${head}_${safeSuffix}`;
}

async function resolveCommunityId(metadata) {
  const candidate = parsePositiveInt(metadata?.community_id) || parsePositiveInt(metadata?.region_id);
  if (!candidate) {
    return null;
  }

  const { findCommunityById } = await getAuthModel();
  const result = await findCommunityById(candidate);
  return result.rowCount > 0 ? candidate : null;
}

async function findOrCreateUserFromSupabase(authUser) {
  const email = String(authUser?.email || '').trim().toLowerCase();
  if (!email) {
    return null;
  }

  const { findUserByEmail, insertSupabaseUser } = await getAuthModel();
  const existing = await findUserByEmail(email);
  if (existing.rowCount > 0) {
    return existing.rows[0];
  }

  const metadata = authUser.user_metadata || {};
  const baseUsername = normalizeUsername(
    metadata.username ||
      metadata.user_name ||
      metadata.preferred_username ||
      email.split('@')[0],
    email.split('@')[0]
  );
  const displayName = metadata.full_name || metadata.name || metadata.display_name || baseUsername;
  const avatarUrl = metadata.avatar_url || metadata.picture || null;
  const communityId = await resolveCommunityId(metadata);
  const candidates = [
    baseUsername,
    usernameWithSuffix(baseUsername, authUser.id),
    usernameWithSuffix(baseUsername, Date.now()),
  ];

  for (const username of [...new Set(candidates)]) {
    try {
      const created = await insertSupabaseUser({
        username,
        email,
        displayName,
        avatarUrl,
        communityId,
      });
      return created.rows[0];
    } catch (error) {
      if (error?.code !== '23505') {
        throw error;
      }

      const retryExisting = await findUserByEmail(email);
      if (retryExisting.rowCount > 0) {
        return retryExisting.rows[0];
      }
    }
  }

  return null;
}

function mapBackendUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    role: row.role,
    community_id: row.community_id,
  };
}

async function resolveSupabaseUser(token) {
  if (!supabaseAuthClient || token.split('.').length !== 3) {
    return null;
  }

  const { data, error } = await supabaseAuthClient.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }

  const backendUser = await findOrCreateUserFromSupabase(data.user);
  return backendUser ? mapBackendUser(backendUser) : null;
}

async function resolveUserFromToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch {
    return resolveSupabaseUser(token);
  }
}

export async function authenticate(req, _res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return next(createError(401, 'AUTH_REQUIRED', 'Token no presente o inválido'));
  }

  try {
    const user = await resolveUserFromToken(token);
    if (!user) {
      return next(createError(401, 'AUTH_REQUIRED', 'Token no presente o inválido'));
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error?.status) {
      return next(error);
    }
    return next(createError(401, 'AUTH_REQUIRED', 'Token no presente o inválido'));
  }
}

export async function optionalAuth(req, _res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return next();
  }

  try {
    req.user = await resolveUserFromToken(token);
  } catch {
    req.user = null;
  }

  return next();
}
