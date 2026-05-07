// Tests de controladores: validan entradas, respuestas y codigos HTTP.
import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app.js';

describe('Auth controller validation', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('POST /api/v1/auth/register rechaza payload invalido', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      username: 'ab',
      email: 'correo-invalido',
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('POST /api/v1/auth/login rechaza payload invalido', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'sin-formato',
      password: '',
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
