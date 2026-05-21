-- ════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: 004_tutores.sql
-- QUÉ HACE: Crea las tablas con datos extendidos exclusivos de los tutores:
--           perfil, materias que enseña, badges de especialidad
--           y franjas de disponibilidad semanal.
-- DEPENDE DE: 001_enums.sql (usa dia_semana), 002_materias.sql, 003_usuarios.sql
-- ════════════════════════════════════════════════════════════════════════════

-- Datos extendidos del tutor (solo existe si users.role = 'tutor')
-- rating y total_reviews los actualiza automáticamente el trigger de reseñas
CREATE TABLE tutor_profiles (
  user_id         UUID         PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  precio_hora     INTEGER      NOT NULL CHECK (precio_hora > 0),  -- en pesos COP
  anios_exp       SMALLINT     NOT NULL DEFAULT 0,
  verificado      BOOLEAN      NOT NULL DEFAULT FALSE,
  responde_rapido BOOLEAN      NOT NULL DEFAULT FALSE,
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0.00,             -- calculado por trigger
  total_reviews   INTEGER      NOT NULL DEFAULT 0,                -- calculado por trigger
  total_sesiones  INTEGER      NOT NULL DEFAULT 0,
  total_horas     INTEGER      NOT NULL DEFAULT 0
);

-- Relación N:M — un tutor puede enseñar varias materias
CREATE TABLE tutor_materias (
  tutor_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  materia_id VARCHAR(30) NOT NULL REFERENCES materias(id),
  PRIMARY KEY (tutor_id, materia_id)
);

-- Etiquetas de especialidad visibles en la tarjeta del tutor (ej: "📐 Álgebra lineal")
CREATE TABLE tutor_badges (
  id       SERIAL       PRIMARY KEY,
  tutor_id UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label    VARCHAR(100) NOT NULL,
  orden    SMALLINT     NOT NULL DEFAULT 0  -- para mostrarlas en el orden correcto
);

-- Franjas horarias semanales del tutor (disponibilidad base)
-- Los slots reales se calculan restando las sesiones ya agendadas
CREATE TABLE disponibilidad_tutor (
  id       SERIAL     PRIMARY KEY,
  tutor_id UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dia      dia_semana NOT NULL,
  hora_ini TIME       NOT NULL,
  hora_fin TIME       NOT NULL,
  activo   BOOLEAN    NOT NULL DEFAULT TRUE,
  CONSTRAINT hora_valida CHECK (hora_ini < hora_fin)
);

-- Índice para consultar disponibilidad de un tutor en un día específico
CREATE INDEX idx_disp_tutor ON disponibilidad_tutor(tutor_id, dia);
