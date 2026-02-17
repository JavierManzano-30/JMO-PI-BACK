// Tests de servicios: verifican integraciones y logica de infraestructura.
import { buildTransportOptions } from '../../../src/services/email.js';

describe('Email service', () => {
  test('buildTransportOptions devuelve host/port para SMTP local', () => {
    const options = buildTransportOptions({
      host: '127.0.0.1',
      port: 1025,
      secure: false,
      allowInsecureLocal: true,
      user: '',
      pass: '',
      service: '',
    });

    expect(options).toEqual({
      host: '127.0.0.1',
      port: 1025,
      secure: false,
      requireTLS: false,
    });
  });

  test('buildTransportOptions devuelve configuracion de service cuando se define', () => {
    const options = buildTransportOptions({
      host: '',
      port: 0,
      secure: true,
      allowInsecureLocal: false,
      user: 'user@test.com',
      pass: 'secret',
      service: 'gmail',
    });

    expect(options.service).toBe('gmail');
    expect(options.requireTLS).toBe(true);
    expect(options.tls).toEqual({ minVersion: 'TLSv1.2', rejectUnauthorized: true });
    expect(options.auth.user).toBe('user@test.com');
    expect(options.auth.pass).toBe('secret');
  });

  test('buildTransportOptions exige TLS cuando no es SMTP local inseguro', () => {
    const options = buildTransportOptions({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      allowInsecureLocal: false,
      user: '',
      pass: '',
      service: '',
    });

    expect(options.requireTLS).toBe(true);
    expect(options.tls).toEqual({ minVersion: 'TLSv1.2', rejectUnauthorized: true });
  });
});
