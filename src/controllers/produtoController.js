const pool = require('../config/database');

class ProdutoController {
  static async listar(req, res) {
    try {
      const { busca } = req.query;

      let query = 'SELECT id, nome, descricao, categoria, foto_url, total_defeitos, em_alerta, criado_em FROM produtos WHERE 1=1';
      const params = [];

      if (busca) {
        params.push(`%${busca}%`);
        query += ` AND (nome ILIKE $${params.length} OR categoria ILIKE $${params.length})`;
      }

      query += ' ORDER BY nome';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (erro) {
      console.error('Erro ao listar produtos:', erro);
      res.status(500).json({ erro: 'Erro ao listar produtos' });
    }
  }

  static async atualizarFoto(req, res) {
    try {
      const { id } = req.params;
      const { foto_url } = req.body;

      if (!foto_url) {
        return res.status(400).json({ erro: 'URL da foto é obrigatória' });
      }

      const result = await pool.query(
        `UPDATE produtos SET foto_url = $1, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, nome, foto_url`,
        [foto_url, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Produto não encontrado' });
      }

      res.json({
        mensagem: 'Foto do produto atualizada',
        produto: result.rows[0],
      });
    } catch (erro) {
      console.error('Erro ao atualizar foto:', erro);
      res.status(500).json({ erro: 'Erro ao atualizar foto do produto' });
    }
  }

  static async removerFoto(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `UPDATE produtos SET foto_url = NULL, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, nome`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Produto não encontrado' });
      }

      res.json({
        mensagem: 'Foto removida',
        produto: result.rows[0],
      });
    } catch (erro) {
      console.error('Erro ao remover foto:', erro);
      res.status(500).json({ erro: 'Erro ao remover foto' });
    }
  }
}

module.exports = ProdutoController;
