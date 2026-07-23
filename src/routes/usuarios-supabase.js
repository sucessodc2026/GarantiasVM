const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuarioController-supabase');
const { verificarToken, verificarTipo } = require('../middleware/auth-supabase');

// Login (público)
router.post('/login', UsuarioController.login);

// Perfil (autenticado)
router.get('/perfil', verificarToken, UsuarioController.perfil);

// Listar usuários (autenticado)
router.get('/', verificarToken, UsuarioController.listar);

// Criar usuário (apenas direção)
router.post('/', verificarToken, verificarTipo(['direcao']), UsuarioController.criar);

module.exports = router;
