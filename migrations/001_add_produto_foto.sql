-- Adicionar coluna foto_url (SKU image) na tabela produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);
