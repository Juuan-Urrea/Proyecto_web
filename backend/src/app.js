/**
 * ARCHIVO: app.js
 * QUÉ HACE: Punto de entrada del servidor. Configura Express con todos los
 *           middlewares globales, monta las rutas de la API, inicia el WebSocket
 *           del chat y el cron job de recordatorios de sesiones.
 * DEPENDE DE: express, cors, dotenv, node-cron, http (Node.js built-in),
 *             todas las rutas, ws/chat.js, services/notificaciones.service.js
 * EXPORTA: nada (se ejecuta directamente)
 */

import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';

// Rutas de la API
import rutasAuth         from './routes/autenticacion.routes.js';
import rutasUsuarios     from './routes/usuarios.routes.js';
import rutasTutores      from './routes/tutores.routes.js';
import rutasSesiones     from './routes/sesiones.routes.js';
import rutasMensajes     from './routes/mensajes.routes.js';
import rutasPagos        from './routes/pagos.routes.js';
import rutasVideollamada from './routes/videollamada.routes.js';
import rutasNotificaciones from './routes/notificaciones.routes.js';

// WebSocket y servicios
import { iniciarChatWS } from './ws/chat.js';
import { pool }          from './config/base-de-datos.js';
import { crearNotificacion } from './services/notificaciones.service.js';

const app = express();

// ── Middlewares globales ──────────────────────────────────────────────────────

// CORS: permite peticiones desde el frontend de Vite
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}));

// Parsear body JSON (excepto el webhook de Wompi que necesita el raw)
app.use((req, res, next) => {
  if (req.path === '/api/pagos/webhook') {
    next(); // El webhook lee req.body parseado como JSON por express.json()
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// ── Montaje de rutas de la API ────────────────────────────────────────────────

app.use('/api/auth',          rutasAuth);
app.use('/api/usuarios',      rutasUsuarios);
app.use('/api/tutores',       rutasTutores);
app.use('/api/sesiones',      rutasSesiones);
app.use('/api/mensajes',      rutasMensajes);
app.use('/api/pagos',         rutasPagos);
app.use('/api/salas',         rutasVideollamada);
app.use('/api/notificaciones', rutasNotificaciones);

// ── Ruta de salud ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ estado: 'ok', hora: new Date().toISOString() });
});

// ── Manejo de errores 404 y 500 ───────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  console.error('Error no controlado:', err.message);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// ── Inicio del servidor HTTP + WebSocket ─────────────────────────────────────

const servidor = http.createServer(app);
iniciarChatWS(servidor); // Adjunta el WebSocket al mismo puerto

const PUERTO = process.env.PORT ?? 3000;
servidor.listen(PUERTO, () => {
  console.log(`🚀 Servidor myTEACHER corriendo en http://localhost:${PUERTO}`);
});

// ── Cron job: recordatorio 1h antes de cada sesión ───────────────────────────
// Se ejecuta cada 15 minutos para detectar sesiones que empiecen en ~1 hora

cron.schedule('*/15 * * * *', async () => {
  try {
    // Busca sesiones que empiecen entre 55 y 65 minutos desde ahora
    const { rows: sesiones } = await pool.query(`
      SELECT s.id, s.tutor_id, s.estudiante_id, s.fecha, s.hora_ini,
             m.label AS materia, s.modalidad
      FROM sessions s
      JOIN materias m ON m.id = s.materia_id
      WHERE s.status = 'confirmada'
        AND (s.fecha + s.hora_ini::interval) BETWEEN NOW() + INTERVAL '55 minutes'
                                                 AND NOW() + INTERVAL '65 minutes'
    `);

    for (const sesion of sesiones) {
      // Notifica al tutor
      await crearNotificacion(sesion.tutor_id, 'sesion_recordatorio',
        '⏰ Tu sesión empieza pronto',
        `Tienes una sesión de ${sesion.materia} a las ${sesion.hora_ini}`,
        '/pages/tutorias.html'
      );
      // Notifica al estudiante
      await crearNotificacion(sesion.estudiante_id, 'sesion_recordatorio',
        '⏰ Tu sesión empieza pronto',
        `Tu tutoría de ${sesion.materia} empieza a las ${sesion.hora_ini}`,
        '/pages/tutorias.html'
      );
    }
  } catch (error) {
    console.error('Error en cron de recordatorios:', error.message);
  }
});
