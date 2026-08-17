const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/clienteController');
const { verificarToken, verificarTipo } = require('../middleware/auth');

// Listar clientes (qualquer usuário logado pode buscar clientes)
router.get('/', verificarToken, ClienteController.listar);

// Cadastrar cliente (direção)
router.post('/', verificarToken, verificarTipo(['direcao']), ClienteController.criar);

module.exports = router;
