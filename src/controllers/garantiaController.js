const pool = require('../config/database');

class GarantiaController {
  // Criar nova solicitação de garantia
  static async criar(req, res) {
    try {
      const { cliente_id, produto_id, descricao_falha, foto_url, video_url } = req.body;
      const vendedor_id = req.usuario.id;

      const query = `
        INSERT INTO solicitacoes_garantia
        (cliente_id, vendedor_id, produto_id, descricao_falha, foto_url, video_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'pendente')
        RETURNING *;
      `;

      const result = await pool.query(query, [
        cliente_id,
        vendedor_id,
        produto_id,
        descricao_falha,
        foto_url,
        video_url,
      ]);

      res.status(201).json({
        mensagem: 'Solicitação de garantia criada com sucesso',
        garantia: result.rows[0],
      });
    } catch (erro) {
      console.error('Erro ao criar garantia:', erro);
      res.status(500).json({ erro: 'Erro ao criar garantia' });
    }
  }

  // Listar garantias por vendedor
  static async listarPorVendedor(req, res) {
    try {
      const vendedor_id = req.usuario.id;
      const { status, limite = 50, offset = 0 } = req.query;

      let query = `
        SELECT
          sg.*,
          c.nome as cliente_nome,
          c.telefone as cliente_telefone,
          p.nome as produto_nome,
          p.categoria as produto_categoria,
          p.foto_url as produto_foto_url
        FROM solicitacoes_garantia sg
        JOIN clientes c ON sg.cliente_id = c.id
        JOIN produtos p ON sg.produto_id = p.id
        WHERE sg.vendedor_id = $1
      `;

      const params = [vendedor_id];

      if (status) {
        query += ` AND sg.status = $${params.length + 1}`;
        params.push(status);
      }

      query += ` ORDER BY sg.criado_em DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limite, offset);

      const result = await pool.query(query, params);

      res.json({
        total: result.rows.length,
        garantias: result.rows,
      });
    } catch (erro) {
      console.error('Erro ao listar garantias:', erro);
      res.status(500).json({ erro: 'Erro ao listar garantias' });
    }
  }

  // Listar todas as garantias (para logística/direção)
  static async listarTodas(req, res) {
    try {
      const { status, limite = 100, offset = 0 } = req.query;

      let query = `
        SELECT
          sg.*,
          c.nome as cliente_nome,
          c.telefone as cliente_telefone,
          p.nome as produto_nome,
          p.categoria as produto_categoria,
          p.foto_url as produto_foto_url,
          u.nome as vendedor_nome
        FROM solicitacoes_garantia sg
        JOIN clientes c ON sg.cliente_id = c.id
        JOIN produtos p ON sg.produto_id = p.id
        JOIN usuarios u ON sg.vendedor_id = u.id
        WHERE 1=1
      `;

      const params = [];

      if (status) {
        params.push(status);
        query += ` AND sg.status = $${params.length}`;
      }

      query += ` ORDER BY sg.criado_em DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limite, offset);

      const result = await pool.query(query, params);

      res.json({
        total: result.rows.length,
        garantias: result.rows,
      });
    } catch (erro) {
      console.error('Erro ao listar garantias:', erro);
      res.status(500).json({ erro: 'Erro ao listar garantias' });
    }
  }

  // Obter uma garantia específica
  static async obter(req, res) {
    try {
      const { id } = req.params;
      const usuario = req.usuario;

      let query = `
        SELECT
          sg.*,
          c.nome as cliente_nome,
          c.telefone as cliente_telefone,
          p.nome as produto_nome,
          p.categoria as produto_categoria,
          p.foto_url as produto_foto_url,
          u.nome as vendedor_nome
        FROM solicitacoes_garantia sg
        JOIN clientes c ON sg.cliente_id = c.id
        JOIN produtos p ON sg.produto_id = p.id
        JOIN usuarios u ON sg.vendedor_id = u.id
        WHERE sg.id = $1
      `;

      const params = [id];

      // Vendedor só vê as próprias garantias
      if (usuario.tipo_usuario === 'vendedor') {
        query += ` AND sg.vendedor_id = $2`;
        params.push(usuario.id);
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Garantia não encontrada' });
      }

      res.json(result.rows[0]);
    } catch (erro) {
      console.error('Erro ao obter garantia:', erro);
      res.status(500).json({ erro: 'Erro ao obter garantia' });
    }
  }

  // Atualizar status da garantia
  static async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, observacoes } = req.body;

      const statusValidos = ['pendente', 'processado', 'rejeitado', 'concluido'];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({ erro: 'Status inválido' });
      }

      const query = `
        UPDATE solicitacoes_garantia
        SET status = $1, observacoes = $2, atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *;
      `;

      const result = await pool.query(query, [status, observacoes, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Garantia não encontrada' });
      }

      res.json({
        mensagem: 'Status atualizado com sucesso',
        garantia: result.rows[0],
      });
    } catch (erro) {
      console.error('Erro ao atualizar garantia:', erro);
      res.status(500).json({ erro: 'Erro ao atualizar garantia' });
    }
  }

  // Deletar garantia (soft delete)
  static async deletar(req, res) {
    try {
      const { id } = req.params;

      const query = `
        DELETE FROM solicitacoes_garantia
        WHERE id = $1
        RETURNING *;
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Garantia não encontrada' });
      }

      res.json({ mensagem: 'Garantia deletada com sucesso' });
    } catch (erro) {
      console.error('Erro ao deletar garantia:', erro);
      res.status(500).json({ erro: 'Erro ao deletar garantia' });
    }
  }
}

module.exports = GarantiaController;
