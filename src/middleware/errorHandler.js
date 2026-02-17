// Middleware de Express: intercepta peticiones para aplicar reglas comunes.
import { errorPayload } from '../utils/errors.js';

export function errorHandler(error, _req, res, _next) {
  // Se mantiene por la firma de middleware de errores de Express (4 argumentos).
  void _next;
  if (error.code === 'LIMIT_FILE_SIZE') {
    error.status = 413;
    error.code = 'PAYLOAD_TOO_LARGE';
    error.message = 'Archivo demasiado grande';
  }
  const status = error.status || 500;
  const payload = errorPayload(error);
  res.status(status).json(payload);
}
