/**
 * ARCHIVO: controllers/usuarios.controller.js
 * QUÉ HACE: Editar perfil, subir avatar, cambiar contraseña y preferencias.
 * DEPENDE DE: ../config/base-de-datos.js, bcryptjs
 * EXPORTA: editarPerfil, subirAvatar, cambiarPassword, editarPreferencias
 */

import bcrypt from 'bcryptjs';
import { pool } from '../config/base-de-datos.js';

/** PATCH /api/usuarios/:id */
export async function editarPerfil(req, res) {
  const { id } = req.params;
  if (req.usuario.id !== id) return res.status(403).json({ error: 'Sin permisos.' });

  const { nombre, apellido, bio, ciudad, telefono } = req.body;
  const { rows } = await pool.query(
    `UPDATE users SET nombre=COALESCE($1,nombre), apellido=COALESCE($2,apellido),
     bio=COALESCE($3,bio), ciudad=COALESCE($4,ciudad), telefono=COALESCE($5,telefono),
     updated_at=NOW() WHERE id=$6 RETURNING id,nombre,apellido,bio,ciudad,telefono,avatar_url`,
    [nombre, apellido, bio, ciudad, telefono, id]
  );
  res.json({ usuario: rows[0] });
}

/** POST /api/usuarios/:id/avatar */
export async function subirAvatar(req, res) {
  const { id } = req.params;
  if (req.usuario.id !== id) return res.status(403).json({ error: 'Sin permisos.' });
  if (!req.archivoUrl) return res.status(400).json({ error: 'No se subió imagen.' });

  const { rows } = await pool.query(
    `UPDATE users SET avatar_url=$1, updated_at=NOW() WHERE id=$2 RETURNING avatar_url`,
    [req.archivoUrl, id]
  );
  res.json({ avatar_url: rows[0].avatar_url });
}

/** PATCH /api/usuarios/:id/password */
export async function cambiarPassword(req, res) {
  const { id } = req.params;
  if (req.usuario.id !== id) return res.status(403).json({ error: 'Sin permisos.' });

  const { passwordActual, nuevaPassword } = req.body;
  if (!passwordActual || !nuevaPassword) {
    return res.status(400).json({ error: 'Ambas contraseñas son requeridas.' });
  }
  if (nuevaPassword.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener mínimo 8 caracteres.' });
  }

  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [id]);
  const esCorrecta = await bcrypt.compare(passwordActual, rows[0].password_hash);
  if (!esCorrecta) return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });

  const nuevoHash = await bcrypt.hash(nuevaPassword, 12);
  await pool.query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [nuevoHash, id]);

  res.json({ mensaje: 'Contraseña actualizada exitosamente.' });
}

/** PATCH /api/usuarios/:id/preferencias */
export async function editarPreferencias(req, res) {
  const { id } = req.params;
  if (req.usuario.id !== id) return res.status(403).json({ error: 'Sin permisos.' });

  const campos = ['notif_email','notif_push','notif_sms','notif_mensajes',
                  'notif_recordatorios','notif_promociones','perfil_publico',
                  'mostrar_en_linea','permitir_mensajes'];
  const updates = [];
  const params = [];

  for (const campo of campos) {
    if (req.body[campo] !== undefined) {
      params.push(req.body[campo]);
      updates.push(`${campo}=$${params.length}`);
    }
  }

  if (!updates.length) return res.status(400).json({ error: 'No hay campos para actualizar.' });
  params.push(id);

  await pool.query(
    `UPDATE preferencias_usuario SET ${updates.join(',')} WHERE user_id=$${params.length}`, params
  );
  res.json({ mensaje: 'Preferencias actualizadas.' });
}
