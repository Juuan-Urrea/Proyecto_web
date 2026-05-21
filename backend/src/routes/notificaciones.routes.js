/**
 * ARCHIVO: routes/notificaciones.routes.js
 * QUÉ HACE: Rutas para listar y marcar como leídas las notificaciones del usuario.
 * DEPENDE DE: express, middleware/autenticacion.js, controllers/notificaciones.controller.js
 * EXPORTA: router
 */

import { Router } from 'express';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import { listarNotificaciones, marcarLeida, marcarTodasLeidas } from '../controllers/notificaciones.controller.js';

const router = Router();
router.use(verificarAutenticacion);

router.get('/',                listarNotificaciones);
router.patch('/todas-leidas',  marcarTodasLeidas);
router.patch('/:id/leida',     marcarLeida);

export default router;
