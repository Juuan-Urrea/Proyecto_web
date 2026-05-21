/**
 * ARCHIVO: config/jwt.js
 * QUÉ HACE: Centraliza la lógica de creación y verificación de tokens JWT.
 *           firmarToken() genera el token al hacer login.
 *           verificarToken() lo valida en el middleware de autenticación.
 * DEPENDE DE: jsonwebtoken, process.env.JWT_SECRET y JWT_EXPIRES_IN
 * EXPORTA: firmarToken(payload), verificarToken(token)
 */

import jwt from 'jsonwebtoken';

/**
 * Genera un token JWT firmado con los datos del usuario.
 * El token expira según JWT_EXPIRES_IN del .env (ej: '7d').
 * @param {{ id: string, role: string, nombre: string }} payload
 * @returns {string} token JWT
 */
export function firmarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  });
}

/**
 * Verifica y decodifica un token JWT.
 * Lanza un error si el token es inválido o expiró.
 * @param {string} token
 * @returns {{ id: string, role: string, nombre: string, iat: number, exp: number }}
 */
export function verificarToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
