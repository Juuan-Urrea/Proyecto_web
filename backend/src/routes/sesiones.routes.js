/**
 * ARCHIVO: routes/sesiones.routes.js
 * QUÉ HACE: Rutas para crear, listar, detallar, cambiar estado, reseñar y cancelar sesiones.
 * DEPENDE DE: express, middleware/autenticacion.js, controllers/sesiones.controller.js
 * EXPORTA: router
 */

import { Router } from 'express';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import {
  crearSesion, listarSesiones, obtenerSesion,
  cambiarEstado, dejarResena, cancelarSesion,
} from '../controllers/sesiones.controller.js';

const router = Router();

// Todas las rutas de sesiones requieren autenticación
router.use(verificarAutenticacion);

router.post('/',              crearSesion);
router.get('/',               listarSesiones);
router.get('/:id',            obtenerSesion);
router.patch('/:id/estado',   cambiarEstado);
router.post('/:id/resena',    dejarResena);
router.delete('/:id',         cancelarSesion);

export default router;
