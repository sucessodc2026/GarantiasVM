import axios, { AxiosInstance } from 'axios';
import {
  Garantia,
  LoginRequest,
  LoginResponse,
  MetricasGerais,
  VendedorMetrica,
  ClienteRepetidor,
  ProdutoComDefeito,
  Alerta,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token em todas requisições
    this.api.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  // ============= AUTENTICAÇÃO =============
  async login(email: string, senha: string): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/usuarios/login', {
      email,
      senha,
    });
    return response.data;
  }

  async getPerfil() {
    const response = await this.api.get('/usuarios/perfil');
    return response.data;
  }

  async listarUsuarios(tipo_usuario?: string) {
    const params = tipo_usuario ? `?tipo_usuario=${tipo_usuario}` : '';
    const response = await this.api.get(`/usuarios${params}`);
    return response.data;
  }

  async criarUsuario(data: {
    nome: string;
    email: string;
    senha: string;
    tipo_usuario: 'vendedor' | 'logistica';
    telefone?: string;
  }) {
    const response = await this.api.post('/usuarios', data);
    return response.data;
  }

  async toggleUsuario(id: string) {
    const response = await this.api.patch(`/usuarios/${id}/toggle`);
    return response.data;
  }

  async alterarSenhaUsuario(id: string, senha: string) {
    const response = await this.api.patch(`/usuarios/${id}/senha`, { senha });
    return response.data;
  }

  // ============= GARANTIAS =============
  async criarGarantia(data: {
    cliente_id: string;
    produto_id?: string;
    itens?: { produto_id: string; quantidade: number }[];
    descricao_falha: string;
    foto_url?: string;
    video_url?: string;
  }): Promise<Garantia> {
    const response = await this.api.post<{ garantia: Garantia }>('/garantias', data);
    return response.data.garantia;
  }

  async minhasGarantias(status?: string, limite: number = 50, offset: number = 0) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limite', limite.toString());
    params.append('offset', offset.toString());

    const response = await this.api.get(`/garantias/meus?${params.toString()}`);
    return response.data;
  }

  async todasGarantias(status?: string, limite: number = 100, offset: number = 0) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limite', limite.toString());
    params.append('offset', offset.toString());

    const response = await this.api.get(`/garantias?${params.toString()}`);
    return response.data;
  }

  async obterGarantia(id: string): Promise<Garantia> {
    const response = await this.api.get<Garantia>(`/garantias/${id}`);
    return response.data;
  }

  async atualizarStatusGarantia(
    id: string,
    status: string,
    observacoes?: string,
    motivo_rejeicao?: string
  ): Promise<Garantia> {
    const response = await this.api.patch<{ garantia: Garantia }>(
      `/garantias/${id}/status`,
      {
        status,
        observacoes,
        motivo_rejeicao,
      }
    );
    return response.data.garantia;
  }

  // ============= MÉTRICAS =============
  async metricasGerais(): Promise<MetricasGerais> {
    const response = await this.api.get<MetricasGerais>('/metricas/geral');
    return response.data;
  }

  async garantiasPorVendedor(): Promise<VendedorMetrica[]> {
    const response = await this.api.get<VendedorMetrica[]>('/metricas/vendedores');
    return response.data;
  }

  async clientesRepetidores(): Promise<ClienteRepetidor[]> {
    const response = await this.api.get<ClienteRepetidor[]>(
      '/metricas/clientes-repetidores'
    );
    return response.data;
  }

  async produtosComDefeitos(): Promise<ProdutoComDefeito[]> {
    const response = await this.api.get<ProdutoComDefeito[]>(
      '/metricas/produtos-defeitos'
    );
    return response.data;
  }

  async historicoCliente(clienteId: string): Promise<Garantia[]> {
    const response = await this.api.get<Garantia[]>(
      `/metricas/cliente/${clienteId}`
    );
    return response.data;
  }

  async alertasNaoResolvidos(): Promise<Alerta[]> {
    const response = await this.api.get<Alerta[]>('/metricas/alertas');
    return response.data;
  }

  async resolverAlerta(id: string): Promise<Alerta> {
    const response = await this.api.patch<{ alerta: Alerta }>(
      `/metricas/alertas/${id}/resolver`
    );
    return response.data.alerta;
  }

  // ============= PRODUTOS =============
  async listarProdutos(busca?: string) {
    const params = busca ? `?busca=${encodeURIComponent(busca)}` : '';
    const response = await this.api.get(`/produtos${params}`);
    return response.data;
  }

  // ============= CLIENTES =============
  async listarClientes(busca?: string) {
    const params = busca ? `?busca=${encodeURIComponent(busca)}` : '';
    const response = await this.api.get(`/clientes${params}`);
    return response.data;
  }

  async criarCliente(data: { nome: string; telefone?: string; email?: string; cpf_cnpj?: string; cidade?: string; cep?: string; endereco?: string }) {
    const response = await this.api.post('/clientes', data);
    return response.data;
  }

  // Cadastra um SKU novo — sozinho, ou como variação de uma família existente.
  async criarProduto(data: { nome: string; descricao?: string; categoria?: string; familia_existente?: string }) {
    const response = await this.api.post('/produtos', data);
    return response.data;
  }

  // Aplica (ou remove, se foto_url vier vazio) a foto em todos os SKUs do modelo.
  async atualizarFotoFamilia(familia: string, foto_url?: string) {
    const response = await this.api.patch('/produtos/familia/foto', { familia, foto_url });
    return response.data;
  }

  async atualizarFotoProduto(id: string, foto_url: string) {
    const response = await this.api.patch(`/produtos/${id}/foto`, { foto_url });
    return response.data;
  }

  async removerFotoProduto(id: string) {
    const response = await this.api.delete(`/produtos/${id}/foto`);
    return response.data;
  }

  // ============= BLING (OAuth2) =============
  async blingStatus() {
    const response = await this.api.get('/bling/status');
    return response.data;
  }

  async blingOauthIniciar() {
    const response = await this.api.get('/bling/oauth/iniciar');
    return response.data; // { url }
  }

  async blingSincronizar() {
    const response = await this.api.post('/bling/sincronizar');
    return response.data;
  }

  // ============= IMPORTAÇÃO CSV =============
  async importarClientesCSV(csv: string) {
    const response = await this.api.post('/import/clientes', { csv });
    return response.data;
  }

  async importarProdutosCSV(csv: string) {
    const response = await this.api.post('/import/produtos', { csv });
    return response.data;
  }
}

export const apiService = new ApiService();
