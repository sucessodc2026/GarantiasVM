const axios = require('axios');

class BlingService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.bling.com.br/b/api/v2';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
  }

  // ============= CLIENTES =============
  async listarClientes(filtro = '') {
    try {
      let url = '/contatos?formato=json';

      if (filtro) {
        url += `&nome=${encodeURIComponent(filtro)}`;
      }

      const response = await this.client.get(url);

      if (response.data.retorno?.contatos) {
        return response.data.retorno.contatos.map((c) => ({
          id: c.contato.id,
          nome: c.contato.nome,
          email: c.contato.email,
          telefone: c.contato.telefone,
          cpf_cnpj: c.contato.cpf_cnpj,
        }));
      }

      return [];
    } catch (erro) {
      console.error('Erro ao listar clientes do Bling:', erro.message);
      throw erro;
    }
  }

  async obterCliente(id) {
    try {
      const response = await this.client.get(`/contatos/${id}?formato=json`);

      if (response.data.retorno?.contatos) {
        const c = response.data.retorno.contatos[0].contato;
        return {
          id: c.id,
          nome: c.nome,
          email: c.email,
          telefone: c.telefone,
          cpf_cnpj: c.cpf_cnpj,
          endereco: c.endereco,
          numero: c.numero,
          cidade: c.cidade,
          estado: c.estado,
        };
      }

      return null;
    } catch (erro) {
      console.error('Erro ao obter cliente do Bling:', erro.message);
      throw erro;
    }
  }

  // ============= PRODUTOS =============
  async listarProdutos(filtro = '') {
    try {
      let url = '/produtos?formato=json&limite=100';

      if (filtro) {
        url += `&nome=${encodeURIComponent(filtro)}`;
      }

      const response = await this.client.get(url);

      if (response.data.retorno?.produtos) {
        return response.data.retorno.produtos.map((p) => ({
          id: p.produto.id,
          nome: p.produto.nome,
          descricao: p.produto.descricao,
          sku: p.produto.sku,
          preco: p.produto.preco,
          categoria: p.produto.categoria,
          estoque: p.produto.estoque,
        }));
      }

      return [];
    } catch (erro) {
      console.error('Erro ao listar produtos do Bling:', erro.message);
      throw erro;
    }
  }

  async obterProduto(id) {
    try {
      const response = await this.client.get(`/produtos/${id}?formato=json`);

      if (response.data.retorno?.produtos) {
        const p = response.data.retorno.produtos[0].produto;
        return {
          id: p.id,
          nome: p.nome,
          descricao: p.descricao,
          sku: p.sku,
          preco: p.preco,
          categoria: p.categoria,
          estoque: p.estoque,
          fabricante: p.fabricante,
        };
      }

      return null;
    } catch (erro) {
      console.error('Erro ao obter produto do Bling:', erro.message);
      throw erro;
    }
  }

  // ============= SINCRONIZAR COM DB LOCAL =============
  async sincronizarClientes(pool) {
    try {
      console.log('📥 Sincronizando clientes do Bling...');
      const clientes = await this.listarClientes();

      for (const cliente of clientes) {
        await pool.query(
          `INSERT INTO clientes (id, nome, telefone, email)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
           nome = $2, telefone = $3, email = $4, atualizado_em = CURRENT_TIMESTAMP`,
          [cliente.id, cliente.nome, cliente.telefone, cliente.email]
        );
      }

      console.log(`✓ ${clientes.length} clientes sincronizados`);
      return clientes.length;
    } catch (erro) {
      console.error('Erro ao sincronizar clientes:', erro);
      throw erro;
    }
  }

  async sincronizarProdutos(pool) {
    try {
      console.log('📥 Sincronizando produtos do Bling...');
      const produtos = await this.listarProdutos();

      for (const produto of produtos) {
        await pool.query(
          `INSERT INTO produtos (id, nome, descricao, categoria)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
           nome = $2, descricao = $3, categoria = $4, atualizado_em = CURRENT_TIMESTAMP`,
          [produto.id, produto.nome, produto.descricao, produto.categoria]
        );
      }

      console.log(`✓ ${produtos.length} produtos sincronizados`);
      return produtos.length;
    } catch (erro) {
      console.error('Erro ao sincronizar produtos:', erro);
      throw erro;
    }
  }
}

module.exports = BlingService;
