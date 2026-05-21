-- ════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: 002_materias.sql
-- QUÉ HACE: Crea el catálogo fijo de materias disponibles en la plataforma.
--           Las materias son predefinidas (no las crea el usuario).
--           Se insertan los datos iniciales en esta misma migración.
-- ════════════════════════════════════════════════════════════════════════════

-- Tabla de materias: catálogo central de todas las asignaturas disponibles
CREATE TABLE materias (
  id     VARCHAR(30)  PRIMARY KEY,   -- identificador corto: 'matematicas', 'fisica', etc.
  label  VARCHAR(100) NOT NULL,      -- nombre legible para mostrar en la UI
  emoji  VARCHAR(10)                 -- ícono visual de la materia
);

-- Inserción del catálogo inicial de materias
INSERT INTO materias (id, label, emoji) VALUES
  ('matematicas',  'Matemáticas',  '📐'),
  ('fisica',       'Física',       '⚛️'),
  ('quimica',      'Química',      '🧪'),
  ('ingles',       'Inglés',       '🌍'),
  ('programacion', 'Programación', '💻'),
  ('historia',     'Historia',     '📚'),
  ('biologia',     'Biología',     '🔬'),
  ('economia',     'Economía',     '📊'),
  ('estadistica',  'Estadística',  '📈'),
  ('calculo',      'Cálculo',      '∫');
