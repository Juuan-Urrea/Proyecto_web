/**
 * ARCHIVO: routes/autenticacion.routes.js
 * QUÉ HACE: Define las rutas públicas y protegidas del módulo de autenticación.
 * DEPENDE DE: express, ../middleware/autenticacion.js, ../controllers/autenticacion.controller.js
 * EXPORTA: router (instancia de Express Router)
 */

import { Router } from 'express';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import {
  registrar, iniciarSesion, obtenerPerfil,
  olvideMiPassword, restablecerPassword,
} from '../controllers/autenticacion.controller.js';

const router = Router();

// Rutas públicas (sin JWT)
router.post('/registrar',           registrar);
router.post('/login',               iniciarSesion);
router.post('/olvide-mi-password',  olvideMiPassword);
router.post('/restablecer-password', restablecerPassword);

// Ruta protegida: devuelve el usuario autenticado
router.get('/yo', verificarAutenticacion, obtenerPerfil);

export default router;
