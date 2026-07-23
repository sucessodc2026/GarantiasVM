const pool = require('../config/database');

class ClienteController {
  static async listar(req, res) {
    try {
      const { busca } = req.query;

      let query = 'SELECT id, nome, telefone, email, criado_em FROM clientes WHERE 1=1';
      const params = [];

      if (busca) {
        params.push(`%${busca}%`);
        query += ` AND (nome ILIKE $${params.length} OR email ILIKE $${params.length} OR telefone ILIKE $${params.length})`;
      }

      query += ' ORDER BY nome';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (erro) {
      console.error('Erro ao listar clientes:', erro);
      res.status(500).json({ erro: 'Erro ao listar clientes' });
    }
  }
}

module.exports = ClienteController;
