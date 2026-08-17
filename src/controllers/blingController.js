const crypto = require('crypto');
const pool = require('../config/database');
const BlingService = require('../services/blingService');

async function getConfig(tipo) {
  const r = await pool.query('SELECT valor FROM configuracoes WHERE tipo = $1', [tipo]);
  return r.rows[0]?.valor || null;
}

async function setConfig(tipo, valor) {
  await pool.query(
    `INSERT INTO configuracoes (tipo, valor) VALUES ($1, $2)
     ON CONFLICT (tipo) DO UPDATE SET valor = $2, atualizado_em = CURRENT_TIMESTAMP`,
    [tipo, valor]
  );
}

async function salvarTokens(tokens) {
  const expiresAt = Date.now() + tokens.expires_in * 1000;
  await setConfig('bling_access_token', tokens.access_token);
  await setConfig('bling_refresh_token', tokens.refresh_token);
  await setConfig('bling_token_expires_at', String(expiresAt));
}

// Devolve um access_token válido, renovando com o refresh_token se estiver
// perto de expirar. Usado por toda rota que precisa falar com o Bling.
async function getValidAccessToken() {
  const accessToken = await getConfig('bling_access_token');
  const refreshToken = await getConfig('bling_refresh_token');
  const expiresAt = Number(await getConfig('bling_token_expires_at') || 0);

  if (!accessToken || !refreshToken) return null;

  // Renova com 2min de folga antes de vencer.
  if (Date.now() > expiresAt - 2 * 60 * 1000) {
    const tokens = await BlingService.refreshToken(refreshToken);
    await salvarTokens(tokens);
    return tokens.access_token;
  }

  return accessToken;
}

class BlingController {
  // Gera a URL de autorização — a Direção abre isso pra conectar a conta Bling.
  static async oauthIniciar(req, res) {
    if (!process.env.BLING_CLIENT_ID || !process.env.BLING_CLIENT_SECRET) {
      return res.status(400).json({ erro: 'BLING_CLIENT_ID/BLING_CLIENT_SECRET não configurados no servidor' });
    }
    const state = crypto.randomBytes(16).toString('hex');
    await setConfig('bling_oauth_state', state);
    res.json({ url: BlingService.getAuthUrl(state) });
  }

  // O Bling redireciona o navegador pra cá depois que a Direção autoriza.
  static async oauthCallback(req, res) {
    const { code, state } = req.query;
    const frontendUrl = process.env.CORS_ORIGIN || 'https://garantiasvm.duckdns.org';

    try {
      const estadoSalvo = await getConfig('bling_oauth_state');
      if (!code || !state || state !== estadoSalvo) {
        return res.redirect(`${frontendUrl}/dashboard/direcao/configuracoes?bling=erro`);
      }
      const tokens = await BlingService.exchangeCode(code);
      await salvarTokens(tokens);
      res.redirect(`${frontendUrl}/dashboard/direcao/configuracoes?bling=conectado`);
    } catch (erro) {
      console.error('Erro no callback do Bling:', erro.response?.data || erro.message);
      res.redirect(`${frontendUrl}/dashboard/direcao/configuracoes?bling=erro`);
    }
  }

  // Status da integração
  static async status(req, res) {
    const accessToken = await getConfig('bling_access_token');
    res.json({
      bling: accessToken ? 'Conectado' : 'Não conectado',
      mensagem: accessToken
        ? 'Integração com Bling ativa'
        : 'Conecte sua conta Bling para ativar a integração',
    });
  }

  // Listar clientes do Bling
  static async listarClientes(req, res) {
    try {
      const token = await getValidAccessToken();
      if (!token) return res.status(400).json({ erro: 'Bling não está conectado' });
      const bling = new BlingService(token);
      const { termo } = req.query;
      const clientes = await bling.listarClientes(termo);
      res.json({ total: clientes.length, clientes });
    } catch (erro) {
      console.error('Erro ao listar clientes do Bling:', erro.response?.data || erro.message);
      res.status(500).json({ erro: 'Erro ao listar clientes do Bling' });
    }
  }

  static async obterCliente(req, res) {
    try {
      const token = await getValidAccessToken();
      if (!token) return res.status(400).json({ erro: 'Bling não está conectado' });
      const bling = new BlingService(token);
      const cliente = await bling.obterCliente(req.params.id);
      if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
      res.json(cliente);
    } catch (erro) {
      console.error('Erro ao obter cliente do Bling:', erro.response?.data || erro.message);
      res.status(500).json({ erro: 'Erro ao obter cliente' });
    }
  }

  // Listar produtos do Bling
  static async listarProdutos(req, res) {
    try {
      const token = await getValidAccessToken();
      if (!token) return res.status(400).json({ erro: 'Bling não está conectado' });
      const bling = new BlingService(token);
      const { termo } = req.query;
      const produtos = await bling.listarProdutos(termo);
      res.json({ total: produtos.length, produtos });
    } catch (erro) {
      console.error('Erro ao listar produtos do Bling:', erro.response?.data || erro.message);
      res.status(500).json({ erro: 'Erro ao listar produtos do Bling' });
    }
  }

  static async obterProduto(req, res) {
    try {
      const token = await getValidAccessToken();
      if (!token) return res.status(400).json({ erro: 'Bling não está conectado' });
      const bling = new BlingService(token);
      const produto = await bling.obterProduto(req.params.id);
      if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
      res.json(produto);
    } catch (erro) {
      console.error('Erro ao obter produto do Bling:', erro.response?.data || erro.message);
      res.status(500).json({ erro: 'Erro ao obter produto' });
    }
  }

  // Sincronizar clientes (produtos ficam de fora — cadastro é manual/CSV)
  static async sincronizar(req, res) {
    try {
      const token = await getValidAccessToken();
      if (!token) return res.status(400).json({ erro: 'Bling não está conectado' });
      const bling = new BlingService(token);

      const clientesSincronizados = await bling.sincronizarClientes(pool);

      res.json({
        mensagem: 'Sincronização concluída',
        clientes_sincronizados: clientesSincronizados,
        total: clientesSincronizados,
      });
    } catch (erro) {
      console.error('Erro ao sincronizar:', erro.response?.data || erro.message);
      res.status(500).json({ erro: 'Erro ao sincronizar com Bling' });
    }
  }
}

module.exports = { BlingController };
