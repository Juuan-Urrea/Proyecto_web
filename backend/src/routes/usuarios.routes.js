/**
 * ARCHIVO: routes/usuarios.routes.js
 * QUÉ HACE: Rutas para editar perfil, subir avatar, cambiar contraseña y preferencias.
 * DEPENDE DE: express, middleware de autenticación y upload, controllers/usuarios.controller.js
 * EXPORTA: router
 */

import { Router } from 'express';
import { verificarAutenticacion } from '../middleware/autenticacion.js';
import { subirFotoPerfil } from '../middleware/subir-archivo.js';
import { editarPerfil, subirAvatar, cambiarPassword, editarPreferencias } from '../controllers/usuarios.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verificarAutenticacion);

router.patch('/:id',              editarPerfil);
router.post('/:id/avatar',        subirFotoPerfil, subirAvatar);
router.patch('/:id/password',     cambiarPassword);
router.patch('/:id/preferencias', editarPreferencias);

export default router;
