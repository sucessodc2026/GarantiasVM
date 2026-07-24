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

      // Atualizar último acesso no login
      await pool.query('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = $1', [usuario.id]);

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

      let query = 'SELECT id, nome, email, tipo_usuario, ativo, criado_em, ultimo_acesso FROM usuarios WHERE 1=1';
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

  // Alterar senha de um usuário (apenas direção)
  static async alterarSenha(req, res) {
    try {
      const { id } = req.params;
      const { senha } = req.body;

      if (!senha || senha.trim().length < 6) {
        return res.status(400).json({ erro: 'A senha é obrigatória e deve ter pelo menos 6 caracteres' });
      }

      // Verificar se o usuário existe
      const usuario = await pool.query('SELECT id, nome, tipo_usuario FROM usuarios WHERE id = $1', [id]);
      if (usuario.rows.length === 0) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      // Segurança: Apenas a própria pessoa pode alterar a senha de contas de direção
      if (usuario.rows[0].tipo_usuario === 'direcao' && req.usuario.id !== id) {
        return res.status(403).json({ erro: 'Ação não permitida para este tipo de conta' });
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      await pool.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [senhaHash, id]);

      res.json({
        mensagem: `Senha do usuário ${usuario.rows[0].nome} atualizada com sucesso`
      });
    } catch (erro) {
      console.error('Erro ao alterar senha do usuário:', erro);
      res.status(500).json({ erro: 'Erro ao alterar senha' });
    }
  }

  // Obter perfil do usuário
  static async perfil(req, res) {
    try {
      const usuario_id = req.usuario.id;

      // Atualiza o último acesso na tabela (heartbeat)
      await pool.query('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = $1', [usuario_id]);

      const query = `
        SELECT id, nome, email, telefone, tipo_usuario, ativo, criado_em, ultimo_acesso
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
