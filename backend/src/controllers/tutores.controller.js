/**
 * ARCHIVO: controllers/tutores.controller.js
 * QUÉ HACE: Maneja búsqueda de tutores con filtros, perfil completo,
 *           disponibilidad semanal y cálculo de slots libres.
 * DEPENDE DE: ../config/base-de-datos.js, ../services/slots.service.js
 * EXPORTA: listarTutores, obtenerTutor, obtenerDisponibilidad,
 *          actualizarDisponibilidad, obtenerSlots, obtenerResenas
 */

import { pool } from '../config/base-de-datos.js';
import { obtenerSlotsDisponibles } from '../services/slots.service.js';

/** GET /api/tutores — lista con filtros y paginación */
export async function listarTutores(req, res) {
  const { materia, ciudad, precio_min, precio_max, verificado, search,
          order_by = 'rating', page = 1, limit = 12 } = req.query;

  const conds = ["u.activo = true", "u.role = 'tutor'"];
  const params = [];

  if (materia) {
    params.push(materia);
    conds.push(`EXISTS(SELECT 1 FROM tutor_materias tm WHERE tm.tutor_id=u.id AND tm.materia_id=$${params.length})`);
  }
  if (ciudad)     { params.push(`%${ciudad}%`);     conds.push(`u.ciudad ILIKE $${params.length}`); }
  if (precio_min) { params.push(+precio_min);        conds.push(`tp.precio_hora >= $${params.length}`); }
  if (precio_max) { params.push(+precio_max);        conds.push(`tp.precio_hora <= $${params.length}`); }
  if (verificado === 'true') conds.push('tp.verificado = true');
  if (search) {
    params.push(`%${search}%`);
    conds.push(`(u.nombre ILIKE $${params.length} OR u.apellido ILIKE $${params.length})`);
  }

  const orden = order_by === 'precio' ? 'tp.precio_hora ASC' : 'tp.rating DESC';
  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);

  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.apellido, u.ciudad, u.avatar_url, u.bio,
            tp.precio_hora, tp.anios_exp, tp.verificado, tp.rating, tp.total_reviews,
            COALESCE(array_agg(DISTINCT m.label) FILTER (WHERE m.label IS NOT NULL), '{}') AS materias,
            COALESCE(array_agg(DISTINCT b.label) FILTER (WHERE b.label IS NOT NULL), '{}') AS badges
     FROM users u
     JOIN tutor_profiles tp ON tp.user_id = u.id
     LEFT JOIN tutor_materias tm ON tm.tutor_id = u.id
     LEFT JOIN materias m ON m.id = tm.materia_id
     LEFT JOIN tutor_badges b ON b.tutor_id = u.id
     WHERE ${conds.join(' AND ')}
     GROUP BY u.id,tp.precio_hora,tp.anios_exp,tp.verificado,tp.rating,tp.total_reviews
     ORDER BY ${orden}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  res.json({ tutores: rows, pagina: Number(page) });
}

/** GET /api/tutores/:id — perfil completo */
export async function obtenerTutor(req, res) {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.apellido, u.ciudad, u.avatar_url, u.bio,
            tp.precio_hora, tp.anios_exp, tp.verificado, tp.responde_rapido,
            tp.rating, tp.total_reviews, tp.total_sesiones, tp.total_horas
     FROM users u JOIN tutor_profiles tp ON tp.user_id = u.id
     WHERE u.id = $1 AND u.activo = true AND u.role = 'tutor'`, [id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Tutor no encontrado.' });

  const { rows: materias } = await pool.query(
    `SELECT m.id, m.label, m.emoji FROM tutor_materias tm JOIN materias m ON m.id=tm.materia_id WHERE tm.tutor_id=$1`, [id]
  );
  const { rows: badges } = await pool.query(
    `SELECT label FROM tutor_badges WHERE tutor_id=$1 ORDER BY orden`, [id]
  );
  const { rows: resenas } = await pool.query(
    `SELECT r.rating, r.comentario, r.created_at, u.nombre AS nombre_estudiante, u.avatar_url AS avatar_estudiante
     FROM reviews r JOIN users u ON u.id=r.estudiante_id WHERE r.tutor_id=$1 ORDER BY r.created_at DESC LIMIT 5`, [id]
  );

  res.json({ tutor: { ...rows[0], materias, badges: badges.map(b => b.label), resenas } });
}

/** GET /api/tutores/:id/disponibilidad */
export async function obtenerDisponibilidad(req, res) {
  const { rows } = await pool.query(
    `SELECT id, dia, hora_ini, hora_fin, activo FROM disponibilidad_tutor WHERE tutor_id=$1 ORDER BY dia, hora_ini`,
    [req.params.id]
  );
  res.json({ disponibilidad: rows });
}

/** PUT /api/tutores/:id/disponibilidad — reemplaza toda la disponibilidad */
export async function actualizarDisponibilidad(req, res) {
  const { id } = req.params;
  if (req.usuario.id !== id) return res.status(403).json({ error: 'Sin permisos.' });

  const { franjas } = req.body;
  const cli = await pool.connect();
  try {
    await cli.query('BEGIN');
    await cli.query('DELETE FROM disponibilidad_tutor WHERE tutor_id=$1', [id]);
    for (const { dia, hora_ini, hora_fin } of franjas) {
      await cli.query(
        'INSERT INTO disponibilidad_tutor (tutor_id,dia,hora_ini,hora_fin) VALUES ($1,$2,$3,$4)',
        [id, dia, hora_ini, hora_fin]
      );
    }
    await cli.query('COMMIT');
    res.json({ mensaje: 'Disponibilidad actualizada.' });
  } catch {
    await cli.query('ROLLBACK');
    res.status(500).json({ error: 'Error al actualizar.' });
  } finally { cli.release(); }
}

/** GET /api/tutores/:id/slots?fecha=YYYY-MM-DD */
export async function obtenerSlots(req, res) {
  const { id } = req.params;
  const { fecha } = req.query;
  if (!fecha) return res.status(400).json({ error: 'Falta el parámetro fecha.' });
  const slots = await obtenerSlotsDisponibles(id, fecha);
  res.json({ slots, fecha });
}

/** GET /api/tutores/:id/resenas?page=1 */
export async function obtenerResenas(req, res) {
  const { id } = req.params;
  const limit = 10;
  const offset = (Number(req.query.page ?? 1) - 1) * limit;
  const { rows } = await pool.query(
    `SELECT r.rating, r.comentario, r.created_at, u.nombre AS nombre_estudiante, u.avatar_url AS avatar_estudiante
     FROM reviews r JOIN users u ON u.id=r.estudiante_id WHERE r.tutor_id=$1 ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
    [id, limit, offset]
  );
  res.json({ resenas: rows });
}
