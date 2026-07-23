// Tipos do usuário
export type TipoUsuario = 'vendedor' | 'logistica' | 'direcao';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo_usuario: TipoUsuario;
  ativo: boolean;
  criado_em: string;
}

// Tipos de garantia
export type StatusGarantia = 'pendente' | 'processado' | 'rejeitado' | 'concluido';

export interface Garantia {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  cliente_telefone?: string;
  vendedor_id: string;
  vendedor_nome?: string;
  produto_id: string;
  produto_nome?: string;
  produto_categoria?: string;
  produto_foto_url?: string;
  descricao_falha: string;
  foto_url?: string;
  video_url?: string;
  status: StatusGarantia;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
  processado_em?: string;
}

// Cliente
export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  total_garantias: number;
  em_analise: boolean;
  criado_em: string;
}

// Produto
export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  foto_url?: string;
  total_defeitos: number;
  em_alerta: boolean;
  criado_em: string;
}

// Métricas
export interface MetricasGerais {
  total_garantias: string;
  processadas: string;
  pendentes: string;
  rejeitadas: string;
  taxa_aprovacao: string;
}

export interface VendedorMetrica {
  id: string;
  nome: string;
  total: string;
  processadas: string;
  pendentes: string;
  taxa_aprovacao: string;
}

export interface ClienteRepetidor {
  id: string;
  nome: string;
  telefone: string;
  total_solicitacoes: string;
  produtos_diferentes: string;
}

export interface ProdutoComDefeito {
  id: string;
  nome: string;
  categoria: string;
  total_defeitos: string;
  clientes_afetados: string;
}

export interface Alerta {
  id: string;
  tipo: 'cliente_repetidor' | 'vendedor_suspeito' | 'produto_defeituoso';
  cliente_id?: string;
  vendedor_id?: string;
  produto_id?: string;
  alerta_para?: string;
  descricao: string;
  valor_metrica: string;
  limite_alerta: string;
  resolvido: boolean;
  criado_em: string;
  resolvido_em?: string;
}

// Auth
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  mensagem: string;
  token: string;
  usuario: Usuario;
}

// API Response
export interface ApiResponse<T> {
  mensagem?: string;
  erro?: string;
  data?: T;
  [key: string]: any;
}
