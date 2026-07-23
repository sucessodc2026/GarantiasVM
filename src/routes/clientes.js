const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/clienteController');
const { verificarToken } = require('../middleware/auth');

// Listar clientes (qualquer usuário logado pode buscar clientes)
router.get('/', verificarToken, ClienteController.listar);

module.exports = router;
