-- ════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: 003_usuarios.sql
-- QUÉ HACE: Crea la tabla central de usuarios del sistema (estudiantes y tutores)
--           y la tabla de preferencias de notificación y privacidad.
--           Nunca se hace DELETE; se usa activo=false para "eliminar" una cuenta.
-- DEPENDE DE: 001_enums.sql (usa el tipo user_role)
-- ════════════════════════════════════════════════════════════════════════════

-- Extensión necesaria para generar UUIDs automáticamente
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla principal de usuarios: un registro por persona sin importar el rol
CREATE TABLE users (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  role           user_role    NOT NULL,                          -- 'estudiante' o 'tutor'
  nombre         VARCHAR(100) NOT NULL,
  apellido       VARCHAR(100) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,                          -- NUNCA texto plano
  telefono       VARCHAR(20),
  ciudad         VARCHAR(100),
  avatar_url     TEXT,                                           -- URL en Cloudinary
  bio            TEXT         DEFAULT '',
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- Tabla de preferencias separada para no inflar la tabla principal de usuarios
CREATE TABLE preferencias_usuario (
  user_id             UUID    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notif_email         BOOLEAN NOT NULL DEFAULT TRUE,
  notif_push          BOOLEAN NOT NULL DEFAULT TRUE,
  notif_sms           BOOLEAN NOT NULL DEFAULT FALSE,
  notif_mensajes      BOOLEAN NOT NULL DEFAULT TRUE,
  notif_recordatorios BOOLEAN NOT NULL DEFAULT TRUE,
  notif_promociones   BOOLEAN NOT NULL DEFAULT FALSE,
  perfil_publico      BOOLEAN NOT NULL DEFAULT TRUE,
  mostrar_en_linea    BOOLEAN NOT NULL DEFAULT TRUE,
  permitir_mensajes   BOOLEAN NOT NULL DEFAULT TRUE
);
