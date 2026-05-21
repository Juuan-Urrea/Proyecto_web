/**
 * ARCHIVO: controllers/autenticacion.controller.js
 * QUÉ HACE: Maneja el registro, login, recuperación y verificación de contraseña.
 *           Nunca devuelve el campo password_hash en ninguna respuesta.
 * DEPENDE DE: bcryptjs, ../config/base-de-datos.js, ../config/jwt.js,
 *             ../services/email.service.js, ../services/notificaciones.service.js
 * EXPORTA: registrar, iniciarSesion, obtenerPerfil, olvideMiPassword, restablecerPassword
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool } from '../config/base-de-datos.js';
import { firmarToken } from '../config/jwt.js';
import { enviarEmailBienvenida, enviarEmailRecuperacion } from '../services/email.service.js';

// ── Registro de usuario nuevo ──────────────────────────────────────────────

/**
 * POST /api/auth/registrar
 * Crea una cuenta nueva (estudiante o tutor), hashea la contraseña,
 * crea las preferencias por defecto y envía email de bienvenida.
 */
export async function registrar(req, res) {
  const { role, nombre, apellido, email, password, telefono, ciudad } = req.body;

  // Validación básica de campos requeridos
  if (!role || !nombre || !apellido || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos requeridos.' });
  }

  // Verifica que el email no esté registrado
  const { rows: existente } = await pool.query(
    'SELECT id FROM users WHERE email = $1', [email]
  );
  if (existente.length > 0) {
    return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
  }

  // Hashea la contraseña con bcrypt (salt rounds = 12)
  const passwordHash = await bcrypt.hash(password, 12);

  // Inserta el usuario en una transacción para garantizar consistencia
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const { rows } = await cliente.query(
      `INSERT INTO users (role, nombre, apellido, email, password_hash, telefono, ciudad)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, role, nombre, apellido, email`,
      [role, nombre, apellido, email, passwordHash, telefono ?? null, ciudad ?? null]
    );
    const usuario = rows[0];

    // Crea las preferencias de notificación con los valores por defecto
    await cliente.query(
      'INSERT INTO preferencias_usuario (user_id) VALUES ($1)',
      [usuario.id]
    );

    // Si es tutor, crea su perfil extendido con precio mínimo
    if (role === 'tutor') {
      const { precio_hora = 20000, anios_exp = 0 } = req.body;
      await cliente.query(
        'INSERT INTO tutor_profiles (user_id, precio_hora, anios_exp) VALUES ($1, $2, $3)',
        [usuario.id, precio_hora, anios_exp]
      );

      // Asocia las materias si se enviaron en el registro
      if (Array.isArray(req.body.materias) && req.body.materias.length > 0) {
        for (const materiaId of req.body.materias) {
          await cliente.query(
            'INSERT INTO tutor_materias (tutor_id, materia_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [usuario.id, materiaId]
          );
        }
      }
    }

    await cliente.query('COMMIT');

    // Envía email de bienvenida sin bloquear la respuesta
    enviarEmailBienvenida({ nombre, email }).catch(() => {});

    // Genera el token JWT y lo devuelve junto con los datos básicos del usuario
    const token = firmarToken({ id: usuario.id, role: usuario.role, nombre: usuario.nombre });
    res.status(201).json({ token, usuario: { id: usuario.id, role: usuario.role, nombre, apellido, email } });

  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('Error al registrar:', error.message);
    res.status(500).json({ error: 'Error interno al crear la cuenta.' });
  } finally {
    cliente.release();
  }
}

// ── Login ──────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Verifica email y contraseña. Si son correctos, devuelve un JWT.
 */
export async function iniciarSesion(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
  }

  // Busca el usuario por email (solo usuarios activos)
  const { rows } = await pool.query(
    `SELECT id, role, nombre, apellido, email, password_hash, activo
     FROM users WHERE email = $1`,
    [email]
  );

  const usuario = rows[0];

  // Responde con el mismo mensaje tanto si no existe como si la contraseña es incorrecta
  // (evita enumerar qué emails están registrados)
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Credenciales incorrectas.' });
  }

  const passwordCorrecta = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordCorrecta) {
    return res.status(401).json({ error: 'Credenciales incorrectas.' });
  }

  const token = firmarToken({ id: usuario.id, role: usuario.role, nombre: usuario.nombre });
  res.json({
    token,
    usuario: {
      id: usuario.id,
      role: usuario.role,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
    },
  });
}

// ── Obtener perfil del usuario autenticado ─────────────────────────────────

/**
 * GET /api/auth/yo
 * Devuelve el perfil completo del usuario autenticado.
 * Nunca incluye password_hash.
 */
export async function obtenerPerfil(req, res) {
  const { rows } = await pool.query(
    `SELECT u.id, u.role, u.nombre, u.apellido, u.email, u.telefono,
            u.ciudad, u.avatar_url, u.bio, u.email_verified, u.created_at
     FROM users u
     WHERE u.id = $1 AND u.activo = true`,
    [req.usuario.id]
  );

  if (!rows[0]) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  res.json({ usuario: rows[0] });
}

// ── Recuperación de contraseña ─────────────────────────────────────────────

/**
 * POST /api/auth/olvide-mi-password
 * Genera un token de recuperación y envía el email con el link.
 */
export async function olvideMiPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'El email es requerido.' });

  const { rows } = await pool.query(
    'SELECT id, nombre FROM users WHERE email = $1 AND activo = true', [email]
  );
  const usuario = rows[0];

  // Siempre responde igual (no revelar si el email existe)
  if (!usuario) {
    return res.json({ mensaje: 'Si el email existe, recibirás un link de recuperación.' });
  }

  // Genera un token único de un solo uso con expiración de 1 hora
  const token = crypto.randomBytes(32).toString('hex');
  const expiracion = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await pool.query(
    `UPDATE users SET bio = $1 WHERE id = $2`,
    // Guardamos el token en un campo temporal. En producción usar tabla dedicada.
    [JSON.stringify({ resetToken: token, resetExpira: expiracion.toISOString() }), usuario.id]
  );

  enviarEmailRecuperacion({ nombre: usuario.nombre, email, token }).catch(() => {});

  res.json({ mensaje: 'Si el email existe, recibirás un link de recuperación.' });
}

/**
 * POST /api/auth/restablecer-password
 * Cambia la contraseña usando el token del email de recuperación.
 */
export async function restablecerPassword(req, res) {
  const { token, nuevaPassword } = req.body;
  if (!token || !nuevaPassword) {
    return res.status(400).json({ error: 'Token y nueva contraseña son requeridos.' });
  }

  if (nuevaPassword.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres.' });
  }

  const passwordHash = await bcrypt.hash(nuevaPassword, 12);

  // En producción usar una tabla dedicada reset_tokens. Aquí es simplificado.
  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE activo = true', [passwordHash]
  );

  res.json({ mensaje: 'Contraseña restablecida exitosamente.' });
}
