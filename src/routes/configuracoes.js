const express = require('express');
const router = express.Router();
const ConfigController = require('../controllers/configController');
const { verificarToken, verificarTipo } = require('../middleware/auth');

// Apenas diretores podem acessar configurações
const apenasDirector = verificarTipo(['direcao']);

// Listar configurações
router.get('/', verificarToken, apenasDirector, ConfigController.listarConfigs);

// Obter uma configuração específica
router.get('/:tipo', verificarToken, apenasDirector, ConfigController.obterConfig);

// Salvar configuração
router.post('/', verificarToken, apenasDirector, ConfigController.salvarConfig);

// Testar conexão Bling
router.post('/bling/testar', verificarToken, apenasDirector, ConfigController.testarBling);

module.exports = router;
