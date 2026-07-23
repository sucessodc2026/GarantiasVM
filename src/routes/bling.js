const express = require('express');
const router = express.Router();
const { BlingController } = require('../controllers/blingController');
const { verificarToken, verificarTipo } = require('../middleware/auth');

// Configurar API Key (apenas direção)
router.post('/config', verificarToken, verificarTipo(['direcao']), BlingController.configurarApiKey);

// Status da integração
router.get('/status', verificarToken, BlingController.status);

// Clientes
router.get('/clientes', verificarToken, BlingController.listarClientes);
router.get('/clientes/:id', verificarToken, BlingController.obterCliente);

// Produtos
router.get('/produtos', verificarToken, BlingController.listarProdutos);
router.get('/produtos/:id', verificarToken, BlingController.obterProduto);

// Sincronizar
router.post('/sincronizar', verificarToken, verificarTipo(['direcao']), BlingController.sincronizar);

module.exports = router;
