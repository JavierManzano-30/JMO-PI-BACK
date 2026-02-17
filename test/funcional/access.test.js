// Test de acceso general: comprueba estado base de la API.
import request from 'supertest';
import app from '../../src/app.js';

describe('Access and health endpoints', () => {
  test('GET /health devuelve ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('GET /api/v1/health devuelve ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('Ruta inexistente devuelve 404 con formato de error', async () => {
    const res = await request(app).get('/ruta-que-no-existe');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
