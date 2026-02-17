// Tests de utilidades: garantizan helpers estables y casos limite.
import { createError, errorPayload } from '../../../src/utils/errors.js';

describe('errors utils', () => {
  test('createError crea objeto de error con metadata', () => {
    const error = createError(400, 'VALIDATION_ERROR', 'Dato invalido', ['campo']);

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Dato invalido');
    expect(error.details).toEqual(['campo']);
  });

  test('errorPayload aplica valores por defecto', () => {
    const payload = errorPayload({});

    expect(payload).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Error inesperado del servidor',
      details: [],
    });
  });

  test('errorPayload normaliza details no-array', () => {
    const payload = errorPayload({
      code: 'ANY',
      message: 'msg',
      details: 'texto',
    });

    expect(payload).toEqual({
      code: 'ANY',
      message: 'msg',
      details: [],
    });
  });
});
