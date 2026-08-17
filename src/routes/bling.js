const express = require('express');
const router = express.Router();
const { BlingController } = require('../controllers/blingController');
const { verificarToken, verificarTipo } = require('../middleware/auth');

// Fluxo OAuth2 — só a Direção inicia a conexão
router.get('/oauth/iniciar', verificarToken, verificarTipo(['direcao']), BlingController.oauthIniciar);

// O Bling chama essa aqui direto (sem token nosso — é o navegador do usuário voltando do Bling)
router.get('/callback', BlingController.oauthCallback);

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
