/**
 * ARCHIVO: middleware/autenticacion.js
 * QUÉ HACE: Verifica que cada request protegido tenga un JWT válido en el
 *           header Authorization. Si es válido, agrega req.usuario con los
 *           datos del token. Si no, devuelve 401 antes de llegar al controlador.
 *           requireRol() verifica además que el rol sea el correcto.
 * DEPENDE DE: ../config/jwt.js
 * EXPORTA: verificarToken, requireRol
 */

import { verificarToken } from '../config/jwt.js';

/**
 * Middleware que verifica el JWT en el header Authorization: Bearer <token>.
 * Si el token es válido, agrega req.usuario con { id, role, nombre }.
 * Si no, responde 401 sin pasar al siguiente middleware.
 */
export function verificarAutenticacion(req, res, next) {
  const header = req.headers.authorization;

  // El token debe venir en el formato "Bearer <token>"
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Se requiere autenticación.' });
  }

  const token = header.split(' ')[1];

  try {
    // Decodifica y verifica la firma del token
    req.usuario = verificarToken(token);
    next();
  } catch {
    // El token es inválido, fue manipulado o ya expiró
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

/**
 * Middleware de autorización por rol.
 * Se usa después de verificarAutenticacion().
 * Ejemplo de uso: router.delete('/:id', verificarAutenticacion, requireRol('tutor'), ...)
 * @param {...string} roles - roles permitidos (ej: 'tutor', 'estudiante')
 */
export function requireRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.role)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción.' });
    }
    next();
  };
}
