/**
 * ARCHIVO: services/email.service.js
 * QUÉ HACE: Envía emails transaccionales usando Nodemailer con SendGrid como SMTP.
 *           Centraliza el transporte para que todos los servicios usen el mismo.
 * DEPENDE DE: nodemailer, process.env.SMTP_*
 * EXPORTA: enviarEmail({ para, asunto, html })
 */

import nodemailer from 'nodemailer';

// Transporte SMTP configurado con las variables de entorno
const transporte = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envía un email HTML.
 * @param {{ para: string, asunto: string, html: string }} opciones
 */
export async function enviarEmail({ para, asunto, html }) {
  await transporte.sendMail({
    from: process.env.EMAIL_FROM,
    to: para,
    subject: asunto,
    html,
  });
}

/**
 * Genera el email de bienvenida para un nuevo usuario registrado.
 * @param {{ nombre: string, email: string }} usuario
 */
export async function enviarEmailBienvenida({ nombre, email }) {
  await enviarEmail({
    para: email,
    asunto: '¡Bienvenido a myTEACHER! 🎓',
    html: `
      <h2>Hola ${nombre},</h2>
      <p>Tu cuenta en <strong>myTEACHER</strong> fue creada exitosamente.</p>
      <p>Ya puedes iniciar sesión y comenzar a conectar con tutores.</p>
      <p>— El equipo de myTEACHER</p>
    `,
  });
}

/**
 * Genera el email con el link de recuperación de contraseña.
 * @param {{ nombre: string, email: string, token: string }} opciones
 */
export async function enviarEmailRecuperacion({ nombre, email, token }) {
  const enlace = `${process.env.FRONTEND_URL}/pages/restablecer-password.html?token=${token}`;
  await enviarEmail({
    para: email,
    asunto: 'Recuperación de contraseña — myTEACHER',
    html: `
      <h2>Hola ${nombre},</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p><a href="${enlace}">Haz clic aquí para crear una nueva contraseña</a></p>
      <p>Este enlace expira en 1 hora. Si no solicitaste el cambio, ignora este email.</p>
    `,
  });
}

/**
 * Genera el email de recordatorio 1 hora antes de una sesión.
 * @param {{ nombre: string, email: string, sesion: object }} opciones
 */
export async function enviarRecordatorio({ nombre, email, sesion }) {
  await enviarEmail({
    para: email,
    asunto: '⏰ Recordatorio: tu sesión comienza en 1 hora — myTEACHER',
    html: `
      <h2>Hola ${nombre},</h2>
      <p>Tu sesión de <strong>${sesion.materia}</strong> comienza a las <strong>${sesion.hora_ini}</strong>.</p>
      <p>Modalidad: ${sesion.modalidad === 'virtual' ? '💻 Virtual (videollamada)' : '📍 Presencial'}</p>
      <p><a href="${process.env.FRONTEND_URL}/pages/tutorias.html">Ver detalles de la sesión</a></p>
    `,
  });
}
