-- ════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: 005_sesiones.sql
-- QUÉ HACE: Crea la tabla que registra cada sesión de tutoría agendada.
--           precio_total es un snapshot: guarda el precio al momento de reservar
--           para que no cambie si el tutor modifica su tarifa después.
-- DEPENDE DE: 001_enums.sql, 002_materias.sql, 003_usuarios.sql
-- ════════════════════════════════════════════════════════════════════════════

-- Cada sesión de tutoría agendada entre un tutor y un estudiante
CREATE TABLE sessions (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id      UUID           NOT NULL REFERENCES users(id),
  estudiante_id UUID           NOT NULL REFERENCES users(id),
  materia_id    VARCHAR(30)    NOT NULL REFERENCES materias(id),
  modalidad     modalidad_tipo NOT NULL,
  metodo_pago   pago_tipo      NOT NULL,
  status        session_status NOT NULL DEFAULT 'pendiente',
  fecha         DATE           NOT NULL,
  hora_ini      TIME           NOT NULL,
  hora_fin      TIME           NOT NULL,
  precio_total  INTEGER        NOT NULL CHECK (precio_total > 0),  -- snapshot en COP
  notas         TEXT           DEFAULT '',
  room_url      TEXT,                                              -- URL sala Daily.co (virtual)
  wompi_ref     TEXT,                                             -- referencia pago Wompi
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT tutor_neq_estudiante CHECK (tutor_id != estudiante_id),
  CONSTRAINT hora_valida          CHECK (hora_ini < hora_fin)
);

-- Índices para consultas frecuentes por tutor, estudiante y fecha
CREATE INDEX idx_sessions_tutor      ON sessions(tutor_id, status);
CREATE INDEX idx_sessions_estudiante ON sessions(estudiante_id, status);
CREATE INDEX idx_sessions_fecha      ON sessions(fecha);
