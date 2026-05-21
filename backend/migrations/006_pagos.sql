-- ════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: 006_pagos.sql
-- QUÉ HACE: Crea la tabla de pagos separada de las sesiones para mantener
--           historial completo de intentos de pago aunque el estado
--           de la sesión cambie. Wompi trabaja en centavos COP.
-- DEPENDE DE: 001_enums.sql, 003_usuarios.sql, 005_sesiones.sql
-- ════════════════════════════════════════════════════════════════════════════

-- Registro de cada intento de pago por sesión
CREATE TABLE payments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID        NOT NULL REFERENCES sessions(id),
  tutor_id      UUID        NOT NULL REFERENCES users(id),
  estudiante_id UUID        NOT NULL REFERENCES users(id),
  monto         INTEGER     NOT NULL,           -- en centavos COP (requerido por Wompi)
  metodo        pago_tipo   NOT NULL,
  status        pago_status NOT NULL DEFAULT 'pendiente',
  wompi_id      TEXT,                           -- ID único de la transacción en Wompi
  wompi_ref     TEXT,                           -- referencia pública del pago
  metadata      JSONB,                          -- respuesta JSON completa de Wompi (auditoría)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
