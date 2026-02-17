// Tests de controladores: validan entradas, respuestas y codigos HTTP.
import { jest } from '@jest/globals';
import request from 'supertest';

const sendMailMock = jest.fn();
const createTransportMock = jest.fn(() => ({ sendMail: sendMailMock }));

jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: createTransportMock,
  },
}));

const { default: app } = await import('../../../src/app.js');
const { resetMailer } = await import('../../../src/services/email.js');

describe('Email controller', () => {
  beforeEach(() => {
    resetMailer();
    createTransportMock.mockClear();
    sendMailMock.mockReset();
  });

  test('POST /api/v1/email/test valida campos obligatorios', async () => {
    const res = await request(app).post('/api/v1/email/test').send({
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

    const res = await request(app).post('/api/v1/email/test').send({
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
