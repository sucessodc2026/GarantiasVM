const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuarioController');
const { verificarToken, verificarTipo } = require('../middleware/auth');

// Login (público)
router.post('/login', UsuarioController.login);

// Listar usuários (apenas direção)
router.get('/', verificarToken, verificarTipo(['direcao']), UsuarioController.listar);

// Criar usuário (apenas direção)
router.post('/', verificarToken, verificarTipo(['direcao']), UsuarioController.criar);

// Ativar / Desativar usuário (apenas direção)
router.patch('/:id/toggle', verificarToken, verificarTipo(['direcao']), UsuarioController.toggleAtivo);

// Perfil do usuário logado
router.get('/perfil', verificarToken, UsuarioController.perfil);

module.exports = router;
