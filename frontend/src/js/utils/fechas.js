/**
 * ARCHIVO: utils/fechas.js
 * QUÉ HACE: Funciones auxiliares para formatear fechas y horas de manera uniforme.
 * EXPORTA: formatearFecha, formatearHora, calcularTiempoRelativo
 */

/**
 * Formatea una fecha SQL (YYYY-MM-DD) a "15 de Octubre, 2023"
 */
export function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  // Asegurar formato YYYY-MM-DD
  const baseStr = (typeof fechaStr === 'string' ? fechaStr.split('T')[0] : fechaStr.toISOString().split('T')[0]);
  const fecha = new Date(baseStr + 'T12:00:00');
  
  // Si la fecha es inválida, retornar el original
  if (isNaN(fecha.getTime())) return String(fechaStr);

  return new Intl.DateTimeFormat('es-CO', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(fecha);
}

/**
 * Formatea una hora SQL (14:30:00) a formato am/pm (2:30 PM)
 */
export function formatearHora(horaStr) {
  if (!horaStr) return '';
  
  // Extrae HH:MM
  const parte = horaStr.substring(0, 5);
  const [h, m] = parte.split(':').map(Number);
  
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12; // Convierte 0 a 12
  
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Convierte un timestamp a tiempo relativo ("hace 5 minutos", "ayer")
 */
export function calcularTiempoRelativo(timestamp) {
  const ahora = new Date();
  const fecha = new Date(timestamp);
  const diffSegundos = Math.floor((ahora - fecha) / 1000);
  
  if (diffSegundos < 60) return 'hace un momento';
  if (diffSegundos < 3600) return `hace ${Math.floor(diffSegundos / 60)} min`;
  if (diffSegundos < 86400) return `hace ${Math.floor(diffSegundos / 3600)} h`;
  if (diffSegundos < 172800) return 'ayer';
  
  return formatearFecha(fecha.toISOString().split('T')[0]);
}

/**
 * Devuelve el día de la semana actual (lunes, martes...)
 */
export function getDiaSemanaActual() {
  const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return dias[new Date().getDay()];
}

/**
 * Formatea la fecha de hoy para inputs (YYYY-MM-DD)
 */
export function getHoyInput() {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}
