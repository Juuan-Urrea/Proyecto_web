/**
 * ARCHIVO: core/api.js
 * QUÉ HACE: Wrapper sobre fetch() que agrega automáticamente el JWT
 *           y maneja los errores HTTP de forma uniforme.
 * DEPENDE DE: ./auth.js (para obtener el token)
 * EXPORTA: api (objeto con get, post, put, patch, delete)
 */

import { getToken, cerrarSesion } from './auth.js';

// URL base definida en .env en dev, o relativa en producción
const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api';

async function request(endpoint, method = 'GET', body = null, isFormData = false) {
  const headers = {};
  const token = getToken();
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Si no es FormData (para subir archivos), le decimos que es JSON
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const opciones = {
    method,
    headers,
  };

  if (body) {
    opciones.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const respuesta = await fetch(`${BASE_URL}${endpoint}`, opciones);
    
    // Si la API responde con 401 Unauthorized y el token expiró, cerrar sesión
    if (respuesta.status === 401) {
      cerrarSesion();
      throw new Error('Sesión expirada. Por favor, inicia sesión de nuevo.');
    }

    const json = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      throw new Error(json.error || 'Ocurrió un error inesperado en el servidor.');
    }

    return json;
  } catch (error) {
    // Relanza el error para que cada página lo maneje (ej. mostrando un toast)
    throw error;
  }
}

// Objeto con alias para métodos HTTP comunes
export const api = {
  get:    (endpoint) => request(endpoint, 'GET'),
  post:   (endpoint, body) => request(endpoint, 'POST', body),
  put:    (endpoint, body) => request(endpoint, 'PUT', body),
  patch:  (endpoint, body) => request(endpoint, 'PATCH', body),
  delete: (endpoint) => request(endpoint, 'DELETE'),
  
  // Método especial para multipart/form-data (subir imágenes)
  upload: (endpoint, formData) => request(endpoint, 'POST', formData, true),
};
