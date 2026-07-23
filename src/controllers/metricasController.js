const pool = require('../config/database');

class MetricasController {
  // Dashboard - Métricas gerais do mês
  static async metricasGerais(req, res) {
    try {
      const query = `
        SELECT
          COUNT(*) as total_garantias,
          SUM(CASE WHEN status = 'processado' THEN 1 ELSE 0 END) as processadas,
          SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
          SUM(CASE WHEN status = 'rejeitado' THEN 1 ELSE 0 END) as rejeitadas,
          ROUND(
            (SUM(CASE WHEN status = 'processado' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100,
            2
          ) as taxa_aprovacao
        FROM solicitacoes_garantia
        WHERE criado_em >= CURRENT_DATE - INTERVAL '30 days';
      `;

      const result = await pool.query(query);
      res.json(result.rows[0]);
    } catch (erro) {
      console.error('Erro ao obter métricas gerais:', erro);
      res.status(500).json({ erro: 'Erro ao obter métricas' });
    }
  }

  // Garantias por vendedor (últimos 30 dias)
  static async garantiasPorVendedor(req, res) {
    try {
      const query = `
        SELECT * FROM vw_garantias_vendedor_30d;
      `;

      const result = await pool.query(query);
      res.json(result.rows);
    } catch (erro) {
      console.error('Erro ao obter garantias por vendedor:', erro);
      res.status(500).json({ erro: 'Erro ao obter métricas' });
    }
  }

  // Clientes repetidores (últimos 30 dias)
  static async clientesRepetidores(req, res) {
    try {
      const query = `
        SELECT * FROM vw_clientes_repetidores_30d;
      `;

      const result = await pool.query(query);
      res.json(result.rows);
    } catch (erro) {
      console.error('Erro ao obter clientes repetidores:', erro);
      res.status(500).json({ erro: 'Erro ao obter métricas' });
    }
  }

  // Produtos com defeitos
  static async produtosComDefeitos(req, res) {
    try {
      const query = `
        SELECT * FROM vw_produtos_com_defeitos
        ORDER BY total_defeitos DESC
        LIMIT 20;
      `;

      const result = await pool.query(query);
      res.json(result.rows);
    } catch (erro) {
      console.error('Erro ao obter produtos com defeitos:', erro);
      res.status(500).json({ erro: 'Erro ao obter métricas' });
    }
  }

  // Histórico de garantias por cliente
  static async historicoCliente(req, res) {
    try {
      const { cliente_id } = req.params;

      const query = `
        SELECT
          sg.*,
          p.nome as produto_nome,
          p.categoria as produto_categoria,
          u.nome as vendedor_nome
        FROM solicitacoes_garantia sg
        JOIN produtos p ON sg.produto_id = p.id
        JOIN usuarios u ON sg.vendedor_id = u.id
        WHERE sg.cliente_id = $1
        ORDER BY sg.criado_em DESC;
      `;

      const result = await pool.query(query, [cliente_id]);
      res.json(result.rows);
    } catch (erro) {
      console.error('Erro ao obter histórico do cliente:', erro);
      res.status(500).json({ erro: 'Erro ao obter histórico' });
    }
  }

  // Alertas não resolvidos
  static async alertasNaoResolvidos(req, res) {
    try {
      const query = `
        SELECT
          a.*,
          COALESCE(c.nome, u.nome, p.nome) as alerta_para
        FROM alertas_anomalias a
        LEFT JOIN clientes c ON a.cliente_id = c.id
        LEFT JOIN usuarios u ON a.vendedor_id = u.id
        LEFT JOIN produtos p ON a.produto_id = p.id
        WHERE a.resolvido = FALSE
        ORDER BY a.criado_em DESC;
      `;

      const result = await pool.query(query);
      res.json(result.rows);
    } catch (erro) {
      console.error('Erro ao obter alertas:', erro);
      res.status(500).json({ erro: 'Erro ao obter alertas' });
    }
  }

  // Marcar alerta como resolvido
  static async resolverAlerta(req, res) {
    try {
      const { id } = req.params;

      const query = `
        UPDATE alertas_anomalias
        SET resolvido = TRUE, resolvido_em = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Alerta não encontrado' });
      }

      res.json({
        mensagem: 'Alerta marcado como resolvido',
        alerta: result.rows[0],
      });
    } catch (erro) {
      console.error('Erro ao resolver alerta:', erro);
      res.status(500).json({ erro: 'Erro ao resolver alerta' });
    }
  }
}

module.exports = MetricasController;
