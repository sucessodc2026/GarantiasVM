const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UsuarioController {
  // Login
  static async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
      }

      const query = 'SELECT * FROM usuarios WHERE email = $1 AND ativo = TRUE;';
      const result = await pool.query(query, [email.toLowerCase().trim()]);

      if (result.rows.length === 0) {
        return res.status(401).json({ erro: 'Email ou senha inválidos' });
      }

      const usuario = result.rows[0];

      // Verificação da senha usando bcrypt
      const senhaValida = await bcrypt.compare(senha, usuario.senha || '');
      if (!senhaValida) {
        return res.status(401).json({ erro: 'Email ou senha inválidos' });
      }

      const token = jwt.sign(
        { id: usuario.id, email: usuario.email, tipo_usuario: usuario.tipo_usuario },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        mensagem: 'Login realizado com sucesso',
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          tipo_usuario: usuario.tipo_usuario,
        },
      });
    } catch (erro) {
      console.error('Erro no login:', erro);
      res.status(500).json({ erro: 'Erro ao fazer login' });
    }
  }

  // Listar usuários
  static async listar(req, res) {
    try {
      const { tipo_usuario } = req.query;

      let query = 'SELECT id, nome, email, tipo_usuario, ativo, criado_em FROM usuarios WHERE 1=1';
      const params = [];

      if (tipo_usuario) {
        params.push(tipo_usuario);
        query += ` AND tipo_usuario = $${params.length}`;
      }

      query += ' ORDER BY nome;';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (erro) {
      console.error('Erro ao listar usuários:', erro);
      res.status(500).json({ erro: 'Erro ao listar usuários' });
    }
  }

  // Criar usuário (apenas direção)
  static async criar(req, res) {
    try {
      const { nome, email, senha, tipo_usuario, telefone } = req.body;

      if (!nome || !email || !senha || !tipo_usuario) {
        return res.status(400).json({ erro: 'Nome, email, senha e tipo são obrigatórios' });
      }

      if (!['vendedor', 'logistica'].includes(tipo_usuario)) {
        return res.status(400).json({ erro: 'Tipo de usuário inválido. Use vendedor ou logistica' });
      }

      // Verificar se email já existe
      const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
      if (existe.rows.length > 0) {
        return res.status(409).json({ erro: 'Este email já está em uso' });
      }

      const senhaHash = await bcrypt.hash(senha, 10);

      const result = await pool.query(
        `INSERT INTO usuarios (nome, email, senha, tipo_usuario, telefone, ativo)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         RETURNING id, nome, email, tipo_usuario, telefone, ativo, criado_em`,
        [nome.trim(), email.toLowerCase().trim(), senhaHash, tipo_usuario, telefone || null]
      );

      res.status(201).json({
        mensagem: 'Usuário criado com sucesso',
        usuario: result.rows[0],
      });
    } catch (erro) {
      console.error('Erro ao criar usuário:', erro);
      res.status(500).json({ erro: 'Erro ao criar usuário' });
    }
  }

  // Desativar/ativar usuário (toggle)
  static async toggleAtivo(req, res) {
    try {
      const { id } = req.params;

      const atual = await pool.query('SELECT id, ativo FROM usuarios WHERE id = $1', [id]);
      if (atual.rows.length === 0) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      const novoStatus = !atual.rows[0].ativo;
      const result = await pool.query(
        'UPDATE usuarios SET ativo = $1 WHERE id = $2 RETURNING id, nome, email, tipo_usuario, ativo',
        [novoStatus, id]
      );

      res.json({
        mensagem: novoStatus ? 'Usuário ativado' : 'Usuário desativado',
        usuario: result.rows[0],
      });
    } catch (erro) {
      console.error('Erro ao alterar status do usuário:', erro);
      res.status(500).json({ erro: 'Erro ao alterar status' });
    }
  }

  // Obter perfil do usuário
  static async perfil(req, res) {
    try {
      const usuario_id = req.usuario.id;

      const query = `
        SELECT id, nome, email, telefone, tipo_usuario, ativo, criado_em
        FROM usuarios
        WHERE id = $1;
      `;

      const result = await pool.query(query, [usuario_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      res.json(result.rows[0]);
    } catch (erro) {
      console.error('Erro ao obter perfil:', erro);
      res.status(500).json({ erro: 'Erro ao obter perfil' });
    }
  }
}

module.exports = UsuarioController;
