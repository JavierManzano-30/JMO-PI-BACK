// Tests de middleware: comprueban autenticacion, permisos y manejo de errores.
import { jest } from '@jest/globals';
import { errorHandler } from '../../../src/middleware/errorHandler.js';

function createRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('errorHandler middleware', () => {
  test('mapea LIMIT_FILE_SIZE a 413', () => {
    const err = { code: 'LIMIT_FILE_SIZE' };
    const res = createRes();

    errorHandler(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Archivo demasiado grande',
      details: [],
    });
  });

  test('usa status 500 por defecto', () => {
    const err = new Error('fallo');
    const res = createRes();

    errorHandler(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: 'INTERNAL_ERROR',
      message: 'fallo',
      details: [],
    });
  });
});
