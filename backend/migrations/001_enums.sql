-- ════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: 001_enums.sql
-- QUÉ HACE: Define todos los tipos de dato personalizados (ENUMs) del sistema.
--           Se crean primero porque las tablas los necesitan como tipo de columna.
--           Estos valores son los mismos que las constantes en frontend/constants.js
-- ════════════════════════════════════════════════════════════════════════════

-- Rol del usuario: puede ser estudiante o tutor
CREATE TYPE user_role AS ENUM ('estudiante', 'tutor');

-- Estados por los que puede pasar una sesión de tutoría
CREATE TYPE session_status AS ENUM (
  'pendiente',    -- Solicitada por el estudiante, sin respuesta del tutor
  'confirmada',   -- Aceptada por el tutor
  'en_curso',     -- La sesión está ocurriendo en este momento
  'completada',   -- La sesión terminó exitosamente
  'cancelada',    -- Cancelada por cualquiera de las partes
  'rechazada',    -- El tutor la rechazó explícitamente
  'no_asistio'    -- El estudiante no se presentó
);

-- Modalidad de la sesión: virtual o presencial
CREATE TYPE modalidad_tipo AS ENUM ('virtual', 'presencial');

-- Métodos de pago aceptados en la plataforma
CREATE TYPE pago_tipo AS ENUM ('transferencia', 'efectivo', 'nequi', 'pse', 'tarjeta');

-- Estado del proceso de pago
CREATE TYPE pago_status AS ENUM ('pendiente', 'aprobado', 'rechazado', 'reembolsado');

-- Tipos de notificación que el sistema puede generar
CREATE TYPE notif_type AS ENUM (
  'reserva_nueva',
  'reserva_confirmada',
  'reserva_cancelada',
  'mensaje_nuevo',
  'sesion_recordatorio',
  'resena_nueva',
  'pago_confirmado',
  'sistema'
);

-- Días de la semana para la disponibilidad del tutor
CREATE TYPE dia_semana AS ENUM (
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'
);
