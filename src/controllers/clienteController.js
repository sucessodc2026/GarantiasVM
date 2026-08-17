const pool = require('../config/database');

class ClienteController {
  static async listar(req, res) {
    try {
      const { busca } = req.query;

      let query = 'SELECT id, nome, telefone, email, cpf_cnpj, cidade, cep, criado_em FROM clientes WHERE 1=1';
      const params = [];

      if (busca) {
        params.push(`%${busca}%`);
        const like = params.length;
        query += ` AND (nome ILIKE $${like} OR email ILIKE $${like} OR telefone ILIKE $${like} OR cidade ILIKE $${like}`;

        // Só busca por documento se o termo tiver dígitos — senão sobra
        // parâmetro sem uso e o Postgres recusa a consulta.
        const soDigitos = String(busca).replace(/\D/g, '');
        if (soDigitos) {
          params.push(`%${soDigitos}%`);
          query += ` OR cpf_cnpj LIKE $${params.length}`;
        }
        query += ')';
      }

      // Sem limite, uma busca curta traria a base inteira.
      query += ' ORDER BY nome LIMIT 30';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (erro) {
      console.error('Erro ao listar clientes:', erro);
      res.status(500).json({ erro: 'Erro ao listar clientes' });
    }
  }

  static async criar(req, res) {
    try {
      const { nome, telefone, email, cpf_cnpj, cidade, cep, endereco } = req.body;

      if (!nome || !nome.trim()) {
        return res.status(400).json({ erro: 'Nome é obrigatório' });
      }

      if (cpf_cnpj) {
        const existente = await pool.query('SELECT id FROM clientes WHERE cpf_cnpj = $1', [cpf_cnpj]);
        if (existente.rows.length > 0) {
          return res.status(409).json({ erro: 'Já existe um cliente com esse CPF/CNPJ' });
        }
      }

      const result = await pool.query(
        `INSERT INTO clientes (nome, telefone, email, cpf_cnpj, cidade, cep, endereco)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, nome, telefone, email, cpf_cnpj, cidade, cep, endereco, criado_em`,
        [nome.trim(), telefone || null, email || null, cpf_cnpj || null, cidade || null, cep || null, endereco || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (erro) {
      console.error('Erro ao criar cliente:', erro);
      res.status(500).json({ erro: 'Erro ao criar cliente' });
    }
  }
}

module.exports = ClienteController;
