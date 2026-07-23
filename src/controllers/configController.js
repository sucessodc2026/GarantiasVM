const pool = require('../config/database');

class ConfigController {
  // Salvar configuração (chave Bling, etc)
  static async salvarConfig(req, res) {
    try {
      const { tipo, valor } = req.body;

      if (!tipo || !valor) {
        return res.status(400).json({ erro: 'Tipo e valor são obrigatórios' });
      }

      // Validar tipos permitidos
      const tiposPermitidos = ['bling_api_key', 'empresa_nome', 'email_suporte'];
      if (!tiposPermitidos.includes(tipo)) {
        return res.status(400).json({ erro: 'Tipo de configuração inválido' });
      }

      // Se for Bling, testar a chave
      if (tipo === 'bling_api_key') {
        try {
          const BlingService = require('../services/blingService');
          const blingTest = new BlingService(valor);
          await blingTest.listarClientes(); // Teste simples
        } catch (erro) {
          return res.status(400).json({
            erro: 'Chave Bling inválida. Verifique e tente novamente.',
            detalhes: erro.message,
          });
        }
      }

      // Salvar ou atualizar configuração
      await pool.query(
        `INSERT INTO configuracoes (tipo, valor)
         VALUES ($1, $2)
         ON CONFLICT (tipo) DO UPDATE SET
         valor = $2, atualizado_em = CURRENT_TIMESTAMP`,
        [tipo, valor]
      );

      res.json({
        mensagem: `Configuração "${tipo}" salva com sucesso`,
        tipo,
        valor: tipo === 'bling_api_key' ? '***' : valor, // Não retornar a chave
      });
    } catch (erro) {
      console.error('Erro ao salvar configuração:', erro);
      res.status(500).json({ erro: 'Erro ao salvar configuração' });
    }
  }

  // Obter configuração (sem retornar valor sensível)
  static async obterConfig(req, res) {
    try {
      const { tipo } = req.params;

      const result = await pool.query(
        'SELECT tipo, valor, atualizado_em FROM configuracoes WHERE tipo = $1',
        [tipo]
      );

      if (result.rows.length === 0) {
        return res.json({ configurado: false });
      }

      const config = result.rows[0];

      // Não retornar valores sensíveis
      const valor =
        tipo === 'bling_api_key'
          ? config.valor
            ? '****' + config.valor.slice(-4)
            : ''
          : config.valor || '';

      res.json({
        tipo: config.tipo,
        valor,
        configurado: true,
        atualizado_em: config.atualizado_em,
      });
    } catch (erro) {
      console.error('Erro ao obter configuração:', erro);
      res.status(500).json({ erro: 'Erro ao obter configuração' });
    }
  }

  // Listar todas as configurações (sem valores sensíveis)
  static async listarConfigs(req, res) {
    try {
      const result = await pool.query(
        'SELECT tipo, atualizado_em FROM configuracoes ORDER BY atualizado_em DESC'
      );

      const configs = result.rows.map((c) => ({
        tipo: c.tipo,
        configurado: true,
        atualizado_em: c.atualizado_em,
      }));

      res.json(configs);
    } catch (erro) {
      console.error('Erro ao listar configurações:', erro);
      res.status(500).json({ erro: 'Erro ao listar configurações' });
    }
  }

  // Testar chave Bling
  static async testarBling(req, res) {
    try {
      const result = await pool.query(
        'SELECT valor FROM configuracoes WHERE tipo = $1',
        ['bling_api_key']
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          erro: 'Chave Bling não configurada',
        });
      }

      const apiKey = result.rows[0].valor;
      const BlingService = require('../services/blingService');
      const bling = new BlingService(apiKey);

      // Tentar listar clientes (teste simples)
      const clientes = await bling.listarClientes();

      res.json({
        status: 'OK',
        mensagem: 'Conexão com Bling estabelecida com sucesso',
        clientes_encontrados: clientes.length,
      });
    } catch (erro) {
      console.error('Erro ao testar Bling:', erro);
      res.status(400).json({
        status: 'ERRO',
        mensagem: 'Erro ao conectar com Bling',
        detalhes: erro.message,
      });
    }
  }
}

module.exports = ConfigController;
