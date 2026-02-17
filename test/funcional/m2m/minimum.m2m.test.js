// Test m2m (machine-to-machine): smoke tests de endpoints clave.
import request from 'supertest';
import app from '../../../src/app.js';

describe('M2M minimum flow', () => {
  test('health endpoints responden 200', async () => {
    // Prueba de humo: si esto falla, el servidor no esta montado correctamente.
    const rootHealth = await request(app).get('/health');
    const apiHealth = await request(app).get('/api/v1/health');

    expect(rootHealth.status).toBe(200);
    expect(rootHealth.body.ok).toBe(true);
    expect(apiHealth.status).toBe(200);
    expect(apiHealth.body.ok).toBe(true);
  });

  test('Swagger JSON disponible', async () => {
    // Validamos que la documentacion OpenAPI este publicada.
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toBe('JMO-Backend API');
  });

  test('404 mantiene formato de error', async () => {
    // Comprobamos que los errores sigan el contrato del backend.
    const res = await request(app).get('/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
