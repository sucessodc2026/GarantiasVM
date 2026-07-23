import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  sku?: string;
  categoria?: string;
  preco?: number;
}

class BlingServiceClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/bling`,
    });

    // Interceptor para adicionar token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async configurarApiKey(apiKey: string): Promise<any> {
    try {
      const response = await this.api.post('/config', { apiKey });
      return response.data;
    } catch (error) {
      console.error('Erro ao configurar API Key:', error);
      throw error;
    }
  }

  async verificarStatus(): Promise<any> {
    try {
      const response = await this.api.get('/status');
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      throw error;
    }
  }

  async listarClientes(termo?: string): Promise<Cliente[]> {
    try {
      const params = new URLSearchParams();
      if (termo) params.append('termo', termo);

      const response = await this.api.get(`/clientes?${params.toString()}`);
      return response.data.clientes || [];
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      throw error;
    }
  }

  async obterCliente(id: string): Promise<Cliente> {
    try {
      const response = await this.api.get(`/clientes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter cliente:', error);
      throw error;
    }
  }

  async listarProdutos(termo?: string): Promise<Produto[]> {
    try {
      const params = new URLSearchParams();
      if (termo) params.append('termo', termo);

      const response = await this.api.get(`/produtos?${params.toString()}`);
      return response.data.produtos || [];
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      throw error;
    }
  }

  async obterProduto(id: string): Promise<Produto> {
    try {
      const response = await this.api.get(`/produtos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter produto:', error);
      throw error;
    }
  }

  async sincronizar(): Promise<any> {
    try {
      const response = await this.api.post('/sincronizar', {});
      return response.data;
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      throw error;
    }
  }
}

export const blingService = new BlingServiceClient();
export type { Cliente, Produto };
