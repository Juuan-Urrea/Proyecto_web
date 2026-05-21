/**
 * ARCHIVO: config/base-de-datos.js
 * QUÉ HACE: Crea y exporta el pool de conexiones a PostgreSQL.
 *           El pool reutiliza conexiones para no abrir una nueva en cada request,
 *           lo que mejora el rendimiento bajo carga alta.
 * DEPENDE DE: pg (driver oficial de PostgreSQL), dotenv
 * EXPORTA: pool (instancia de Pool lista para usar con pool.query(...))
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Carga las variables de entorno (.env) antes de leer DATABASE_URL
dotenv.config();

const { Pool } = pg;

// Pool de conexiones: mantiene hasta 10 conexiones abiertas simultáneas
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,               // máximo de conexiones simultáneas
  idleTimeoutMillis: 30000,  // cierra conexiones inactivas después de 30s
  connectionTimeoutMillis: 5000, // falla si no consigue conexión en 5s
});

// Verifica la conexión al iniciar el servidor
pool.on('connect', () => {
  // Solo imprime en desarrollo para no llenar los logs de producción
  if (process.env.NODE_ENV !== 'production') {
    console.log('🗄️  Conexión a PostgreSQL establecida');
  }
});

// Captura errores de conexión que ocurren fuera de un query
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message);
});
