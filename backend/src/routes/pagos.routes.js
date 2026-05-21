/**
 * ARCHIVO: routes/pagos.routes.js
 * QUÉ HACE: Rutas para iniciar pago con Wompi, recibir webhook y consultar estado.
 * DEPENDE DE: express, middleware/autenticacion.js, controllers/pagos.controller.js
 * EXPORTA: router
 */

import { Router } from 'express';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import { iniciarPago, webhookWompi, estadoPago } from '../controllers/pagos.controller.js';

const router = Router();

// El webhook de Wompi NO lleva JWT (viene del servidor de Wompi)
router.post('/webhook', webhookWompi);

// Las demás rutas requieren autenticación
router.use(verificarAutenticacion);
router.post('/iniciar',           iniciarPago);
router.get('/sesion/:sessionId',  estadoPago);

export default router;
