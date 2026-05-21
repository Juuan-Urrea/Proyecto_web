/**
 * ARCHIVO: scripts/migrar.js
 * QUÉ HACE: Lee todos los archivos .sql de la carpeta migrations/ en orden
 *           numérico y los ejecuta contra la base de datos PostgreSQL.
 *           Si ya existe una tabla, PostgreSQL devolverá un error que se muestra.
 * DEPENDE DE: pg (driver de PostgreSQL), dotenv, fs, path
 * EXPORTA: nada (se ejecuta directamente con `node scripts/migrar.js`)
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Carga las variables de entorno desde .env
dotenv.config();

const { Pool } = pg;

// Ruta absoluta a la carpeta de migraciones
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const carpetaMigraciones = path.join(__dirname, '..', 'migrations');

// Crea la conexión a la base de datos usando la URL del .env
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ejecutarMigraciones() {
  console.log('🚀 Iniciando migraciones...\n');

  // Lee todos los archivos .sql ordenados numéricamente
  const archivos = fs.readdirSync(carpetaMigraciones)
    .filter(f => f.endsWith('.sql'))
    .sort(); // el sort alfabético respeta el orden numérico del prefijo

  for (const archivo of archivos) {
    const rutaArchivo = path.join(carpetaMigraciones, archivo);
    const sql = fs.readFileSync(rutaArchivo, 'utf8');

    try {
      await pool.query(sql);
      console.log(`✅ ${archivo}`);
    } catch (error) {
      console.error(`❌ ${archivo}: ${error.message}`);
      // No lanza el error para continuar con las siguientes migraciones
    }
  }

  console.log('\n🎉 Migraciones completadas.');
  await pool.end();
}

ejecutarMigraciones();
