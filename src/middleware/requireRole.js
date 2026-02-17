// Middleware de Express: intercepta peticiones para aplicar reglas comunes.
import { createError } from '../utils/errors.js';

export function requireRole(role) {
  return (req, _res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(createError(403, 'FORBIDDEN', 'No tienes permisos para realizar esta acción'));
    }
    return next();
  };
}
