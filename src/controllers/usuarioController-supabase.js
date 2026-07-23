const { supabase } = require('../config/supabase');
const jwt = require('jsonwebtoken');

class UsuarioController {
  // Login
  static async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
      }

      // Buscar usuário no Supabase
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !usuarios) {
        return res.status(401).json({ erro: 'Email ou senha incorretos' });
      }

      // Validar senha (em produção, usar bcrypt)
      if (usuarios.senha !== senha) {
        return res.status(401).json({ erro: 'Email ou senha incorretos' });
      }

      // Gerar JWT
      const token = jwt.sign(
        {
          id: usuarios.id,
          email: usuarios.email,
          tipo_usuario: usuarios.tipo_usuario,
        },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '24h' }
      );

      res.json({
        mensagem: 'Login realizado com sucesso',
        token,
        usuario: {
          id: usuarios.id,
          nome: usuarios.nome,
          email: usuarios.email,
          tipo_usuario: usuarios.tipo_usuario,
        },
      });
    } catch (erro) {
      console.error('Erro ao fazer login:', erro);
      res.status(500).json({ erro: 'Erro ao fazer login' });
    }
  }

  // Listar usuários
  static async listar(req, res) {
    try {
      const { tipo_usuario } = req.query;

      let query = supabase.from('usuarios').select('*');

      if (tipo_usuario) {
        query = query.eq('tipo_usuario', tipo_usuario);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({ usuarios: data || [] });
    } catch (erro) {
      console.error('Erro ao listar usuários:', erro);
      res.status(500).json({ erro: 'Erro ao listar usuários' });
    }
  }

  // Criar usuário
  static async criar(req, res) {
    try {
      const { nome, email, senha, tipo_usuario, telefone } = req.body;

      if (!nome || !email || !senha || !tipo_usuario) {
        return res.status(400).json({ erro: 'Dados obrigatórios faltando' });
      }

      const { data, error } = await supabase.from('usuarios').insert([
        {
          nome,
          email,
          senha, // Em produção, fazer hash com bcrypt!
          tipo_usuario,
          telefone,
        },
      ]).select();

      if (error) throw error;

      res.status(201).json({
        mensagem: 'Usuário criado com sucesso',
        usuario: data[0],
      });
    } catch (erro) {
      console.error('Erro ao criar usuário:', erro);
      res.status(500).json({ erro: 'Erro ao criar usuário' });
    }
  }

  // Get perfil do usuário logado
  static async perfil(req, res) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', req.usuario.id)
        .single();

      if (error) throw error;

      res.json({ usuario: data });
    } catch (erro) {
      console.error('Erro ao obter perfil:', erro);
      res.status(500).json({ erro: 'Erro ao obter perfil' });
    }
  }
}

module.exports = UsuarioController;
