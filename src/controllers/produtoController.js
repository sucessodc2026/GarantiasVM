const pool = require('../config/database');
const { separarFamilia } = require('../utils/produtoFamilia');

class ProdutoController {
  static async listar(req, res) {
    try {
      const { busca } = req.query;

      let query = 'SELECT id, nome, descricao, categoria, familia, variacao, foto_url, total_defeitos, em_alerta, criado_em FROM produtos WHERE 1=1';
      const params = [];

      if (busca) {
        params.push(`%${busca}%`);
        query += ` AND (nome ILIKE $${params.length} OR descricao ILIKE $${params.length} OR familia ILIKE $${params.length} OR categoria ILIKE $${params.length})`;
      }

      query += ' ORDER BY COALESCE(familia, nome), variacao NULLS FIRST';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (erro) {
      console.error('Erro ao listar produtos:', erro);
      res.status(500).json({ erro: 'Erro ao listar produtos' });
    }
  }

  // Aplica a mesma foto a todos os SKUs de um modelo (ex: os 10 encaixes da Gold).
  // Cadastra um SKU novo — sozinho, ou como mais uma variação de um modelo
  // que já existe (o vendedor pediu: "chegou um encaixe novo, preciso poder
  // cadastrar sem reimportar a planilha inteira").
  static async criar(req, res) {
    try {
      const { nome, descricao, categoria, familia_existente } = req.body;
      if (!nome || !nome.trim()) {
        return res.status(400).json({ erro: 'Código do produto (SKU) é obrigatório' });
      }

      const existe = await pool.query('SELECT id FROM produtos WHERE nome = $1', [nome.trim()]);
      if (existe.rows.length > 0) {
        return res.status(409).json({ erro: 'Já existe um produto com esse código' });
      }

      // Se veio ligado a uma família existente, herda a foto dela e usa o
      // nome da família como base da descrição — assim a variação nova já
      // nasce agrupada, sem precisar editar nada depois.
      let familiaFinal = null;
      let variacaoFinal = null;
      let fotoHerdada = null;
      let descricaoFinal = (descricao || '').trim() || nome.trim();

      if (familia_existente && familia_existente.trim()) {
        const ref = await pool.query(
          'SELECT foto_url, categoria FROM produtos WHERE COALESCE(familia, nome) = $1 LIMIT 1',
          [familia_existente.trim()]
        );
        if (ref.rows.length === 0) {
          return res.status(404).json({ erro: 'Modelo (família) não encontrado' });
        }
        familiaFinal = familia_existente.trim();
        fotoHerdada = ref.rows[0].foto_url;
        if (!descricao || !descricao.trim()) {
          descricaoFinal = `${familiaFinal} - ${nome.trim()}`;
        }
        const sep = separarFamilia(descricaoFinal);
        variacaoFinal = sep.variacao || nome.trim().toUpperCase();
      } else {
        const sep = separarFamilia(descricaoFinal);
        familiaFinal = sep.familia || null;
        variacaoFinal = sep.variacao;
      }

      const categoriaFinal = (categoria || '').trim() || 'geral';

      const result = await pool.query(
        `INSERT INTO produtos (nome, descricao, categoria, familia, variacao, foto_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [nome.trim(), descricaoFinal, categoriaFinal, familiaFinal, variacaoFinal, fotoHerdada]
      );

      res.status(201).json({ mensagem: 'Produto cadastrado com sucesso', produto: result.rows[0] });
    } catch (erro) {
      console.error('Erro ao criar produto:', erro);
      res.status(500).json({ erro: 'Erro ao cadastrar produto' });
    }
  }

  static async atualizarFotoFamilia(req, res) {
    try {
      const { familia, foto_url } = req.body;
      if (!familia) return res.status(400).json({ erro: 'Família é obrigatória' });

      const result = await pool.query(
        `UPDATE produtos SET foto_url = $1, atualizado_em = CURRENT_TIMESTAMP
         WHERE COALESCE(familia, nome) = $2 RETURNING id`,
        [foto_url || null, familia]
      );

      res.json({
        mensagem: foto_url
          ? `Foto aplicada a ${result.rowCount} variações`
          : `Foto removida de ${result.rowCount} variações`,
        atualizados: result.rowCount,
      });
    } catch (erro) {
      console.error('Erro ao atualizar foto da família:', erro);
      res.status(500).json({ erro: 'Erro ao atualizar foto do modelo' });
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
