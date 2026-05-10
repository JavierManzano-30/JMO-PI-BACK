// Utilidad compartida: helpers reutilizables para simplificar el codigo.
export function createError(status, code, message, details = []) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

export function errorPayload(error) {
  const status = error.status || 500;

  return {
    code: error.code || 'INTERNAL_ERROR',
    message: status >= 500 ? 'Error inesperado del servidor' : (error.message || 'Error inesperado del servidor'),
    details: status >= 500 ? [] : (Array.isArray(error.details) ? error.details : []),
  };
}
