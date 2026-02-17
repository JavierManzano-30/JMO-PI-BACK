// Tests de middleware: comprueban autenticacion, permisos y manejo de errores.
import { jest } from '@jest/globals';

// Mock de jwt.verify para controlar si el token es valido o invalido.
const verifyMock = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: verifyMock,
  },
}));

const { authenticate, optionalAuth } = await import('../../../src/middleware/auth.js');

describe('auth middleware', () => {
  beforeEach(() => {
    // Limpiamos el mock antes de cada test para no mezclar llamadas.
    verifyMock.mockReset();
  });

  test('authenticate falla sin token', () => {
    const next = jest.fn();
    authenticate({ headers: {} }, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].status).toBe(401);
    expect(next.mock.calls[0][0].code).toBe('AUTH_REQUIRED');
  });

  test('authenticate acepta token valido', () => {
    // Simulamos que jwt.verify devuelve el payload del usuario.
    verifyMock.mockReturnValue({ id: 10, role: 'user' });
    const req = { headers: { authorization: 'Bearer token-ok' } };
    const next = jest.fn();

    authenticate(req, {}, next);

    expect(req.user).toEqual({ id: 10, role: 'user' });
    expect(next).toHaveBeenCalledWith();
  });

  test('authenticate falla con token invalido', () => {
    // Simulamos error de verificacion de JWT.
    verifyMock.mockImplementation(() => {
      throw new Error('bad token');
    });
    const next = jest.fn();

    authenticate({ headers: { authorization: 'Bearer bad' } }, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].status).toBe(401);
  });

  test('optionalAuth sigue sin token', () => {
    // En optionalAuth, no tener token no es error: continua sin req.user.
    const req = { headers: {} };
    const next = jest.fn();

    optionalAuth(req, {}, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  test('optionalAuth guarda usuario con token valido', () => {
    verifyMock.mockReturnValue({ id: 2 });
    const req = { headers: { authorization: 'Bearer token-ok' } };
    const next = jest.fn();

    optionalAuth(req, {}, next);

    expect(req.user).toEqual({ id: 2 });
    expect(next).toHaveBeenCalledWith();
  });

  test('optionalAuth pone user=null con token invalido', () => {
    // optionalAuth no bloquea la peticion si el token esta mal.
    verifyMock.mockImplementation(() => {
      throw new Error('bad token');
    });
    const req = { headers: { authorization: 'Bearer bad' } };
    const next = jest.fn();

    optionalAuth(req, {}, next);

    expect(req.user).toBeNull();
    expect(next).toHaveBeenCalledWith();
  });
});
