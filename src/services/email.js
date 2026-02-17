// Servicio de infraestructura: encapsula integraciones externas (SMTP, etc.).
import nodemailer from 'nodemailer';
import config from '../config.js';

let transporter = null;

function isLocalSmtpHost(host) {
  return ['127.0.0.1', 'localhost', '::1'].includes(host);
}

export function buildTransportOptions(smtpConfig) {
  const allowInsecureLocal = Boolean(smtpConfig.allowInsecureLocal && isLocalSmtpHost(smtpConfig.host));
  const requireTLS = !allowInsecureLocal;

  if (smtpConfig.service) {
    const serviceOptions = {
      service: smtpConfig.service,
      secure: smtpConfig.secure,
      requireTLS,
      auth: smtpConfig.user && smtpConfig.pass ? { user: smtpConfig.user, pass: smtpConfig.pass } : undefined,
    };

    if (requireTLS) {
      serviceOptions.tls = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
    }

    return serviceOptions;
  }

  const options = {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: allowInsecureLocal ? false : smtpConfig.secure,
    requireTLS,
  };

  if (smtpConfig.user && smtpConfig.pass) {
    options.auth = {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    };
  }

  if (requireTLS) {
    options.tls = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    };
  }

  return options;
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(buildTransportOptions(config.smtp));
  }

  return transporter;
}

export async function sendEmail(message) {
  const mailer = getTransporter();
  const defaultFrom = config.smtp.from || config.smtp.user || 'no-reply@local.test';
  const payload = {
    ...message,
    from: message.from || defaultFrom,
  };

  return mailer.sendMail(payload);
}

export function resetMailer() {
  transporter = null;
}
