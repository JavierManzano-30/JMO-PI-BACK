import { errorPayload } from '../utils/errors.js';

export function errorHandler(error, _req, res, _next) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    error.status = 413;
    error.code = 'PAYLOAD_TOO_LARGE';
    error.message = 'Archivo demasiado grande';
  }
  const status = error.status || 500;
  const payload = errorPayload(error);
  res.status(status).json(payload);
}
