const pool = require('../config/database');

class GarantiaController {
  // Criar nova solicitação de garantia
  static async criar(req, res) {
    const client = await pool.connect();
    try {
      const { cliente_id, produto_id, itens, descricao_falha, foto_url, video_url } = req.body;
      const vendedor_id = req.usuario.id;

      // Aceita lista de itens ou, para compatibilidade, um produto_id único.
      const lista = Array.isArray(itens) && itens.length
        ? itens
        : (produto_id ? [{ produto_id, quantidade: 1 }] : []);

      if (!lista.length) {
        return res.status(400).json({ erro: 'Informe ao menos um produto' });
      }

      // Junta repetidos e valida a quantidade de cada item.
      const porProduto = new Map();
      for (const item of lista) {
        const pid = item && item.produto_id;
        if (!pid) return res.status(400).json({ erro: 'Item sem produto' });
        const qtd = Math.max(1, parseInt(item.quantidade, 10) || 1);
        porProduto.set(pid, (porProduto.get(pid) || 0) + qtd);
      }

      // Garantia e itens gravam juntos: se um item falhar, nada é salvo pela metade.
      await client.query('BEGIN');

      const principal = porProduto.keys().next().value;
      const result = await client.query(
        `INSERT INTO solicitacoes_garantia
         (cliente_id, vendedor_id, produto_id, descricao_falha, foto_url, video_url, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pendente')
         RETURNING *;`,
        [cliente_id, vendedor_id, principal, descricao_falha, foto_url, video_url]
      );
      const garantia = result.rows[0];

      for (const [pid, qtd] of porProduto) {
        await client.query(
          'INSERT INTO garantia_itens (garantia_id, produto_id, quantidade) VALUES ($1, $2, $3)',
          [garantia.id, pid, qtd]
        );
      }

      await client.query('COMMIT');

      const itensSalvos = await pool.query(
        `SELECT i.produto_id, i.quantidade, p.nome, p.familia, p.variacao, p.foto_url
         FROM garantia_itens i JOIN produtos p ON p.id = i.produto_id
         WHERE i.garantia_id = $1 ORDER BY p.familia, p.variacao`,
        [garantia.id]
      );

      res.status(201).json({
        mensagem: 'Solicitação de garantia criada com sucesso',
        garantia: { ...garantia, itens: itensSalvos.rows },
      });
    } catch (erro) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('Erro ao criar garantia:', erro);
      res.status(500).json({ erro: 'Erro ao criar garantia' });
    } finally {
      client.release();
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
          (SELECT COALESCE(json_agg(json_build_object(
                    'produto_id', gi.produto_id,
                    'nome', pi.nome,
                    'familia', pi.familia,
                    'variacao', pi.variacao,
                    'foto_url', pi.foto_url,
                    'quantidade', gi.quantidade
                  ) ORDER BY pi.familia, pi.variacao), '[]'::json)
           FROM garantia_itens gi JOIN produtos pi ON pi.id = gi.produto_id
           WHERE gi.garantia_id = sg.id) AS itens,
          p.nome as produto_nome,
          p.categoria as produto_categoria,
          p.foto_url as produto_foto_url
        FROM solicitacoes_garantia sg
        JOIN clientes c ON sg.cliente_id = c.id
        LEFT JOIN produtos p ON sg.produto_id = p.id
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
          (SELECT COALESCE(json_agg(json_build_object(
                    'produto_id', gi.produto_id,
                    'nome', pi.nome,
                    'familia', pi.familia,
                    'variacao', pi.variacao,
                    'foto_url', pi.foto_url,
                    'quantidade', gi.quantidade
                  ) ORDER BY pi.familia, pi.variacao), '[]'::json)
           FROM garantia_itens gi JOIN produtos pi ON pi.id = gi.produto_id
           WHERE gi.garantia_id = sg.id) AS itens,
          p.nome as produto_nome,
          p.categoria as produto_categoria,
          p.foto_url as produto_foto_url,
          u.nome as vendedor_nome
        FROM solicitacoes_garantia sg
        JOIN clientes c ON sg.cliente_id = c.id
        LEFT JOIN produtos p ON sg.produto_id = p.id
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
          (SELECT COALESCE(json_agg(json_build_object(
                    'produto_id', gi.produto_id,
                    'nome', pi.nome,
                    'familia', pi.familia,
                    'variacao', pi.variacao,
                    'foto_url', pi.foto_url,
                    'quantidade', gi.quantidade
                  ) ORDER BY pi.familia, pi.variacao), '[]'::json)
           FROM garantia_itens gi JOIN produtos pi ON pi.id = gi.produto_id
           WHERE gi.garantia_id = sg.id) AS itens,
          p.nome as produto_nome,
          p.categoria as produto_categoria,
          p.foto_url as produto_foto_url,
          u.nome as vendedor_nome
        FROM solicitacoes_garantia sg
        JOIN clientes c ON sg.cliente_id = c.id
        LEFT JOIN produtos p ON sg.produto_id = p.id
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
      const { status, observacoes, motivo_rejeicao } = req.body;

      const statusValidos = ['pendente', 'processado', 'rejeitado', 'concluido'];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({ erro: 'Status inválido' });
      }

      // Negar sem justificativa deixa o vendedor sem saber o que aconteceu.
      if (status === 'rejeitado' && !String(motivo_rejeicao || '').trim()) {
        return res.status(400).json({ erro: 'Informe o motivo da negativa' });
      }

      // processado_em/processado_por só fazem sentido quando sai de pendente.
      const query = `
        UPDATE solicitacoes_garantia
        SET status = $1,
            observacoes = $2,
            motivo_rejeicao = CASE WHEN $1 = 'rejeitado' THEN $5 ELSE NULL END,
            atualizado_em = CURRENT_TIMESTAMP,
            processado_em = CASE WHEN $1 = 'pendente' THEN NULL
                                 ELSE COALESCE(processado_em, CURRENT_TIMESTAMP) END,
            processado_por = CASE WHEN $1 = 'pendente' THEN NULL
                                  ELSE $4::uuid END
        WHERE id = $3
        RETURNING *;
      `;

      const result = await pool.query(query, [
        status,
        observacoes,
        id,
        req.usuario?.id || null,
        String(motivo_rejeicao || '').trim() || null,
      ]);

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
