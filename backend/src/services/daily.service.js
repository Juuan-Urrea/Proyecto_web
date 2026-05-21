/**
 * ARCHIVO: services/daily.service.js
 * QUÉ HACE: Se comunica con la API de Daily.co para crear salas de videollamada
 *           y generar tokens de participante con tiempo de expiración.
 * DEPENDE DE: process.env.DAILY_API_KEY, DAILY_URL
 * EXPORTA: crearSalaDaily(nombre), generarTokenDaily(salaUrl, usuarioId)
 */

/**
 * Crea una sala privada en Daily.co para una sesión.
 * La sala expira automáticamente a la hora de fin de la sesión.
 * @param {string} nombre     - Nombre único de la sala (ej: UUID de la sesión)
 * @param {number} expiracion - Timestamp Unix de cuándo expira la sala
 * @returns {{ url: string, name: string }}
 */
export async function crearSalaDaily(nombre, expiracion) {
  const respuesta = await fetch(`${process.env.DAILY_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: nombre,
      privacy: 'private',             // solo usuarios con token pueden entrar
      properties: {
        exp: expiracion,              // la sala desaparece automáticamente
        start_video_off: false,
        start_audio_off: false,
        enable_chat: true,
      },
    }),
  });

  if (!respuesta.ok) {
    throw new Error('Error al crear la sala de videollamada en Daily.co.');
  }

  const datos = await respuesta.json();
  return { url: datos.url, name: datos.name };
}

/**
 * Genera un token de acceso para que un participante entre a la sala.
 * El token expira 30 min después de la hora de fin de la sesión.
 * @param {string} nombreSala  - Nombre de la sala en Daily.co
 * @param {string} usuarioId   - UUID del usuario que va a entrar
 * @param {number} expiracion  - Timestamp Unix de expiración
 * @returns {string} token JWT de Daily.co
 */
export async function generarTokenDaily(nombreSala, usuarioId, expiracion) {
  const respuesta = await fetch(`${process.env.DAILY_URL}/meeting-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: nombreSala,
        user_id: usuarioId,
        exp: expiracion,
        is_owner: false,              // true solo para el tutor si se quiere dar control
      },
    }),
  });

  if (!respuesta.ok) {
    throw new Error('Error al generar el token de videollamada.');
  }

  const datos = await respuesta.json();
  return datos.token;
}
