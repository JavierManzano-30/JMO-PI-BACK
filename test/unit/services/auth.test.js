// Tests de servicios: verifican integraciones y logica de infraestructura.
import jwt from 'jsonwebtoken';
import { signToken } from '../../../src/utils/auth.js';
import config from '../../../src/config.js';

describe('Auth service', () => {
  test('signToken firma payload con campos esperados', () => {
    const token = signToken({
      id: 42,
      role: 'admin',
      email: 'admin@snapnation.test',
    });

    const payload = jwt.verify(token, config.jwt.secret);
    expect(payload.id).toBe(42);
    expect(payload.role).toBe('admin');
    expect(payload.email).toBe('admin@snapnation.test');
  });
});
