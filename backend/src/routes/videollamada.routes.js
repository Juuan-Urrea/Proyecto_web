/**
 * ARCHIVO: routes/videollamada.routes.js
 * QUÉ HACE: Rutas para crear sala Daily.co y obtener token de participante.
 * DEPENDE DE: express, middleware/autenticacion.js, controllers/videollamada.controller.js
 * EXPORTA: router
 */

import { Router } from 'express';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import { crearSala, obtenerToken } from '../controllers/videollamada.controller.js';

const router = Router();
router.use(verificarAutenticacion);

router.post('/sesion/:sessionId',        crearSala);
router.get('/sesion/:sessionId/token',   obtenerToken);

export default router;
