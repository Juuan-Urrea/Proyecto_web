-- ════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: 009_notificaciones.sql
-- QUÉ HACE: Crea la tabla de notificaciones del sistema para cada usuario.
--           El índice prioriza las no leídas y las más recientes primero
--           para que la campana de la navbar muestre el conteo correcto.
-- DEPENDE DE: 001_enums.sql (usa notif_type), 003_usuarios.sql
-- ════════════════════════════════════════════════════════════════════════════

-- Notificaciones generadas automáticamente por eventos del sistema
CREATE TABLE notifications (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       notif_type   NOT NULL,
  titulo     VARCHAR(200) NOT NULL,
  texto      TEXT         NOT NULL,
  leida      BOOLEAN      NOT NULL DEFAULT FALSE,
  link       TEXT,                                 -- ruta interna opcional al hacer click
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índice optimizado: primero las no leídas y más recientes del usuario
CREATE INDEX idx_notif_user ON notifications(user_id, leida, created_at DESC);
