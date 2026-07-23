const express = require('express');
const router = express.Router();
const ImportController = require('../controllers/importController');
const { verificarToken, verificarTipo } = require('../middleware/auth');

router.post('/clientes', verificarToken, verificarTipo(['direcao']), ImportController.importarClientes);
router.post('/produtos', verificarToken, verificarTipo(['direcao']), ImportController.importarProdutos);

module.exports = router;
