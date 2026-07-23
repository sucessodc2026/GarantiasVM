-- ============================================================
-- TABELA DE CONFIGURAÇÕES (ADICIONAR AO BANCO)
-- ============================================================

CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para buscar por tipo
CREATE INDEX IF NOT EXISTS idx_configuracoes_tipo ON configuracoes(tipo);

-- Inserir configurações padrão (vazias)
INSERT INTO configuracoes (tipo, descricao, valor) VALUES
  ('bling_api_key', 'Chave de API do Bling ERP', ''),
  ('empresa_nome', 'Nome da empresa', ''),
  ('email_suporte', 'Email de suporte', '')
ON CONFLICT (tipo) DO NOTHING;
