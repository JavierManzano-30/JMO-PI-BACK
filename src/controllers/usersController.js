// Controlador: recibe la peticion HTTP, valida entradas y construye la respuesta.
import {
  deleteUserById as deleteUserByIdModel,
  findUserProfileById,
  updateUserProfileById,
} from '../models/usersModel.js';
import { createError } from '../utils/errors.js';

export async function getMe(req, res) {
  const result = await findUserProfileById(req.user.id);

  if (result.rowCount === 0) {
    throw createError(404, 'USER_NOT_FOUND', 'Usuario no encontrado', []);
  }

  res.json(result.rows[0]);
}

export async function updateMe(req, res) {
  const { display_name } = req.body || {};
  const patch = {};

  if (display_name !== undefined) {
    if (typeof display_name !== 'string' || display_name.length > 100) {
      throw createError(400, 'VALIDATION_ERROR', 'display_name inválido', []);
    }
    patch.displayName = display_name;
  }

  if (req.file) {
    patch.avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  if (Object.keys(patch).length === 0) {
    throw createError(400, 'VALIDATION_ERROR', 'No hay cambios para aplicar', []);
  }

  const result = await updateUserProfileById(req.user.id, patch);

  res.json(result.rows[0]);
}

export async function deleteMe(req, res) {
  const result = await deleteUserByIdModel(req.user.id);

  if (result.rowCount === 0) {
    throw createError(404, 'USER_NOT_FOUND', 'Usuario no encontrado', []);
  }

  res.status(204).send();
}

export async function deleteUserById(req, res) {
  const userId = Number.parseInt(req.params.id, 10);
  if (!userId || userId < 1 || Number.isNaN(userId)) {
    throw createError(400, 'VALIDATION_ERROR', 'ID inválido', []);
  }

  const result = await deleteUserByIdModel(userId);

  if (result.rowCount === 0) {
    throw createError(404, 'USER_NOT_FOUND', 'Usuario no encontrado', []);
  }

  res.status(204).send();
}
