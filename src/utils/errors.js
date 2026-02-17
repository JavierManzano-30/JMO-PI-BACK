// Utilidad compartida: helpers reutilizables para simplificar el codigo.
export function createError(status, code, message, details = []) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

export function errorPayload(error) {
  return {
    code: error.code || 'INTERNAL_ERROR',
    message: error.message || 'Error inesperado del servidor',
    details: Array.isArray(error.details) ? error.details : [],
  };
}
