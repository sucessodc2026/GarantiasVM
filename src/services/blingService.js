const axios = require('axios');

const AUTH_BASE = 'https://www.bling.com.br/Api/v3/oauth';
const API_BASE = 'https://www.bling.com.br/Api/v3';

// Integração via OAuth2 (API v3 do Bling). O client_id/secret ficam só no
// .env do servidor; o access/refresh token ficam no banco (tabela
// configuracoes), porque precisam sobreviver a reinícios do processo.
class BlingService {
  // Monta a URL pra onde a Direção é mandada pra autorizar o app.
  static getAuthUrl(state) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.BLING_CLIENT_ID,
      state,
      redirect_uri: process.env.BLING_REDIRECT_URI,
    });
    return `${AUTH_BASE}/authorize?${params.toString()}`;
  }

  static _basicAuthHeader() {
    const cred = Buffer.from(`${process.env.BLING_CLIENT_ID}:${process.env.BLING_CLIENT_SECRET}`).toString('base64');
    return `Basic ${cred}`;
  }

  // Troca o "code" que o Bling devolveu no callback pelo primeiro par de tokens.
  static async exchangeCode(code) {
    const response = await axios.post(
      `${AUTH_BASE}/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.BLING_REDIRECT_URI,
      }),
      { headers: { Authorization: BlingService._basicAuthHeader(), 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data; // { access_token, refresh_token, expires_in, ... }
  }

  // O access_token do Bling expira em ~6h; usa o refresh_token pra renovar sem pedir login de novo.
  static async refreshToken(refreshToken) {
    const response = await axios.post(
      `${AUTH_BASE}/token`,
      new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
      { headers: { Authorization: BlingService._basicAuthHeader(), 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data;
  }

  constructor(accessToken) {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  // ============= CLIENTES (contatos) =============
  // Uma página (100 no máximo) — usado pra busca pontual no /bling/clientes.
  async listarClientes(termo = '') {
    const params = { pagina: 1, limite: 100 };
    if (termo) params.pesquisa = termo;
    const response = await this.client.get('/contatos', { params });
    return (response.data.data || []).map(BlingService._mapContato);
  }

  static _mapContato(c) {
    return {
      id: c.id,
      nome: c.nome,
      email: c.email,
      telefone: c.telefone || c.celular,
      cpf_cnpj: c.numeroDocumento,
    };
  }

  // Percorre todas as páginas — usado na sincronização, que precisa da base inteira.
  // O Bling limita a 3 req/s, por isso o intervalo entre páginas.
  async listarTodosClientes() {
    const todos = [];
    let pagina = 1;
    while (true) {
      const response = await this.client.get('/contatos', { params: { pagina, limite: 100 } });
      const pagina_dados = response.data.data || [];
      todos.push(...pagina_dados.map(BlingService._mapContato));
      if (pagina_dados.length < 100) break;
      pagina++;
      await new Promise((r) => setTimeout(r, 400));
    }
    return todos;
  }

  async obterCliente(id) {
    const response = await this.client.get(`/contatos/${id}`);
    const c = response.data.data;
    if (!c) return null;
    return {
      id: c.id,
      nome: c.nome,
      email: c.email,
      telefone: c.telefone || c.celular,
      cpf_cnpj: c.numeroDocumento,
      endereco: c.endereco?.geral?.endereco,
      cidade: c.endereco?.geral?.municipio,
    };
  }

  // ============= PRODUTOS =============
  async listarProdutos(termo = '') {
    const params = { pagina: 1, limite: 100 };
    if (termo) params.pesquisa = termo;
    const response = await this.client.get('/produtos', { params });
    return (response.data.data || []).map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricaoCurta,
      sku: p.codigo,
      preco: p.preco,
    }));
  }

  async obterProduto(id) {
    const response = await this.client.get(`/produtos/${id}`);
    const p = response.data.data;
    if (!p) return null;
    return { id: p.id, nome: p.nome, descricao: p.descricaoCurta, sku: p.codigo, preco: p.preco };
  }

  // ============= SINCRONIZAR COM DB LOCAL =============
  // Casa pelo CPF/CNPJ (chave natural já usada no resto do app), não pelo ID
  // do Bling — o id local é uuid e o do Bling é numérico, não dá pra usar
  // um no lugar do outro.
  async sincronizarClientes(pool) {
    const clientes = await this.listarTodosClientes();
    let count = 0;
    for (const cliente of clientes) {
      if (!cliente.nome) continue;
      if (cliente.cpf_cnpj) {
        await pool.query(
          `INSERT INTO clientes (nome, telefone, email, cpf_cnpj)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (cpf_cnpj) WHERE cpf_cnpj IS NOT NULL DO UPDATE SET
           nome = $1, telefone = $2, email = $3`,
          [cliente.nome, cliente.telefone || null, cliente.email || null, cliente.cpf_cnpj]
        );
      } else {
        // ponytail: sem CPF/CNPJ não dá pra deduplicar com segurança — insere direto.
        await pool.query(
          `INSERT INTO clientes (nome, telefone, email) VALUES ($1, $2, $3)`,
          [cliente.nome, cliente.telefone || null, cliente.email || null]
        );
      }
      count++;
    }
    return count;
  }
}

module.exports = BlingService;
