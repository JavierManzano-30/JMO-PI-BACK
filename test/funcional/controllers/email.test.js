// Tests de controladores: validan entradas, respuestas y codigos HTTP.
import { jest } from '@jest/globals';
import request from 'supertest';

process.env.ENABLE_EMAIL_TEST_ENDPOINT = 'true';

const sendMailMock = jest.fn();
const createTransportMock = jest.fn(() => ({ sendMail: sendMailMock }));

jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: createTransportMock,
  },
}));

const { default: app } = await import('../../../src/app.js');
const { resetMailer } = await import('../../../src/services/email.js');
const { signToken } = await import('../../../src/utils/auth.js');

const adminToken = signToken({
  id: 1,
  role: 'admin',
  email: 'admin@snapnation.test',
});

describe('Email controller', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    resetMailer();
    createTransportMock.mockClear();
    sendMailMock.mockReset();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('POST /api/v1/email/test valida campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/v1/email/test')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        to: 'destino@correo.com',
        subject: '',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(createTransportMock).not.toHaveBeenCalled();
  });

  test('POST /api/v1/email/test envia email y devuelve metadatos', async () => {
    sendMailMock.mockResolvedValue({
      messageId: '<mailhog-1@snapnation.local>',
      accepted: ['destino@correo.com'],
      rejected: [],
    });

    const res = await request(app)
      .post('/api/v1/email/test')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        to: 'destino@correo.com',
        subject: 'Prueba endpoint',
        text: 'Hola',
      });

    expect(res.status).toBe(200);
    expect(res.body.messageId).toContain('mailhog-1');
    expect(res.body.accepted).toEqual(['destino@correo.com']);
    expect(res.body.rejected).toEqual([]);
    expect(createTransportMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'no-reply@snapnation.local',
        to: 'destino@correo.com',
        subject: 'Prueba endpoint',
        text: 'Hola',
      })
    );
  });
});
