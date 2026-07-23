const express = require('express');
const router = express.Router();
const MetricasController = require('../controllers/metricasController');
const { verificarToken, verificarTipo } = require('../middleware/auth');

// Métricas gerais (direção)
router.get('/geral', verificarToken, verificarTipo(['direcao']), MetricasController.metricasGerais);

// Garantias por vendedor
router.get('/vendedores', verificarToken, verificarTipo(['direcao']), MetricasController.garantiasPorVendedor);

// Clientes repetidores
router.get('/clientes-repetidores', verificarToken, verificarTipo(['direcao']), MetricasController.clientesRepetidores);

// Produtos com defeitos
router.get('/produtos-defeitos', verificarToken, verificarTipo(['direcao']), MetricasController.produtosComDefeitos);

// Histórico de um cliente
router.get('/cliente/:cliente_id', verificarToken, MetricasController.historicoCliente);

// Alertas não resolvidos
router.get('/alertas', verificarToken, verificarTipo(['direcao']), MetricasController.alertasNaoResolvidos);

// Resolver alerta
router.patch('/alertas/:id/resolver', verificarToken, verificarTipo(['direcao']), MetricasController.resolverAlerta);

module.exports = router;
