const express = require('express');
const router = express.Router();
const GarantiaController = require('../controllers/garantiaController');
const { verificarToken, verificarTipo } = require('../middleware/auth');

// Criar nova garantia (vendedor)
router.post('/', verificarToken, verificarTipo(['vendedor']), GarantiaController.criar);

// Listar garantias do vendedor
router.get('/meus', verificarToken, verificarTipo(['vendedor']), GarantiaController.listarPorVendedor);

// Listar todas as garantias (logística/direção)
router.get('/', verificarToken, verificarTipo(['logistica', 'direcao']), GarantiaController.listarTodas);

// Obter uma garantia específica
router.get('/:id', verificarToken, GarantiaController.obter);

// Atualizar status (logística/direção)
router.patch('/:id/status', verificarToken, verificarTipo(['logistica', 'direcao']), GarantiaController.atualizarStatus);

// Deletar garantia (apenas direção)
router.delete('/:id', verificarToken, verificarTipo(['direcao']), GarantiaController.deletar);

module.exports = router;
