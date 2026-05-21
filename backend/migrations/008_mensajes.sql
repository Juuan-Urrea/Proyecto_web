-- ════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: 008_mensajes.sql
-- QUÉ HACE: Crea la tabla de mensajes del chat entre usuarios.
--           El índice está diseñado para buscar la conversación entre dos
--           usuarios sin importar quién fue el remitente y quién el receptor.
-- DEPENDE DE: 003_usuarios.sql
-- ════════════════════════════════════════════════════════════════════════════

-- Mensajes del chat en tiempo real guardados en la base de datos
CREATE TABLE messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID        NOT NULL REFERENCES users(id),
  receiver_id UUID        NOT NULL REFERENCES users(id),
  texto       TEXT        NOT NULL,
  leido       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sender_neq_receiver CHECK (sender_id != receiver_id)
);

-- Índice para buscar conversaciones entre A y B eficientemente
-- LEAST/GREATEST garantiza el mismo orden sin importar quién envió
CREATE INDEX idx_messages_conv
  ON messages(
    LEAST(sender_id::text, receiver_id::text),
    GREATEST(sender_id::text, receiver_id::text),
    created_at
  );
