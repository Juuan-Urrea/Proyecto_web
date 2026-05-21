/**
 * ARCHIVO: controllers/mensajes.controller.js
 * QUÉ HACE: Devuelve el historial de conversaciones y mensajes paginados.
 *           El envío en tiempo real va por WebSocket (ws/chat.js).
 * DEPENDE DE: ../config/base-de-datos.js
 * EXPORTA: listarConversaciones, obtenerHistorial, enviarMensaje, marcarLeidos
 */

import { pool } from '../config/base-de-datos.js';

/** GET /api/mensajes/conversaciones */
export async function listarConversaciones(req, res) {
  const userId = req.usuario.id;
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (otro_id)
       otro_id,
       otro_nombre,
       otro_avatar,
       texto AS ultimo_mensaje,
       created_at,
       (SELECT COUNT(*) FROM messages
        WHERE receiver_id=$1 AND sender_id=otro_id AND leido=false) AS no_leidos
     FROM (
       SELECT
         CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END AS otro_id,
         CASE WHEN sender_id=$1 THEN (SELECT nombre FROM users WHERE id=receiver_id)
                                 ELSE (SELECT nombre FROM users WHERE id=sender_id) END AS otro_nombre,
         CASE WHEN sender_id=$1 THEN (SELECT avatar_url FROM users WHERE id=receiver_id)
                                 ELSE (SELECT avatar_url FROM users WHERE id=sender_id) END AS otro_avatar,
         texto, created_at
       FROM messages WHERE sender_id=$1 OR receiver_id=$1
     ) sub
     ORDER BY otro_id, created_at DESC`,
    [userId]
  );
  res.json({ conversaciones: rows });
}

/** GET /api/mensajes/conversacion/:userId */
export async function obtenerHistorial(req, res) {
  const yo = req.usuario.id;
  const otro = req.params.userId;
  const limit = 50;
  const offset = (Number(req.query.page ?? 1) - 1) * limit;

  const { rows } = await pool.query(
    `SELECT id, sender_id, receiver_id, texto, leido, created_at
     FROM messages
     WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1)
     ORDER BY created_at ASC LIMIT $3 OFFSET $4`,
    [yo, otro, limit, offset]
  );
  res.json({ mensajes: rows });
}

/** POST /api/mensajes */
export async function enviarMensaje(req, res) {
  const { receiver_id, texto } = req.body;
  if (!receiver_id || !texto) return res.status(400).json({ error: 'Faltan campos.' });

  const { rows } = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, texto) VALUES ($1,$2,$3) RETURNING *`,
    [req.usuario.id, receiver_id, texto]
  );
  res.status(201).json({ mensaje: rows[0] });
}

/** PATCH /api/mensajes/conversacion/:userId/leidos */
export async function marcarLeidos(req, res) {
  await pool.query(
    `UPDATE messages SET leido=true WHERE receiver_id=$1 AND sender_id=$2 AND leido=false`,
    [req.usuario.id, req.params.userId]
  );
  res.json({ mensaje: 'Mensajes marcados como leídos.' });
}
