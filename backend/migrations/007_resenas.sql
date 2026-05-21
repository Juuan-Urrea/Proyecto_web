-- ════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: 007_resenas.sql
-- QUÉ HACE: Crea la tabla de reseñas que los estudiantes dejan tras una sesión
--           completada. Incluye el trigger que recalcula automáticamente el
--           rating promedio del tutor cada vez que se inserta o elimina una reseña.
-- DEPENDE DE: 003_usuarios.sql, 005_sesiones.sql, 004_tutores.sql
-- ════════════════════════════════════════════════════════════════════════════

-- Reseñas: una por sesión completada, escrita por el estudiante
CREATE TABLE reviews (
  id            UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID     NOT NULL UNIQUE REFERENCES sessions(id),  -- una reseña por sesión
  tutor_id      UUID     NOT NULL REFERENCES users(id),
  estudiante_id UUID     NOT NULL REFERENCES users(id),
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comentario    TEXT     DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para obtener las reseñas de un tutor ordenadas por fecha
CREATE INDEX idx_reviews_tutor ON reviews(tutor_id);

-- Función del trigger: recalcula rating y total_reviews del tutor
-- Se ejecuta automáticamente después de cada INSERT o DELETE en reviews
CREATE OR REPLACE FUNCTION recalcular_rating_tutor()
RETURNS TRIGGER AS $$
DECLARE
  tid UUID := COALESCE(NEW.tutor_id, OLD.tutor_id);
BEGIN
  UPDATE tutor_profiles SET
    rating        = COALESCE(
                      (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE tutor_id = tid),
                      0
                    ),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE tutor_id = tid)
  WHERE user_id = tid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que llama a la función después de cada cambio en reviews
CREATE TRIGGER trg_rating
  AFTER INSERT OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION recalcular_rating_tutor();
