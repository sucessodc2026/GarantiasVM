-- ============================================================
-- PLATAFORMA DE GARANTIAS - SCHEMA DATABASE
-- ============================================================

-- Criar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: USUARIOS (Vendedores, Logística, Direção)
-- ============================================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20),

  -- Tipo de usuário: 'vendedor', 'logistica', 'direcao'
  tipo_usuario VARCHAR(50) NOT NULL CHECK (tipo_usuario IN ('vendedor', 'logistica', 'direcao')),

  -- Status ativo/inativo
  ativo BOOLEAN DEFAULT TRUE,

  -- Timestamp
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario);

-- ============================================================
-- TABELA: CLIENTES
-- ============================================================
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) UNIQUE,

  -- Dados opcionais
  email VARCHAR(255),
  endereco TEXT,

  -- Contador automático de garantias
  total_garantias INT DEFAULT 0,

  -- Flag de anomalia (cliente suspeito - pedindo muita garantia)
  em_analise BOOLEAN DEFAULT FALSE,

  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clientes_telefone ON clientes(telefone);
CREATE INDEX idx_clientes_em_analise ON clientes(em_analise);

-- ============================================================
-- TABELA: PRODUTOS
-- ============================================================
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,

  -- Categoria: 'led', 'automotivo', etc
  categoria VARCHAR(100) NOT NULL,

  -- URL da foto do produto (SKU)
  foto_url VARCHAR(500),

  -- Contador automático de defeitos
  total_defeitos INT DEFAULT 0,

  -- Flag de alerta (produto com muitos defeitos)
  em_alerta BOOLEAN DEFAULT FALSE,

  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_em_alerta ON produtos(em_alerta);

-- ============================================================
-- TABELA: SOLICITACOES_GARANTIA (Principal)
-- ============================================================
CREATE TABLE solicitacoes_garantia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamentos
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  vendedor_id UUID NOT NULL REFERENCES usuarios(id),
  produto_id UUID NOT NULL REFERENCES produtos(id),

  -- Descrição do problema
  descricao_falha TEXT NOT NULL,

  -- Arquivo - URLs do Google Drive
  foto_url VARCHAR(500),
  video_url VARCHAR(500),

  -- Status: 'pendente', 'processado', 'rejeitado', 'concluido'
  status VARCHAR(50) NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'processado', 'rejeitado', 'concluido')),

  -- Observações
  observacoes TEXT,

  -- Rastreamento
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processado_em TIMESTAMP,

  CONSTRAINT garantia_unica UNIQUE(cliente_id, produto_id, criado_em)
);

CREATE INDEX idx_solicitacoes_cliente ON solicitacoes_garantia(cliente_id);
CREATE INDEX idx_solicitacoes_vendedor ON solicitacoes_garantia(vendedor_id);
CREATE INDEX idx_solicitacoes_produto ON solicitacoes_garantia(produto_id);
CREATE INDEX idx_solicitacoes_status ON solicitacoes_garantia(status);
CREATE INDEX idx_solicitacoes_data ON solicitacoes_garantia(criado_em);

-- ============================================================
-- TABELA: HISTORICO_GARANTIAS (Auditoria)
-- ============================================================
CREATE TABLE historico_garantias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes_garantia(id),

  -- O que mudou
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50),

  -- Quem fez a mudança
  usuario_id UUID REFERENCES usuarios(id),

  -- Motivo
  motivo TEXT,

  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_historico_solicitacao ON historico_garantias(solicitacao_id);
CREATE INDEX idx_historico_data ON historico_garantias(criado_em);

-- ============================================================
-- TABELA: ALERTAS_ANOMALIAS
-- ============================================================
CREATE TABLE alertas_anomalias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tipo de alerta
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('cliente_repetidor', 'vendedor_suspeito', 'produto_defeituoso')),

  -- Relacionamento (pode ser cliente, vendedor ou produto)
  cliente_id UUID REFERENCES clientes(id),
  vendedor_id UUID REFERENCES usuarios(id),
  produto_id UUID REFERENCES produtos(id),

  -- Descrição do alerta
  descricao TEXT NOT NULL,

  -- Métricas que dispararam o alerta
  valor_metrica DECIMAL(10, 2),
  limite_alerta DECIMAL(10, 2),

  -- Status do alerta
  resolvido BOOLEAN DEFAULT FALSE,

  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolvido_em TIMESTAMP
);

CREATE INDEX idx_alertas_tipo ON alertas_anomalias(tipo);
CREATE INDEX idx_alertas_cliente ON alertas_anomalias(cliente_id);
CREATE INDEX idx_alertas_vendedor ON alertas_anomalias(vendedor_id);
CREATE INDEX idx_alertas_resolvido ON alertas_anomalias(resolvido);

-- ============================================================
-- TABELA: METRICAS_VENDEDORES (Cache para Dashboard)
-- ============================================================
CREATE TABLE metricas_vendedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendedor_id UUID NOT NULL REFERENCES usuarios(id) UNIQUE,

  total_solicitacoes INT DEFAULT 0,
  total_processadas INT DEFAULT 0,
  total_rejeitadas INT DEFAULT 0,

  -- Taxa de aprovação
  taxa_aprovacao DECIMAL(5, 2) DEFAULT 0,

  -- Período (mês/ano)
  periodo DATE NOT NULL,

  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metricas_vendedor ON metricas_vendedores(vendedor_id);
