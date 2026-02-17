// Utilidad compartida: helpers reutilizables para simplificar el codigo.
import jwt from 'jsonwebtoken';
import config from '../config.js';

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}
