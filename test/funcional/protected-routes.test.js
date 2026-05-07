import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';

describe('Protected API routes', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const protectedCases = [
    ['GET', '/api/v1/users/me'],
    ['PATCH', '/api/v1/users/me'],
    ['DELETE', '/api/v1/users/me'],
    ['POST', '/api/v1/photos'],
    ['DELETE', '/api/v1/photos/1'],
    ['POST', '/api/v1/photos/1/comments'],
    ['DELETE', '/api/v1/photos/1/comments/1'],
    ['POST', '/api/v1/votes'],
    ['DELETE', '/api/v1/votes'],
  ];

  test.each(protectedCases)('%s %s rechaza peticiones sin token', async (method, path) => {
    const res = await request(app)[method.toLowerCase()](path).send({});

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      code: 'AUTH_REQUIRED',
    });
  });
});
