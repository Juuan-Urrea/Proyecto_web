/**
 * ARCHIVO: controllers/notificaciones.controller.js
 * QUÉ HACE: Lista, marca como leída una o todas las notificaciones del usuario.
 * DEPENDE DE: ../config/base-de-datos.js
 * EXPORTA: listarNotificaciones, marcarLeida, marcarTodasLeidas
 */

import { pool } from '../config/base-de-datos.js';

/** GET /api/notificaciones?leida=false&page=1 */
export async function listarNotificaciones(req, res) {
  const userId = req.usuario.id;
  const { leida, page = 1 } = req.query;
  const limit = 20;
  const offset = (Number(page) - 1) * limit;
  const params = [userId];
  let filtro = '';
  if (leida !== undefined) { params.push(leida === 'true'); filtro = `AND leida=$${params.length}`; }

  const { rows } = await pool.query(
    `SELECT id, type, titulo, texto, leida, link, created_at
     FROM notifications WHERE user_id=$1 ${filtro}
     ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const { rows: count } = await pool.query(
    `SELECT COUNT(*) AS total FROM notifications WHERE user_id=$1 AND leida=false`, [userId]
  );

  res.json({ notificaciones: rows, no_leidas: Number(count[0].total) });
}

/** PATCH /api/notificaciones/:id/leida */
export async function marcarLeida(req, res) {
  await pool.query(
    `UPDATE notifications SET leida=true WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.usuario.id]
  );
  res.json({ mensaje: 'Notificación marcada como leída.' });
}

/** PATCH /api/notificaciones/todas-leidas */
export async function marcarTodasLeidas(req, res) {
  await pool.query(
    `UPDATE notifications SET leida=true WHERE user_id=$1 AND leida=false`,
    [req.usuario.id]
  );
  res.json({ mensaje: 'Todas las notificaciones marcadas como leídas.' });
}
