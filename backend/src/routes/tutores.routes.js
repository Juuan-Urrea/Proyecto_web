/**
 * ARCHIVO: routes/tutores.routes.js
 * QUÉ HACE: Rutas públicas de búsqueda y perfil, y rutas protegidas para editar disponibilidad.
 * DEPENDE DE: express, middleware/autenticacion.js, controllers/tutores.controller.js
 * EXPORTA: router
 */

import { Router } from 'express';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import {
  listarTutores, obtenerTutor, obtenerDisponibilidad,
  actualizarDisponibilidad, obtenerSlots, obtenerResenas,
} from '../controllers/tutores.controller.js';

const router = Router();

// Rutas públicas (sin JWT)
router.get('/',                     listarTutores);
router.get('/:id',                  obtenerTutor);
router.get('/:id/disponibilidad',   obtenerDisponibilidad);
router.get('/:id/slots',            obtenerSlots);
router.get('/:id/resenas',          obtenerResenas);

// Rutas protegidas: solo el tutor propietario
router.put('/:id/disponibilidad', verificarAutenticacion, actualizarDisponibilidad);

export default router;
