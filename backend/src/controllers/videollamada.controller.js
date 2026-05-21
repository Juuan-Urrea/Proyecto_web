/**
 * ARCHIVO: controllers/videollamada.controller.js
 * QUÉ HACE: Crea salas de Daily.co para sesiones virtuales y genera tokens
 *           de participante con expiración alineada a la hora de fin de sesión.
 * DEPENDE DE: ../config/base-de-datos.js, ../services/daily.service.js
 * EXPORTA: crearSala, obtenerToken
 */

import { pool } from '../config/base-de-datos.js';
import { crearSalaDaily, generarTokenDaily } from '../services/daily.service.js';

/** POST /api/salas/sesion/:sessionId */
export async function crearSala(req, res) {
  const { sessionId } = req.params;
  const { rows } = await pool.query(
    `SELECT * FROM sessions WHERE id=$1 AND tutor_id=$2 AND modalidad='virtual'`,
    [sessionId, req.usuario.id]
  );
  const sesion = rows[0];
  if (!sesion) return res.status(404).json({ error: 'Sesión virtual no encontrada.' });

  // Calcula el timestamp de expiración de la sala (hora de fin de la sesión)
  const expiracion = Math.floor(new Date(`${sesion.fecha}T${sesion.hora_fin}`).getTime() / 1000);

  try {
    const { url } = await crearSalaDaily(sessionId, expiracion);
    await pool.query(
      `UPDATE sessions SET room_url=$1, updated_at=NOW() WHERE id=$2`, [url, sessionId]
    );
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/** GET /api/salas/sesion/:sessionId/token */
export async function obtenerToken(req, res) {
  const { sessionId } = req.params;
  const { rows } = await pool.query(
    `SELECT room_url, fecha, hora_fin FROM sessions WHERE id=$1 AND (tutor_id=$2 OR estudiante_id=$2)`,
    [sessionId, req.usuario.id]
  );
  const sesion = rows[0];
  if (!sesion || !sesion.room_url) {
    return res.status(404).json({ error: 'Sala no disponible aún.' });
  }

  // El token expira 30 min después de la hora de fin
  const expiracion = Math.floor(new Date(`${sesion.fecha}T${sesion.hora_fin}`).getTime() / 1000) + 1800;
  const nombreSala = sesion.room_url.split('/').pop();

  try {
    const token = await generarTokenDaily(nombreSala, req.usuario.id, expiracion);
    res.json({ token, url: sesion.room_url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
