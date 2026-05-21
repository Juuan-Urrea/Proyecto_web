/**
 * ARCHIVO: config/cloudinary.js
 * QUÉ HACE: Configura y exporta el cliente de Cloudinary para subir imágenes.
 *           Se usa en el middleware de upload para las fotos de perfil.
 * DEPENDE DE: cloudinary, process.env.CLOUDINARY_*
 * EXPORTA: cloudinary (instancia configurada lista para usar)
 */

import { v2 as cloudinary } from 'cloudinary';

// Configura las credenciales usando las variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // siempre usar HTTPS
});

export default cloudinary;
