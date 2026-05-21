/**
 * ARCHIVO: ws/chat.js
 * QUÉ HACE: Gestiona las conexiones WebSocket del chat en tiempo real.
 *           Autentica al usuario por JWT en la URL, guarda mensajes en BD
 *           y los reenvía al receptor si está conectado; si no, crea notificación.
 * DEPENDE DE: ws, jsonwebtoken, ../config/base-de-datos.js,
 *             ../services/notificaciones.service.js
 * EXPORTA: iniciarChatWS(servidor)
 */

import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { pool } from '../config/base-de-datos.js';
import { crearNotificacion } from '../services/notificaciones.service.js';

// Mapa global: userId → conexión WebSocket activa
const conexiones = new Map();

/**
 * Inicia el servidor WebSocket adjunto al servidor HTTP de Express.
 * @param {import('http').Server} servidor
 */
export function iniciarChatWS(servidor) {
  const wss = new WebSocketServer({ server: servidor });

  wss.on('connection', (ws, req) => {
    // Extrae el token JWT de la query string: ws://host/chat?token=...
    const params = new URL(req.url, 'ws://localhost').searchParams;
    const token = params.get('token');

    let usuario;
    try {
      usuario = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      ws.close(4001, 'Token inválido'); // Cierra la conexión si el token es inválido
      return;
    }

    // Registra la conexión activa del usuario
    conexiones.set(usuario.id, ws);
    console.log(`💬 Usuario conectado al chat: ${usuario.nombre}`);

    // ── Manejo de mensajes entrantes ──────────────────────────
    ws.on('message', async (datos) => {
      let payload;
      try {
        payload = JSON.parse(datos.toString());
      } catch {
        return; // Ignora mensajes con JSON inválido
      }

      const { type, to, texto } = payload;
      if (type !== 'message' || !to || !texto) return;

      try {
        // Guarda el mensaje en la base de datos
        const { rows } = await pool.query(
          `INSERT INTO messages (sender_id, receiver_id, texto) VALUES ($1,$2,$3) RETURNING id, created_at`,
          [usuario.id, to, texto]
        );
        const mensaje = rows[0];

        // Construye el objeto que se enviará al cliente
        const respuesta = JSON.stringify({
          type: 'message',
          id: mensaje.id,
          from: usuario.id,
          to,
          texto,
          created_at: mensaje.created_at,
        });

        // Si el receptor está conectado, envía el mensaje en tiempo real
        const wsReceptor = conexiones.get(to);
        if (wsReceptor?.readyState === 1) {
          wsReceptor.send(respuesta);
        } else {
          // Si el receptor no está conectado, crea una notificación
          await crearNotificacion(
            to, 'mensaje_nuevo', 'Nuevo mensaje',
            `${usuario.nombre} te envió un mensaje.`, '/pages/mensajes.html'
          );
        }

        // Confirma al emisor que el mensaje fue guardado
        ws.send(JSON.stringify({ type: 'enviado', messageId: mensaje.id }));
      } catch (error) {
        console.error('Error al procesar mensaje WS:', error.message);
      }
    });

    // ── Limpieza al desconectarse ──────────────────────────────
    ws.on('close', () => {
      conexiones.delete(usuario.id);
      console.log(`💬 Usuario desconectado del chat: ${usuario.nombre}`);
    });

    ws.on('error', (err) => {
      console.error('Error en WebSocket:', err.message);
      conexiones.delete(usuario.id);
    });
  });
}

/**
 * Devuelve si un usuario está conectado al chat en este momento.
 * @param {string} userId
 * @returns {boolean}
 */
export function estaConectado(userId) {
  const ws = conexiones.get(userId);
  return ws?.readyState === 1;
}
