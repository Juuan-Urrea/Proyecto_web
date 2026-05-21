/**
 * ARCHIVO: controllers/sesiones.controller.js
 * QUÉ HACE: Crear, listar, cambiar estado, reseñar y cancelar sesiones.
 *           precio_total se congela al momento de crear la reserva.
 * DEPENDE DE: ../config/base-de-datos.js, ../services/notificaciones.service.js
 * EXPORTA: crearSesion, listarSesiones, obtenerSesion, cambiarEstado, dejarResena, cancelarSesion
 */

import { pool } from '../config/base-de-datos.js';
import { crearNotificacion } from '../services/notificaciones.service.js';

/** POST /api/sesiones — el estudiante crea la solicitud */
export async function crearSesion(req, res) {
  const { tutor_id, materia_id, modalidad, metodo_pago, fecha, hora_ini, hora_fin, notas } = req.body;
  const estudiante_id = req.usuario.id;

  // Obtiene el precio del tutor para congelarlo como snapshot
  const { rows: tp } = await pool.query(
    'SELECT precio_hora FROM tutor_profiles WHERE user_id=$1', [tutor_id]
  );
  if (!tp[0]) return res.status(404).json({ error: 'Tutor no encontrado.' });

  // Calcula el precio total según horas (hora_ini/hora_fin en formato HH:MM)
  const [hi, hf] = [hora_ini, hora_fin].map(h => { const [hr, mn] = h.split(':').map(Number); return hr * 60 + mn; });
  const horas = (hf - hi) / 60;
  const precio_total = Math.round(tp[0].precio_hora * horas);

  const { rows } = await pool.query(
    `INSERT INTO sessions (tutor_id,estudiante_id,materia_id,modalidad,metodo_pago,fecha,hora_ini,hora_fin,precio_total,notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [tutor_id, estudiante_id, materia_id, modalidad, metodo_pago, fecha, hora_ini, hora_fin, precio_total, notas ?? '']
  );

  // Notifica al tutor
  await crearNotificacion(tutor_id, 'reserva_nueva', 'Nueva solicitud de sesión',
    `Tienes una nueva solicitud de tutoría para el ${fecha}`, '/pages/solicitudes.html');

  res.status(201).json({ sesion: rows[0] });
}

/** GET /api/sesiones?status=&page= */
export async function listarSesiones(req, res) {
  const { status, page = 1 } = req.query;
  const userId = req.usuario.id;
  const limit = 10;
  const offset = (Number(page) - 1) * limit;

  const params = [userId, userId];
  let filtroStatus = '';
  if (status) { params.push(status); filtroStatus = `AND s.status = $${params.length}`; }

  const { rows } = await pool.query(
    `SELECT s.*, m.label AS materia_label,
            t.nombre AS tutor_nombre, t.apellido AS tutor_apellido, t.avatar_url AS tutor_avatar,
            e.nombre AS est_nombre, e.apellido AS est_apellido, e.avatar_url AS est_avatar
     FROM sessions s
     JOIN materias m ON m.id = s.materia_id
     JOIN users t ON t.id = s.tutor_id
     JOIN users e ON e.id = s.estudiante_id
     WHERE (s.tutor_id=$1 OR s.estudiante_id=$2) ${filtroStatus}
     ORDER BY s.fecha DESC, s.hora_ini DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  res.json({ sesiones: rows, pagina: Number(page) });
}

/** GET /api/sesiones/:id */
export async function obtenerSesion(req, res) {
  const { rows } = await pool.query(
    `SELECT s.*, m.label AS materia_label,
            t.nombre AS tutor_nombre, t.apellido AS tutor_apellido, t.avatar_url AS tutor_avatar,
            e.nombre AS est_nombre, e.apellido AS est_apellido, e.avatar_url AS est_avatar
     FROM sessions s
     JOIN materias m ON m.id=s.materia_id
     JOIN users t ON t.id=s.tutor_id
     JOIN users e ON e.id=s.estudiante_id
     WHERE s.id=$1 AND (s.tutor_id=$2 OR s.estudiante_id=$2)`,
    [req.params.id, req.usuario.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Sesión no encontrada.' });
  res.json({ sesion: rows[0] });
}

/** PATCH /api/sesiones/:id/estado — tutor acepta o rechaza */
export async function cambiarEstado(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const estadosPermitidos = ['confirmada', 'rechazada', 'completada', 'cancelada', 'en_curso', 'no_asistio'];

  if (!estadosPermitidos.includes(status)) {
    return res.status(400).json({ error: 'Estado no válido.' });
  }

  const { rows } = await pool.query(
    `UPDATE sessions SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`, [status, id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Sesión no encontrada.' });

  // Notifica al otro participante según el nuevo estado
  const sesion = rows[0];
  const notifMap = {
    confirmada: { uid: sesion.estudiante_id, tipo: 'reserva_confirmada', titulo: 'Sesión confirmada', texto: `Tu sesión del ${sesion.fecha} fue confirmada.` },
    rechazada:  { uid: sesion.estudiante_id, tipo: 'reserva_cancelada',  titulo: 'Sesión rechazada',  texto: `Tu sesión del ${sesion.fecha} fue rechazada por el tutor.` },
    cancelada:  { uid: sesion.tutor_id,      tipo: 'reserva_cancelada',  titulo: 'Sesión cancelada',  texto: `Una sesión del ${sesion.fecha} fue cancelada.` },
  };

  if (notifMap[status]) {
    const { uid, tipo, titulo, texto } = notifMap[status];
    await crearNotificacion(uid, tipo, titulo, texto, '/pages/tutorias.html');
  }

  res.json({ sesion: rows[0] });
}

/** POST /api/sesiones/:id/resena — el estudiante deja su reseña */
export async function dejarResena(req, res) {
  const { id } = req.params;
  const { rating, comentario } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating entre 1 y 5 requerido.' });
  }

  const { rows: sesRows } = await pool.query(
    `SELECT * FROM sessions WHERE id=$1 AND estudiante_id=$2 AND status='completada'`,
    [id, req.usuario.id]
  );
  if (!sesRows[0]) return res.status(403).json({ error: 'No puedes reseñar esta sesión.' });

  const { rows } = await pool.query(
    `INSERT INTO reviews (session_id,tutor_id,estudiante_id,rating,comentario)
     VALUES ($1,$2,$3,$4,$5) ON CONFLICT (session_id) DO NOTHING RETURNING *`,
    [id, sesRows[0].tutor_id, req.usuario.id, rating, comentario ?? '']
  );

  if (!rows[0]) return res.status(409).json({ error: 'Ya dejaste una reseña para esta sesión.' });

  await crearNotificacion(sesRows[0].tutor_id, 'resena_nueva', 'Nueva reseña',
    `Recibiste una reseña de ${rating} estrellas.`, `/pages/perfil-tutor.html?id=${sesRows[0].tutor_id}`);

  res.status(201).json({ resena: rows[0] });
}

/** DELETE /api/sesiones/:id — cancelar con mínimo 2h de anticipación */
export async function cancelarSesion(req, res) {
  const { rows } = await pool.query(
    `SELECT * FROM sessions WHERE id=$1 AND (tutor_id=$2 OR estudiante_id=$2)`,
    [req.params.id, req.usuario.id]
  );
  const sesion = rows[0];
  if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada.' });

  // Verifica la restricción de 2 horas de anticipación
  const inicio = new Date(`${sesion.fecha}T${sesion.hora_ini}`);
  const ahora = new Date();
  const diffHoras = (inicio - ahora) / (1000 * 60 * 60);

  if (diffHoras < 2) {
    return res.status(400).json({ error: 'No puedes cancelar con menos de 2 horas de anticipación.' });
  }

  await pool.query(
    `UPDATE sessions SET status='cancelada', updated_at=NOW() WHERE id=$1`, [sesion.id]
  );

  // Notifica al otro participante
  const otraPersona = req.usuario.id === sesion.tutor_id ? sesion.estudiante_id : sesion.tutor_id;
  await crearNotificacion(otraPersona, 'reserva_cancelada', 'Sesión cancelada',
    `La sesión del ${sesion.fecha} fue cancelada.`, '/pages/tutorias.html');

  res.json({ mensaje: 'Sesión cancelada exitosamente.' });
}
