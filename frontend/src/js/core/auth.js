/**
 * ARCHIVO: core/auth.js
 * QUÉ HACE: Gestiona la sesión en localStorage y verifica permisos.
 * DEPENDE DE: ./api.js
 * EXPORTA: guardarSesion, cerrarSesion, getUser, isLoggedIn, requireAuth, requireRole
 */

import { api } from './api.js';

/**
 * Guarda el token y el usuario en LocalStorage tras el login
 */
export function guardarSesion(token, usuario) {
  localStorage.setItem('myteacher_token', token);
  localStorage.setItem('myteacher_user', JSON.stringify(usuario));
}

/**
 * Limpia LocalStorage y redirige al inicio
 */
export function cerrarSesion() {
  localStorage.removeItem('myteacher_token');
  localStorage.removeItem('myteacher_user');
  window.location.href = '/index.html';
}

/**
 * Devuelve el usuario activo o null si no hay
 */
export function getUser() {
  const data = localStorage.getItem('myteacher_user');
  return data ? JSON.parse(data) : null;
}

export function getToken() {
  return localStorage.getItem('myteacher_token');
}

export function isLoggedIn() {
  return !!getToken();
}

/**
 * Guarda (Auth Guard) para páginas que requieren estar logueado.
 * Se llama al inicio de cada script de página protegida.
 */
export function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/pages/login.html';
    return null;
  }
  return getUser();
}

/**
 * Guarda (Role Guard) para páginas exclusivas de un rol.
 */
export function requireRole(rol) {
  const user = requireAuth();
  if (user && user.role !== rol) {
    // Redirige al panel correcto si entró donde no debía
    window.location.href = user.role === 'tutor' 
      ? '/pages/panel-tutor.html' 
      : '/pages/panel-estudiante.html';
  }
  return user;
}
