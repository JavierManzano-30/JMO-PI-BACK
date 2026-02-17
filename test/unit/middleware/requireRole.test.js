// Tests de middleware: comprueban autenticacion, permisos y manejo de errores.
import { jest } from '@jest/globals';
import { requireRole } from '../../../src/middleware/requireRole.js';

describe('requireRole middleware', () => {
  test('bloquea cuando no hay usuario', () => {
    const next = jest.fn();
    const mw = requireRole('admin');

    mw({}, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].status).toBe(403);
    expect(next.mock.calls[0][0].code).toBe('FORBIDDEN');
  });

  test('bloquea cuando rol no coincide', () => {
    const next = jest.fn();
    const mw = requireRole('admin');

    mw({ user: { role: 'user' } }, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].status).toBe(403);
  });

  test('permite cuando rol coincide', () => {
    const next = jest.fn();
    const mw = requireRole('admin');

    mw({ user: { role: 'admin' } }, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });
});
