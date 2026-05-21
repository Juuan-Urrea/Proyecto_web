/**
 * ARCHIVO: routes/mensajes.routes.js
 * QUÉ HACE: Rutas para listar conversaciones, historial y marcar como leídos.
 * DEPENDE DE: express, middleware/autenticacion.js, controllers/mensajes.controller.js
 * EXPORTA: router
 */

import { Router } from 'express';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import { listarConversaciones, obtenerHistorial, enviarMensaje, marcarLeidos } from '../controllers/mensajes.controller.js';

const router = Router();
router.use(verificarAutenticacion);

router.get('/conversaciones',                    listarConversaciones);
router.get('/conversacion/:userId',              obtenerHistorial);
router.post('/',                                 enviarMensaje);
router.patch('/conversacion/:userId/leidos',     marcarLeidos);

export default router;