CREATE INDEX idx_metricas_periodo ON metricas_vendedores(periodo);

-- ============================================================
-- TABELA: METRICAS_CLIENTES (Cache para Dashboard)
-- ============================================================
CREATE TABLE metricas_clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),

  total_solicitacoes INT DEFAULT 0,
  ultima_solicitacao TIMESTAMP,

  -- Frequência no período
  periodo DATE NOT NULL,

  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(cliente_id, periodo)
);

CREATE INDEX idx_metricas_clientes_cliente ON metricas_clientes(cliente_id);
CREATE INDEX idx_metricas_clientes_periodo ON metricas_clientes(periodo);

-- ============================================================
-- TRIGGER: Atualizar contador de garantias do cliente
-- ============================================================
CREATE OR REPLACE FUNCTION atualizar_total_garantias_cliente()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clientes
  SET total_garantias = (
    SELECT COUNT(*) FROM solicitacoes_garantia
    WHERE cliente_id = NEW.cliente_id
  ),
  atualizado_em = CURRENT_TIMESTAMP
  WHERE id = NEW.cliente_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_garantias_cliente
AFTER INSERT ON solicitacoes_garantia
FOR EACH ROW
EXECUTE FUNCTION atualizar_total_garantias_cliente();

-- ============================================================
-- TRIGGER: Atualizar contador de defeitos do produto
-- ============================================================
CREATE OR REPLACE FUNCTION atualizar_total_defeitos_produto()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE produtos
  SET total_defeitos = (
    SELECT COUNT(*) FROM solicitacoes_garantia
    WHERE produto_id = NEW.produto_id
  ),
  atualizado_em = CURRENT_TIMESTAMP
  WHERE id = NEW.produto_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_defeitos_produto
AFTER INSERT ON solicitacoes_garantia
FOR EACH ROW
EXECUTE FUNCTION atualizar_total_defeitos_produto();

-- ============================================================
-- TRIGGER: Registrar histórico quando status muda
-- ============================================================
CREATE OR REPLACE FUNCTION registrar_historico_garantia()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO historico_garantias (solicitacao_id, status_anterior, status_novo)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_registrar_historico
AFTER UPDATE ON solicitacoes_garantia
FOR EACH ROW
EXECUTE FUNCTION registrar_historico_garantia();

-- ============================================================
-- SEED: Dados iniciais (OPCIONAL)
-- ============================================================

-- Inserir usuários de exemplo
INSERT INTO usuarios (nome, email, tipo_usuario) VALUES
  ('João Silva', 'joao.silva@garantia.com', 'vendedor'),
  ('Maria Santos', 'maria.santos@garantia.com', 'vendedor'),
  ('Pedro Oliveira', 'pedro.oliveira@garantia.com', 'logistica'),
  ('Ana Costa', 'ana.costa@garantia.com', 'direcao')
ON CONFLICT (email) DO NOTHING;

-- Inserir produtos
INSERT INTO produtos (nome, descricao, categoria) VALUES
  ('LED RGB 10W', 'LED colorido para automotivos', 'led'),
  ('LED Branco 5W', 'LED branco para iluminação', 'led'),
  ('Relé Automotivo', 'Relé de controle para veículos', 'automotivo'),
  ('Sensor de Temperatura', 'Sensor para sistemas embarcados', 'automotivo')
ON CONFLICT DO NOTHING;

-- ============================================================
-- VIEWS ÚTEIS PARA DASHBOARD
-- ============================================================

-- View: Garantias por vendedor (últimos 30 dias)
CREATE OR REPLACE VIEW vw_garantias_vendedor_30d AS
SELECT
  u.id,
  u.nome,
  COUNT(*) as total,
  SUM(CASE WHEN sg.status = 'processado' THEN 1 ELSE 0 END) as processadas,
  SUM(CASE WHEN sg.status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
  ROUND(
    (SUM(CASE WHEN sg.status = 'processado' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100,
    2
  ) as taxa_aprovacao
FROM usuarios u
LEFT JOIN solicitacoes_garantia sg ON u.id = sg.vendedor_id
  AND sg.criado_em >= CURRENT_DATE - INTERVAL '30 days'
WHERE u.tipo_usuario = 'vendedor'
GROUP BY u.id, u.nome
ORDER BY total DESC;

-- View: Clientes com múltiplas solicitações (últimos 30 dias)
CREATE OR REPLACE VIEW vw_clientes_repetidores_30d AS
SELECT
  c.id,
  c.nome,
  c.telefone,
  COUNT(*) as total_solicitacoes,
  COUNT(DISTINCT sg.produto_id) as produtos_diferentes
FROM clientes c
JOIN solicitacoes_garantia sg ON c.id = sg.cliente_id
WHERE sg.criado_em >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.id, c.nome, c.telefone
HAVING COUNT(*) >= 3
ORDER BY total_solicitacoes DESC;

-- View: Produtos com mais defeitos
CREATE OR REPLACE VIEW vw_produtos_com_defeitos AS
SELECT
  p.id,
  p.nome,
  p.categoria,
  COUNT(*) as total_defeitos,
  COUNT(DISTINCT sg.cliente_id) as clientes_afetados
FROM produtos p
LEFT JOIN solicitacoes_garantia sg ON p.id = sg.produto_id
GROUP BY p.id, p.nome, p.categoria
HAVING COUNT(*) > 0
ORDER BY total_defeitos DESC;

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
