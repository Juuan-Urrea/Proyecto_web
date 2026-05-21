/**
 * ARCHIVO: services/slots.service.js
 * QUÉ HACE: Calcula los bloques de 1 hora disponibles de un tutor para una fecha.
 *           Toma su disponibilidad base (franjas horarias) y le resta las sesiones
 *           ya agendadas (pendientes, confirmadas o en curso) para ese día.
 * DEPENDE DE: ../config/base-de-datos.js
 * EXPORTA: obtenerSlotsDisponibles(tutorId, fecha)
 */

import { pool } from '../config/base-de-datos.js';

/**
 * Devuelve los slots libres de 1 hora para un tutor en una fecha dada.
 * @param {string} tutorId - UUID del tutor
 * @param {string} fecha   - Fecha en formato 'YYYY-MM-DD'
 * @returns {Array<{ hora_ini: string, hora_fin: string }>}
 */
export async function obtenerSlotsDisponibles(tutorId, fecha) {
  // Paso 1: Obtener el día de semana en español para buscar en disponibilidad_tutor
  const diaSemana = obtenerDiaSemana(fecha);

  // Paso 2: Obtener las franjas horarias configuradas del tutor para ese día
  const { rows: franjas } = await pool.query(
    `SELECT hora_ini, hora_fin
     FROM disponibilidad_tutor
     WHERE tutor_id = $1 AND dia = $2 AND activo = true`,
    [tutorId, diaSemana]
  );

  // Paso 3: Obtener las sesiones ya ocupadas para ese tutor y fecha
  const { rows: sesiones } = await pool.query(
    `SELECT hora_ini, hora_fin FROM sessions
     WHERE tutor_id = $1 AND fecha = $2
     AND status IN ('pendiente', 'confirmada', 'en_curso')`,
    [tutorId, fecha]
  );

  // Paso 4: Fragmentar cada franja en bloques de 1 hora y filtrar los ocupados
  const slotsLibres = [];
  for (const franja of franjas) {
    const bloques = fragmentarEnBloques(
      franja.hora_ini.substring(0, 5), // quita los segundos "08:00:00" → "08:00"
      franja.hora_fin.substring(0, 5)
    );
    for (const bloque of bloques) {
      const estaOcupado = sesiones.some(s => hayOverlap(bloque, {
        hora_ini: s.hora_ini.substring(0, 5),
        hora_fin: s.hora_fin.substring(0, 5),
      }));
      if (!estaOcupado) slotsLibres.push(bloque);
    }
  }

  return slotsLibres;
}

/**
 * Convierte una fecha 'YYYY-MM-DD' al nombre del día de semana en español.
 * Usa el enum de la base de datos: lunes, martes, miercoles...
 * @param {string} fecha
 * @returns {string}
 */
function obtenerDiaSemana(fecha) {
  const dias = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
  // Se agrega la hora para evitar problemas de zona horaria al crear el Date
  return dias[new Date(fecha + 'T12:00:00').getDay()];
}

/**
 * Divide una franja horaria en bloques exactos de 1 hora.
 * @param {string} horaIni - "08:00"
 * @param {string} horaFin - "12:00"
 * @returns {Array<{ hora_ini: string, hora_fin: string }>}
 */
function fragmentarEnBloques(horaIni, horaFin) {
  const bloques = [];
  let [h, m] = horaIni.split(':').map(Number);
  const [hFin, mFin] = horaFin.split(':').map(Number);

  while (h * 60 + m + 60 <= hFin * 60 + mFin) {
    const ini = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    m += 60;
    if (m >= 60) { h += 1; m -= 60; }
    const fin = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    bloques.push({ hora_ini: ini, hora_fin: fin });
  }

  return bloques;
}

/**
 * Verifica si dos bloques horarios se solapan.
 * @param {{ hora_ini: string, hora_fin: string }} a
 * @param {{ hora_ini: string, hora_fin: string }} b
 * @returns {boolean}
 */
function hayOverlap(a, b) {
  return a.hora_ini < b.hora_fin && a.hora_fin > b.hora_ini;
}
