// Utilidad compartida: helpers reutilizables para simplificar el codigo.
export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
