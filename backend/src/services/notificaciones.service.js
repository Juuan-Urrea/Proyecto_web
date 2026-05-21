/**
 * ARCHIVO: services/notificaciones.service.js
 * QUÉ HACE: Crea notificaciones en la base de datos y opcionalmente envía
 *           un email al usuario según sus preferencias de configuración.
 *           Es el único lugar donde se inserta en la tabla notifications.
 * DEPENDE DE: ../config/base-de-datos.js, ./email.service.js
 * EXPORTA: crearNotificacion(userId, tipo, titulo, texto, link?)
 */

import { pool } from '../config/base-de-datos.js';

/**
 * Crea una notificación en la base de datos para el usuario indicado.
 * @param {string} userId  - UUID del usuario que recibirá la notificación
 * @param {string} tipo    - Tipo de notif_type (ej: 'reserva_nueva')
 * @param {string} titulo  - Título corto de la notificación
 * @param {string} texto   - Descripción completa
 * @param {string} [link]  - Ruta interna opcional (ej: '/pages/tutorias.html')
 */
export async function crearNotificacion(userId, tipo, titulo, texto, link = null) {
  await pool.query(
    `INSERT INTO notifications (user_id, type, titulo, texto, link)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tipo, titulo, texto, link]
  );
}

/**
 * Devuelve el conteo de notificaciones no leídas de un usuario.
 * Se usa para el badge de la campana en la navbar.
 * @param {string} userId
 * @returns {number}
 */
export async function contarNoLeidas(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS total FROM notifications WHERE user_id = $1 AND leida = false`,
    [userId]
  );
  return Number(rows[0].total);
}
