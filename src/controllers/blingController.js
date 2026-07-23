const pool = require('../config/database');
const BlingService = require('../services/blingService');

let blingService = null;

class BlingController {
  // Configurar chave de API do Bling
  static async configurarApiKey(req, res) {
    try {
      const { apiKey } = req.body;

      if (!apiKey) {
        return res.status(400).json({ erro: 'API Key é obrigatória' });
      }

      // Testar conexão
      const testService = new BlingService(apiKey);
      const clientes = await testService.listarClientes();

      // Se chegou aqui, a chave é válida
      // Salvar em variável global (em produção, usar banco de dados ou variáveis de ambiente)
      blingService = testService;

      res.json({
        mensagem: 'API Key configurada com sucesso',
        clientes_encontrados: clientes.length,
      });
    } catch (erro) {
      console.error('Erro ao configurar API Key:', erro);
      res.status(400).json({
        erro: 'Erro ao validar API Key. Verifique se a chave está correta.',
      });
    }
  }

  // Listar clientes do Bling
  static async listarClientes(req, res) {
    try {
      if (!blingService) {
        return res.status(400).json({
          erro: 'Bling não está configurado. Configure a API Key primeiro.',
        });
      }

      const { termo } = req.query;
      const clientes = await blingService.listarClientes(termo);

      res.json({
        total: clientes.length,
        clientes,
      });
    } catch (erro) {
      console.error('Erro ao listar clientes:', erro);
      res.status(500).json({ erro: 'Erro ao listar clientes' });
    }
  }

  // Obter cliente específico
  static async obterCliente(req, res) {
    try {
      if (!blingService) {
        return res.status(400).json({
          erro: 'Bling não está configurado',
        });
      }

      const { id } = req.params;
      const cliente = await blingService.obterCliente(id);

      if (!cliente) {
        return res.status(404).json({ erro: 'Cliente não encontrado' });
      }

      res.json(cliente);
    } catch (erro) {
      console.error('Erro ao obter cliente:', erro);
      res.status(500).json({ erro: 'Erro ao obter cliente' });
    }
  }

  // Listar produtos do Bling
  static async listarProdutos(req, res) {
    try {
      if (!blingService) {
        return res.status(400).json({
          erro: 'Bling não está configurado',
        });
      }

      const { termo } = req.query;
      const produtos = await blingService.listarProdutos(termo);

      res.json({
        total: produtos.length,
        produtos,
      });
    } catch (erro) {
      console.error('Erro ao listar produtos:', erro);
      res.status(500).json({ erro: 'Erro ao listar produtos' });
    }
  }

  // Obter produto específico
  static async obterProduto(req, res) {
    try {
      if (!blingService) {
        return res.status(400).json({
          erro: 'Bling não está configurado',
        });
      }

      const { id } = req.params;
      const produto = await blingService.obterProduto(id);

      if (!produto) {
        return res.status(404).json({ erro: 'Produto não encontrado' });
      }

      res.json(produto);
    } catch (erro) {
      console.error('Erro ao obter produto:', erro);
      res.status(500).json({ erro: 'Erro ao obter produto' });
    }
  }

  // Sincronizar clientes e produtos
  static async sincronizar(req, res) {
    try {
      if (!blingService) {
        return res.status(400).json({
          erro: 'Bling não está configurado',
        });
      }

      const clientesSincronizados = await blingService.sincronizarClientes(pool);
      const produtosSincronizados = await blingService.sincronizarProdutos(pool);

      res.json({
        mensagem: 'Sincronização concluída',
        clientes_sincronizados: clientesSincronizados,
        produtos_sincronizados: produtosSincronizados,
        total: clientesSincronizados + produtosSincronizados,
      });
    } catch (erro) {
      console.error('Erro ao sincronizar:', erro);
      res.status(500).json({ erro: 'Erro ao sincronizar com Bling' });
    }
  }

  // Status da integração
  static async status(req, res) {
    try {
      const statusBling = blingService ? 'Configurado' : 'Não configurado';

      res.json({
        bling: statusBling,
        database: 'Conectado',
        mensagem: blingService
          ? 'Integração com Bling ativa'
          : 'Configure a API Key do Bling para ativar a integração',
      });
    } catch (erro) {
      res.status(500).json({ erro: 'Erro ao verificar status' });
    }
  }
}

module.exports = { BlingController, getBlingService: () => blingService };
