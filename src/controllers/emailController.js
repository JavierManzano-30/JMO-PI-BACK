// Controlador: recibe la peticion HTTP, valida entradas y construye la respuesta.
import { createError } from '../utils/errors.js';
import { sendEmail } from '../services/email.js';

export async function sendTestEmail(req, res) {
  const { to, subject, text, html, from } = req.body || {};

  if (!to || !subject || (!text && !html)) {
    throw createError(400, 'VALIDATION_ERROR', 'Faltan campos obligatorios', ['to', 'subject', 'text o html']);
  }

  const info = await sendEmail({
    to,
    subject,
    text,
    html,
    from,
  });

  res.status(200).json({
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  });
}
