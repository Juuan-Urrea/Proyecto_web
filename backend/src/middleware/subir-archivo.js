/**
 * ARCHIVO: middleware/subir-archivo.js
 * QUÉ HACE: Recibe archivos de imagen con Multer (almacenados en memoria),
 *           los sube a Cloudinary y pone la URL resultante en req.archivoUrl.
 *           Solo acepta imágenes (jpg, png, webp) de hasta 5 MB.
 * DEPENDE DE: multer, ../config/cloudinary.js
 * EXPORTA: subirFotoPerfil (middleware de Express)
 */

import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

// Multer guarda el archivo en memoria como Buffer (no en disco)
// para pasarlo directamente al stream de Cloudinary
const almacenamiento = multer.memoryStorage();

const filtroTipoArchivo = (req, file, cb) => {
  // Solo acepta imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpg, png, webp).'), false);
  }
};

const cargador = multer({
  storage: almacenamiento,
  limits: { fileSize: 5 * 1024 * 1024 }, // máximo 5 MB
  fileFilter: filtroTipoArchivo,
});

/**
 * Sube el archivo al stream de Cloudinary y guarda la URL segura en req.archivoUrl.
 * Se usa como: router.post('/avatar', subirFotoPerfil, controlador)
 */
function subirACloudinary(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún archivo.' });
  }

  // Sube el buffer al stream de Cloudinary sin guardar en disco
  const stream = cloudinary.uploader.upload_stream(
    { folder: 'myteacher/avatares', resource_type: 'image' },
    (error, resultado) => {
      if (error) {
        return res.status(500).json({ error: 'Error al subir la imagen a Cloudinary.' });
      }
      // Guarda la URL segura para que el controlador la use
      req.archivoUrl = resultado.secure_url;
      next();
    }
  );

  // Convierte el Buffer del archivo en un stream legible y lo conecta a Cloudinary
  Readable.from(req.file.buffer).pipe(stream);
}

// Exporta los dos middlewares en secuencia: primero multer, luego Cloudinary
export const subirFotoPerfil = [cargador.single('avatar'), subirACloudinary];
